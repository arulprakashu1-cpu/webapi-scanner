import threading
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List, Optional

from src.database.models import Scan, ScanFinding, UsageEvent
from src.scans.schemas import ScanCreate
from src.scans.scanner.mock_scanner import run_mock_scan


def get_scan_by_id(db: Session, scan_id: str, org_id: str) -> Optional[Scan]:
    return db.query(Scan).filter(Scan.id == scan_id, Scan.organization_id == org_id).first()


def list_scans(db: Session, org_id: str) -> List[Scan]:
    return db.query(Scan).filter(Scan.organization_id == org_id).order_by(Scan.created_at.desc()).all()


def create_scan(db: Session, data: ScanCreate, org_id: str) -> Scan:
    scan = Scan(
        organization_id=org_id,
        name=data.name,
        description=data.description,
        status="queued",
        target_type=data.target_type,
        target_url=data.target_url,
        auth_type=data.auth_type,
        auth_header_name=data.auth_header_name,
        progress=0,
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    return scan


def get_scan_summary(db: Session, scan_id: str) -> dict:
    findings = db.query(ScanFinding).filter(ScanFinding.scan_id == scan_id).all()
    summary = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    for f in findings:
        sev = f.severity.lower()
        if sev in summary:
            summary[sev] += 1
    return summary


def get_monthly_scan_count(db: Session, org_id: str) -> int:
    from sqlalchemy import func
    now = datetime.now(timezone.utc)
    month_str = now.strftime("%Y-%m")
    count = (
        db.query(func.count(UsageEvent.id))
        .filter(
            UsageEvent.organization_id == org_id,
            UsageEvent.event_type == "scan_completed",
            func.strftime("%Y-%m", UsageEvent.recorded_at) == month_str,
        )
        .scalar()
    )
    return count or 0


def _run_scan_worker(scan_id: str, target_url: str, db_factory):
    db = db_factory()
    try:
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            return

        scan.status = "running"
        scan.started_at = datetime.now(timezone.utc)
        db.commit()

        def update_progress(progress: int):
            s = db.query(Scan).filter(Scan.id == scan_id).first()
            if s:
                s.progress = progress
                db.commit()

        result = run_mock_scan(scan_id, target_url, update_progress)
        findings_data = result["findings"]
        meta = result["meta"]

        for f in findings_data:
            finding = ScanFinding(
                scan_id=scan_id,
                severity=f["severity"],
                title=f["title"],
                description=f.get("description"),
                confidence=f.get("confidence"),
                endpoint=f.get("endpoint"),
                method=f.get("method"),
                remediation=f.get("remediation"),
                cwe_id=f.get("cwe_id"),
                owasp_category=f.get("owasp_category"),
                finding_status=f.get("finding_status", "new"),
            )
            db.add(finding)

        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        scan.status = "completed"
        scan.progress = 100
        scan.finished_at = datetime.now(timezone.utc)
        scan.endpoints_count = meta.get("endpoints_count", 0)
        scan.security_score = meta.get("security_score")
        scan.https_enforced = meta.get("https_enforced", False)
        scan.headers_pass = meta.get("headers_pass")
        scan.cors_safe = meta.get("cors_safe")

        usage = UsageEvent(organization_id=scan.organization_id, event_type="scan_completed", quantity=1)
        db.add(usage)
        db.commit()

    except Exception as e:
        s = db.query(Scan).filter(Scan.id == scan_id).first()
        if s:
            s.status = "failed"
            s.error_message = str(e)
            db.commit()
    finally:
        db.close()


def start_scan_thread(scan_id: str, target_url: str, db_factory):
    t = threading.Thread(target=_run_scan_worker, args=(scan_id, target_url, db_factory), daemon=True)
    t.start()
