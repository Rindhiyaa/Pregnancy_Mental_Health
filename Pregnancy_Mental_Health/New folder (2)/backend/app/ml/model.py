"""
Minimal ML service wrapper. Replace with real model later.
"""
from typing import Dict, Any, List
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

from ..config import get_settings

settings = get_settings()


class MockModel:
    def __init__(self) -> None:
        # tiny mock pipeline
        self.pipeline = Pipeline(
            [
                ("scaler", StandardScaler(with_mean=False)),
                ("clf", LogisticRegression()),
            ]
        )

    def predict_proba(self, X):
        # deterministic pseudo probability using sigmoid of feature sum
        sums = np.sum(X, axis=1)
        probs = 1 / (1 + np.exp(-sums))
        return np.vstack([1 - probs, probs]).T


class ModelService:
    def __init__(self) -> None:
        self.model = MockModel()
        self.feature_order = [
            "age",
            "parity",
            "marital_status",
            "education_level",
            "pregnancy_complications",
            "mental_health_history",
            "medication",
            "obstetric_history",
            "social_support_score",
            "relationship_satisfaction",
            "screening_score",
            "sleep_issues",
            "stress_level",
            "basic_symptoms",
            "mood",
        ]

    def _vectorize(self, features: Dict[str, Any]):
        # simple numeric mapping; categorical become length; fallback 0
        values = []
        for key in self.feature_order:
            val = features.get(key)
            if val is None:
                values.append(0.0)
            elif isinstance(val, (int, float)):
                values.append(float(val))
            else:
                values.append(float(len(str(val))))
        return np.array([values])

    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        X = self._vectorize(features)
        prob = float(self.model.predict_proba(X)[0][1])
        label = "high" if prob >= 0.66 else "moderate" if prob >= 0.33 else "low"
        top_features: List[Dict[str, Any]] = []
        for idx, key in enumerate(self.feature_order[:5]):
            magnitude = abs(X[0][idx])
            direction = "positive" if X[0][idx] >= 0 else "negative"
            top_features.append(
                {
                    "feature": key,
                    "direction": direction,
                    "magnitude": float(magnitude),
                    "label": key.replace("_", " ").title(),
                }
            )
        return {
            "probability": prob,
            "label": label,
            "top_features": top_features,
            "model_version": settings.model_version,
        }


model_service = ModelService()


