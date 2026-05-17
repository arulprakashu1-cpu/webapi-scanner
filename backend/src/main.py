import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from src.database.session import init_db, SessionLocal
from src.auth.router import router as auth_router
from src.scans.router import router as scans_router
from src.reports.router import router as reports_router
from src.usage.router import router as usage_router
from src.organizations.router import router as orgs_router
from src.targets.router import router as targets_router


def seed_demo_data():
    from src.database.models import User, Organization, OrganizationMember, Scan, ScanFinding, UsageEvent, ApiTarget
    from src.auth.service import hash_password
    from src.scans.scanner.mock_scanner import OWASP_FINDINGS_POOL
    from datetime import datetime, timezone, timedelta
    import random, uuid

    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            return

        demo_user = User(
            id=str(uuid.uuid4()),
            email="demo@scanapi.io",
            password_hash=hash_password("demo1234"),
            full_name="Alex Chen",
            email_verified=True,
            created_at=datetime.now(timezone.utc) - timedelta(days=30),
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

        demo_scans = [
            {
                "name": "Petstore REST API",
                "description": "OWASP Petstore sample API security assessment",
                "target_url": "https://petstore.swagger.io/v2",
                "days_ago": 14,
                "num_findings": 9,
            },
            {
                "name": "Juice Shop API v1",
                "description": "OWASP Juice Shop intentionally vulnerable API",
                "target_url": "https://juice-shop.herokuapp.com/api",
                "days_ago": 7,
                "num_findings": 12,
            },
            {
                "name": "Internal Auth Service",
                "description": "Authentication microservice — pre-release security review",
                "target_url": "https://auth.internal.acme.com/api/v1",
                "days_ago": 2,
                "num_findings": 6,
            },
            {
                "name": "Payment Gateway API",
                "description": "PCI-DSS compliance scan on payment processing endpoints",
                "target_url": "https://payments.acme.com/api/v2",
                "days_ago": 1,
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
        print("Demo data seeded successfully. Login: demo@scanapi.io / demo1234")
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

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(scans_router, prefix="/scans", tags=["scans"])
app.include_router(reports_router, prefix="/reports", tags=["reports"])
app.include_router(usage_router, prefix="/usage", tags=["usage"])
app.include_router(orgs_router, prefix="/organizations", tags=["organizations"])
app.include_router(targets_router, prefix="/targets", tags=["targets"])


@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}
