from datetime import datetime
import logging
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from .. import config

logger = logging.getLogger(__name__)

# Email configuration
EMAIL_ENABLED = all([config.MAIL_USERNAME, config.MAIL_PASSWORD, config.MAIL_FROM])

if EMAIL_ENABLED:
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
else:
    mail_conf = None
    logger.warning("Email configuration is incomplete. Email features will be disabled.")

async def send_followup_email(patient_email: str, patient_name: str, scheduled_date: datetime, ftype: str):
    """Utility to send follow-up confirmation email"""
    if not EMAIL_ENABLED or not mail_conf:
        logger.warning(f"Skipping email to {patient_email} - Email not configured")
        return

    date_str = scheduled_date.strftime("%d %B %Y")
    time_str = scheduled_date.strftime("%I:%M %p")
    
    html_body = f"""
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px; background: white;">
      <div style="background: #6366f1; padding: 15px; border-radius: 8px 8px 0 0; color: white; text-align: center;">
        <h2 style="margin: 0; color: white;">📅 Follow-up Appointment</h2>
      </div>
      <div style="padding: 20px;">
        <p>Dear {patient_name},</p>
        <p>A mental health follow-up check-in has been scheduled for you as part of your postpartum care plan.</p>
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1;">
          <p style="margin: 5px 0;"><strong>Type:</strong> {ftype.replace('-', ' ').title()} Check-in</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> {date_str}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> {time_str}</p>
        </div>
        
        <p>This is a routine status check to ensure your well-being. If you need to reschedule, please contact your clinician.</p>
      </div>
      <div style="background: #f1f5f9; padding: 15px; border-radius: 0 0 8px 8px; font-size: 12px; color: #64748b; text-align: center;">
        This is an automated notification from the PPD Risk Insight platform.
      </div>
    </div>
    """

    message = MessageSchema(
        subject=f"📅 Appointment Scheduled: {ftype.replace('-', ' ').title()} Check-in",
        recipients=[patient_email],
        body=html_body,
        subtype=MessageType.html
    )
    
    fm = FastMail(mail_conf)
    try:
        await fm.send_message(message)
        logger.info(f"Follow-up email sent to {patient_email}")
    except Exception as e:
        logger.error(f"Failed to send follow-up email: {e}")
