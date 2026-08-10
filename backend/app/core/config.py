from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://ratecalc:ratecalc@localhost:5432/rate_calculator"
    secret_key: str = "change-me-to-a-random-secret"
    access_token_expire_minutes: int = 60 * 24
    frontend_url: str = "http://localhost:3000"
    admin_email: str = "admin@workshop.local"
    admin_password: str = "changeme123"
    algorithm: str = "HS256"


settings = Settings()
