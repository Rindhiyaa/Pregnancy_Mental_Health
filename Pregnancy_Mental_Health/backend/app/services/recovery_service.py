from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..models import User, RecoveryRequest, RecoveryChallenge, AuditLog
from ..security import generate_recovery_code, hash_recovery_code, hash_password
from ..utils.websocket_manager import manager
import json
import asyncio



def log_event(db: Session, action: str, user_id: int | None = None, actor_id: int | None = None, metadata: dict | None = None):
    # Determine the 'user_name' for the AuditLog model
    user_name = "System"
    if actor_id:
        actor = db.query(User).filter(User.id == actor_id).first()
        if actor:
            user_name = f"{actor.first_name} {actor.last_name or ''}".strip()
    elif user_id:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user_name = f"{user.first_name} {user.last_name or ''}".strip()

    ip_address = metadata.get("ip") if metadata else None
    # Create human-readable details based on action and metadata
    readable_details = f"Action: {action}"
    
    if action == "RECOVERY_SUCCESS":
        readable_details = "Successfully completed password recovery and reset."
    elif action == "RECOVERY_APPROVED":
        request_id = metadata.get('request_id') if metadata else "Unknown"
        readable_details = f"Recovery request approved (Req ID: {request_id})"
    elif action == "RECOVERY_AUTO_APPROVED":
        readable_details = "Recovery request automatically approved (Patient role)."
    elif action == "RECOVERY_REQUEST_PENDING_ADMIN":
        readable_details = "Recovery request submitted for clinician (Waiting for Admin approval)."
    elif action == "RECOVERY_FAILED_BAD_CODE":
        readable_details = "Failed recovery attempt: Incorrect code entered."
    elif action == "RECOVERY_FAILED_EXPIRED":
        readable_details = "Failed recovery attempt: Code has expired."
    elif action == "RECOVERY_FAILED_LOCKED":
        readable_details = "Account recovery locked: Too many failed attempts."
    elif action == "RECOVERY_REQUEST_UNKNOWN_EMAIL":
        email = metadata.get('email') if metadata else "Unknown"
        readable_details = f"Recovery attempt for unknown email: {email}"
    elif metadata:
        # Fallback for other actions: include specific keys if they exist
        clean_meta = {k: v for k, v in metadata.items() if k not in ["ip", "user_agent"]}
        if clean_meta:
            readable_details = f"{action} | {clean_meta}"

    
    entry = AuditLog(
        user_id=actor_id or user_id or 0,
        user_name=user_name,
        action=action,
        details=readable_details,
        ip_address=ip_address,
        timestamp=datetime.utcnow()
    )
    db.add(entry)
    db.commit()



async def send_recovery_push(user: User, code: str):
    # Broadcast through WebSockets for the Demo/Project UX
    try:
        await manager.broadcast(json.dumps({
            "type": "RECOVERY_READY",
            "email": user.email,
            "code": code,
            "role": user.role
        }))
    except Exception as e:
        print(f"WS Broadcast error: {e}")

    # Log to console as fallback
    print(f"Push notification/email to {user.email}: recovery code {code}")


async def create_recovery_request(db: Session, email: str, ip: str | None, user_agent: str | None):
    user = db.query(User).filter(User.email == email).first()

    if not user:
        log_event(
            db,
            action="RECOVERY_REQUEST_UNKNOWN_EMAIL",
            metadata={"email": email, "ip": ip, "user_agent": user_agent},
        )
        return {"message": "If your account exists, a recovery code has been sent.", "auto_approved": True}

    is_staff = user.role in ["doctor", "nurse", "admin"]
    status = "pending" if is_staff else "approved"

    request = RecoveryRequest(
        user_id=user.id,
        user_email=user.email,
        user_role=user.role,
        status=status,
        requested_from_ip=ip,
        requested_user_agent=user_agent,
    )
    db.add(request)
    db.commit()
    db.refresh(request)

    if is_staff:
        # Broadcast to Admins that a new request is pending for real-time update
        try:
            await manager.broadcast(json.dumps({
                "type": "NEW_RECOVERY_REQUEST",
                "email": user.email,
                "role": user.role,
                "request_id": request.id
            }))
        except Exception as e:
            print(f"WS Broadcast error: {e}")

        log_event(
            db,
            action="RECOVERY_REQUEST_PENDING_ADMIN",
            user_id=user.id,
            metadata={"request_id": request.id, "ip": ip}
        )
        return {"message": "Your request is pending admin approval.", "auto_approved": False}
    else:
        # Auto-approve for patients
        raw_code = generate_recovery_code()
        code_hash = hash_recovery_code(raw_code)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

        device_id = getattr(user, "device_id", None)
        push_subscription_id = getattr(user, "push_subscription_id", None)

        challenge = RecoveryChallenge(
            recovery_request_id=request.id,
            token_hash=code_hash,
            expires_at=expires_at,
            max_attempts=3,
            device_id=device_id,
            push_subscription_id=push_subscription_id,
        )
        db.add(challenge)
        
        request.approved_at = datetime.now(timezone.utc)
        db.commit()

        await send_recovery_push(user, raw_code)

        log_event(
            db,
            action="RECOVERY_AUTO_APPROVED",
            user_id=user.id,
            metadata={"request_id": request.id, "ip": ip}
        )
        return {
            "message": "If your account exists, a recovery code has been sent.",
            "auto_approved": True,
            "code": raw_code
        }


