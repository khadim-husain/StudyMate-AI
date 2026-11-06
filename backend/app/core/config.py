from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import List, Union
import json
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "StudyMate AI Backend"
    API_V1_PREFIX: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = Field(
        default="postgresql+psycopg://postgres:admin@localhost:5432/studymate_db",
        description="PostgreSQL connection string with psycopg driver"
    )
    
    # Gemini AI
    GEMINI_API_KEY: str = Field(default="", description="Google Gemini API key")
    GEMINI_MODEL: str = Field(default="gemini-3.5-flash", description="Supported Gemini model")
    EMBEDDING_MODEL: str = Field(default="gemini-embedding-001", description="Embedding model name")
    EMBEDDING_DIMENSION: int = 768
    
    # Security & JWT
    JWT_SECRET_KEY: str = Field(
        default="studymate_super_secret_jwt_key_2026_change_in_production",
        description="Secret key for JWT generation"
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Google OAuth
    GOOGLE_CLIENT_ID_WEB: str = Field(default="", description="Google OAuth Web Client ID")
    GOOGLE_CLIENT_ID_ANDROID: str = Field(default="", description="Google OAuth Android Client ID")
    GOOGLE_CLIENT_ID_IOS: str = Field(default="", description="Google OAuth iOS Client ID")

    # Email & SMTP Password Reset
    SMTP_HOST: str = Field(default="", description="SMTP host server (e.g. smtp.gmail.com)")
    SMTP_PORT: int = Field(default=587, description="SMTP server port (usually 587 for STARTTLS, 465 for SSL)")
    SMTP_USER: str = Field(default="", description="SMTP authentication username")
    SMTP_PASSWORD: str = Field(default="", description="SMTP authentication password / app password")
    SMTP_FROM_EMAIL: str = Field(default="", description="From email address for outgoing system emails")
    SMTP_FROM_NAME: str = "StudyMate AI"
    SMTP_TLS: bool = True
    RESET_TOKEN_EXPIRE_MINUTES: int = 15
    FRONTEND_URL: str = "http://localhost:8081"
    APP_DEEP_LINK_SCHEME: str = "studymate"
    
    # File Uploads
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 20

    # S3 / Cloudflare R2 Persistent Cloud Object Storage
    S3_ENDPOINT_URL: str = Field(default="", description="S3 or Cloudflare R2 endpoint URL")
    S3_ACCESS_KEY_ID: str = Field(default="", description="S3 or Cloudflare R2 Access Key ID")
    S3_SECRET_ACCESS_KEY: str = Field(default="", description="S3 or Cloudflare R2 Secret Access Key")
    S3_BUCKET_NAME: str = Field(default="", description="S3 or Cloudflare R2 bucket name for PDF study materials")
    S3_REGION_NAME: str = Field(default="auto", description="S3 region (or 'auto' for Cloudflare R2)")
    
    # Environment
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: Union[List[str], str] = ["*"]
    
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def get_cors_origins(self) -> List[str]:
        if isinstance(self.CORS_ORIGINS, list):
            return self.CORS_ORIGINS
        try:
            return json.loads(self.CORS_ORIGINS)
        except Exception:
            return [self.CORS_ORIGINS]

    @property
    def sqlalchemy_database_uri(self) -> str:
        """
        Ensures PostgreSQL URLs from cloud providers (Render, Neon, Supabase, etc.)
        use the installed psycopg3 driver prefix (postgresql+psycopg://).
        """
        url = self.DATABASE_URL.strip()
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+psycopg://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+"):
            url = url.replace("postgresql://", "postgresql+psycopg://", 1)
        return url

settings = Settings()
