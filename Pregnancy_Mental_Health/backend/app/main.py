from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from .utils.websocket_manager import manager
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from .database import engine
from . import models
from .routers import predictions, auth, assessments, notifications, follow_ups, patient_portal, admin, nurse, doctor, messages
from .routers.patients import router as patients_router
from .rate_limiter import rate_limiter
from .config import ALLOWED_ORIGINS, TRUSTED_HOSTS, IS_PRODUCTION
import asyncio
import logging
import sys

logging.basicConfig(
    level=logging.INFO,  # show info+
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables on startup
    models.Base.metadata.create_all(bind=engine)
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
    # Skip in development
    if not IS_PRODUCTION:
        return await call_next(request)
        
    if request.url.path.startswith("/api/"):
        try:
            await rate_limiter.check_rate_limit(request)
        except Exception as e:
            # When returning response from middleware, we MUST manually add CORS headers 
            # OR ensure CORSMiddleware is the OUTERMOST (added last).
            # We'll move CORSMiddleware to the bottom.
            return JSONResponse(
                status_code=429,
                content={"detail": str(e.detail) if hasattr(e, 'detail') else "Rate limit exceeded"}
            )
    
    response = await call_next(request)
    return response

# CORS Configuration - MUST BE OUTERMOST (added last)
# Explicitly set common origins for development to ensure CORS works
DEV_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5175",
    "http://127.0.0.1:5175"
]
ALL_ALLOWED_ORIGINS = list(set(ALLOWED_ORIGINS + DEV_ORIGINS))

print(f"DEBUG: ALL_ALLOWED_ORIGINS = {ALL_ALLOWED_ORIGINS}")

# Add CORS middleware LAST
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALL_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

models.Base.metadata.create_all(bind=engine)
app.include_router(predictions.router)
app.include_router(auth.router)
app.include_router(assessments.router)
app.include_router(patients_router)
app.include_router(notifications.router)
app.include_router(follow_ups.router)
app.include_router(patient_portal.router)
app.include_router(admin.router)
app.include_router(nurse.router, prefix="/api")
app.include_router(doctor.router)
app.include_router(messages.router)

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