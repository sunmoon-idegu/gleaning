from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import verify_token
from database import get_db
from models import Reflection, User
from schemas import ReflectionCreate, ReflectionOut, ReflectionUpdate

router = APIRouter(prefix="/reflections", tags=["reflections"])


def _own_or_404(reflection_id: UUID, user: User, db: Session) -> Reflection:
    r = db.query(Reflection).filter(
        Reflection.id == reflection_id,
        Reflection.user_id == user.id,
    ).first()
    if not r:
        raise HTTPException(status_code=404, detail="Reflection not found")
    return r


@router.get("", response_model=List[ReflectionOut])
def list_reflections(
    target_type: str,
    target_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_token),
):
    return (
        db.query(Reflection)
        .filter(
            Reflection.user_id == current_user.id,
            Reflection.target_type == target_type,
            Reflection.target_id == target_id,
        )
        .order_by(Reflection.created_at.desc())
        .all()
    )


@router.post("", response_model=ReflectionOut, status_code=status.HTTP_201_CREATED)
def create_reflection(
    body: ReflectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_token),
):
    r = Reflection(
        user_id=current_user.id,
        target_type=body.target_type,
        target_id=body.target_id,
        content=body.content,
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


@router.patch("/{reflection_id}", response_model=ReflectionOut)
def update_reflection(
    reflection_id: UUID,
    body: ReflectionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_token),
):
    r = _own_or_404(reflection_id, current_user, db)
    r.content = body.content
    db.commit()
    db.refresh(r)
    return r


@router.delete("/{reflection_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reflection(
    reflection_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_token),
):
    r = _own_or_404(reflection_id, current_user, db)
    db.delete(r)
    db.commit()
