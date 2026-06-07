import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent.parent / ".env")

from .database import init_db
from .auth.router import router as auth_router
from .scans.router import router as scans_router
from .reports.router import router as reports_router

logging.basicConfig(level=logging.INFO)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5174")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Security Header Scanner API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5174", "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(scans_router, prefix="/api/scans", tags=["Scans"])
app.include_router(reports_router, prefix="/api/scans", tags=["Reports"])


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "service": "header-scanner"}


@app.get("/api/dev/emails", tags=["Dev"])
def dev_emails():
    """Return recent emails captured in dev mode (SMTP not configured). Remove in production."""
    from .email.sender import _dev_email_log
    return list(_dev_email_log)


@app.delete("/api/dev/clear-ip-log", tags=["Dev"])
def dev_clear_ip_log():
    """Clear the public scan IP rate-limit log. Dev only — remove in production."""
    from .database import get_db
    from .models import HsPublicScanIpLog
    db = next(get_db())
    try:
        deleted = db.query(HsPublicScanIpLog).delete()
        db.commit()
        return {"deleted": deleted, "message": "IP scan log cleared"}
    finally:
        db.close()
