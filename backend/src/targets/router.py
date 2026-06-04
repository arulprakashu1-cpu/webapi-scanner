from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from src.database.session import get_db
from src.database.models import User, ApiTarget, Scan, ScanFinding
from src.auth.dependencies import get_current_user
from src.organizations.service import get_user_org

router = APIRouter()


class TargetCreate(BaseModel):
    name: str
    url: str
    description: Optional[str] = None
    auth_type: str = "none"


class TargetRead(BaseModel):
    id: str
    name: str
    url: str
    description: Optional[str]
    auth_type: str
    created_at: datetime
    last_scanned_at: Optional[datetime]
    total_scans: int
    completed_scans: int
    last_scan_status: Optional[str] = None
    last_findings_count: Optional[int] = None
    last_security_score: Optional[int] = None
    last_high_count: Optional[int] = None
    last_medium_count: Optional[int] = None

    class Config:
        from_attributes = True


def _get_org_or_404(user: User, db: Session):
    org = get_user_org(db, user.id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


def _build_target_read(t: ApiTarget, org_id: str, db: Session) -> TargetRead:
    # Compute counts from actual scan records
    scans = (
        db.query(Scan)
        .filter(Scan.organization_id == org_id, Scan.target_url == t.url)
        .order_by(Scan.created_at.desc())
        .all()
    )
    total_scans     = len(scans)
    completed_scans = sum(1 for s in scans if s.status == "completed")
    last_scan       = scans[0] if scans else None
    last_completed  = next((s for s in scans if s.status == "completed"), None)

    last_findings_count = None
    last_high_count     = None
    last_medium_count   = None
    if last_completed:
        findings = db.query(ScanFinding).filter(ScanFinding.scan_id == last_completed.id).all()
        last_findings_count = len(findings)
        last_high_count   = sum(1 for f in findings if f.severity in ("critical", "high"))
        last_medium_count = sum(1 for f in findings if f.severity == "medium")

    return TargetRead(
        id=t.id,
        name=t.name,
        url=t.url,
        description=t.description,
        auth_type=t.auth_type,
        created_at=t.created_at,
        last_scanned_at=last_scan.created_at if last_scan else t.last_scanned_at,
        total_scans=total_scans,
        completed_scans=completed_scans,
        last_scan_status=last_scan.status if last_scan else None,
        last_findings_count=last_findings_count,
        last_security_score=last_completed.security_score if last_completed else None,
        last_high_count=last_high_count,
        last_medium_count=last_medium_count,
    )


@router.get("/", response_model=List[TargetRead])
def list_targets(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org = _get_org_or_404(current_user, db)
    targets = (
        db.query(ApiTarget)
        .filter(ApiTarget.organization_id == org.id)
        .order_by(ApiTarget.created_at.desc())
        .all()
    )
    return [_build_target_read(t, org.id, db) for t in targets]


@router.post("/", response_model=TargetRead)
def create_target(data: TargetCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org = _get_org_or_404(current_user, db)

    existing = db.query(ApiTarget).filter(
        ApiTarget.organization_id == org.id, ApiTarget.url == data.url
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Target with this URL already exists")

    target = ApiTarget(
        organization_id=org.id,
        name=data.name,
        url=data.url,
        description=data.description,
        auth_type=data.auth_type,
    )
    db.add(target)
    db.commit()
    db.refresh(target)
    return _build_target_read(target, org.id, db)


@router.delete("/{target_id}")
def delete_target(target_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org = _get_org_or_404(current_user, db)
    target = db.query(ApiTarget).filter(ApiTarget.id == target_id, ApiTarget.organization_id == org.id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
    db.delete(target)
    db.commit()
    return {"ok": True}
