from fastapi import APIRouter, Depends, Query, HTTPException, status, UploadFile, BackgroundTasks
from sqlalchemy.orm import Session
import pandas as pd
from typing import List, Optional
import logging
from datetime import datetime, timedelta
import io
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

from ..database import get_db
from ..schemas import AssessmentCreate, AssessmentResult, AssessmentSave, ReferralRequest, AssessmentReview
from ..ml_model import model, feature_columns, build_model_input_from_form
from .. import models, config
from ..jwt_handler import get_current_user_email, get_current_user
from ..utils.email_utils import send_followup_email

router = APIRouter(prefix="/api", tags=["assessments"])
logger = logging.getLogger(__name__)

# Email configuration
mail_conf = ConnectionConfig(
    MAIL_USERNAME=config.MAIL_USERNAME,
    MAIL_PASSWORD=config.MAIL_PASSWORD,
    MAIL_FROM=config.MAIL_FROM,
    MAIL_FROM_NAME=config.MAIL_FROM_NAME,
    MAIL_PORT=config.MAIL_PORT,
    MAIL_SERVER=config.MAIL_SERVER,
    MAIL_STARTTLS=config.MAIL_STARTTLS,
    MAIL_SSL_TLS=config.MAIL_SSL_TLS,
    USE_CREDENTIALS=True
)


@router.post("/assessments/predict", response_model=AssessmentResult)
def predict_assessment(payload: AssessmentCreate):
    # 1) Build 1-row dataframe with same raw columns as training
    try:
        df_input = build_model_input_from_form(payload)  # DataFrame with 26 cols
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 2) Align columns with training feature_columns (fill missing with 0)
    X_aligned = df_input.reindex(columns=feature_columns, fill_value=0)

    try:
        # 4) Predict EPDS Result class and probabilities
        cat_classes = list(model.classes_)
        pred_class = model.predict(X_aligned)[0]

        # convert numeric prediction to label
        if isinstance(pred_class, (int, float)):
            label_map = {0: "High", 1: "Low", 2: "Medium"}
            pred_class = label_map.get(int(pred_class), "Medium")
        proba = model.predict_proba(X_aligned)[0]  # e.g. [p0, p1, p2]

    # Using the LabelEncoder order ['High', 'Low', 'Medium'] -> 0,1,2
        # so:
        high_prob = float(proba[0])
        low_prob = float(proba[1])
        med_prob = float(proba[2])

        # Choose model_risk by max probability
        if high_prob >= med_prob and high_prob >= low_prob:
            model_risk = "High Risk"
        elif med_prob >= low_prob:
            model_risk = "Moderate Risk"
        else:
            model_risk = "Low Risk"

        # Base scores
        if model_risk == "High Risk":
            base_score = 85.0
        elif model_risk == "Moderate Risk":
            base_score = 55.0
        else:
            base_score = 25.0

        # Confidence of chosen class
        if model_risk == "High Risk":
            confidence = high_prob
        elif model_risk == "Moderate Risk":
            confidence = med_prob
        else:
            confidence = low_prob

        model_score = base_score + (confidence - 0.5) * 20.0
        model_score = max(0.0, min(100.0, model_score))

        logger.info(
            f"CatBoost prediction - probs: {proba}"
        )
        logger.info(
            f"CatBoost model risk: {model_risk}, "
            f"base_score: {base_score:.1f}, "
            f"confidence: {confidence:.3f}, "
            f"model_score: {model_score:.1f}"
        )



        # 5) EPDS total and scaled (0–100)
        epds_items = [
            int(payload.epds_1),
            int(payload.epds_2),
            int(payload.epds_3),
            int(payload.epds_4),
            int(payload.epds_5),
            int(payload.epds_6),
            int(payload.epds_7),
            int(payload.epds_8),
            int(payload.epds_9),
            int(payload.epds_10),
        ]
        epds_total = sum(epds_items)
        epds_scaled = (epds_total / 30.0) * 100.0

        # 6) 70/30 combined score
        final_score = 0.7 * model_score + 0.3 * epds_scaled

        # 7) Map final_score → final risk level (based on combined score)
        if final_score >= 70:
            final_risk = "High Risk"
        elif final_score >= 40:
            final_risk = "Moderate Risk"
        else:
            final_risk = "Low Risk"


        logger.info(
            f"FINAL OUTPUT -> model_risk={model_risk}, model_score={model_score:.1f}, "
            f"epds_total={epds_total}, epds_scaled={epds_scaled:.1f}, "
            f"final_score={final_score:.1f}, final_risk={final_risk}"
        )

    except Exception as e:
        logger.error(f"ML Model failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Model prediction failed. Please contact admin."
        )

    # response_model=AssessmentResult expects risk_level + score
    return AssessmentResult(
        risk_level=final_risk,
        score=final_score,
    )

