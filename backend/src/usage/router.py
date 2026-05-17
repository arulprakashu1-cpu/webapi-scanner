from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.database.session import get_db
from src.database.models import User
from src.auth.dependencies import get_current_user
from src.organizations.service import get_user_org
from src.scans.service import get_monthly_scan_count
from src.config import settings

router = APIRouter()


@router.get("/")
def get_usage(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org = get_user_org(db, current_user.id)
    if not org:
        return {"monthly_scans": 0, "limit": settings.FREE_TIER_SCANS_PER_MONTH, "plan": "free", "remaining": settings.FREE_TIER_SCANS_PER_MONTH}

    count = get_monthly_scan_count(db, org.id)
    return {
        "monthly_scans": count,
        "limit": settings.FREE_TIER_SCANS_PER_MONTH,
        "plan": "free",
        "remaining": max(0, settings.FREE_TIER_SCANS_PER_MONTH - count),
    }
