from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.database.session import get_db
from src.auth import schemas, service
from src.auth.dependencies import get_current_user
from src.database.models import User

router = APIRouter()


@router.post("/register", response_model=schemas.Token)
def register(data: schemas.UserCreate, db: Session = Depends(get_db)):
    if service.get_user_by_email(db, data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = service.create_user(db, data)
    token = service.create_access_token(user.id)
    return schemas.Token(access_token=token, user=schemas.UserRead.model_validate(user))


@router.post("/login", response_model=schemas.Token)
def login(data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = service.authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = service.create_access_token(user.id)
    return schemas.Token(access_token=token, user=schemas.UserRead.model_validate(user))


@router.get("/me", response_model=schemas.UserRead)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
