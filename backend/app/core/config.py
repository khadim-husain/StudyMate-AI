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
    GEMINI_MODEL: str = Field(default="gemini-2.5-flash", description="Supported Gemini model")
    EMBEDDING_MODEL: str = Field(default="text-embedding-004", description="Embedding model name")
    EMBEDDING_DIMENSION: int = 768
    
    # Security & JWT
    JWT_SECRET_KEY: str = Field(
        default="studymate_super_secret_jwt_key_2026_change_in_production",
        description="Secret key for JWT generation"
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # File Uploads
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 20
    
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

settings = Settings()
