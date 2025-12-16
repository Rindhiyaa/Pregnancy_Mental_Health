# backend/app/ml_model.py
from pathlib import Path
from catboost import CatBoostClassifier  # or CatBoostRegressor

MODEL_PATH = Path(__file__).parent / "model_files" / "model.cbm"

model = CatBoostClassifier()
model.load_model(str(MODEL_PATH))  # loads cbm format by default
