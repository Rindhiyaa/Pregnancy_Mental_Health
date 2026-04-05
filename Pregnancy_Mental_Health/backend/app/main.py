from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from .utils.websocket_manager import manager
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from .database import engine
from . import models
from .routers import (
    predictions,
    auth,
    assessments,
    notifications,
    follow_ups,
    patient_portal,
    admin,
    nurse,
    doctor,
    messages,
    recovery,
)
from .routers.patients import router as patients_router
from .rate_limiter import rate_limiter
from .config import ALLOWED_ORIGINS, IS_PRODUCTION
import asyncio
import logging
import sys


logging.basicConfig(
    level=logging.INFO,
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



def run_migrations():
    """Add any missing columns to the DB — safe to run on every startup."""
    from sqlalchemy import inspect, text
    inspector = inspect(engine)

    try:
        with engine.begin() as conn:
            # users table migrations
            user_columns = [c["name"] for c in inspector.get_columns("users")]
            if "password_changed_at" not in user_columns:
                conn.execute(
                    text("ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMP WITH TIME ZONE")
                )
                logging.info("Migration: Added 'password_changed_at' to users")

            # assessments table migrations
            if inspector.has_table("assessments"):
                assess_cols = [c["name"] for c in inspector.get_columns("assessments")]
                if "epds_score" not in assess_cols:
                    conn.execute(
                        text("ALTER TABLE assessments ADD COLUMN epds_score INTEGER")
                    )
                    logging.info("Migration: Added 'epds_score' to assessments")
                if "top_risk_factors" not in assess_cols:
                    conn.execute(
                        text("ALTER TABLE assessments ADD COLUMN top_risk_factors JSON")
                    )
                    logging.info("Migration: Added 'top_risk_factors' to assessments")
                if "risk_level_final" not in assess_cols:
                    conn.execute(
                        text("ALTER TABLE assessments ADD COLUMN risk_level_final VARCHAR")
                    )
                    logging.info("Migration: Added 'risk_level_final' to assessments")
                if "override_reason" not in assess_cols:
                    conn.execute(
                        text("ALTER TABLE assessments ADD COLUMN override_reason VARCHAR")
                    )
                    logging.info("Migration: Added 'override_reason' to assessments")
                if "overridden_by" not in assess_cols:
                    conn.execute(
                        text("ALTER TABLE assessments ADD COLUMN overridden_by INTEGER")
                    )
                    logging.info("Migration: Added 'overridden_by' to assessments")
                if "reviewed_at" not in assess_cols:
                    conn.execute(
                        text("ALTER TABLE assessments ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE")
                    )
                    logging.info("Migration: Added 'reviewed_at' to assessments")

            # appointments table migrations
            if inspector.has_table("appointments"):
                appt_cols = [c["name"] for c in inspector.get_columns("appointments")]
                if "assigned_doctor_id" not in appt_cols:
                    conn.execute(
                        text(
                            "ALTER TABLE appointments ADD COLUMN assigned_doctor_id INTEGER REFERENCES users(id)"
                        )
                    )
                    logging.info("Migration: Added 'assigned_doctor_id' to appointments")
                if "urgency" not in appt_cols:
                    conn.execute(
                        text(
                            "ALTER TABLE appointments ADD COLUMN urgency VARCHAR DEFAULT 'Routine'"
                        )
                    )
                    logging.info("Migration: Added 'urgency' to appointments")
                if "department" not in appt_cols:
                    conn.execute(
                        text(
                            "ALTER TABLE appointments ADD COLUMN department VARCHAR DEFAULT 'OBGYN'"
                        )
                    )
                    logging.info("Migration: Added 'department' to appointments")
                if "status" not in appt_cols:
                    conn.execute(
                        text(
                            "ALTER TABLE appointments ADD COLUMN status VARCHAR DEFAULT 'pending'"
                        )
                    )
                    logging.info("Migration: Added 'status' to appointments")
                if "patient_name" not in appt_cols:
                    conn.execute(
                        text("ALTER TABLE appointments ADD COLUMN patient_name VARCHAR")
                    )
                    logging.info("Migration: Added 'patient_name' to appointments")

    except Exception as e:
        logging.warning(f"Migration warning (non-fatal): {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables on startup
    models.Base.metadata.create_all(bind=engine)
    # Run column migrations (non-destructive — only adds missing columns)
    run_migrations()
    # Seed default admin user if not exists
    seed_admin()
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
    lifespan=lifespan,
)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"

    if IS_PRODUCTION:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

    return response


# Rate Limiting Middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Skip rate limiting in development
    if not IS_PRODUCTION:
        return await call_next(request)

    if not request.url.path.startswith("/docs") and not request.url.path.startswith("/redoc"):
        try:
            await rate_limiter.check_rate_limit(request)
        except Exception as e:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": str(e.detail) if hasattr(e, "detail") else "Rate limit exceeded"
                },
            )

    response = await call_next(request)
    return response


# CORS - MUST BE ADDED LAST so it wraps all other middleware responses
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(predictions.router)
app.include_router(auth.router)
app.include_router(assessments.router)
app.include_router(patients_router)
app.include_router(notifications.router, prefix="/notifications")
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