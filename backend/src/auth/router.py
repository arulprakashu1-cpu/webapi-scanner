from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import httpx

from src.database.session import get_db
from src.auth import schemas, service
from src.auth.dependencies import get_current_user
from src.database.models import User
from src.config import settings

router = APIRouter()


def _verify_turnstile(token: str) -> bool:
    try:
        resp = httpx.post(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            data={"secret": settings.CAPTCHA_SECRET_KEY, "response": token},
            timeout=5.0,
        )
        return resp.json().get("success", False)
    except Exception:
        return False


@router.post("/register", response_model=schemas.Token)
def register(data: schemas.UserCreate, db: Session = Depends(get_db)):
    if service.get_user_by_email(db, data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = service.create_user(db, data)
    token = service.create_access_token(user.id)
    return schemas.Token(access_token=token, user=schemas.UserRead.model_validate(user))


@router.post("/login", response_model=schemas.Token)
def login(data: schemas.UserLogin, db: Session = Depends(get_db)):
    if settings.CAPTCHA_ENABLED:
        if not data.captcha_token:
            raise HTTPException(status_code=400, detail="CAPTCHA verification required")
        if not _verify_turnstile(data.captcha_token):
            raise HTTPException(status_code=400, detail="CAPTCHA verification failed. Please try again.")
    user = service.authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = service.create_access_token(user.id)
    return schemas.Token(access_token=token, user=schemas.UserRead.model_validate(user))


@router.get("/me", response_model=schemas.UserRead)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
