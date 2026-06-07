import os
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, Response, Cookie
from sqlalchemy.orm import Session
from ..database import get_db
from ..dependencies import get_current_user
from ..models import HsUser
from .schemas import (
    RegisterRequest, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest,
    ChangePasswordRequest, ResendVerificationRequest, UpdateProfileRequest,
    TokenResponse, UserRead, DeleteAccountRequest,
)
from . import service
from .utils import decode_token, create_access_token

router = APIRouter()

REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5174")


def _user_resp(user: HsUser) -> UserRead:
    return UserRead(
        id=user.id,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        company=user.company,
        is_verified=user.is_verified,
        plan=user.plan,
        created_at=user.created_at.isoformat() if user.created_at else "",
    )


@router.post("/register", status_code=201)
async def register(data: RegisterRequest, db: Session = Depends(get_db)):
    user_data = await service.register_user(db, data)
    return {"message": f"Check your email! A verification link has been sent to {data.email}.", "user": user_data}


@router.get("/verify-email")
async def verify_email(token: str, db: Session = Depends(get_db)):
    from fastapi.responses import RedirectResponse
    ok = await service.verify_email(db, token)
    if ok:
        return RedirectResponse(url=f"{FRONTEND_URL}/verification-success")
    return RedirectResponse(url=f"{FRONTEND_URL}/verification-expired?token={token}")


@router.post("/resend-verification")
async def resend_verification(data: ResendVerificationRequest, db: Session = Depends(get_db)):
    await service.resend_verification(db, data.email)
    return {"message": "If that email is registered and unverified, a new link has been sent."}


@router.post("/login")
async def login(data: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")
    result = await service.login_user(db, data.email, data.password, ip, data.captcha_token)

    # Set refresh token as HttpOnly cookie
    from .utils import create_refresh_token
    user = db.query(HsUser).filter(HsUser.email == data.email.lower()).first()
    if user:
        refresh = create_refresh_token(user.id, user.token_version)
        response.set_cookie(
            key="refresh_token",
            value=refresh,
            httponly=True,
            samesite="lax",
            max_age=REFRESH_TOKEN_EXPIRE_DAYS * 86400,
            secure=False,  # set True in production with HTTPS
        )

    return result


@router.post("/refresh")
async def refresh_token(response: Response, refresh_token: str = Cookie(default=None), db: Session = Depends(get_db)):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")

    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = int(payload.get("sub", 0))
    token_version = payload.get("tv", 0)

    user = db.query(HsUser).filter(HsUser.id == user_id, HsUser.deleted_at.is_(None)).first()
    if not user or user.token_version != token_version:
        raise HTTPException(status_code=401, detail="Refresh token invalidated")

    new_access = create_access_token(user.id, user.token_version)
    from .utils import create_refresh_token
    new_refresh = create_refresh_token(user.id, user.token_version)
    response.set_cookie(
        key="refresh_token",
        value=new_refresh,
        httponly=True,
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        secure=False,
    )
    return {"access_token": new_access, "token_type": "bearer"}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("refresh_token")
    return {"message": "Logged out"}


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    await service.forgot_password(db, data.email, data.captcha_token)
    return {"message": "If that email is registered, you'll receive a reset link shortly."}


@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    ok = await service.reset_password(db, data.token, data.new_password, data.confirm_password)
    if not ok:
        raise HTTPException(status_code=400, detail="Reset link is invalid or has expired")
    return {"message": "Password changed successfully. Please sign in again."}


@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    user: HsUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    await service.change_password(db, user, data.current_password, data.new_password, data.confirm_password)
    return {"message": "Password changed. Please sign in again."}


@router.get("/me", response_model=UserRead)
async def get_me(user: HsUser = Depends(get_current_user)):
    return _user_resp(user)


@router.put("/me", response_model=UserRead)
async def update_me(
    data: UpdateProfileRequest,
    user: HsUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.first_name is not None:
        user.first_name = data.first_name.strip()
    if data.last_name is not None:
        user.last_name = data.last_name.strip()
    if data.company is not None:
        user.company = data.company.strip() or None
    db.commit()
    db.refresh(user)
    return _user_resp(user)


@router.delete("/me")
async def delete_me(
    data: DeleteAccountRequest,
    user: HsUser = Depends(get_current_user),
    db: Session = Depends(get_db),
    response: Response = None,
):
    await service.delete_account(db, user, data.reason)
    if response:
        response.delete_cookie("refresh_token")
    return {"message": "Account deleted successfully."}
