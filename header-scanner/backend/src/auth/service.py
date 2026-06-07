import os
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from ..models import (
    HsUser, HsEmailVerificationToken, HsPasswordResetToken,
    HsPasswordHistory, HsLoginAttempt
)
from .utils import (
    hash_password, verify_password, validate_password_policy,
    generate_token, exponential_backoff
)
from ..email.sender import send_email
from ..email.templates import render_template

logger = logging.getLogger(__name__)

VERIFICATION_TOKEN_MINUTES = 30
RESET_TOKEN_MINUTES = 30
LOCKOUT_THRESHOLD = 5
LOCKOUT_WINDOW_MINUTES = 15
LOCKOUT_DURATION_MINUTES = 15
PASSWORD_EXPIRY_DAYS = 90
PASSWORD_HISTORY_COUNT = 5
FREE_MAX_PROFILES = 2
FREE_MAX_SCANS_PER_DAY = 2


async def verify_hcaptcha(token: str) -> bool:
    secret = os.getenv("HCAPTCHA_SECRET", "0x0000000000000000000000000000000AA")
    # Test secret always passes; in production this calls hCaptcha's siteverify
    if secret == "0x0000000000000000000000000000000AA":
        return True
    import httpx
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://hcaptcha.com/siteverify",
            data={"secret": secret, "response": token},
        )
        return resp.json().get("success", False)


def _user_read(user: HsUser) -> dict:
    return {
        "id": user.id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "company": user.company,
        "is_verified": user.is_verified,
        "plan": user.plan,
        "created_at": user.created_at.isoformat() if user.created_at else "",
    }


