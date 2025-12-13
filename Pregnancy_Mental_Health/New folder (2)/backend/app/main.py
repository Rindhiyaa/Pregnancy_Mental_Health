from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import lifespan
from .routes import auth as auth_routes
from .routes import assessments, tasks, admin, analytics
from .config import get_settings


settings = get_settings()

app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(assessments.router)
app.include_router(tasks.router)
app.include_router(admin.router)
app.include_router(analytics.router)


@app.get("/health")
def health():
    return {"status": "ok", "app": settings.app_name}


