import os
import uuid
import asyncio
import hashlib
import bcrypt as _bcrypt
from datetime import datetime, timedelta
from pathlib import Path
from jose import jwt

JWT_SECRET = os.getenv("JWT_SECRET", "change-this-to-a-64-char-random-secret")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Use bcrypt directly (cost factor 12). Pre-hash with SHA-256 to safely handle >72-byte passwords.
def _prep(password: str) -> bytes:
    return hashlib.sha256(password.encode()).digest()

_COMMON_PASSWORDS: set[str] = set()

def _load_common_passwords():
    global _COMMON_PASSWORDS
    p = Path(__file__).parent.parent / "common_passwords.txt"
    if p.exists():
        _COMMON_PASSWORDS = {line.strip().lower() for line in p.read_text().splitlines() if line.strip()}

_load_common_passwords()


def hash_password(password: str) -> str:
    salt = _bcrypt.gensalt(rounds=12)
    return _bcrypt.hashpw(_prep(password), salt).decode()


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return _bcrypt.checkpw(_prep(plain), hashed.encode())
    except Exception:
        return False


def validate_password_policy(password: str) -> str | None:
    """Return error message string if password fails policy, else None."""
    if len(password) < 15:
        return "Password must be at least 15 characters long."
    if len(password) > 128:
        return "Password must not exceed 128 characters."
    if password.lower() in _COMMON_PASSWORDS:
        return "This password is too common. Please choose a more unique password."
    return None


def generate_token() -> str:
    return uuid.uuid4().hex


def create_access_token(user_id: int, token_version: int) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "tv": token_version,
        "exp": expire,
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: int, token_version: int) -> str:
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": str(user_id),
        "tv": token_version,
        "exp": expire,
        "type": "refresh",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    from jose import JWTError
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        return {}


async def exponential_backoff(attempt_count: int):
    """Sleep 0, 1, 2, 4, 8, 16 seconds based on consecutive failed attempts."""
    if attempt_count <= 0:
        return
    delay = min(2 ** (attempt_count - 1), 16)
    await asyncio.sleep(delay)
