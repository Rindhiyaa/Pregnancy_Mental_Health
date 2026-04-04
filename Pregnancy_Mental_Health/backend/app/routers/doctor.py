from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..jwt_handler import get_current_user_email, get_current_user
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta, date
import logging
from app.models import User, Assessment, Patient, Appointment
from app.ml_model import model, feature_columns, build_model_input_from_form

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/doctor", tags=["doctor"])


@router.get("/dashboard")
async def get_doctor_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get doctor dashboard data"""
    try:
        # Stats
        pending = db.query(Assessment).filter(
            Assessment.assigned_doctor_id == current_user.id,
            Assessment.status.in_(['submitted', 'pending'])
        ).count()
        
        high_risk = db.query(Assessment).filter(
            Assessment.assigned_doctor_id == current_user.id,
            func.lower(func.trim(Assessment.risk_level)).in_(['high', 'high risk'])
        ).count()
        
        # Reviewed this week
        week_ago = datetime.now() - timedelta(days=7)
        reviewed_week = db.query(Assessment).filter(
            Assessment.assigned_doctor_id == current_user.id,
            Assessment.status.in_(["reviewed", "approved"]),
            Assessment.reviewed_at >= week_ago,
            Assessment.reviewed_at.isnot(None)
        ).count()
        
        # Total patients
        total_patients = db.query(Assessment.patient_id).filter(
            Assessment.assigned_doctor_id == current_user.id
        ).distinct().count()
        
        # Urgent cases (high risk + submitted)
        urgent_cases = db.query(Assessment).filter(
            Assessment.assigned_doctor_id == current_user.id,
            func.lower(func.trim(Assessment.risk_level)).in_(['high', 'high risk']),
            func.lower(Assessment.status).in_(['submitted', 'pending'])
        ).limit(5).all()

        urgent_list = []
        for a in urgent_cases:
            urgent_list.append({
                "id": a.id,
                "patient_name": a.patient.name if a.patient else a.patient_name,
                "score": a.risk_score,  # ✅ Changed: Don't show EPDS until validated
                "risk_score": a.risk_score
            })
        
        # Weekly trend data (last 7 days)
        trend = []
        for i in range(6, -1, -1):
            day = datetime.now() - timedelta(days=i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day.replace(hour=23, minute=59, second=59, microsecond=999999)
            
            avg_score = db.query(func.avg(Assessment.risk_score)).filter(
                Assessment.assigned_doctor_id == current_user.id,
                Assessment.created_at.between(day_start, day_end)
            ).scalar()
            
            trend.append({
                "name": day.strftime("%a"),
                "score": round(float(avg_score), 1) if avg_score else 0
            })
        
       # Risk distribution - Match the exact database values with spaces
        low_count = db.query(Assessment).filter(
            Assessment.assigned_doctor_id == current_user.id,
            func.lower(func.trim(Assessment.risk_level)).in_(['low risk', 'low'])
        ).count()

        moderate_count = db.query(Assessment).filter(
            Assessment.assigned_doctor_id == current_user.id,
            func.lower(func.trim(Assessment.risk_level)).in_([
                'moderate risk', 'moderate', 'medium risk', 'medium'
            ])
        ).count()

        high_count = db.query(Assessment).filter(
            Assessment.assigned_doctor_id == current_user.id,
            func.lower(func.trim(Assessment.risk_level)).in_(['high', 'high risk'])
        ).count()

        print(f"Risk Distribution - Low: {low_count}, Moderate: {moderate_count}, High: {high_count}")

        distribution = [
            {"name": "Low Risk", "value": low_count},
            {"name": "Moderate Risk", "value": moderate_count},
            {"name": "High Risk", "value": high_count}
        ]

        today = datetime.now().date()

        today_start = datetime.combine(datetime.today(), datetime.min.time())
        today_end = datetime.combine(datetime.today(), datetime.max.time())

        today_apps = db.query(Assessment).filter(
            Assessment.assigned_doctor_id == current_user.id,
            Assessment.created_at >= today_start,
            Assessment.created_at <= today_end
        ).count()
        
        return {
            "stats": {
                "pending": pending,
                "high": high_risk,
                "reviewed_week": reviewed_week,
                "today_apps": today_apps,
                "total": total_patients
            },
            "urgent_cases": urgent_list,
            "trend": trend,
            "distribution": distribution
        }
        
    except Exception as e:
        logger.error(f"Error in get_doctor_dashboard: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/assessments/predict", response_model=schemas.AssessmentResult)
def predict_assessment(payload: schemas.AssessmentCreate):
    # 1) Build input DataFrame
    df_input = build_model_input_from_form(payload)
    X_aligned = df_input.reindex(columns=feature_columns, fill_value=0)

    try:
        # 2) Predict class and probabilities from CatBoost
        pred_class_num = model.predict(X_aligned)[0]           # numeric class
        proba = model.predict_proba(X_aligned)[0]             # probability array

        # Map numeric class → label
        label_map = {0: "High Risk", 1: "Low Risk", 2: "Moderate Risk"}    # based on your model
        pred_label = label_map.get(int(pred_class_num), "Medium")

        # 3) Determine model score as % confidence
        class_idx = int(pred_class_num)
        confidence = float(proba[class_idx])
        model_score = round(confidence * 100, 1)              # 0-100%

        # 4) Calculate EPDS total and scaled
        epds_items = [int(getattr(payload, f"epds_{i}")) for i in range(1, 11)]
        epds_total = sum(epds_items)
        epds_scaled = (epds_total / 30) * 100

        # 5) Combine model + EPDS (70/30)
        final_score = 0.7 * model_score + 0.3 * epds_scaled

        # 6) Final risk level
        if final_score >= 70:
            final_risk = "High Risk"
        elif final_score >= 40:
            final_risk = "Moderate Risk"
        else:
            final_risk = "Low Risk"

        logger.info(f"Predicted: {pred_label}, Confidence: {confidence:.2f}, "
                    f"Model Score: {model_score:.1f}, EPDS Score: {epds_scaled:.1f}, "
                    f"Final Score: {final_score:.1f}, Final Risk: {final_risk}")

    except Exception as e:
        logger.error(f"ML prediction failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Model prediction failed. Please contact admin."
        )

    return schemas.AssessmentResult(
        risk_level=final_risk,
        score=round(final_score, 1)
    )


@router.post("/assessments/{assessment_id}/analyze", response_model=schemas.AssessmentResult)
def analyze_existing_assessment(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    """
    Analyze an existing saved assessment and return risk level & score
    """
    # 1️⃣ Fetch the assessment
    assessment = db.query(models.Assessment).filter(
        models.Assessment.id == assessment_id
    ).first()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    if not assessment.raw_data:
        raise HTTPException(status_code=400, detail="Assessment raw data is missing")

    try:
        # 2️⃣ Convert raw_data dict to Pydantic model
        # Create a temporary AssessmentCreate from raw_data
        raw = assessment.raw_data
        
        # Build the Pydantic model with all required fields
        payload = schemas.AssessmentCreate(
            patient_name=assessment.patient_name,
            age=raw.get("age"),
            residence=raw.get("residence"),
            education_level=raw.get("education_level"),
            marital_status=raw.get("marital_status"),
            partner_education=raw.get("partner_education"),
            partner_income=raw.get("partner_income"),
            total_children_now=raw.get("total_children_now"),
            family_type=raw.get("family_type"),
            household_members=raw.get("household_members"),
            relationship_inlaws=raw.get("relationship_inlaws"),
            relationship_husband=raw.get("relationship_husband"),
            support_during_pregnancy=raw.get("support_during_pregnancy"),
            need_more_support=raw.get("need_more_support"),
            major_life_changes_pregnancy=raw.get("major_life_changes_pregnancy"),
            abuse_during_pregnancy=raw.get("abuse_during_pregnancy"),
            trust_share_feelings=raw.get("trust_share_feelings"),
            pregnancy_number=raw.get("pregnancy_number"),
            pregnancy_planned=raw.get("pregnancy_planned"),
            regular_checkups=raw.get("regular_checkups"),
            fear_pregnancy_childbirth=raw.get("fear_pregnancy_childbirth"),
            medical_conditions_pregnancy=raw.get("medical_conditions_pregnancy"),
            depression_before_pregnancy=raw.get("depression_before_pregnancy"),
            depression_during_pregnancy=raw.get("depression_during_pregnancy"),
            occupation_before_surgery=raw.get("occupation_before_surgery"),
            epds_1=raw.get("epds_1", "0"),
            epds_2=raw.get("epds_2", "0"),
            epds_3=raw.get("epds_3", "0"),
            epds_4=raw.get("epds_4", "0"),
            epds_5=raw.get("epds_5", "0"),
            epds_6=raw.get("epds_6", "0"),
            epds_7=raw.get("epds_7", "0"),
            epds_8=raw.get("epds_8", "0"),
            epds_9=raw.get("epds_9", "0"),
            epds_10=raw.get("epds_10", "0"),
        )
        
        # 3️⃣ Now call your existing prediction logic
        # Import the prediction function from assessments router
        from ..routers.assessments import predict_assessment
        
        # Call the prediction
        result = predict_assessment(payload)
        
        # 4️⃣ Update the assessment with results
        assessment.risk_level = result.risk_level
        assessment.risk_score = result.score
        assessment.status = "reviewed"
        assessment.reviewed_at = datetime.now()

        db.commit()
        db.refresh(assessment)
        
        logger.info(f"Analyzed assessment #{assessment_id} -> {result.risk_level}, score: {result.score:.1f}")
        
        return result


    except Exception as e:
        logger.error(f"Failed to analyze assessment #{assessment_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze assessment: {str(e)}"
        )


def band_and_first_days(risk_level: str) -> int:
    # risk_level must be "High"/"Medium"/"Low" text the nurse sees
    if risk_level == "High":
        return 3
    if risk_level == "Medium":
        return 7
    return 14   # Low


@router.get("/assessments")
def get_doctor_assessments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all assessments assigned to this doctor with appointment status"""
    try:
        # 🔐 Role check
        if current_user.role != "doctor":
            raise HTTPException(status_code=403, detail="Access denied")

        logger.info(f"Doctor {current_user.id} fetching assessments")

        # 📌 Get assessments
        assessments = db.query(Assessment).filter(
            Assessment.assigned_doctor_id == current_user.id
        ).order_by(Assessment.created_at.desc()).all()

        logger.info(f"Found {len(assessments)} assessments")

        # 📌 Get all appointments
        appointments = db.query(Appointment).all()

        # 📌 Map latest appointment per patient
        appointment_map = {}

        for app in appointments:
            app_datetime = datetime.combine(app.date, app.time)

            if (
                app.patient_id not in appointment_map or
                app_datetime > appointment_map[app.patient_id]["datetime"]
            ):
                appointment_map[app.patient_id] = {
                    "status": app.status,
                    "datetime": app_datetime
                }

        # 📌 Build response
        assessments_list = []

        for assessment in assessments:
            # 👩‍⚕️ Nurse info
            nurse = db.query(User).filter(User.id == assessment.nurse_id).first()
            nurse_name = (
                f"{nurse.first_name} {nurse.last_name or ''}".strip()
                if nurse else "Unknown"
            )

            # 📅 Get appointment for this patient
            appointment = appointment_map.get(assessment.patient_id)

            assessments_list.append({
                "id": assessment.id,
                "patient_id": assessment.patient_id,
                "patient_name": assessment.patient_name,
                "patient_email": assessment.patient_email,
                "nurse_id": assessment.nurse_id,
                "nurse_name": nurse_name,
                "assigned_doctor_id": assessment.assigned_doctor_id,

                # ✅ Scores
                "epds_score": assessment.epds_score,
                "score": assessment.risk_score,
                "risk_score": assessment.risk_score,
                "risk_level": assessment.risk_level,

                # ✅ Status
                "status": assessment.status,

                # ✅ Appointment Status (FIXED)
                "appointment_status": (
                    appointment["status"] if appointment else "Not Scheduled"
                ),

                # ✅ Clinical Data
                "plan": assessment.plan,
                "notes": assessment.notes,
                "clinician_risk": assessment.clinician_risk,

                # ✅ Time
                "created_at": assessment.created_at.isoformat()
                if assessment.created_at else None,
                "timestamp": assessment.created_at.isoformat()
                if assessment.created_at else None,
            })

        logger.info(f"Returning {len(assessments_list)} assessments")

        return assessments_list

    except Exception as e:
        logger.error(f"Error in get_doctor_assessments: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/assessments/{assessment_id}")
