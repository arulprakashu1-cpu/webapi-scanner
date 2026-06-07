from pydantic import BaseModel, HttpUrl
from typing import Optional, List


class PublicScanRequest(BaseModel):
    url: str
    captcha_token: str


class CreateProfileRequest(BaseModel):
    url: str
    site_name: Optional[str] = None


class UpdateProfileRequest(BaseModel):
    url: Optional[str] = None
    site_name: Optional[str] = None


class CustomHeaderItem(BaseModel):
    header_key: str
    header_value: str


class UpdateProfileSettingsRequest(BaseModel):
    site_name: Optional[str] = None
    custom_headers: Optional[List[CustomHeaderItem]] = None


class RunScanRequest(BaseModel):
    scan_name: Optional[str] = None


class ProfileRead(BaseModel):
    id: int
    site_name: Optional[str]
    url: str
    created_at: str
    updated_at: str
    custom_headers: List[dict] = []
    latest_grade: Optional[str] = None
    scan_count: int = 0

    class Config:
        from_attributes = True


class ScanRunRead(BaseModel):
    id: int
    profile_id: Optional[int]
    scan_name: Optional[str]
    grade: Optional[str]
    status: str
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    info_count: int
    vt_malicious: Optional[int]
    vt_suspicious: Optional[int]
    vt_harmless: Optional[int]
    vt_verdict: Optional[str]
    scanned_at: str
    target_url: Optional[str]

    class Config:
        from_attributes = True


class FindingRead(BaseModel):
    id: int
    header_name: str
    status: str
    severity: str
    standard: Optional[str]
    description: Optional[str]
    payload: Optional[str]
    remediation: Optional[str]
    reference_links: Optional[str]

    class Config:
        from_attributes = True
