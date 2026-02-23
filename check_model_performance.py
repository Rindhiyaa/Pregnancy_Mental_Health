"""
Script to check CatBoost model performance and details
"""
import joblib
from pathlib import Path
from catboost import CatBoostClassifier

# Load model
MODEL_PATH = Path("Pregnancy_Mental_Health/backend/app/model_files/catboost_epds_model.cbm")
FEATURE_COLS_PATH = Path("Pregnancy_Mental_Health/backend/app/model_files/feature_columns.pkl")

print("="*80)
print("CATBOOST MODEL PERFORMANCE ANALYSIS")
print("="*80)

# Load model
model = CatBoostClassifier()
model.load_model(str(MODEL_PATH))

# Load feature columns
feature_columns = joblib.load(str(FEATURE_COLS_PATH))

print("\n📊 MODEL INFORMATION:")
print(f"   Model Type: CatBoost Classifier")
print(f"   Number of Features: {len(feature_columns)}")
print(f"   Number of Classes: {len(model.classes_)}")
print(f"   Classes: {list(model.classes_)}")

print("\n🔧 MODEL PARAMETERS:")
try:
    params = model.get_params()
    important_params = {
        'iterations': params.get('iterations', 'N/A'),
        'learning_rate': params.get('learning_rate', 'N/A'),
        'depth': params.get('depth', 'N/A'),
        'l2_leaf_reg': params.get('l2_leaf_reg', 'N/A'),
        'loss_function': params.get('loss_function', 'N/A'),
    }
    for key, value in important_params.items():
        print(f"   {key}: {value}")
except Exception as e:
    print(f"   Could not retrieve parameters: {e}")

print("\n📈 FEATURE IMPORTANCE:")
try:
    feature_importance = model.get_feature_importance()
    # Get top 10 most important features
    importance_pairs = list(zip(feature_columns, feature_importance))
    importance_pairs.sort(key=lambda x: x[1], reverse=True)
    
    print("\n   Top 10 Most Important Features:")
    for i, (feature, importance) in enumerate(importance_pairs[:10], 1):
        print(f"   {i:2d}. {feature:50s} {importance:8.2f}")
    
    print("\n   Bottom 5 Least Important Features:")
    for i, (feature, importance) in enumerate(importance_pairs[-5:], 1):
        print(f"   {i:2d}. {feature:50s} {importance:8.2f}")
        
except Exception as e:
    print(f"   Could not retrieve feature importance: {e}")

print("\n📁 MODEL FILE INFO:")
print(f"   Model File: {MODEL_PATH}")
print(f"   Model File Size: {MODEL_PATH.stat().st_size / 1024:.2f} KB")
print(f"   Feature Columns File: {FEATURE_COLS_PATH}")

print("\n⚠️  PERFORMANCE METRICS:")
print("   Note: Training/validation metrics are not stored in the model file.")
print("   To get performance metrics, you need:")
print("   - Training script with evaluation code")
print("   - Test dataset")
print("   - Metrics: Accuracy, Precision, Recall, F1-Score, Confusion Matrix")

print("\n💡 RECOMMENDATIONS:")
print("   1. Create a test dataset with known outcomes")
print("   2. Run predictions on test data")
print("   3. Calculate metrics: accuracy, precision, recall, F1")
print("   4. Generate confusion matrix")
print("   5. Perform cross-validation")
print("   6. Check calibration curves")

print("\n" + "="*80)
print("ANALYSIS COMPLETE")
print("="*80 + "\n")
