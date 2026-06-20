from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from auth import verify_token
from database import get_db
from models import Quote, Book, User
from schemas import BookOut, QuoteCreate, QuoteOut, QuoteUpdate

router = APIRouter(prefix="/quotes", tags=["quotes"])


def _build_quote_out(q: Quote) -> QuoteOut:
    book_out = BookOut.model_validate(q.book) if q.book else None
    return QuoteOut(
        id=q.id, text=q.text,
        source_type=q.source_type, book_id=q.book_id, book=book_out,
        page=q.page, created_at=q.created_at,
    )


def _own_quote_or_404(quote_id: UUID, user: User, db: Session) -> Quote:
    q = (
        db.query(Quote)
        .options(joinedload(Quote.book))
        .filter(Quote.id == quote_id, Quote.user_id == user.id)
        .first()
    )
    if not q:
        raise HTTPException(status_code=404, detail="Quote not found")
    return q


@router.get("", response_model=List[QuoteOut])
def list_quotes(
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_token),
):
    quotes = (
        db.query(Quote)
        .options(joinedload(Quote.book))
        .filter(Quote.user_id == current_user.id)
        .order_by(Quote.created_at.desc())
        .all()
    )
    return [_build_quote_out(q) for q in quotes]


@router.post("", response_model=QuoteOut, status_code=status.HTTP_201_CREATED)
def create_quote(
    body: QuoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_token),
):
    quote = Quote(
        user_id=current_user.id,
        text=body.text,
        source_type=body.source_type,
        book_id=body.book_id,
        page=body.page,
    )
    db.add(quote)
    db.commit()
    return _build_quote_out(_own_quote_or_404(quote.id, current_user, db))


@router.get("/{quote_id}", response_model=QuoteOut)
def get_quote(
    quote_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_token),
):
    return _build_quote_out(_own_quote_or_404(quote_id, current_user, db))


@router.patch("/{quote_id}", response_model=QuoteOut)
def update_quote(
    quote_id: UUID,
    body: QuoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_token),
):
    quote = _own_quote_or_404(quote_id, current_user, db)
    if body.text is not None:
        quote.text = body.text
    if body.source_type is not None:
        quote.source_type = body.source_type
    if body.book_id is not None:
        quote.book_id = body.book_id
    if body.page is not None:
        quote.page = body.page
    db.commit()
    return _build_quote_out(_own_quote_or_404(quote_id, current_user, db))


@router.delete("/{quote_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quote(
    quote_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_token),
):
    quote = _own_quote_or_404(quote_id, current_user, db)
    db.delete(quote)
    db.commit()