async def register_user(db: Session, data) -> dict:
    if not await verify_hcaptcha(data.captcha_token):
        raise HTTPException(status_code=400, detail="CAPTCHA verification failed")

    if data.password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    policy_error = validate_password_policy(data.password)
    if policy_error:
        raise HTTPException(status_code=400, detail=policy_error)

    existing = db.query(HsUser).filter(HsUser.email == data.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    hashed = hash_password(data.password)
    user = HsUser(
        first_name=data.first_name,
        last_name=data.last_name,
        email=data.email.lower(),
        password_hash=hashed,
        company=data.company,
        is_verified=False,
        password_changed_at=datetime.utcnow(),
    )
    db.add(user)
    db.flush()

    # Save initial password to history
    db.add(HsPasswordHistory(user_id=user.id, password_hash=hashed))

    # Create verification token
    token = generate_token()
    db.add(HsEmailVerificationToken(token=token, user_id=user.id))
    db.commit()
    db.refresh(user)

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5174")
    verify_url = f"{frontend_url}/verify-email?token={token}"
    try:
        html = render_template("verify_email.html", {
            "first_name": user.first_name,
            "action_url": verify_url,
            "expiry_minutes": VERIFICATION_TOKEN_MINUTES,
        })
        await send_email(user.email, "Verify your Security Scanner account", html)
    except Exception as e:
        logger.warning(f"Failed to send verification email: {e}")

    return _user_read(user)


async def verify_email(db: Session, token: str) -> bool:
    record = db.query(HsEmailVerificationToken).filter(
        HsEmailVerificationToken.token == token,
        HsEmailVerificationToken.used == False,
    ).first()

    if not record:
        return False

    age = datetime.utcnow() - record.created_at
    if age.total_seconds() > VERIFICATION_TOKEN_MINUTES * 60:
        return False  # expired

    user = record.user
    user.is_verified = True
    record.used = True
    db.commit()
    return True


async def resend_verification(db: Session, email: str):
    user = db.query(HsUser).filter(
        HsUser.email == email.lower(),
        HsUser.is_verified == False,
        HsUser.deleted_at.is_(None),
    ).first()
    if not user:
        return  # Silent: don't reveal existence

    # Invalidate previous tokens
    db.query(HsEmailVerificationToken).filter(
        HsEmailVerificationToken.user_id == user.id,
        HsEmailVerificationToken.used == False,
    ).update({"used": True})

    token = generate_token()
    db.add(HsEmailVerificationToken(token=token, user_id=user.id))
    db.commit()

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5174")
    verify_url = f"{frontend_url}/verify-email?token={token}"
    try:
        html = render_template("verify_email.html", {
            "first_name": user.first_name,
            "action_url": verify_url,
            "expiry_minutes": VERIFICATION_TOKEN_MINUTES,
        })
        await send_email(user.email, "Verify your Security Scanner account", html)
    except Exception as e:
        logger.warning(f"Failed to resend verification email: {e}")


def _count_consecutive_failures(db: Session, user_id: int) -> int:
    window = datetime.utcnow() - timedelta(minutes=LOCKOUT_WINDOW_MINUTES)
    attempts = (
        db.query(HsLoginAttempt)
        .filter(
            HsLoginAttempt.user_id == user_id,
            HsLoginAttempt.attempted_at >= window,
        )
        .order_by(HsLoginAttempt.attempted_at.desc())
        .all()
    )
    count = 0
    for a in attempts:
        if not a.success:
            count += 1
        else:
            break
    return count


async def login_user(db: Session, email: str, password: str, ip: str, captcha_token: str) -> dict:
    if not await verify_hcaptcha(captcha_token):
        raise HTTPException(status_code=400, detail="CAPTCHA verification failed")

    user = db.query(HsUser).filter(
        HsUser.email == email.lower(),
        HsUser.deleted_at.is_(None),
    ).first()

    # Determine consecutive failures for backoff even before auth
    consecutive = _count_consecutive_failures(db, user.id) if user else 0
    await exponential_backoff(consecutive)

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Please verify your email before signing in")

    if user.locked_until and user.locked_until > datetime.utcnow():
        remaining = int((user.locked_until - datetime.utcnow()).total_seconds() / 60) + 1
        raise HTTPException(
            status_code=423,
            detail=f"Account locked due to multiple failed attempts. Try again in {remaining} minute(s).",
        )

    if not verify_password(password, user.password_hash):
        # Record failure
        db.add(HsLoginAttempt(user_id=user.id, ip=ip, success=False))
        db.flush()
        consecutive = _count_consecutive_failures(db, user.id)
        db.commit()

        if consecutive >= LOCKOUT_THRESHOLD:
            lock_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
            user.locked_until = lock_until
            db.commit()
            try:
                html = render_template("account_locked.html", {
                    "first_name": user.first_name,
                    "lock_until": lock_until.strftime("%Y-%m-%d %H:%M UTC"),
                })
                await send_email(user.email, "Your Security Scanner account has been locked", html)
            except Exception as e:
                logger.warning(f"Failed to send lockout email: {e}")
            raise HTTPException(
                status_code=423,
                detail=f"Account locked for {LOCKOUT_DURATION_MINUTES} minutes. Check your email.",
            )

        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Success — record and clear lockout
    db.add(HsLoginAttempt(user_id=user.id, ip=ip, success=True))
    user.locked_until = None
    db.commit()

    # Check password expiry
    if user.password_changed_at:
        age = datetime.utcnow() - user.password_changed_at
        if age.days >= PASSWORD_EXPIRY_DAYS:
            from .utils import create_access_token
            token = create_access_token(user.id, user.token_version)
            return {
                "access_token": token,
                "token_type": "bearer",
                "user": _user_read(user),
                "require_password_change": True,
            }

    from .utils import create_access_token
    token = create_access_token(user.id, user.token_version)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": _user_read(user),
        "require_password_change": False,
    }


def get_refresh_token_value(user: HsUser) -> str:
    from .utils import create_refresh_token
    return create_refresh_token(user.id, user.token_version)


async def forgot_password(db: Session, email: str, captcha_token: str):
    if not await verify_hcaptcha(captcha_token):
        raise HTTPException(status_code=400, detail="CAPTCHA verification failed")

    user = db.query(HsUser).filter(
        HsUser.email == email.lower(),
        HsUser.deleted_at.is_(None),
    ).first()

    if user:
        # Invalidate old tokens
        db.query(HsPasswordResetToken).filter(
            HsPasswordResetToken.user_id == user.id,
            HsPasswordResetToken.used == False,
        ).update({"used": True})

        token = generate_token()
        db.add(HsPasswordResetToken(token=token, user_id=user.id))
        db.commit()

        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5174")
        reset_url = f"{frontend_url}/reset-password?token={token}"
        try:
            html = render_template("password_reset.html", {
                "first_name": user.first_name,
                "action_url": reset_url,
                "expiry_minutes": RESET_TOKEN_MINUTES,
            })
            await send_email(user.email, "Reset your Security Scanner password", html)
        except Exception as e:
            logger.warning(f"Failed to send reset email: {e}")


