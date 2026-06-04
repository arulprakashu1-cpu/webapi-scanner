import os
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager

from src.database.session import init_db, SessionLocal
from src.auth.router import router as auth_router
from src.scans.router import router as scans_router
from src.reports.router import router as reports_router
from src.usage.router import router as usage_router
from src.organizations.router import router as orgs_router
from src.targets.router import router as targets_router
from src.admin.router import router as admin_router


def seed_demo_data():
    from src.database.models import User, Organization, OrganizationMember, Scan, ScanFinding, UsageEvent, ApiTarget
    from src.auth.service import hash_password
    from src.scans.scanner.mock_scanner import OWASP_FINDINGS_POOL
    from datetime import datetime, timezone, timedelta
    import random, uuid

    db = SessionLocal()
    try:
        if db.query(User).filter(User.email == "demo@scanapi.io").count() > 0:
            return

        # ── Free demo user ──────────────────────────────────────────────
        demo_user = User(
            id=str(uuid.uuid4()),
            email="demo@scanapi.io",
            password_hash=hash_password("demo1234"),
            full_name="Alex Chen",
            email_verified=True,
            plan="free",
            created_at=datetime.now(timezone.utc) - timedelta(days=60),
        )
        db.add(demo_user)
        db.flush()

        org = Organization(
            id=str(uuid.uuid4()),
            name="Acme Security Team",
            created_by=demo_user.id,
            created_at=datetime.now(timezone.utc) - timedelta(days=30),
        )
        db.add(org)
        db.flush()

        member = OrganizationMember(user_id=demo_user.id, organization_id=org.id, role="owner")
        db.add(member)

        # days_ago > 31 ensures these fall in a previous month and don't
        # consume any of the current month's 8-scan free-tier quota
        demo_scans = [
            {
                "name": "Petstore REST API",
                "description": "OWASP Petstore sample API security assessment",
                "target_url": "https://petstore.swagger.io/v2",
                "days_ago": 45,
                "num_findings": 9,
            },
            {
                "name": "Juice Shop API v1",
                "description": "OWASP Juice Shop intentionally vulnerable API",
                "target_url": "https://juice-shop.herokuapp.com/api",
                "days_ago": 40,
                "num_findings": 12,
            },
            {
                "name": "Internal Auth Service",
                "description": "Authentication microservice — pre-release security review",
                "target_url": "https://auth.internal.acme.com/api/v1",
                "days_ago": 36,
                "num_findings": 6,
            },
            {
                "name": "Payment Gateway API",
                "description": "PCI-DSS compliance scan on payment processing endpoints",
                "target_url": "https://payments.acme.com/api/v2",
                "days_ago": 33,
                "num_findings": 4,
            },
        ]

        for sd in demo_scans:
            created = datetime.now(timezone.utc) - timedelta(days=sd["days_ago"])
            finished = created + timedelta(minutes=3, seconds=random.randint(10, 50))

            scan = Scan(
                id=str(uuid.uuid4()),
                organization_id=org.id,
                name=sd["name"],
                description=sd["description"],
                status="completed",
                target_type="manual",
                target_url=sd["target_url"],
                auth_type="none",
                created_at=created,
                started_at=created + timedelta(seconds=2),
                finished_at=finished,
                progress=100,
            )
            db.add(scan)
            db.flush()

            pool = OWASP_FINDINGS_POOL.copy()
            random.shuffle(pool)
            selected = pool[: sd["num_findings"]]

            for f in selected:
                finding = ScanFinding(
                    id=str(uuid.uuid4()),
                    scan_id=scan.id,
                    severity=f["severity"],
                    title=f["title"],
                    description=f["description"],
                    confidence=f["confidence"],
                    endpoint=sd["target_url"].rstrip("/") + f["path"],
                    method=f["method"],
                    remediation=f["remediation"],
                    cwe_id=f["cwe_id"],
                    owasp_category=f["owasp_category"],
                    created_at=finished,
                )
                db.add(finding)

            usage = UsageEvent(
                organization_id=org.id,
                event_type="scan_completed",
                quantity=1,
                recorded_at=finished,
            )
            db.add(usage)

        # Seed demo targets
        demo_targets = [
            {"name": "Petstore REST API",    "url": "https://petstore.swagger.io/v2",           "description": "OWASP sample Petstore API"},
            {"name": "Juice Shop API",       "url": "https://juice-shop.herokuapp.com/api",      "description": "OWASP intentionally vulnerable app"},
            {"name": "Internal Auth Service","url": "https://auth.internal.acme.com/api/v1",     "description": "Authentication microservice"},
            {"name": "Payment Gateway API",  "url": "https://payments.acme.com/api/v2",          "description": "PCI-DSS payment endpoints"},
            {"name": "GitHub REST API",      "url": "https://api.github.com",                    "description": "Public GitHub API v3"},
        ]
        for sd_t in demo_scans:
            existing_target = next((t for t in demo_targets if t["url"] == sd_t["target_url"]), None)
            if not existing_target:
                continue
            t = ApiTarget(
                id=str(uuid.uuid4()),
                organization_id=org.id,
                name=existing_target["name"],
                url=existing_target["url"],
                description=existing_target["description"],
                auth_type="none",
                total_scans=1,
                last_scanned_at=datetime.now(timezone.utc) - timedelta(days=sd_t["days_ago"]),
            )
            db.add(t)

        # Add GitHub target (no scans yet)
        github_t = ApiTarget(
            id=str(uuid.uuid4()),
            organization_id=org.id,
            name="GitHub REST API",
            url="https://api.github.com",
            description="Public GitHub API v3",
            auth_type="bearer",
            total_scans=0,
        )
        db.add(github_t)

        db.commit()
        print("Demo data seeded. Login: demo@scanapi.io / demo1234")

        # ── Pro demo user ───────────────────────────────────────────────
        pro_user = User(
            id=str(uuid.uuid4()),
            email="pro@scanapi.io",
            password_hash=hash_password("pro1234"),
            full_name="Jordan Lee",
            email_verified=True,
            plan="pro",
            created_at=datetime.now(timezone.utc) - timedelta(days=60),
        )
        db.add(pro_user)
        pro_org = Organization(
            id=str(uuid.uuid4()),
            name="Pro Workspace",
            created_by=pro_user.id,
            created_at=datetime.now(timezone.utc) - timedelta(days=60),
        )
        db.add(pro_org)
        db.flush()
        db.add(OrganizationMember(user_id=pro_user.id, organization_id=pro_org.id, role="owner"))
        db.commit()
        print("Pro user seeded.  Login: pro@scanapi.io / pro1234")

        # ── Admin user ──────────────────────────────────────────────────
        if db.query(User).filter(User.email == "admin@scanapi.io").count() == 0:
            admin_user = User(
                id=str(uuid.uuid4()),
                email="admin@scanapi.io",
                password_hash=hash_password("admin123"),
                full_name="System Admin",
                email_verified=True,
                plan="pro",
                is_admin=True,
                is_active=True,
                payment_status="active",
                created_at=datetime.now(timezone.utc) - timedelta(days=90),
            )
            db.add(admin_user)
            admin_org = Organization(
                id=str(uuid.uuid4()),
                name="Admin Workspace",
                created_by=admin_user.id,
                created_at=datetime.now(timezone.utc) - timedelta(days=90),
            )
            db.add(admin_org)
            db.flush()
            db.add(OrganizationMember(user_id=admin_user.id, organization_id=admin_org.id, role="owner"))
            db.commit()
            print("Admin user seeded. Login: admin@scanapi.io / admin123")
    except Exception as e:
        db.rollback()
        print(f"Seed error: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed_demo_data()
    yield


app = FastAPI(title="API Security Scanner", version="1.0.0", lifespan=lifespan)

_extra_origin = os.getenv("FRONTEND_URL", "")
_origins = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]
if _extra_origin:
    _origins.append(_extra_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(scans_router, prefix="/scans", tags=["scans"])
api_router.include_router(reports_router, prefix="/reports", tags=["reports"])
api_router.include_router(usage_router, prefix="/usage", tags=["usage"])
api_router.include_router(orgs_router, prefix="/organizations", tags=["organizations"])
api_router.include_router(targets_router, prefix="/targets", tags=["targets"])
api_router.include_router(admin_router,   prefix="/admin",   tags=["admin"])
app.include_router(api_router)


@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}


# Serve React frontend in production (when frontend/dist exists)
_static_dir = os.path.join(os.path.dirname(__file__), "..", "..", "frontend_dist")
if os.path.isdir(_static_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(_static_dir, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        # Serve real files (SVGs, fonts, etc.) directly; fall back to index.html for SPA routes
        candidate = os.path.join(_static_dir, full_path)
        if full_path and os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(os.path.join(_static_dir, "index.html"))
