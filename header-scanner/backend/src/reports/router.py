from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from ..database import get_db
from ..dependencies import get_current_user
from ..models import HsUser
from ..scans.service import get_run, get_run_findings
from .generator import generate_json_report, generate_pdf_report

router = APIRouter()


@router.get("/runs/{run_id}/report")
async def download_report(
    run_id: int,
    format: str = "json",
    user: HsUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    run = get_run(db, user, run_id)
    findings = get_run_findings(db, user, run_id)

    if format == "pdf":
        pdf = generate_pdf_report(run, findings)
        return Response(
            content=pdf,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=scan_{run_id}.pdf"},
        )
    else:
        data = generate_json_report(run, findings)
        return Response(
            content=data,
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=scan_{run_id}.json"},
        )
