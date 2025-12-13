from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func

from ..auth import require_roles
from ..models import Assessment, Role
from ..schemas import AnalyticsSummary, FeatureImportance
from ..database import get_session

router = APIRouter(prefix="/api/analytics", tags=["analytics"], dependencies=[Depends(require_roles(Role.admin, Role.researcher))])


@router.get("/summary", response_model=AnalyticsSummary)
def summary(session: Session = Depends(get_session)):
    # simple aggregate placeholders
    total = session.exec(select(func.count(Assessment.id))).one()
    risk_counts = {"low": 0, "moderate": 0, "high": 0}
    rows = session.exec(select(Assessment.label, func.count(Assessment.id)).group_by(Assessment.label)).all()
    for label, count in rows:
        risk_counts[label] = count
    avg_screening = session.exec(select(func.avg(func.cast(Assessment.features["screening_score"], float)))).one()
    feature_importance = [
        FeatureImportance(feature="screening_score", direction="positive", magnitude=0.8, label="Screening Score"),
        FeatureImportance(feature="social_support_score", direction="negative", magnitude=0.4, label="Social Support"),
    ]
    return AnalyticsSummary(
        risk_distribution=risk_counts,
        average_screening_score=avg_screening or 0.0,
        feature_importance=feature_importance,
    )


