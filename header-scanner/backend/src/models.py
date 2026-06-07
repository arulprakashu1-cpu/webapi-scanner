from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Text, ForeignKey
)
from sqlalchemy.orm import relationship
from .database import Base


class HsUser(Base):
    __tablename__ = "hs_users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    company = Column(String(255), nullable=True)
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    token_version = Column(Integer, default=0)
    plan = Column(String(20), default="free")
    password_changed_at = Column(DateTime, default=datetime.utcnow)
    locked_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)

    verification_tokens = relationship(
        "HsEmailVerificationToken", back_populates="user", cascade="all, delete-orphan"
    )
    reset_tokens = relationship(
        "HsPasswordResetToken", back_populates="user", cascade="all, delete-orphan"
    )
    password_history = relationship(
        "HsPasswordHistory", back_populates="user", cascade="all, delete-orphan"
    )
    login_attempts = relationship(
        "HsLoginAttempt", back_populates="user", cascade="all, delete-orphan"
    )
    scan_profiles = relationship(
        "HsScanProfile", back_populates="user", cascade="all, delete-orphan"
    )


class HsEmailVerificationToken(Base):
    __tablename__ = "hs_email_verification_tokens"

    id = Column(Integer, primary_key=True, autoincrement=True)
    token = Column(String(64), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("hs_users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    used = Column(Boolean, default=False)

    user = relationship("HsUser", back_populates="verification_tokens")


class HsPasswordResetToken(Base):
    __tablename__ = "hs_password_reset_tokens"

    id = Column(Integer, primary_key=True, autoincrement=True)
    token = Column(String(64), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("hs_users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    used = Column(Boolean, default=False)

    user = relationship("HsUser", back_populates="reset_tokens")


class HsPasswordHistory(Base):
    __tablename__ = "hs_password_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("hs_users.id"), nullable=False)
    password_hash = Column(String(255), nullable=False)
    changed_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("HsUser", back_populates="password_history")


class HsLoginAttempt(Base):
    __tablename__ = "hs_login_attempts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("hs_users.id"), nullable=True)
    ip = Column(String(64), nullable=True)
    attempted_at = Column(DateTime, default=datetime.utcnow)
    success = Column(Boolean, default=False)

    user = relationship("HsUser", back_populates="login_attempts")


class HsPublicScanIpLog(Base):
    __tablename__ = "hs_public_scan_ip_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ip = Column(String(64), nullable=False, index=True)
    scan_time = Column(DateTime, default=datetime.utcnow)


class HsScanProfile(Base):
    __tablename__ = "hs_scan_profiles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("hs_users.id"), nullable=False)
    site_name = Column(String(255), nullable=True)
    url = Column(String(2048), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("HsUser", back_populates="scan_profiles")
    custom_headers = relationship(
        "HsCustomHeader", back_populates="profile", cascade="all, delete-orphan"
    )
    scan_runs = relationship(
        "HsScanRun", back_populates="profile", cascade="all, delete-orphan"
    )


class HsCustomHeader(Base):
    __tablename__ = "hs_custom_headers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    profile_id = Column(Integer, ForeignKey("hs_scan_profiles.id", ondelete="CASCADE"))
    header_key = Column(String(255), nullable=False)
    header_value = Column(String(2048), nullable=False)

    profile = relationship("HsScanProfile", back_populates="custom_headers")


class HsScanRun(Base):
    __tablename__ = "hs_scan_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    profile_id = Column(Integer, ForeignKey("hs_scan_profiles.id", ondelete="CASCADE"), nullable=True)
    user_id = Column(Integer, ForeignKey("hs_users.id"), nullable=True)
    scan_name = Column(String(255), nullable=True)
    grade = Column(String(5), nullable=True)
    status = Column(String(20), default="pending")
    critical_count = Column(Integer, default=0)
    high_count = Column(Integer, default=0)
    medium_count = Column(Integer, default=0)
    low_count = Column(Integer, default=0)
    info_count = Column(Integer, default=0)
    vt_malicious = Column(Integer, nullable=True)
    vt_suspicious = Column(Integer, nullable=True)
    vt_harmless = Column(Integer, nullable=True)
    vt_verdict = Column(String(20), nullable=True)
    vt_engines = Column(Text, nullable=True)
    scanned_at = Column(DateTime, default=datetime.utcnow)
    is_public = Column(Boolean, default=False)
    target_url = Column(String(2048), nullable=True)

    profile = relationship("HsScanProfile", back_populates="scan_runs")
    findings = relationship(
        "HsScanFinding", back_populates="scan_run", cascade="all, delete-orphan"
    )


class HsScanFinding(Base):
    __tablename__ = "hs_scan_findings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    scan_run_id = Column(Integer, ForeignKey("hs_scan_runs.id", ondelete="CASCADE"))
    header_name = Column(String(255), nullable=False)
    status = Column(String(20), nullable=False)  # present | missing | info_leak
    severity = Column(String(20), nullable=False)
    standard = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    payload = Column(Text, nullable=True)
    remediation = Column(Text, nullable=True)
    reference_links = Column(Text, nullable=True)  # JSON array

    scan_run = relationship("HsScanRun", back_populates="findings")
