from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..schemas import PredictRequest, PredictResponse, HistoryItem
from ..ml_model import model
from .. import models

router = APIRouter(prefix="/api", tags=["predictions"])

@router.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest, db: Session = Depends(get_db)):
    features = [[payload.feature_1, payload.feature_2]]

    pred = float(model.predict(features)[0])
    proba = float(model.predict_proba(features)[0][1])  # binary, class 1 prob

    log = models.PredictionLog(
        feature_1=payload.feature_1,
        feature_2=payload.feature_2,
        prediction=pred, 
    )
    db.add(log)
    db.commit()

    return PredictResponse(prediction=pred, probability=proba)

@router.get("/assessments/history", response_model=List[HistoryItem])
def get_history(db: Session = Depends(get_db)):
    logs = db.query(models.PredictionLog).all()
    history = []
    for log in logs:
        risk = "high" if log.prediction > 0.5 else "low"
        history.append(HistoryItem(
            id=log.id,
            name=f"Patient {log.id}",
            date=log.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            risk=risk
        ))
    return history
