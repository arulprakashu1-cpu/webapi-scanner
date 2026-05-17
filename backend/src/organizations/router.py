from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.database.session import get_db
from src.database.models import User
from src.auth.dependencies import get_current_user
from src.organizations.service import get_user_org

router = APIRouter()


@router.get("/me")
def get_my_org(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org = get_user_org(db, current_user.id)
    if not org:
        return None
    return {"id": org.id, "name": org.name, "created_at": org.created_at}
