from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import (
    RecoveryRequestCreate,
    RecoveryVerifyIn,
    RecoveryRequestOut,
    GenericMessage,
    ApproveRecoveryResponse,
)
from ..services.recovery_service import (
    create_recovery_request,
    get_pending_recovery_requests,
    approve_recovery_request,
    verify_recovery_code,
)
from ..jwt_handler import get_current_user
from ..models import User

router = APIRouter(prefix="/recovery", tags=["Recovery"])

def require_admin(user: User):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user

@router.post("/request", response_model=GenericMessage)
async def request_recovery(
    payload: RecoveryRequestCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    result = await create_recovery_request(db, payload.email, ip, user_agent)
    return result

@router.get("/admin/pending", response_model=list[RecoveryRequestOut])
def get_pending_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin(current_user)
    rows = get_pending_recovery_requests(db)
    return rows

@router.post("/admin/approve/{request_id}", response_model=ApproveRecoveryResponse)
async def approve_request(
    request_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin(current_user)
    ip = request.client.host if request.client else None

    challenge, expires_at = await approve_recovery_request(db, request_id, current_user, ip)
    if not challenge:
        raise HTTPException(status_code=404, detail="Pending recovery request not found")

    return {
        "message": "Recovery challenge approved and generated",
        "request_id": request_id,
        "expires_at": expires_at,
    }

@router.post("/admin/decline/{request_id}", response_model=GenericMessage)
def decline_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin(current_user)
    from ..models import RecoveryRequest
    req = db.query(RecoveryRequest).filter(
        RecoveryRequest.id == request_id,
        RecoveryRequest.status == "pending"
    ).first()
    
    if not req:
        raise HTTPException(status_code=404, detail="Pending recovery request not found")
    
    req.status = "declined"
    db.commit()
    return {"message": "Recovery request declined successfully"}

@router.post("/verify", response_model=GenericMessage)
async def verify_recovery(
    payload: RecoveryVerifyIn,
    request: Request,
    db: Session = Depends(get_db),
):
    ip = request.client.host if request.client else None
    success, message = await verify_recovery_code(
        db,
        email=payload.email,
        code=payload.code,
        new_password=payload.new_password,
        device_id=payload.device_id,
        ip=ip,
    )

    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    return {"message": message}
