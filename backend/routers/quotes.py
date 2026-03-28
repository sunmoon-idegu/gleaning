from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from auth import verify_token
from database import get_db
from models import Quote, QuoteTag, Source, Tag, User
from schemas import QuoteCreate, QuoteOut, QuoteUpdate, SourceOut, TagOut

router = APIRouter(prefix="/quotes", tags=["quotes"])


def _build_quote_out(q: Quote) -> QuoteOut:
    source_out = SourceOut.model_validate(q.source) if q.source else None
    tags_out = [TagOut.model_validate(t) for t in q.tags]
    return QuoteOut(
        id=q.id, text=q.text, author=q.author, page=q.page,
        source_id=q.source_id, source=source_out, tags=tags_out,
        created_at=q.created_at,
    )


def _set_tags(quote: Quote, tag_ids: Optional[List[UUID]], db: Session):
    db.query(QuoteTag).filter(QuoteTag.quote_id == quote.id).delete()
    for tag_id in (tag_ids or []):
        db.add(QuoteTag(quote_id=quote.id, tag_id=tag_id))


def _own_quote_or_404(quote_id: UUID, user: User, db: Session) -> Quote:
    q = (
        db.query(Quote)
        .options(joinedload(Quote.source), joinedload(Quote.tags))
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
        .options(joinedload(Quote.source), joinedload(Quote.tags))
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
        author=body.author,
        page=body.page,
        source_id=body.source_id,
    )
    db.add(quote)
    db.flush()
    _set_tags(quote, body.tag_ids, db)
    db.commit()
    return _own_quote_or_404(quote.id, current_user, db)


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
    if body.author is not None:
        quote.author = body.author
    if body.page is not None:
        quote.page = body.page
    if body.source_id is not None:
        quote.source_id = body.source_id
    if body.tag_ids is not None:
        _set_tags(quote, body.tag_ids, db)
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
