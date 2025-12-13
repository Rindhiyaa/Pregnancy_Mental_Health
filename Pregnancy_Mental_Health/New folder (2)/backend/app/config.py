import os
from functools import lru_cache
from pydantic import BaseModel, Field


class Settings(BaseModel):
    app_name: str = "Postpartum Risk Insight"
    environment: str = Field(default="development")
    database_url: str = Field(default="postgresql://postgres:postgres@localhost:5432/postpartum")
    jwt_secret: str = Field(default="change-me")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    model_path: str = "models/model.pkl"
    model_version: str = "0.0.1"
    ml_enabled: bool = True


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings(
        app_name=os.getenv("APP_NAME", Settings.model_fields["app_name"].default),
        environment=os.getenv("ENVIRONMENT", Settings.model_fields["environment"].default),
        database_url=os.getenv("DATABASE_URL", Settings.model_fields["database_url"].default),
        jwt_secret=os.getenv("JWT_SECRET", Settings.model_fields["jwt_secret"].default),
        jwt_algorithm=os.getenv("JWT_ALGORITHM", Settings.model_fields["jwt_algorithm"].default),
        access_token_expire_minutes=int(
            os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", Settings.model_fields["access_token_expire_minutes"].default)
        ),
        model_path=os.getenv("MODEL_PATH", Settings.model_fields["model_path"].default),
        model_version=os.getenv("MODEL_VERSION", Settings.model_fields["model_version"].default),
        ml_enabled=os.getenv("ML_ENABLED", "true").lower() == "true",
    )


