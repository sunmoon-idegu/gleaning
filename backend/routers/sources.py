from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import verify_token
from database import get_db
from models import Source, User
from schemas import SourceCreate, SourceOut

router = APIRouter(prefix="/sources", tags=["sources"])


@router.get("", response_model=List[SourceOut])
def list_sources(
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_token),
):
    return (
        db.query(Source)
        .filter(Source.user_id == current_user.id, Source.type != "book")
        .order_by(Source.created_at.desc())
        .all()
    )


@router.post("", response_model=SourceOut, status_code=status.HTTP_201_CREATED)
def create_source(
    body: SourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_token),
):
    source = Source(
        user_id=current_user.id,
        type=body.type,
        title=body.title,
        author=body.author,
        url=body.url,
        context=body.context,
        book_id=body.book_id,
    )
    db.add(source)
    db.commit()
    db.refresh(source)
    return source


@router.delete("/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_source(
    source_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_token),
):
    source = db.query(Source).filter(Source.id == source_id, Source.user_id == current_user.id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    db.delete(source)
    db.commit()
