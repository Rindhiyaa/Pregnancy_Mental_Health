# backend/app/config.py
"""
Centralized configuration for the application
Single source of truth for environment variables and settings
"""
import os

# Add this line after import os
DATABASE_URL = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASS')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"

# Environment
IS_PRODUCTION = os.getenv("ENVIRONMENT") == "production"

# CORS Origins - Single source of truth
# In production, set ALLOWED_ORIGINS env var: "https://domain1.com,https://domain2.com"
ALLOWED_ORIGINS_STR = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:3000"
)
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS_STR.split(",")]

# Trusted Hosts - For TrustedHostMiddleware
# In production, set TRUSTED_HOSTS env var: "your-domain.com,api.your-domain.com"
TRUSTED_HOSTS_STR = os.getenv(
    "TRUSTED_HOSTS",
    "localhost,127.0.0.1"
)
TRUSTED_HOSTS = [host.strip() for host in TRUSTED_HOSTS_STR.split(",")]

# JWT Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_REFRESH_SECRET = os.getenv("JWT_REFRESH_SECRET")

# Database
DATABASE_URL = f"postgresql://mluser:mlpass@localhost/ml_db"


# API Configuration
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))

# Email Configuration (IMPORTANT FOR EXPO PRESENTATION)
# 1. Use your own Gmail for MAIL_USERNAME
# 2. Generate an "App Password" (16 chars) from Google Account Security
# 3. Put your phone's email in MAIL_RECIPIENT to see it arrive live!
MAIL_USERNAME = os.getenv("MAIL_USERNAME", "rindhiyaasathish@gmail.com")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "evmnfhjigahweftd")
MAIL_FROM = os.getenv("MAIL_FROM", "rindhiyaasathish@gmail.com")
MAIL_FROM_NAME = os.getenv("MAIL_FROM_NAME", "PPD Risk Insight System")
MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))
MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
MAIL_STARTTLS = os.getenv("MAIL_STARTTLS", "True").lower() == "true"
MAIL_SSL_TLS = os.getenv("MAIL_SSL_TLS", "False").lower() == "true"
MAIL_RECIPIENT = os.getenv("MAIL_RECIPIENT", "your_email@gmail.com")
