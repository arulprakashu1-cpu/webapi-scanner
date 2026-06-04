from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Integer
from sqlalchemy.orm import relationship, DeclarativeBase
from datetime import datetime, timezone
import uuid


def gen_uuid():
    return str(uuid.uuid4())


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=True)
    full_name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    email_verified = Column(Boolean, default=False)
    plan = Column(String, default="free")
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    payment_status = Column(String, default="none")  # none | trial | active | expired | cancelled
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_login = Column(DateTime, nullable=True)

    organizations = relationship("OrganizationMember", back_populates="user")


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    created_by = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    members = relationship("OrganizationMember", back_populates="organization")
    scans = relationship("Scan", back_populates="organization")


class OrganizationMember(Base):
    __tablename__ = "organization_members"

    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    organization_id = Column(String, ForeignKey("organizations.id"), primary_key=True)
    role = Column(String, default="owner")

    user = relationship("User", back_populates="organizations")
    organization = relationship("Organization", back_populates="members")


class Scan(Base):
    __tablename__ = "scans"

    id = Column(String, primary_key=True, default=gen_uuid)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="queued")
    target_type = Column(String, nullable=False)
    target_url = Column(String, nullable=True)
    spec_file_path = Column(String, nullable=True)
    auth_type = Column(String, default="none")
    auth_header_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    progress = Column(Integer, default=0)
    endpoints_count = Column(Integer, default=0)
    security_score = Column(Integer, nullable=True)
    https_enforced = Column(Boolean, default=False)
    headers_pass = Column(Boolean, nullable=True)
    cors_safe = Column(Boolean, nullable=True)

    organization = relationship("Organization", back_populates="scans")
    findings = relationship("ScanFinding", back_populates="scan", cascade="all, delete-orphan")


class ScanFinding(Base):
    __tablename__ = "scan_findings"

    id = Column(String, primary_key=True, default=gen_uuid)
    scan_id = Column(String, ForeignKey("scans.id"), nullable=False, index=True)
    severity = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    confidence = Column(String, nullable=True)
    endpoint = Column(String, nullable=True)
    method = Column(String, nullable=True)
    remediation = Column(Text, nullable=True)
    cwe_id = Column(String, nullable=True)
    owasp_category = Column(String, nullable=True)
    finding_status = Column(String, default="new")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    scan = relationship("Scan", back_populates="findings")


class UsageEvent(Base):
    __tablename__ = "usage_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(String, ForeignKey("organizations.id"), index=True)
    event_type = Column(String, nullable=False)
    quantity = Column(Integer, default=1)
    recorded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class ApiTarget(Base):
    __tablename__ = "api_targets"

    id = Column(String, primary_key=True, default=gen_uuid)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    url = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    auth_type = Column(String, default="none")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_scanned_at = Column(DateTime, nullable=True)
    total_scans = Column(Integer, default=0)

    organization = relationship("Organization")


class ScanAiAnalysis(Base):
    __tablename__ = "scan_ai_analyses"

    id = Column(String, primary_key=True, default=gen_uuid)
    scan_id = Column(String, ForeignKey("scans.id"), nullable=False, unique=True, index=True)
    executive_summary = Column(Text, nullable=True)
    risk_level = Column(String, nullable=True)
    attack_narrative = Column(Text, nullable=True)
    top_priorities = Column(Text, nullable=True)
    quick_wins = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    scan = relationship("Scan")
