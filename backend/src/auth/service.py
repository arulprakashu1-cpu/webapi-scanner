from sqlalchemy.orm import Session
import bcrypt
from jose import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional

from src.database.models import User, Organization, OrganizationMember
from src.auth.schemas import UserCreate
from src.config import settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": user_id, "exp": expire}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, data: UserCreate) -> User:
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        email_verified=True,
    )
    db.add(user)
    db.flush()

    org = Organization(name=f"{data.full_name or data.email.split('@')[0]}'s Workspace", created_by=user.id)
    db.add(org)
    db.flush()

    member = OrganizationMember(user_id=user.id, organization_id=org.id, role="owner")
    db.add(member)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = get_user_by_email(db, email)
    if not user or not user.password_hash or not verify_password(password, user.password_hash):
        return None
    user.last_login = datetime.now(timezone.utc)
    db.commit()
    return user