def get_pending_recovery_requests(db: Session):
    return db.query(RecoveryRequest).filter(RecoveryRequest.status == "pending").order_by(desc(RecoveryRequest.created_at)).all()


async def approve_recovery_request(db: Session, request_id: int, admin_user: User, admin_ip: str | None):
    recovery_request = db.query(RecoveryRequest).filter(RecoveryRequest.id == request_id).first()
    if not recovery_request or recovery_request.status != "pending":
        return None, None

    user = db.query(User).filter(User.id == recovery_request.user_id).first()
    if not user:
        return None, None

    raw_code = generate_recovery_code()
    code_hash = hash_recovery_code(raw_code)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    # Note: `device_id` and `push_subscription_id` are not in the User model directly by default, so we safely get them
    device_id = getattr(user, "device_id", None)
    push_subscription_id = getattr(user, "push_subscription_id", None)

    challenge = RecoveryChallenge(
        recovery_request_id=recovery_request.id,
        token_hash=code_hash,
        expires_at=expires_at,
        max_attempts=3,
        device_id=device_id,
        push_subscription_id=push_subscription_id,
        created_by_admin_ip=admin_ip,
    )
    db.add(challenge)

    recovery_request.status = "approved"
    recovery_request.approved_by_admin_id = admin_user.id
    recovery_request.approved_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(challenge)

    await send_recovery_push(user, raw_code)

    log_event(
        db,
        action="RECOVERY_APPROVED",
        user_id=user.id,
        actor_id=admin_user.id,
        metadata={
            "request_id": recovery_request.id,
            "challenge_id": challenge.id,
            "ip": admin_ip
        }
    )

    return challenge, expires_at


def verify_recovery_code(db: Session, email: str, code: str, new_password: str, device_id: str | None, ip: str | None):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return False, "Invalid or expired recovery attempt"

    # Find the latest approved challenge for this email that isn't used or revoked
    challenge = (
        db.query(RecoveryChallenge)
        .join(RecoveryRequest, RecoveryChallenge.recovery_request_id == RecoveryRequest.id)
        .filter(
            RecoveryRequest.user_email == email,
            RecoveryRequest.status == "approved",
            RecoveryChallenge.used_at.is_(None),
            RecoveryChallenge.revoked_at.is_(None)
        )
        .order_by(desc(RecoveryChallenge.created_at))
        .first()
    )

    if not challenge:
        return False, "Invalid or expired recovery attempt"

    now = datetime.now(timezone.utc)

    # Some databases store naive datetimes. If so, strip tzinfo for comparison
    challenge_exp = challenge.expires_at
    if challenge_exp.tzinfo is None:
         now = datetime.utcnow()

    if challenge_exp < now:
        log_event(
            db,
            action="RECOVERY_FAILED_EXPIRED",
            user_id=user.id,
            metadata={"challenge_id": challenge.id, "ip": ip}
        )
        return False, "Invalid or expired recovery attempt"

    if challenge.attempt_count >= challenge.max_attempts:
        challenge.revoked_at = now
        db.commit()
        log_event(
            db,
            action="RECOVERY_FAILED_LOCKED",
            user_id=user.id,
            metadata={"challenge_id": challenge.id, "ip": ip}
        )
        return False, "Too many failed attempts"

    if challenge.device_id and device_id and challenge.device_id != device_id:
        challenge.attempt_count += 1
        db.commit()
        log_event(
            db,
            action="RECOVERY_FAILED_DEVICE_MISMATCH",
            user_id=user.id,
            metadata={"challenge_id": challenge.id, "ip": ip}
        )
        return False, "Invalid or expired recovery attempt"

    if hash_recovery_code(code) != challenge.token_hash:
        challenge.attempt_count += 1
        db.commit()
        log_event(
            db,
            action="RECOVERY_FAILED_BAD_CODE",
            user_id=user.id,
            metadata={"challenge_id": challenge.id, "ip": ip}
        )
        return False, "Invalid or expired recovery attempt"

    # Success: Change password
    user.hashed_password = hash_password(new_password)
    user.password_changed_at = datetime.utcnow()
    user.first_login = False
    
    challenge.used_at = now
    challenge.used_from_ip = ip

    recovery_request = db.query(RecoveryRequest).filter(RecoveryRequest.id == challenge.recovery_request_id).first()
    if recovery_request:
        recovery_request.status = "completed"
        recovery_request.completed_at = now

    db.commit()

    log_event(
        db,
        action="RECOVERY_SUCCESS",
        user_id=user.id,
        metadata={"challenge_id": challenge.id, "ip": ip}
    )

    # Broadcast that the recovery is complete for real-time update
    try:
        await manager.broadcast(json.dumps({
            "type": "RECOVERY_COMPLETED",
            "email": user.email,
            "request_id": recovery_request.id if recovery_request else None
        }))
    except Exception as e:
        print(f"WS Broadcast error: {e}")

    return True, "Password updated successfully"
