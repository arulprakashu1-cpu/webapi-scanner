from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from src.database.session import get_db
from src.database.models import User, Organization, OrganizationMember, Scan, ScanFinding, UsageEvent
from src.auth.dependencies import get_current_user

router = APIRouter()


def _require_admin(current_user: User = Depends(get_current_user)):
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# ── Schemas ─────────────────────────────────────────────────

class UserAdminRead(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    plan: str
    is_admin: bool
    is_active: bool
    payment_status: str
    email_verified: bool
    created_at: datetime
    last_login: Optional[datetime]
    total_scans: int
    total_findings: int
    org_name: Optional[str]

    class Config:
        from_attributes = True


class PatchUser(BaseModel):
    plan: Optional[str] = None
    is_active: Optional[bool] = None
    payment_status: Optional[str] = None
    is_admin: Optional[bool] = None


class AdminStats(BaseModel):
    total_users: int
    active_users: int
    pro_users: int
    free_users: int
    disabled_users: int
    total_scans: int
    completed_scans: int
    total_findings: int
    scans_this_month: int
    new_users_this_month: int


# ── Endpoints ────────────────────────────────────────────────

@router.get("/stats", response_model=AdminStats)
def get_stats(admin: User = Depends(_require_admin), db: Session = Depends(get_db)):
    now = datetime.utcnow()
    month_str = now.strftime("%Y-%m")

    total_users    = db.query(func.count(User.id)).scalar() or 0
    active_users   = db.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0
    pro_users      = db.query(func.count(User.id)).filter(User.plan == "pro").scalar() or 0
    free_users     = db.query(func.count(User.id)).filter(User.plan == "free").scalar() or 0
    disabled_users = db.query(func.count(User.id)).filter(User.is_active == False).scalar() or 0

    total_scans     = db.query(func.count(Scan.id)).scalar() or 0
    completed_scans = db.query(func.count(Scan.id)).filter(Scan.status == "completed").scalar() or 0
    total_findings  = db.query(func.count(ScanFinding.id)).scalar() or 0

    scans_this_month = (
        db.query(func.count(Scan.id))
        .filter(func.strftime("%Y-%m", Scan.created_at) == month_str)
        .scalar() or 0
    )
    new_users_this_month = (
        db.query(func.count(User.id))
        .filter(func.strftime("%Y-%m", User.created_at) == month_str)
        .scalar() or 0
    )

    return AdminStats(
        total_users=total_users,
        active_users=active_users,
        pro_users=pro_users,
        free_users=free_users,
        disabled_users=disabled_users,
        total_scans=total_scans,
        completed_scans=completed_scans,
        total_findings=total_findings,
        scans_this_month=scans_this_month,
        new_users_this_month=new_users_this_month,
    )


@router.get("/users", response_model=List[UserAdminRead])
def list_users(admin: User = Depends(_require_admin), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    result = []
    for u in users:
        org_member = db.query(OrganizationMember).filter(OrganizationMember.user_id == u.id).first()
        org = db.query(Organization).filter(Organization.id == org_member.organization_id).first() if org_member else None
        scan_count    = db.query(func.count(Scan.id)).filter(Scan.organization_id == org.id).scalar() if org else 0
        finding_count = 0
        if org:
            scan_ids = [s.id for s in db.query(Scan.id).filter(Scan.organization_id == org.id).all()]
            if scan_ids:
                finding_count = db.query(func.count(ScanFinding.id)).filter(ScanFinding.scan_id.in_(scan_ids)).scalar() or 0
        result.append(UserAdminRead(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            plan=getattr(u, "plan", "free") or "free",
            is_admin=getattr(u, "is_admin", False) or False,
            is_active=getattr(u, "is_active", True) if getattr(u, "is_active", True) is not None else True,
            payment_status=getattr(u, "payment_status", "none") or "none",
            email_verified=u.email_verified,
            created_at=u.created_at,
            last_login=u.last_login,
            total_scans=scan_count or 0,
            total_findings=finding_count or 0,
            org_name=org.name if org else None,
        ))
    return result


@router.patch("/users/{user_id}", response_model=UserAdminRead)
def update_user(
    user_id: str,
    data: PatchUser,
    admin: User = Depends(_require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot modify your own admin account here")

    if data.plan is not None:
        if data.plan not in ("free", "pro"):
            raise HTTPException(status_code=400, detail="Plan must be 'free' or 'pro'")
        user.plan = data.plan
        # Sync payment status automatically
        if data.plan == "pro" and getattr(user, "payment_status", "none") == "none":
            user.payment_status = "active"
        if data.plan == "free":
            user.payment_status = "none"

    if data.is_active is not None:
        user.is_active = data.is_active

    if data.payment_status is not None:
        allowed = ("none", "trial", "active", "expired", "cancelled")
        if data.payment_status not in allowed:
            raise HTTPException(status_code=400, detail=f"payment_status must be one of {allowed}")
        user.payment_status = data.payment_status
        # Auto-sync plan from payment status
        if data.payment_status in ("active", "trial"):
            user.plan = "pro"
        elif data.payment_status in ("expired", "cancelled"):
            user.plan = "free"

    if data.is_admin is not None:
        user.is_admin = data.is_admin

    db.commit()
    db.refresh(user)

    org_member = db.query(OrganizationMember).filter(OrganizationMember.user_id == user.id).first()
    org = db.query(Organization).filter(Organization.id == org_member.organization_id).first() if org_member else None
    scan_count = db.query(func.count(Scan.id)).filter(Scan.organization_id == org.id).scalar() if org else 0

    return UserAdminRead(
        id=user.id, email=user.email, full_name=user.full_name,
        plan=user.plan or "free",
        is_admin=user.is_admin or False,
        is_active=user.is_active if user.is_active is not None else True,
        payment_status=user.payment_status or "none",
        email_verified=user.email_verified,
        created_at=user.created_at, last_login=user.last_login,
        total_scans=scan_count or 0, total_findings=0,
        org_name=org.name if org else None,
    )


@router.get("/scans")
def list_all_scans(
    admin: User = Depends(_require_admin),
    db: Session = Depends(get_db),
    limit: int = 100,
    offset: int = 0,
):
    scans = db.query(Scan).order_by(Scan.created_at.desc()).offset(offset).limit(limit).all()
    result = []
    for s in scans:
        org = db.query(Organization).filter(Organization.id == s.organization_id).first()
        owner = None
        if org:
            m = db.query(OrganizationMember).filter(OrganizationMember.organization_id == org.id, OrganizationMember.role == "owner").first()
            if m:
                owner = db.query(User).filter(User.id == m.user_id).first()
        finding_count = db.query(func.count(ScanFinding.id)).filter(ScanFinding.scan_id == s.id).scalar() or 0
        result.append({
            "id": s.id,
            "name": s.name,
            "status": s.status,
            "target_url": s.target_url,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "finished_at": s.finished_at.isoformat() if s.finished_at else None,
            "security_score": s.security_score,
            "findings_count": finding_count,
            "org_name": org.name if org else None,
            "owner_email": owner.email if owner else None,
        })
    total = db.query(func.count(Scan.id)).scalar() or 0
    return {"scans": result, "total": total}
