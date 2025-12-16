from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import PredictRequest, PredictResponse
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
