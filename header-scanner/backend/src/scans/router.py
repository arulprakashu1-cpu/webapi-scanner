from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..dependencies import get_current_user
from ..models import HsUser
from .schemas import (
    PublicScanRequest, CreateProfileRequest,
    UpdateProfileSettingsRequest, RunScanRequest,
)
from . import service
from ..auth.service import verify_hcaptcha

router = APIRouter()


@router.post("/public")
async def public_scan(data: PublicScanRequest, request: Request, db: Session = Depends(get_db)):
    if not await verify_hcaptcha(data.captcha_token):
        raise HTTPException(status_code=400, detail="CAPTCHA verification failed")
    ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")
    return await service.run_public_scan(db, data.url, ip)


@router.get("/profiles")
async def list_profiles(
    user: HsUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.get_user_profiles(db, user)


@router.post("/profiles", status_code=201)
async def create_profile(
    data: CreateProfileRequest,
    user: HsUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.create_profile(db, user, data.url, data.site_name)


@router.put("/profiles/{profile_id}")
async def update_profile(
    profile_id: int,
    data: UpdateProfileSettingsRequest,
    user: HsUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.update_profile(db, user, profile_id, data)


@router.delete("/profiles/{profile_id}", status_code=204)
async def delete_profile(
    profile_id: int,
    user: HsUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service.delete_profile(db, user, profile_id)


@router.post("/profiles/{profile_id}/run")
async def run_scan(
    profile_id: int,
    data: RunScanRequest,
    user: HsUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    run, oldest_deleted = await service.run_profile_scan(db, user, profile_id, data.scan_name)
    return {"run": run, "oldest_deleted": oldest_deleted}


@router.get("/profiles/{profile_id}/runs")
async def get_profile_runs(
    profile_id: int,
    user: HsUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.get_profile_runs(db, user, profile_id)


@router.get("/runs/{run_id}")
async def get_run(
    run_id: int,
    user: HsUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.get_run(db, user, run_id)


@router.get("/runs/{run_id}/findings")
async def get_run_findings(
    run_id: int,
    user: HsUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.get_run_findings(db, user, run_id)


@router.delete("/runs/{run_id}", status_code=204)
async def delete_run(
    run_id: int,
    user: HsUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service.delete_run(db, user, run_id)