def _check_password_history(db: Session, user_id: int, new_password: str):
    history = (
        db.query(HsPasswordHistory)
        .filter(HsPasswordHistory.user_id == user_id)
        .order_by(HsPasswordHistory.changed_at.desc())
        .limit(PASSWORD_HISTORY_COUNT)
        .all()
    )
    for entry in history:
        if verify_password(new_password, entry.password_hash):
            raise HTTPException(
                status_code=400,
                detail=f"You cannot reuse any of your last {PASSWORD_HISTORY_COUNT} passwords.",
            )


async def reset_password(db: Session, token: str, new_password: str, confirm_password: str) -> bool:
    if new_password != confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    policy_error = validate_password_policy(new_password)
    if policy_error:
        raise HTTPException(status_code=400, detail=policy_error)

    record = db.query(HsPasswordResetToken).filter(
        HsPasswordResetToken.token == token,
        HsPasswordResetToken.used == False,
    ).first()

    if not record:
        return False

    age = datetime.utcnow() - record.created_at
    if age.total_seconds() > RESET_TOKEN_MINUTES * 60:
        return False

    user = record.user
    _check_password_history(db, user.id, new_password)

    new_hash = hash_password(new_password)
    db.add(HsPasswordHistory(user_id=user.id, password_hash=new_hash))
    user.password_hash = new_hash
    user.password_changed_at = datetime.utcnow()
    user.token_version += 1
    record.used = True
    db.commit()

    try:
        html = render_template("password_changed.html", {"first_name": user.first_name})
        await send_email(user.email, "Your Security Scanner password was changed", html)
    except Exception as e:
        logger.warning(f"Failed to send password changed email: {e}")

    return True


async def change_password(db: Session, user: HsUser, current_password: str, new_password: str, confirm_password: str):
    if new_password != confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    if not verify_password(current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    policy_error = validate_password_policy(new_password)
    if policy_error:
        raise HTTPException(status_code=400, detail=policy_error)

    _check_password_history(db, user.id, new_password)

    new_hash = hash_password(new_password)
    db.add(HsPasswordHistory(user_id=user.id, password_hash=new_hash))
    user.password_hash = new_hash
    user.password_changed_at = datetime.utcnow()
    user.token_version += 1
    db.commit()

    try:
        html = render_template("password_changed.html", {"first_name": user.first_name})
        await send_email(user.email, "Your Security Scanner password was changed", html)
    except Exception as e:
        logger.warning(f"Failed to send password changed email: {e}")


async def delete_account(db: Session, user: HsUser, reason: str | None):
    from ..models import HsScanProfile, HsScanRun, HsScanFinding, HsCustomHeader
    import re

    # Hard-delete all scan data
    for profile in user.scan_profiles:
        for run in profile.scan_runs:
            db.query(HsScanFinding).filter(HsScanFinding.scan_run_id == run.id).delete()
        db.query(HsScanRun).filter(HsScanRun.profile_id == profile.id).delete()
        db.query(HsCustomHeader).filter(HsCustomHeader.profile_id == profile.id).delete()
    db.query(HsScanProfile).filter(HsScanProfile.user_id == user.id).delete()

    # Soft-delete + anonymize PII (GDPR Article 17)
    user.deleted_at = datetime.utcnow()
    user.first_name = "Deleted"
    user.last_name = "User"
    user.email = f"deleted_{user.id}@deleted.invalid"
    user.company = None
    user.is_active = False
    db.commit()

    try:
        html = render_template("account_deleted.html", {"first_name": "there"})
        # Can't email to anonymized address - log only
        logger.info(f"Account {user.id} deleted. Reason: {reason}")
    except Exception as e:
        logger.warning(f"Failed to process account deletion email: {e}")
