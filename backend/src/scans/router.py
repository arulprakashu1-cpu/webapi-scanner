from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from src.database.session import get_db, SessionLocal
from src.database.models import User, ScanFinding
from src.auth.dependencies import get_current_user
from src.organizations.service import get_user_org
from src.scans import schemas, service
from src.config import settings

router = APIRouter()


def _get_org_or_404(user: User, db: Session):
    org = get_user_org(db, user.id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


@router.get("/", response_model=List[schemas.ScanListItem])
def list_scans(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org = _get_org_or_404(current_user, db)
    scans = service.list_scans(db, org.id)
    result = []
    for scan in scans:
        summary = service.get_scan_summary(db, scan.id)
        result.append(
            schemas.ScanListItem(
                id=scan.id,
                name=scan.name,
                status=scan.status,
                target_url=scan.target_url,
                created_at=scan.created_at,
                finished_at=scan.finished_at,
                findings_count=sum(summary.values()),
                high_count=summary.get("critical", 0) + summary.get("high", 0),
                medium_count=summary.get("medium", 0),
                low_count=summary.get("low", 0) + summary.get("info", 0),
            )
        )
    return result


@router.post("/", response_model=schemas.ScanRead)
def create_scan(data: schemas.ScanCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org = _get_org_or_404(current_user, db)

    monthly = service.get_monthly_scan_count(db, org.id)
    if monthly >= settings.FREE_TIER_SCANS_PER_MONTH:
        raise HTTPException(status_code=429, detail=f"Monthly limit of {settings.FREE_TIER_SCANS_PER_MONTH} scans reached. Upgrade to continue.")

    scan = service.create_scan(db, data, org.id)
    target = data.target_url or "https://example.com/api"
    service.start_scan_thread(scan.id, target, SessionLocal)

    return schemas.ScanRead(
        id=scan.id, name=scan.name, description=scan.description,
        status=scan.status, target_type=scan.target_type, target_url=scan.target_url,
        auth_type=scan.auth_type, created_at=scan.created_at, started_at=scan.started_at,
        finished_at=scan.finished_at, error_message=scan.error_message, progress=scan.progress,
    )


@router.get("/{scan_id}", response_model=schemas.ScanRead)
def get_scan(scan_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org = _get_org_or_404(current_user, db)
    scan = service.get_scan_by_id(db, scan_id, org.id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    summary = service.get_scan_summary(db, scan.id)
    return schemas.ScanRead(
        id=scan.id, name=scan.name, description=scan.description,
        status=scan.status, target_type=scan.target_type, target_url=scan.target_url,
        auth_type=scan.auth_type, created_at=scan.created_at, started_at=scan.started_at,
        finished_at=scan.finished_at, error_message=scan.error_message, progress=scan.progress,
        findings_count=sum(summary.values()), severity_summary=summary,
    )


@router.get("/{scan_id}/findings", response_model=List[schemas.ScanFindingRead])
def get_findings(scan_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org = _get_org_or_404(current_user, db)
    scan = service.get_scan_by_id(db, scan_id, org.id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    findings = db.query(ScanFinding).filter(ScanFinding.scan_id == scan_id).all()
    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}
    findings.sort(key=lambda f: severity_order.get(f.severity.lower(), 5))
    return findings
