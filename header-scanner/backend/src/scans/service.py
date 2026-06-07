import json
import logging
from datetime import datetime, timedelta
from urllib.parse import urlparse
from sqlalchemy.orm import Session
from fastapi import HTTPException
from ..models import (
    HsUser, HsScanProfile, HsCustomHeader, HsScanRun, HsScanFinding, HsPublicScanIpLog
)
from .header_engine import fetch_and_analyze
from .grader import calculate_grade
from .virustotal import analyze_url

logger = logging.getLogger(__name__)

FREE_MAX_PROFILES = 2
FREE_MAX_SCANS_PER_DAY = 2
FREE_MAX_HISTORY = 2


def _extract_domain(url: str) -> str:
    try:
        parsed = urlparse(url)
        return parsed.netloc or url
    except Exception:
        return url


def check_public_rate_limit(db: Session, ip: str):
    since = datetime.utcnow() - timedelta(hours=24)
    count = db.query(HsPublicScanIpLog).filter(
        HsPublicScanIpLog.ip == ip,
        HsPublicScanIpLog.scan_time >= since,
    ).count()
    if count >= 1:
        raise HTTPException(
            status_code=429,
            detail="You've used your free public scan. Sign up for unlimited access.",
        )


async def run_public_scan(db: Session, url: str, ip: str) -> dict:
    check_public_rate_limit(db, ip)

    # Record IP
    db.add(HsPublicScanIpLog(ip=ip))
    db.commit()

    result = await fetch_and_analyze(url)
    grade, counts = calculate_grade(result.get("findings", []), result.get("reachable", False))

    vt_data = None
    try:
        vt_data = await analyze_url(url)
    except Exception as e:
        logger.warning(f"VT analysis failed: {e}")

    return {
        "url": url,
        "reachable": result.get("reachable", False),
        "error": result.get("error"),
        "grade": grade,
        "counts": counts,
        "findings": result.get("findings", []),
        "virustotal": vt_data,
    }


def get_user_profiles(db: Session, user: HsUser) -> list:
    profiles = db.query(HsScanProfile).filter(HsScanProfile.user_id == user.id).all()
    result = []
    for p in profiles:
        runs = db.query(HsScanRun).filter(HsScanRun.profile_id == p.id).order_by(HsScanRun.scanned_at.desc()).all()
        latest_grade = runs[0].grade if runs else None
        result.append({
            "id": p.id,
            "site_name": p.site_name or _extract_domain(p.url),
            "url": p.url,
            "created_at": p.created_at.isoformat(),
            "updated_at": p.updated_at.isoformat() if p.updated_at else p.created_at.isoformat(),
            "custom_headers": [
                {"id": ch.id, "header_key": ch.header_key, "header_value": ch.header_value}
                for ch in p.custom_headers
            ],
            "latest_grade": latest_grade,
            "scan_count": len(runs),
        })
    return result


def create_profile(db: Session, user: HsUser, url: str, site_name: str | None) -> dict:
    profile_count = db.query(HsScanProfile).filter(HsScanProfile.user_id == user.id).count()
    if user.plan == "free" and profile_count >= FREE_MAX_PROFILES:
        raise HTTPException(
            status_code=403,
            detail=f"Free plan allows maximum {FREE_MAX_PROFILES} scan profiles. Upgrade to Pro for unlimited.",
        )

    computed_name = site_name.strip() if site_name else _extract_domain(url)
    profile = HsScanProfile(user_id=user.id, url=url, site_name=computed_name)
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return {
        "id": profile.id,
        "site_name": profile.site_name,
        "url": profile.url,
        "created_at": profile.created_at.isoformat(),
        "updated_at": profile.created_at.isoformat(),
        "custom_headers": [],
        "latest_grade": None,
        "scan_count": 0,
    }


def update_profile(db: Session, user: HsUser, profile_id: int, data) -> dict:
    profile = db.query(HsScanProfile).filter(
        HsScanProfile.id == profile_id,
        HsScanProfile.user_id == user.id,
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    if data.site_name is not None:
        profile.site_name = data.site_name.strip() or _extract_domain(profile.url)

    if data.custom_headers is not None:
        if len(data.custom_headers) > 3:
            raise HTTPException(status_code=400, detail="Free plan allows maximum 3 custom headers per profile")
        # Replace all custom headers
        db.query(HsCustomHeader).filter(HsCustomHeader.profile_id == profile.id).delete()
        for ch in data.custom_headers:
            db.add(HsCustomHeader(
                profile_id=profile.id,
                header_key=ch.header_key.strip(),
                header_value=ch.header_value.strip(),
            ))

    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)

    runs = db.query(HsScanRun).filter(HsScanRun.profile_id == profile.id).order_by(HsScanRun.scanned_at.desc()).all()
    return {
        "id": profile.id,
        "site_name": profile.site_name,
        "url": profile.url,
        "created_at": profile.created_at.isoformat(),
        "updated_at": profile.updated_at.isoformat() if profile.updated_at else profile.created_at.isoformat(),
        "custom_headers": [
            {"id": ch.id, "header_key": ch.header_key, "header_value": ch.header_value}
            for ch in profile.custom_headers
        ],
        "latest_grade": runs[0].grade if runs else None,
        "scan_count": len(runs),
    }


