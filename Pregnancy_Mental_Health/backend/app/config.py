# backend/app/config.py
"""
Centralized configuration for the application
Single source of truth for environment variables and settings
"""
import os
from dotenv import load_dotenv

# Load environment variables from .env file
# Look for .env in the backend directory (one level up from app)
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
dotenv_path = os.path.join(backend_dir, ".env")
load_dotenv(dotenv_path)

# Database Configuration
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME")
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}"

# Environment
IS_PRODUCTION = os.getenv("ENVIRONMENT") == "production"


# In production, set ALLOWED_ORIGINS env var: "https://domain1.com,https://domain2.com"
ALLOWED_ORIGINS_STR = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:3000,http://127.0.0.1:3000"
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

# API Configuration
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))

# Email Configuration (IMPORTANT FOR EXPO PRESENTATION)
MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
MAIL_FROM = os.getenv("MAIL_FROM")

# Debug: Print configuration status (without sensitive data)
import sys
print(f"Email Config Loaded: USER={MAIL_USERNAME}, SERVER={os.getenv('MAIL_SERVER')}", file=sys.stderr)
if not MAIL_PASSWORD:
    print(" WARNING: MAIL_PASSWORD is NOT set!", file=sys.stderr)
else:
    print(f" MAIL_PASSWORD is set (length: {len(MAIL_PASSWORD)})", file=sys.stderr)
MAIL_FROM_NAME = os.getenv("MAIL_FROM_NAME", "PPD Risk Insight System")
MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))
MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
MAIL_STARTTLS = os.getenv("MAIL_STARTTLS", "True").lower() == "true"
MAIL_SSL_TLS = os.getenv("MAIL_SSL_TLS", "False").lower() == "true"
MAIL_RECIPIENT = os.getenv("MAIL_RECIPIENT")
