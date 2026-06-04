from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./scanner.db"
    SECRET_KEY: str = "super-secret-key-change-in-production-abc123xyz789"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    FREE_TIER_SCANS_PER_MONTH: int = 8
    PRO_TIER_SCANS_PER_MONTH: int = 100
    ANTHROPIC_API_KEY: str = ""
    CAPTCHA_ENABLED: bool = False
    CAPTCHA_SITE_KEY: str = ""
    CAPTCHA_SECRET_KEY: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
