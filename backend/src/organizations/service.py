from sqlalchemy.orm import Session
from typing import Optional

from src.database.models import Organization, OrganizationMember


def get_user_org(db: Session, user_id: str) -> Optional[Organization]:
    member = db.query(OrganizationMember).filter(OrganizationMember.user_id == user_id).first()
    if not member:
        return None
    return db.query(Organization).filter(Organization.id == member.organization_id).first()
