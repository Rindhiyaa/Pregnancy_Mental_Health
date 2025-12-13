from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..models import Task, TaskStatus, Role, User, Assessment
from ..schemas import TaskCreate, TaskRead
from ..auth import get_current_user, require_roles
from ..database import get_session

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("", response_model=List[TaskRead])
def list_tasks(session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    query = select(Task)
    tasks = session.exec(query).all()
    return tasks


@router.post("", response_model=TaskRead, dependencies=[Depends(require_roles(Role.clinician, Role.nurse, Role.admin))])
def create_task(body: TaskCreate, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    assessment = session.get(Assessment, body.assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    task = Task(
        assessment_id=body.assessment_id,
        assigned_to=body.assigned_to,
        due_date=body.due_date,
        status=body.status,
    )
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


