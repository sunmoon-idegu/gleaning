from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import verify_token
from database import get_db
from models import Feedback, User
from schemas import FeedbackCreate

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.post("", status_code=status.HTTP_201_CREATED)
def submit_feedback(
    body: FeedbackCreate,
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db),
):
    if not body.category and not (body.message and body.message.strip()):
        raise HTTPException(status_code=422, detail="Provide a category or a message.")

    entry = Feedback(
        user_id=current_user.id,
        category=body.category,
        message=body.message.strip() if body.message else None,
    )
    db.add(entry)
    db.commit()
    return {"ok": True}
