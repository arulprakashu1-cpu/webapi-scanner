from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime


class ScanCreate(BaseModel):
    name: str
    description: Optional[str] = None
    target_type: str
    target_url: Optional[str] = None
    auth_type: str = "none"
    auth_header_name: Optional[str] = None
    auth_header_value: Optional[str] = None


class ScanFindingRead(BaseModel):
    id: str
    severity: str
    title: str
    description: Optional[str]
    confidence: Optional[str]
    endpoint: Optional[str]
    method: Optional[str]
    remediation: Optional[str]
    cwe_id: Optional[str]
    owasp_category: Optional[str]
    finding_status: Optional[str] = "new"
    created_at: datetime

    class Config:
        from_attributes = True


class ScanRead(BaseModel):
    id: str
    name: str
    description: Optional[str]
    status: str
    target_type: str
    target_url: Optional[str]
    auth_type: str
    created_at: datetime
    started_at: Optional[datetime]
    finished_at: Optional[datetime]
    error_message: Optional[str]
    progress: int
    findings_count: int = 0
    severity_summary: Optional[Dict[str, int]] = None
    endpoints_count: Optional[int] = 0
    security_score: Optional[int] = None
    https_enforced: Optional[bool] = False
    headers_pass: Optional[bool] = None
    cors_safe: Optional[bool] = None

    class Config:
        from_attributes = True


class ScanListItem(BaseModel):
    id: str
    name: str
    status: str
    target_url: Optional[str]
    created_at: datetime
    finished_at: Optional[datetime]
    findings_count: int = 0
    high_count: int = 0
    medium_count: int = 0
    low_count: int = 0

    class Config:
        from_attributes = True