def get_doctor_assessment_by_id(
    assessment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific assessment by ID for clinical validation"""
    try:
        if current_user.role != "doctor":
            raise HTTPException(status_code=403, detail="Access denied")
        
        logger.info(f"Fetching assessment {assessment_id} for doctor {current_user.id}")
        
        assessment = db.query(Assessment).filter(
            Assessment.id == assessment_id,
            Assessment.assigned_doctor_id == current_user.id
        ).first()
        
        if not assessment:
            logger.warning(f"Assessment {assessment_id} not found")
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        # Get nurse info
        nurse = db.query(User).filter(User.id == assessment.nurse_id).first()
        nurse_name = f"{nurse.first_name} {nurse.last_name or ''}".strip() if nurse else "Unknown"
        
        # ✅ CHANGED: Calculate EPDS here for the doctor to review
        # This is ONLY for display in the validation screen
        epds_score = 0
        if assessment.raw_data and isinstance(assessment.raw_data, dict):
            epds_items = []
            for i in range(1, 11):
                val = assessment.raw_data.get(f'epds_{i}', '0')
                try:
                    epds_items.append(int(val))
                except:
                    epds_items.append(0)
            epds_score = sum(epds_items)
        
        result = {
            "id": assessment.id,
            "patient_id": assessment.patient_id,
            "patient_name": assessment.patient_name,
            "patient_email": assessment.patient_email,
            "nurse_id": assessment.nurse_id,
            "nurse_name": nurse_name,
            "assigned_doctor_id": assessment.assigned_doctor_id,
            "epds_score": epds_score,  # Show calculated EPDS to doctor for review
            "score": assessment.risk_score,
            "risk_score": assessment.risk_score,
            "risk_level": assessment.risk_level,
            "clinician_risk": assessment.clinician_risk,
            "risk_level_final": assessment.risk_level_final,
            "status": assessment.status,
            "plan": assessment.plan,
            "notes": assessment.notes,
            "override_reason": assessment.override_reason,
            "followup_urgency": None,
            "followup_window": None,
            "nurse_instruction": None,
            "raw_data": assessment.raw_data,
            "created_at": assessment.created_at.isoformat() if assessment.created_at else None,
            "reviewed_at": assessment.reviewed_at.isoformat() if assessment.reviewed_at else None,
            "top_risk_factors": assessment.top_risk_factors or [],
        }

        logger.info(f"Returning assessment {assessment_id}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting assessment {assessment_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/assessments/test")
def test_assessments(
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    """Quick test to see raw Assessment data"""
    assessments = db.query(models.Assessment).filter(
        models.Assessment.status == "submitted"
    ).limit(1).all()
    
    if not assessments:
        return {"error": "No assessments found"}
    
    assessment = assessments[0]
    return {
        "id": assessment.id,
        "patient_name": assessment.patient_name,
        "risk_level": assessment.risk_level,
        "status": assessment.status,
        "created_at": assessment.created_at,
        "raw_assessment": str(assessment.__dict__)
    }

@router.patch("/assessments/{assessment_id}/review")
def review_assessment(
    assessment_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    doctor = (
        db.query(models.User)
        .filter(models.User.email == current_user_email)
        .first()
    )
    if not doctor or doctor.role != "doctor":
        raise HTTPException(status_code=403, detail="Doctor role required")

    a = (
        db.query(models.Assessment)
        .filter(models.Assessment.id == assessment_id)
        .first()
    )
    if not a:
        raise HTTPException(status_code=404, detail="Assessment not found")

    # ✅ ADDED: Calculate and save EPDS score when doctor validates
    if a.raw_data and isinstance(a.raw_data, dict):
        epds_items = []
        for i in range(1, 11):
            val = a.raw_data.get(f'epds_{i}', '0')
            try:
                epds_items.append(int(val))
            except:
                epds_items.append(0)
        a.epds_score = sum(epds_items)  # Save EPDS to database

    # Apply updates from ClinicalValidation.jsx payload
    a.clinician_risk   = payload.get("clinicianrisk")
    a.risk_level_final = payload.get("risklevelfinal")
    a.override_reason  = payload.get("overridereason")
    a.plan             = payload.get("plan")
    a.notes            = payload.get("notes")
    a.reviewed_at      = datetime.now()  # ✅ ADDED: Mark when reviewed

    new_status = payload.get("status")

    if new_status == "approved":
        a.status = "approved"
    else:
        a.status = "reviewed"

    db.commit()
    db.refresh(a)

    # Notification logic (existing code)
    final_band = a.risk_level_final or a.clinician_risk or a.risk_level
    if a.nurse_id and final_band and new_status in {"reviewed", "approved"}:
        nurse = db.query(models.User).filter(models.User.id == a.nurse_id).first()
        if nurse and nurse.email:
            patient_name = a.patient_name or f"Patient #{a.patient_id}"
            title = "Risk Score Validated"
            message = (
                f"Dr. {(doctor.first_name or '').strip()} {(doctor.last_name or '').strip()} "
                f"has reviewed the assessment for {patient_name} and confirmed the "
                f"risk as {final_band}."
            )

            priority = "high" if str(final_band).lower().startswith("high") else "medium"

            notification = models.Notification(
                title=title,
                message=message,
                type="info",
                priority=priority,
                clinician_email=nurse.email,
            )
            db.add(notification)
            db.commit()

    return a


@router.get("/profile")
def get_doctor_profile(
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    """Get current logged-in doctor's profile with ID"""
    doctor = db.query(models.User).filter(
        models.User.email == current_user_email,
        models.User.role == "doctor"
    ).first()
    
    if not doctor:
        raise HTTPException(status_code=403, detail="Doctor not found")
    
    return {
        "id": doctor.id,
        "email": doctor.email,
        "first_name": doctor.first_name,
        "last_name": doctor.last_name,
        "role": doctor.role
    }


@router.get("/patients")
def get_doctor_patients(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):

    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Access denied")

    # Step 1: Get all assessments assigned to this doctor with valid patient
    assessments = db.query(Assessment).filter(
        Assessment.assigned_doctor_id == current_user.id,
        Assessment.patient_id.isnot(None)
    ).all()

    if not assessments:
        return {"patients": []}

    # Step 2: Extract unique patient IDs from these assessments
    patient_ids = list({a.patient_id for a in assessments})

    # Step 3: Fetch patients from Patient table
    patients = db.query(Patient).filter(Patient.id.in_(patient_ids)).all()

    # Step 4: Prepare JSON response
    patients_list = []
    for p in patients:
        patients_list.append({
            "id": p.id,
            "name": getattr(p, "name", None),
            "email": getattr(p, "email", None),
            "phone": getattr(p, "phone", None),
            "created_at": getattr(p, "created_at", None).isoformat() if getattr(p, "created_at", None) else None
        })

    return {"patients": patients_list}

@router.put("/patients/{id}")
def update_doctor_patient(
    id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    doctor = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not doctor or doctor.role != "doctor":
        raise HTTPException(status_code=403, detail="Doctor role required")
    
    patient = db.query(models.Patient).filter(
        models.Patient.id == id,
        models.Patient.assigned_doctor_id == doctor.id
    ).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found or not assigned to you")
    
    patient.name = payload.get('name', patient.name)
    patient.email = payload.get('email', patient.email)
    patient.age = payload.get('age', patient.age)
    patient.phone = payload.get('phone', patient.phone)
    
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient

@router.delete("/patients/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_doctor_patient(
    id: int,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    doctor = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not doctor or doctor.role != "doctor":
        raise HTTPException(status_code=403, detail="Doctor role required")
    
    patient = db.query(models.Patient).filter(
        models.Patient.id == id,
        models.Patient.assigned_doctor_id == doctor.id
    ).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found or not assigned to you")
    
    db.delete(patient)
    db.commit()
    return

@router.get("/patients/with-assessments")
def get_patients_with_assessment_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get patients with their assessment summary for the Patients page
    This is a SEPARATE endpoint from /assessments
    """
    try:
        if current_user.role != "doctor":
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get all assessments for this doctor
        assessments = db.query(Assessment).filter(
            Assessment.assigned_doctor_id == current_user.id,
            Assessment.patient_id.isnot(None)
        ).all()
        
        if not assessments:
            return {"patients": []}
        
        # Get unique patient IDs
        patient_ids = list({a.patient_id for a in assessments})
        
        # Fetch patients
        patients = db.query(Patient).filter(Patient.id.in_(patient_ids)).all()
        
        # Build patient list with assessment data
        patients_list = []
        for patient in patients:
            # Get all assessments for this patient
            patient_assessments = [a for a in assessments if a.patient_id == patient.id]
            
            # Sort by date
            patient_assessments.sort(key=lambda x: x.created_at, reverse=True)
            
            latest = patient_assessments[0] if patient_assessments else None
            
            # Extract EPDS from raw_data
            # Extract EPDS from raw_data - ONLY if validated
            epds_score = 0
            if latest and latest.epds_score is not None:
                epds_score = latest.epds_score  # Use stored value
            elif latest and latest.status in ['reviewed', 'approved'] and latest.raw_data:
                # Fallback: calculate if validated but not stored
                if isinstance(latest.raw_data, dict):
                    epds_items = []
                    for i in range(1, 11):
                        val = latest.raw_data.get(f'epds_{i}', '0')
                        try:
                            epds_items.append(int(val))
                        except:
                            epds_items.append(0)
                    epds_score = sum(epds_items)
            
            # Calculate trend if there are multiple assessments
            trend = 'stable'
            if len(patient_assessments) > 1:
                latest_score = epds_score
                
                # Get previous assessment EPDS
                prev = patient_assessments[1]
                prev_epds = 0
                if prev.raw_data and isinstance(prev.raw_data, dict):
                    prev_items = []
                    for i in range(1, 11):
                        val = prev.raw_data.get(f'epds_{i}', '0')
                        try:
                            prev_items.append(int(val))
                        except:
                            prev_items.append(0)
                    prev_epds = sum(prev_items)
                
                if latest_score > prev_epds:
                    trend = 'up'
                elif latest_score < prev_epds:
                    trend = 'down'
            
            patients_list.append({
                "id": patient.id,
                "name": patient.name,
                "email": patient.email,
                "phone": patient.phone,
                "created_at": patient.created_at.isoformat() if patient.created_at else None,
                "latest_score": epds_score,
                "risk_level": latest.risk_level if latest else "Low Risk",
                "last_assessment": latest.created_at.isoformat() if latest else None,
                "trend": trend,
                "assessment_count": len(patient_assessments)
            })
        
        logger.info(f"Returning {len(patients_list)} patients with assessment data")
        return {"patients": patients_list}
        
    except Exception as e:
        logger.error(f"Error in get_patients_with_assessment_data: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/patients/{patient_id}")
def get_patient_detail(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed patient information with all assessments"""
    try:
        if current_user.role != "doctor":
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get patient
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Get all assessments for this patient assigned to this doctor
        assessments = db.query(Assessment).filter(
            Assessment.patient_id == patient_id,
            Assessment.assigned_doctor_id == current_user.id
        ).order_by(Assessment.created_at.desc()).all()
        
        # Process assessments
        assessments_list = []
        for assessment in assessments:
            # Extract EPDS from raw_data
            epds_score = 0
            if assessment.raw_data and isinstance(assessment.raw_data, dict):
                epds_items = []
                for i in range(1, 11):
                    val = assessment.raw_data.get(f'epds_{i}', '0')
                    try:
                        epds_items.append(int(val))
                    except:
                        epds_items.append(0)
                epds_score = sum(epds_items)
            
            assessments_list.append({
                "id": assessment.id,
                "epds_score": epds_score,
                "risk_score": assessment.risk_score,
                "risk_level": assessment.risk_level,
                "status": assessment.status,
                "plan": assessment.plan,
                "notes": assessment.notes,
                "created_at": assessment.created_at.isoformat() if assessment.created_at else None,
            })
        
        return {
            "patient": {
                "id": patient.id,
                "name": patient.name,
                "email": patient.email,
                "phone": patient.phone,
                "age": patient.age,
                "created_at": patient.created_at.isoformat() if patient.created_at else None,
            },
            "assessments": assessments_list,
            "assessment_count": len(assessments_list)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting patient {patient_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/stats")
async def get_doctor_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get doctor statistics for profile page"""
    
    # Count assessments reviewed by this doctor
    assessments_reviewed = db.query(Assessment).filter(
        Assessment.assigned_doctor_id == current_user.id,
        Assessment.status.in_(['reviewed', 'approved'])
    ).count()
    
    # Count high risk cases assigned to this doctor
    high_risk_cases = db.query(Assessment).filter(
        Assessment.assigned_doctor_id == current_user.id,
        Assessment.risk_level == 'high'
    ).count()
    
    # Count total patients assigned to this doctor
    patients_assigned = db.query(Assessment.patient_id).filter(
        Assessment.assigned_doctor_id == current_user.id
    ).distinct().count()
    
    return {
        "assessments_reviewed": assessments_reviewed,
        "high_risk_cases": high_risk_cases,
        "patients_assigned": patients_assigned
    }

def compute_band_and_days(score: float) -> tuple[str, int]:
    if score >= 0.75:
        return "High", 3
    if score >= 0.4:
        return "Medium", 7
    return "Low", 14

@router.post("/assessments/{assessment_id}/review")
def review_assessment(
    assessment_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    doctor = db.query(models.User).filter(
        models.User.email == current_user_email
    ).first()

    if not doctor or doctor.role != "doctor":
        raise HTTPException(status_code=403, detail="Doctor role required")

    a = db.query(models.Assessment).filter(
        models.Assessment.id == assessment_id
    ).first()

    if not a:
        raise HTTPException(status_code=404, detail="Assessment not found")

    #  EPDS calculation
    if a.raw_data and isinstance(a.raw_data, dict):
        try:
            a.epds_score = sum(int(a.raw_data.get(f"epds_{i}", 0)) for i in range(1, 11))
        except:
            a.epds_score = 0

    #  Apply doctor inputs
    a.clinician_risk   = payload.get("clinicianrisk")
    a.risk_level_final = payload.get("risklevelfinal")
    a.override_reason  = payload.get("overridereason")
    a.plan             = payload.get("plan")
    a.notes            = payload.get("notes")
    a.reviewed_at      = datetime.now()

    new_status = payload.get("status")
    a.status = "approved" if new_status == "approved" else "reviewed"

    #  FINAL BAND LOGIC (use final override first)
    final_band = a.risk_level_final or a.clinician_risk or a.risk_level

    #  AUTO FOLLOW-UP GENERATION
    if a.risk_score is not None and a.patient_id:
        band, first_days = compute_band_and_days(a.risk_score)
        a.risk_level = band

        base_date = datetime.now().date()
        offsets = [first_days, first_days + 30, first_days + 60]

        for i, offset in enumerate(offsets):
            fup = models.FollowUp(
                patient_id=a.patient_id,
                scheduled_date=base_date + timedelta(days=offset),
                type=f"Auto follow-up #{i+1}",
                notes=f"{band} risk follow-up #{i+1}",
                status="pending",
                clinician_email=current_user_email,
            )
            db.add(fup)

    db.commit()
    db.refresh(a)

    #  NOTIFICATION
    if a.nurse_id and final_band:
        nurse = db.query(models.User).filter(
            models.User.id == a.nurse_id
        ).first()

        if nurse and nurse.email:
            notification = models.Notification(
                title="Risk Score Validated",
                message=f"Doctor reviewed {a.patient_name} → {final_band}",
                type="info",
                priority="high" if "high" in final_band.lower() else "medium",
                clinician_email=nurse.email,
            )
            db.add(notification)
            db.commit()

    return a


@router.get("/appointments/today")
def get_today_appointments(
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    user = (
        db.query(models.User)
        .filter(models.User.email == current_user_email)
        .first()
    )
    if not user or user.role != "doctor":
        raise HTTPException(status_code=403, detail="Doctor role required")

    today = date.today()

    apps = (
        db.query(models.Appointment)
        .filter(
            and_(
                models.Appointment.doctor_id == user.id,
                models.Appointment.date == today,
            )
        )
        .order_by(models.Appointment.time.asc())
        .all()
    )

    # Fallback: show next 5 upcoming if nothing today
    if not apps:
        apps = (
            db.query(models.Appointment)
            .filter(
                and_(
                    models.Appointment.doctor_id == user.id,
                    models.Appointment.date >= today,
                )
            )
            .order_by(models.Appointment.date.asc(), models.Appointment.time.asc())
            .limit(5)
            .all()
        )

    return [
        {
            "id": a.id,
            "patient_name": a.patient_name or (a.patient.name if a.patient else "Unknown"),
            "date": a.date.isoformat() if hasattr(a.date, "isoformat") else str(a.date),
            "time": str(a.time) if a.time else "N/A",
            "type": a.type or "Follow-up",
            "status": a.status or "pending",
        }
        for a in apps
    ]


@router.get("/appointments")
def get_doctor_appointments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Doctor role required")

    appointments = (
        db.query(models.Appointment)
        .filter(
            or_(
                models.Appointment.doctor_id == current_user.id,
                models.Appointment.assigned_doctor_id == current_user.id,
            )
        )
        .order_by(models.Appointment.date.desc(), models.Appointment.time.desc())
        .all()
    )

    results = []
    for a in appointments:
        patient = db.query(Patient).filter(Patient.id == a.patient_id).first()

        # Get latest assessment for this patient assigned to this doctor
        latest_assessment = (
            db.query(Assessment)
            .filter(
                Assessment.patient_id == a.patient_id,
                Assessment.assigned_doctor_id == current_user.id,
            )
            .order_by(Assessment.created_at.desc())
            .first()
        )

        # Get nurse info from assessment
        nurse_name = None
        if latest_assessment and latest_assessment.nurse_id:
            nurse = db.query(User).filter(User.id == latest_assessment.nurse_id).first()
            if nurse:
                nurse_name = f"{nurse.first_name} {nurse.last_name or ''}".strip()

        # Calculate EPDS from stored value or raw_data if validated
        epds_score = None
        if latest_assessment:
            epds_score = latest_assessment.epds_score
            # If not stored but assessment is validated, calculate it
            if epds_score is None and latest_assessment.status in ['reviewed', 'approved'] and latest_assessment.raw_data:
                try:
                    items = [int(latest_assessment.raw_data.get(f"epds_{i}", 0)) for i in range(1, 11)]
                    epds_score = sum(items)
                except Exception:
                    epds_score = None

        results.append({
            "id": a.id,
            "date": a.date.isoformat() if a.date else None,
            "time": str(a.time) if a.time else None,
            "type": a.type or "Follow-up",
            "urgency": a.urgency or "Routine",
            "department": a.department or "OBGYN",
            "notes": a.notes,
            "status": getattr(a, "status", "pending") or "pending",
            # Patient
            "patient_id": a.patient_id,
            "patient_name": patient.name if patient else "Unknown",
            "patient_age": patient.age if patient else None,
            "patient_phone": patient.phone if patient else None,
            "patient_email": patient.email if patient else None,
            "pregnancy_week": getattr(patient, 'pregnancy_week', None) if patient else None,
            # Clinical
            "assessment_id": latest_assessment.id if latest_assessment else None,
            "risk_level": latest_assessment.risk_level if latest_assessment else None,
            "risk_score": latest_assessment.risk_score if latest_assessment else None,
            "epds_score": epds_score,
            "top_risk_factors": latest_assessment.top_risk_factors if latest_assessment else [],
            # Workflow
            "submitted_by_nurse": nurse_name,
            "assessment_status": latest_assessment.status if latest_assessment else None,
            "assessment_created_at": latest_assessment.created_at.isoformat() if latest_assessment and latest_assessment.created_at else None,
        })

    return results


@router.patch("/appointments/{appointment_id}/status")
def update_doctor_appointment_status(
    appointment_id: int,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Doctor confirms, completes, or cancels an appointment"""
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Doctor role required")

    appt = (
        db.query(models.Appointment)
        .filter(
            models.Appointment.id == appointment_id,
            or_(
                models.Appointment.doctor_id == current_user.id,
                models.Appointment.assigned_doctor_id == current_user.id,
            )
            
        )
        .first()
    )

    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    new_status = payload.get("status")
    if new_status not in ["pending", "confirmed", "completed", "cancelled", "no-show"]:
        raise HTTPException(status_code=400, detail="Invalid status value")

    appt.status = new_status

    # Sync the related FollowUp row when completed
    if new_status == "completed":
        followup = (
            db.query(models.FollowUp)
            .filter(
                models.FollowUp.patient_id == appt.patient_id,
                models.FollowUp.status == "pending",
            )
            .order_by(models.FollowUp.scheduled_date.desc())
            .first()
        )
        if followup:
            followup.status = "completed"

    db.commit()
    db.refresh(appt)
    return {"id": appt.id, "status": appt.status}

