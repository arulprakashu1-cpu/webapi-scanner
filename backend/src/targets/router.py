from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from src.database.session import get_db
from src.database.models import User, ApiTarget, Scan
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
    last_scan_status: Optional[str] = None

    class Config:
        from_attributes = True


def _get_org_or_404(user: User, db: Session):
    org = get_user_org(db, user.id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


@router.get("/", response_model=List[TargetRead])
def list_targets(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org = _get_org_or_404(current_user, db)
    targets = db.query(ApiTarget).filter(ApiTarget.organization_id == org.id).order_by(ApiTarget.created_at.desc()).all()

    result = []
    for t in targets:
        last_scan = (
            db.query(Scan)
            .filter(Scan.organization_id == org.id, Scan.target_url == t.url)
            .order_by(Scan.created_at.desc())
            .first()
        )
        result.append(TargetRead(
            id=t.id, name=t.name, url=t.url, description=t.description,
            auth_type=t.auth_type, created_at=t.created_at,
            last_scanned_at=t.last_scanned_at, total_scans=t.total_scans,
            last_scan_status=last_scan.status if last_scan else None,
        ))
    return result


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
    return TargetRead(
        id=target.id, name=target.name, url=target.url, description=target.description,
        auth_type=target.auth_type, created_at=target.created_at,
        last_scanned_at=target.last_scanned_at, total_scans=target.total_scans,
    )


@router.delete("/{target_id}")
def delete_target(target_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org = _get_org_or_404(current_user, db)
    target = db.query(ApiTarget).filter(ApiTarget.id == target_id, ApiTarget.organization_id == org.id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
    db.delete(target)
    db.commit()
    return {"ok": True}
