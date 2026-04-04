import logging

logger = logging.getLogger(__name__)

async def send_followup_email(*args, **kwargs):
    """Email functionality disabled"""
    logger.info("Email functionality is currently disabled. send_followup_email called but no email sent.")
    return True
