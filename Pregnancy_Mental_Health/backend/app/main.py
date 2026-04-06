from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from .utils.websocket_manager import manager
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from .database import engine
from . import models
from .routers import predictions, auth, assessments, notifications, follow_ups, patient_portal, admin, nurse, doctor, messages, recovery
from .routers.patients import router as patients_router
from .rate_limiter import rate_limiter
from .config import ALLOWED_ORIGINS, IS_PRODUCTION
import asyncio
import logging
import sys

logging.basicConfig(
    level=logging.INFO,  # show info+
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)


def seed_admin():
    from .database import SessionLocal
    from .security import hash_password
    db = SessionLocal()
    try:
        existing = db.query(models.User).filter(models.User.email == "admin@ppd.com").first()
        if not existing:
            admin = models.User(
                first_name="Admin",
                last_name="User",
                email="admin@ppd.com",
                hashed_password=hash_password("Admin@123"),
                role="admin",
                first_login=False,
                is_active=True,
            )
            db.add(admin)
            db.commit()
            logging.info("Default admin user created: admin@ppd.com")
        else:
            # Always ensure password and role are correct on startup
            existing.hashed_password = hash_password("Admin@123")
            existing.role = "admin"
            existing.first_login = False
            existing.is_active = True
            db.commit()
            logging.info("Admin user password reset to default on startup.")
    except Exception as e:
        logging.error(f"seed_admin failed: {e}")
        db.rollback()
    finally:
        db.close()


def cleanup_invalid_emails():
    """✅ Auto-cleanup common data entry errors on startup"""
    from .database import SessionLocal
    from sqlalchemy import text
    db = SessionLocal()
    try:
        # Fix specific 'test@gmailcom' typo
        db.execute(text("UPDATE users SET email = 'test@gmail.com' WHERE email = 'test@gmailcom'"))
        db.commit()
        logging.info("Startup cleanup: Fixed invalid email data (test@gmailcom -> test@gmail.com)")
    except Exception as e:
        logging.error(f"cleanup_invalid_emails failed: {e}")
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables on startup
    models.Base.metadata.create_all(bind=engine)
    # Seed default admin user if not exists
    seed_admin()
    # Cleanup invalid data
    cleanup_invalid_emails()
    # Startup: Start background cleanup task
    cleanup_task = asyncio.create_task(rate_limiter.cleanup_old_entries())
    yield
    # Shutdown: Cancel cleanup task
    cleanup_task.cancel()

app = FastAPI(
    title="Postpartum Risk Insight API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan
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
    # Skip OPTIONS preflight — CORSMiddleware must handle it unobstructed
    if request.method == "OPTIONS":
        return await call_next(request)

    # Apply rate limiting to API endpoints; skip in development
    if not IS_PRODUCTION:
        return await call_next(request)

    if not request.url.path.startswith("/docs") and not request.url.path.startswith("/redoc"):
        try:
            await rate_limiter.check_rate_limit(request)
        except Exception as e:
            origin = request.headers.get("origin", "")
            cors_headers = {}
            if origin in ALLOWED_ORIGINS:
                cors_headers = {
                    "Access-Control-Allow-Origin": origin,
                    "Access-Control-Allow-Credentials": "true",
                }
            return JSONResponse(
                status_code=429,
                content={"detail": str(e.detail) if hasattr(e, 'detail') else "Rate limit exceeded"},
                headers=cors_headers,
            )

    response = await call_next(request)
    return response

# CORS — must be added LAST so it is the OUTERMOST middleware.
# In Starlette, the last add_middleware call wraps all previous middleware,
# ensuring CORS headers are present on every response (including 429s).
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predictions.router)
app.include_router(auth.router)
app.include_router(assessments.router)
app.include_router(patients_router)
app.include_router(notifications.router)
app.include_router(follow_ups.router)
app.include_router(patient_portal.router)
app.include_router(admin.router)
app.include_router(nurse.router)
app.include_router(doctor.router)
app.include_router(messages.router)
app.include_router(recovery.router)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/")
def root():
    return {"message": "PPD Predictor API is running!", "version": "1.0.0"}