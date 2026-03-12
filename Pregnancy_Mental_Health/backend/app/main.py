from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from .database import engine
from . import models
from .routers import predictions, auth, assessments
from .routers.patients import router as patients_router
from .rate_limiter import rate_limiter
from .config import ALLOWED_ORIGINS, TRUSTED_HOSTS, IS_PRODUCTION
import asyncio

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start background cleanup taskk
    cleanup_task = asyncio.create_task(rate_limiter.cleanup_old_entries())
    yield
    # Shutdown: Cancel cleanup task
    cleanup_task.cancel()

app = FastAPI(
    title="PPD Predictor API", 
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan
)

# In production: only allow configured hosts
if IS_PRODUCTION:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=TRUSTED_HOSTS
    )
else:
    # Development: allow all hosts (localhost, 127.0.0.1, etc.)
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["*"]
    )

# CORS Configuration - Uses centralized ALLOWED_ORIGINS from config.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    
    # Only set HSTS in production (not on localhost)
    if IS_PRODUCTION:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    
    return response

# Rate Limiting Middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Apply rate limiting to API endpoints
    if request.url.path.startswith("/api/"):
        try:
            await rate_limiter.check_rate_limit(request)
        except Exception as e:
            return JSONResponse(
                status_code=429,
                content={"detail": str(e.detail) if hasattr(e, 'detail') else "Rate limit exceeded"}
            )
    
    response = await call_next(request)
    return response

models.Base.metadata.create_all(bind=engine)
app.include_router(predictions.router)
app.include_router(auth.router)
app.include_router(assessments.router)
app.include_router(patients_router)

@app.get("/")
def root():
    return {"message": "PPD Predictor API is running!", "version": "1.0.0"}