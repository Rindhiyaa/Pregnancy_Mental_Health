from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from . import models
from .routers import predictions, auth, assessments

app = FastAPI(title="PPD Predictor API", version="1.0.0")

# Updated CORS for production
origins = [
    "http://localhost:5173", 
    "http://localhost:5174", 
    "http://localhost:3000",
    "https://*.vercel.app",  # Allow Vercel deployments
    "https://*.railway.app"  # Allow Railway deployments
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=engine)
app.include_router(predictions.router)
app.include_router(auth.router)
app.include_router(assessments.router)

@app.get("/")
def root():
    return {"message": "PPD Predictor API is running!"}  