def calculate_weighted_risk_score(features) -> float:
    """
    Fallback calculation using weighted features based on research
    """
    score = 0
    
    # Relationship factors (30% weight)
    relationship_score = (features[1] + features[4]) / 8 * 30  # Husband + in-laws
    score += relationship_score
    
    # Support factors (25% weight)
    support_score = features[2] / 2 * 25  # Support received
    score += support_score
    
    # Mental health factors (25% weight)
    mental_score = (features[6] + features[9]) / 5 * 25  # Anger + depression
    score += mental_score
    
    # Age factor (10% weight)
    age_risk = 1 if features[3] < 20 or features[3] > 35 else 0
    score += age_risk * 10
    
    # Newborn bonding (10% weight)
    bonding_score = (4 - features[5]) / 4 * 10  # Inverted worry
    score += bonding_score
    
    return min(max(score, 0), 100)

@router.post("/assessments")
def save_assessment(
    payload: AssessmentSave,
    background_tasks: BackgroundTasks,
    current_user_email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db)
):
    # --- START FIX: Robust linkage ---
    # 1. If patient_id is a temporary ID (frontend timestamp), it won't exist in DB
    final_patient_id = payload.patient_id
    patient = None
    if final_patient_id:
        patient = db.query(models.Patient).filter(models.Patient.id == final_patient_id).first()
        if not patient:
            logger.info(f"Provided patient_id {final_patient_id} not found in DB. Treating as temporary.")
            final_patient_id = None
    
    # 2. Try to link by name if ID is missing/invalid
    if not final_patient_id and payload.patient_name:
        patient = db.query(models.Patient).filter(
            models.Patient.name == payload.patient_name,
            models.Patient.clinician_email == current_user_email
        ).first()
        if patient:
            final_patient_id = patient.id
            logger.info(f"Auto-linked assessment for '{payload.patient_name}' to patient ID: {final_patient_id}")
    # --- END FIX ---

    # Get current user
    from .. import models
    current_user = db.query(models.User).filter(models.User.email == current_user_email).first()

    # Compute SHAP top risk factors once at submission (safe, stored in DB)
    top_risk_factors = []
    if payload.raw_data:
        try:
            from types import SimpleNamespace
            from ..ml_model import get_top_features, build_model_input_from_form
            data_obj = SimpleNamespace(**payload.raw_data)
            X = build_model_input_from_form(data_obj)
            top_risk_factors = get_top_features(X, list(X.columns))
        except Exception as shap_err:
            logger.warning(f"SHAP computation skipped at submission: {shap_err}")

    assessment = models.Assessment(
        patient_name=payload.patient_name,
        patient_id=final_patient_id,
        patient_email=patient.email if patient else None,
        raw_data=payload.raw_data,
        risk_score=payload.score,
        risk_level=payload.risk_level,
        clinician_risk=payload.clinician_risk,
        plan=payload.plan,
        notes=payload.notes,
        clinician_email=payload.clinician_email or current_user_email,
        nurse_id=current_user.id if current_user and current_user.role == "nurse" else payload.nurse_id,
        doctor_id=payload.doctor_id,
        status=payload.status,
        top_risk_factors=top_risk_factors,
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    # Only trigger notifications/scheduling if submitted (not draft)
    if assessment.status == "submitted":
        # --- START: Trigger Notifications & Auto-Scheduling ---
        try:
            # 1. High Risk Notification
            if assessment.risk_level == "High Risk":
                high_risk_notif = models.Notification(
                    title="🚨 High Risk Patient Detected",
                    message=f"AI predicts High Risk for {assessment.patient_name}. Immediate review of clinical notes and referral recommended.",
                    type="alert",
                    priority="high",
                    clinician_email=assessment.clinician_email,
                    is_read=False
                )
                db.add(high_risk_notif)
            
            # 2. Assessment Submitted Notification for Doctor
            if assessment.doctor_id:
                doctor = db.query(models.User).filter(models.User.id == assessment.doctor_id).first()
                if doctor:
                    doc_notif = models.Notification(
                        title="📋 New Assessment for Review",
                        message=f"Nurse {current_user.first_name} submitted an assessment for {assessment.patient_name}.",
                        type="info",
                        priority="medium",
                        clinician_email=doctor.email,
                        is_read=False
                    )
                    db.add(doc_notif)
            
            # 3. Assessment Completed Notification
            comp_notif = models.Notification(
                title="📋 Assessment Completed",
                message=f"New assessment submitted for {assessment.patient_name} (Risk: {assessment.risk_level}).",
                type="info",
                priority="low",
                clinician_email=assessment.clinician_email,
                is_read=False
            )
            db.add(comp_notif)
            
            # 4. Auto-Scheduling Logic (Only if not assigning to a doctor for review first, or as a baseline)
            if assessment.patient_id and not assessment.doctor_id:
                # Schedule rules based on risk
                plans = []
                if assessment.risk_level == "High Risk":
                    plans = [
                        (3, "first", "Urgent follow-up check-in"),
                        (7, "second", "Weekly stability review"),
                        (30, "discharge", "One-month final assessment")
                    ]
                elif assessment.risk_level == "Moderate Risk":
                    plans = [
                        (7, "first", "One-week follow-up"),
                        (14, "second", "Two-week status check"),
                        (90, "discharge", "Three-month discharge assessment")
                    ]
                else: # Low Risk
                    plans = [
                        (30, "first", "One-month check-in"),
                        (90, "second", "Three-month routine review"),
                        (180, "discharge", "Six-month final follow-up")
                    ]
                
                for days, tag, notes in plans:
                    scheduled = assessment.created_at + timedelta(days=days)
                    new_fu = models.FollowUp(
                        patient_id=assessment.patient_id,
                        scheduled_date=scheduled,
                        type="clinical",
                        notes=f"{notes} (Auto-scheduled based on {assessment.risk_level})",
                        status="scheduled"
                    )
                    db.add(new_fu)
            
            db.commit()
        except Exception as e:
            logger.error(f"Post-assessment trigger failed: {e}")
            db.rollback()
    # --- END: Trigger Notifications & Auto-Scheduling ---

    created_at = getattr(assessment, "created_at", None)
    timestamp = created_at.isoformat() if created_at else None
    date_str = created_at.date().isoformat() if created_at else None

    # Log assessment details
    logger.info("="*80)
    logger.info("ASSESSMENT SAVED TO HISTORY")
    logger.info(f"Patient: {assessment.patient_name}, ID: {assessment.id}")
    logger.info(f"Date: {date_str}, Risk: {assessment.risk_level}, Score: {assessment.risk_score:.2f}")
    logger.info(f"Clinician Risk: {assessment.clinician_risk or 'N/A'}, Plan: {assessment.plan or 'N/A'}")
    logger.info(f"Clinician: {assessment.clinician_email}")
    logger.info("="*80)

    # Get patient email for immediate use in frontend referral
    patient_email = None
    if assessment.patient_id:
        patient = db.query(models.Patient).filter(models.Patient.id == assessment.patient_id).first()
        if patient:
            patient_email = patient.email

    return {
        "id": assessment.id,
        "patient_name": assessment.patient_name,
        "patient_id": assessment.patient_id,
        "patient_email": patient_email,
        "date": date_str,
        "timestamp": timestamp,
        "risk_level": assessment.risk_level,
        "score": assessment.risk_score,
        "clinician_risk": assessment.clinician_risk,
        "plan": assessment.plan,
        "notes": assessment.notes,
        "clinician_email": assessment.clinician_email,
    }

@router.get("/assessments")
def list_assessments(
    current_user_email: str = Depends(get_current_user_email),
    clinician_email: str | None = Query(None),
    status: Optional[str] = Query(None),
    doctor_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    try:
        # Use provided clinician_email or fall back to current user
        email_filter = clinician_email or current_user_email
        
        query = db.query(models.Assessment)
        
        # Apply filters
        if email_filter:
            # If it's a nurse, they see their own. If a doctor, they see their own.
            # However, for the queue, we might want to filter by doctor_id explicitly.
            if not doctor_id and not status:
                query = query.filter(models.Assessment.clinician_email == email_filter)
        
        if status:
            query = query.filter(models.Assessment.status == status)
            
        if doctor_id:
            query = query.filter(models.Assessment.doctor_id == doctor_id)
        
        records = query.order_by(models.Assessment.created_at.desc()).all()
        
        # Get all patient emails in one go to avoid N+1 and join issues
        patient_ids = [r.patient_id for r in records if r.patient_id]
        patient_names = [r.patient_name for r in records if not r.patient_id]

        patient_emails = {}
        if patient_ids:
            patients = db.query(models.Patient.id, models.Patient.email).filter(models.Patient.id.in_(patient_ids)).all()
            patient_emails = {p.id: p.email for p in patients}
            logger.info(f"Fetched emails for {len(patient_emails)} patients by ID.")

        # Also fetch by name for those missing IDs
        patient_emails_by_name = {}
        if patient_names:
            patients_by_name = db.query(models.Patient.name, models.Patient.email).filter(
                models.Patient.name.in_(patient_names),
                models.Patient.clinician_email == email_filter
            ).all()
            patient_emails_by_name = {p.name: p.email for p in patients_by_name}
            logger.info(f"Fetched emails for {len(patient_emails_by_name)} patients by name.")

        result_list = []
        for a in records:
            created_at = getattr(a, "created_at", None)
            
            # Safe formatting of dates
            date_str = None
            timestamp_str = None
            if created_at:
                try:
                    date_str = created_at.date().isoformat()
                    timestamp_str = created_at.isoformat()
                except Exception:
                    pass

            # Try to find email by ID first, then by name
            p_email = None
            if a.patient_id:
                p_email = patient_emails.get(a.patient_id)
            
            if not p_email and a.patient_name:
                p_email = patient_emails_by_name.get(a.patient_name)
            
            result_list.append({
                "id": getattr(a, "id", None),
                "patient_name": getattr(a, "patient_name", "Unknown Patient"),
                "patient_id": getattr(a, "patient_id", None),
                "patient_email": p_email,
                "date": date_str,
                "timestamp": timestamp_str,
                "risk_level": getattr(a, "risk_level", "Unknown"),
                "score": getattr(a, "risk_score", 0.0),
                "clinician_risk": getattr(a, "clinician_risk", None),
                "plan": getattr(a, "plan", None),
                "notes": getattr(a, "notes", None),
                "clinician_email": getattr(a, "clinician_email", None),
                "raw_data": getattr(a, "raw_data", {}),
            })

        return result_list
    except Exception as e:
        logger.error(f"CRITICAL ERROR in list_assessments: {str(e)}")
        # Fallback: return empty list instead of 500 to avoid CORS issues
        return []

@router.get("/assessments/{assessment_id}")
def get_assessment(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    assessment = db.query(models.Assessment).filter(models.Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return assessment

@router.put("/assessments/{assessment_id}/review")
def review_assessment(
    assessment_id: int,
    review_data: AssessmentReview,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    assessment = db.query(models.Assessment).filter(models.Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Get reviewer info
    reviewer = db.query(models.User).filter(models.User.email == current_user_email).first()
    
    # Check if it's an override
    if review_data.risk_level_final != assessment.risk_level:
        assessment.overridden_by = reviewer.id
        assessment.override_reason = review_data.override_reason
        logger.info(f"Assessment {assessment_id} overridden by Doctor {reviewer.email}")
    
    assessment.risk_level_final = review_data.risk_level_final
    assessment.plan = review_data.plan
    assessment.notes = review_data.notes
    assessment.status = review_data.status
    assessment.reviewed_at = datetime.now()
    
    db.commit()
    db.refresh(assessment)
    
    # If completed or approved, notify patient or nurse
    if assessment.status in ["complete", "approved"]:
        # Notification for patient
        if assessment.patient_id:
            # Add notification logic here
            pass
            
    return assessment

@router.delete("/assessments/clear", status_code=status.HTTP_204_NO_CONTENT)
def clear_assessments_for_clinician(
    current_user_email: str = Depends(get_current_user_email),
    clinician_email: str = Query(None),
    db: Session = Depends(get_db),
):
    # Use provided clinician_email or fall back to current user
    email_filter = clinician_email or current_user_email
    
    deleted = (
        db.query(models.Assessment)
        .filter(models.Assessment.clinician_email == email_filter)
        .delete(synchronize_session=False)
    )

    db.commit()
    return

@router.delete("/assessments/{assessment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assessment(
    assessment_id: int,
    current_user_email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db),
):
    assessment = db.query(models.Assessment).filter(
        models.Assessment.id == assessment_id
    ).first()

    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found!!!")   

    db.delete(assessment)
    db.commit()
    return


def get_risk_color(risk_level: str) -> str:
    """Helper to get hex color for email based on risk level"""
    level = risk_level.replace(" Risk", "")
    return {"High": "#FF4444", "Moderate": "#FF8800", "Low": "#00AA44"}.get(level, "#888888")


def generate_referral_pdf(patient_name, risk_score, risk_level, risk_factors, clinician_notes, assessment_id):
    """Generates a professional PDF report for the referral"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=24,
        alignment=1, # Center
        spaceAfter=30,
        textColor=colors.HexColor("#1F3A5F")
    )
    
    section_header_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor("#333333"),
        borderBottomWidth=1,
        borderBottomColor=colors.grey,
        spaceBefore=12,
        spaceAfter=6
    )

    # Risk badge color
    color_map = {"High": "#FF4444", "Moderate": "#FF8800", "Low": "#00AA44"}
    risk_color = colors.HexColor(color_map.get(risk_level.replace(" Risk", ""), "#888888"))

    story = []

    # Title
    story.append(Paragraph("PPD Risk Assessment Report", title_style))
    story.append(Paragraph("Postpartum Risk Insight | Clinical Referral Document", styles['Normal']))
    story.append(Spacer(1, 0.2 * inch))

    # Patient Information Table
    data = [
        ["Patient Name:", patient_name],
        ["Assessment ID:", f"#{assessment_id}"],
        ["Assessment Date:", datetime.now().strftime("%d %B %Y, %I:%M %p")]
    ]
    t = Table(data, colWidths=[2*inch, 3*inch])
    t.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('ALIGN', (0,0), (0,-1), 'LEFT'),
        ('TEXTCOLOR', (0,0), (0,-1), colors.grey),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.3 * inch))

    # Risk Level Badge
    risk_table_data = [[Paragraph(f"<font color='white' size='14'><b>{risk_level.upper()} — {risk_score:.1f}%</b></font>", styles['Normal'])]]
    risk_table = Table(risk_table_data, colWidths=[4*inch])
    risk_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), risk_color),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('LEFTPADDING', (0,0), (-1,-1), 20),
        ('RIGHTPADDING', (0,0), (-1,-1), 20),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(risk_table)
    story.append(Spacer(1, 0.4 * inch))

    # Key Risk Factors
    story.append(Paragraph("Key Risk Factors Identified", section_header_style))
    if risk_factors:
        for factor in risk_factors:
            story.append(Paragraph(f"• {factor}", styles['Normal']))
    else:
        story.append(Paragraph("No specific factors identified.", styles['Normal']))
    story.append(Spacer(1, 0.3 * inch))

    # Clinician Notes
    story.append(Paragraph("Clinician Notes", section_header_style))
    story.append(Paragraph(clinician_notes if clinician_notes else "No additional notes provided.", styles['Normal']))
    story.append(Spacer(1, 0.3 * inch))

    # Recommended Action
    action_text = "Immediate psychiatric consultation recommended within 24 hours." if "High" in risk_level else "Schedule psychiatric evaluation within 1 week."
    story.append(Paragraph("Recommended Action", section_header_style))
    story.append(Paragraph(f"<b>{action_text}</b>", styles['Normal']))
    story.append(Spacer(1, 0.5 * inch))

    # Footer
    story.append(Spacer(1, 1 * inch))
    footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.grey, alignment=1)
    story.append(Paragraph("Confidential Clinical Communication - For Clinical Use Only", footer_style))
    story.append(Paragraph("This report was generated by the PPD Risk Insight AI platform.", footer_style))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


async def send_referral_email(
    patient_name: str,
    risk_level: str,
    risk_score: float,
    clinician_name: str,
    clinician_notes: str,
    assessment_id: int,
    top_risk_factors: list,
    recipients: list,
    reply_to: str
):
    """
    Sends a professional clinical referral email to the specified recipients with a PDF attachment.
    """
    # Create dynamic config to show clinician name as sender
    dynamic_mail_conf = ConnectionConfig(
        MAIL_USERNAME=config.MAIL_USERNAME,
        MAIL_PASSWORD=config.MAIL_PASSWORD,
        MAIL_FROM=config.MAIL_FROM,
        MAIL_FROM_NAME=clinician_name,
        MAIL_PORT=config.MAIL_PORT,
        MAIL_SERVER=config.MAIL_SERVER,
        MAIL_STARTTLS=config.MAIL_STARTTLS,
        MAIL_SSL_TLS=config.MAIL_SSL_TLS,
        USE_CREDENTIALS=True
    )

    color = get_risk_color(risk_level)
    
    html_body = f"""
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: {color};">PPD Referral Report - {patient_name}</h2>
      <p>Please find the professional clinical referral report attached as a PDF document.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #666;">
        This is a confidential clinical communication from the PPD Risk Insight platform.<br>
        Referred by: {clinician_name}
      </p>
    </div>
    """

    # Generate PDF
    pdf_content = generate_referral_pdf(
        patient_name=patient_name,
        risk_score=risk_score,
        risk_level=risk_level,
        risk_factors=top_risk_factors,
        clinician_notes=clinician_notes,
        assessment_id=assessment_id
    )

    # Create attachment using UploadFile for FastAPI-Mail v2 compatibility
    date_str = datetime.now().strftime("%Y-%m-%d")
    filename = f"PPD_Referral_{patient_name.replace(' ', '_')}_{date_str}.pdf"
    
    attachment = UploadFile(
        filename=filename,
        file=io.BytesIO(pdf_content),
        headers={"content-type": "application/pdf"}
    )

    message = MessageSchema(
        subject=f"[{'URGENT' if 'High' in risk_level else 'REFERRAL'}] PPD {risk_level} - Patient: {patient_name}",
        recipients=recipients,
        body=html_body,
        subtype=MessageType.html,
        reply_to=[reply_to],
        attachments=[attachment]
    )
    
    fm = FastMail(dynamic_mail_conf)
    await fm.send_message(message)


@router.post("/referrals")
async def create_referral(
    payload: ReferralRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Processes a referral and sends a real email notification.
    """
    # 1) Fetch patient email
    assessment = db.query(models.Assessment).filter(models.Assessment.id == payload.assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    patient = db.query(models.Patient).filter(models.Patient.id == assessment.patient_id).first()
    
    # --- START FIX: Fallback linkage for referrals ---
    if not patient and assessment.patient_name:
        logger.info(f"Patient not found by ID {assessment.patient_id}. Attempting search by name: {assessment.patient_name}")
        patient = db.query(models.Patient).filter(
            models.Patient.name == assessment.patient_name,
            models.Patient.clinician_email == current_user.email
        ).first()
        
        if patient:
            # Update the assessment with the correct ID for future
            assessment.patient_id = patient.id
            db.commit()
            logger.info(f"Fixed assessment #{assessment.id} linkage - linked to patient '{patient.name}' (ID: {patient.id})")
    # --- END FIX ---

    if not patient or not patient.email:
        raise HTTPException(status_code=400, detail="Patient email not found. Please update patient details.")

    clinician_full_name = f"{current_user.first_name} {current_user.last_name or ''}".strip()

    logger.info("="*80)
    logger.info("NEW CLINICAL REFERRAL GENERATED")
    logger.info(f"From: {current_user.email} (Name: {clinician_full_name})")
    logger.info(f"To Patient: {patient.email}")
    logger.info(f"Risk Level: {payload.risk_level}, Score: {payload.risk_score}")
    logger.info("="*80)

    try:
        # Trigger real email dynamically
        await send_referral_email(
            patient_name=payload.patient_name,
            risk_level=payload.risk_level,
            risk_score=payload.risk_score,
            clinician_name=clinician_full_name,
            clinician_notes=payload.clinician_notes,
            assessment_id=payload.assessment_id,
            top_risk_factors=payload.top_risk_factors,
            recipients=[patient.email],  # 👈 TO patient.email
            reply_to=current_user.email  # 👈 reply_to clinician
        )
        
        # Create persistent notification for referral email
        ref_notif = models.Notification(
            title="📧 Referral Email Sent",
            message=f"Clinical referral report for {patient.name} has been emailed to {patient.email}.",
            type="info",
            priority="medium",
            clinician_email=current_user.email,
            is_read=False
        )
        db.add(ref_notif)
        db.commit()
        
        # --- START: Trigger Referral Notification ---
        try:
            referral_notif = models.Notification(
                title="📧 Referral Sent",
                message=f"A professional referral for {payload.patient_name} has been sent successfully to {payload.referral_department}.",
                type="success",
                priority="medium",
                clinician_email=current_user.email,
                is_read=False
            )
            db.add(referral_notif)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to create referral notification: {e}")
        # --- END: Trigger Referral Notification ---
        
        return {
            "status": "success",
            "message": f"Referral for {payload.patient_name} successfully sent to {payload.referral_department}.",
            "referral_id": f"REF-{payload.assessment_id}-{datetime.now().strftime('%M')}",
        }
    except Exception as e:
        logger.error(f"CRITICAL: Failed to send real referral email: {e}", exc_info=True)
        # 🚨 THROW REAL ERROR so frontend sees it failed
        raise HTTPException(
            status_code=500,
            detail=f"Real Email Error: {str(e)}. (Hint: Check your MAIL_PASSWORD in config.py)"
        )