def delete_profile(db: Session, user: HsUser, profile_id: int):
    profile = db.query(HsScanProfile).filter(
        HsScanProfile.id == profile_id,
        HsScanProfile.user_id == user.id,
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    db.delete(profile)
    db.commit()


async def run_profile_scan(db: Session, user: HsUser, profile_id: int, scan_name: str | None) -> tuple[dict, bool]:
    """Returns (scan_run_dict, oldest_deleted_bool)."""
    profile = db.query(HsScanProfile).filter(
        HsScanProfile.id == profile_id,
        HsScanProfile.user_id == user.id,
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Check daily limit
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    daily_count = db.query(HsScanRun).filter(
        HsScanRun.user_id == user.id,
        HsScanRun.scanned_at >= today_start,
        HsScanRun.is_public == False,
    ).count()
    if user.plan == "free" and daily_count >= FREE_MAX_SCANS_PER_DAY:
        raise HTTPException(
            status_code=429,
            detail="You've reached your daily scan limit (2/day on free plan). Try again tomorrow.",
        )

    # Build custom headers for request
    extra_headers = {ch.header_key: ch.header_value for ch in profile.custom_headers}

    result = await fetch_and_analyze(profile.url, extra_headers)
    grade, counts = calculate_grade(result.get("findings", []), result.get("reachable", False))

    # Create scan run
    run = HsScanRun(
        profile_id=profile.id,
        user_id=user.id,
        scan_name=scan_name or f"Scan {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}",
        grade=grade,
        status="completed",
        critical_count=counts.get("critical", 0),
        high_count=counts.get("high", 0),
        medium_count=counts.get("medium", 0),
        low_count=counts.get("low", 0),
        info_count=counts.get("info", 0),
        target_url=profile.url,
        is_public=False,
    )
    db.add(run)
    db.flush()

    # Insert findings
    for f in result.get("findings", []):
        db.add(HsScanFinding(
            scan_run_id=run.id,
            header_name=f["header_name"],
            status=f["status"],
            severity=f["severity"],
            standard=f.get("standard"),
            description=f.get("description"),
            payload=f.get("payload"),
            remediation=f.get("remediation"),
            reference_links=f.get("reference_links"),
        ))

    db.commit()
    db.refresh(run)

    # Enforce free tier history limit (keep only 2 most recent, delete oldest)
    oldest_deleted = False
    if user.plan == "free":
        all_runs = (
            db.query(HsScanRun)
            .filter(HsScanRun.profile_id == profile.id)
            .order_by(HsScanRun.scanned_at.desc())
            .all()
        )
        if len(all_runs) > FREE_MAX_HISTORY:
            for old_run in all_runs[FREE_MAX_HISTORY:]:
                db.delete(old_run)
                oldest_deleted = True
            db.commit()

    return {
        "id": run.id,
        "profile_id": run.profile_id,
        "scan_name": run.scan_name,
        "grade": run.grade,
        "status": run.status,
        "critical_count": run.critical_count,
        "high_count": run.high_count,
        "medium_count": run.medium_count,
        "low_count": run.low_count,
        "info_count": run.info_count,
        "vt_malicious": run.vt_malicious,
        "vt_suspicious": run.vt_suspicious,
        "vt_harmless": run.vt_harmless,
        "vt_verdict": run.vt_verdict,
        "scanned_at": run.scanned_at.isoformat(),
        "target_url": run.target_url,
    }, oldest_deleted


def get_profile_runs(db: Session, user: HsUser, profile_id: int) -> list:
    profile = db.query(HsScanProfile).filter(
        HsScanProfile.id == profile_id,
        HsScanProfile.user_id == user.id,
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    runs = (
        db.query(HsScanRun)
        .filter(HsScanRun.profile_id == profile.id)
        .order_by(HsScanRun.scanned_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "profile_id": r.profile_id,
            "scan_name": r.scan_name,
            "grade": r.grade,
            "status": r.status,
            "critical_count": r.critical_count,
            "high_count": r.high_count,
            "medium_count": r.medium_count,
            "low_count": r.low_count,
            "info_count": r.info_count,
            "vt_malicious": r.vt_malicious,
            "vt_suspicious": r.vt_suspicious,
            "vt_harmless": r.vt_harmless,
            "vt_verdict": r.vt_verdict,
            "scanned_at": r.scanned_at.isoformat(),
            "target_url": r.target_url,
        }
        for r in runs
    ]


def get_run(db: Session, user: HsUser, run_id: int) -> dict:
    run = db.query(HsScanRun).filter(HsScanRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Scan not found")
    if run.user_id and run.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return {
        "id": run.id,
        "profile_id": run.profile_id,
        "scan_name": run.scan_name,
        "grade": run.grade,
        "status": run.status,
        "critical_count": run.critical_count,
        "high_count": run.high_count,
        "medium_count": run.medium_count,
        "low_count": run.low_count,
        "info_count": run.info_count,
        "vt_malicious": run.vt_malicious,
        "vt_suspicious": run.vt_suspicious,
        "vt_harmless": run.vt_harmless,
        "vt_verdict": run.vt_verdict,
        "vt_engines": run.vt_engines,
        "scanned_at": run.scanned_at.isoformat(),
        "target_url": run.target_url,
    }


def get_run_findings(db: Session, user: HsUser, run_id: int) -> list:
    run = db.query(HsScanRun).filter(HsScanRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Scan not found")
    if run.user_id and run.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    findings = db.query(HsScanFinding).filter(HsScanFinding.scan_run_id == run_id).all()
    severity_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3, "Info": 4}
    findings = sorted(findings, key=lambda f: severity_order.get(f.severity, 99))
    return [
        {
            "id": f.id,
            "header_name": f.header_name,
            "status": f.status,
            "severity": f.severity,
            "standard": f.standard,
            "description": f.description,
            "payload": f.payload,
            "remediation": f.remediation,
            "reference_links": f.reference_links,
        }
        for f in findings
    ]


def delete_run(db: Session, user: HsUser, run_id: int):
    run = db.query(HsScanRun).filter(HsScanRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Scan not found")
    if run.user_id and run.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(run)
    db.commit()
