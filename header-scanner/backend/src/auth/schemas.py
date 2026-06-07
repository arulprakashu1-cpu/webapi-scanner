from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional


class RegisterRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    confirm_password: str
    company: Optional[str] = None
    captcha_token: str

    @field_validator("first_name", "last_name")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("This field is required")
        return v.strip()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    captcha_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    captcha_token: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    confirm_password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class UpdateProfileRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company: Optional[str] = None


class UserRead(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    company: Optional[str] = None
    is_verified: bool
    plan: str
    created_at: str

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
    require_password_change: bool = False


class DeleteAccountRequest(BaseModel):
    reason: Optional[str] = None
