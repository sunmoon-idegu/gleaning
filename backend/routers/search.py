from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, func
from sqlalchemy.orm import Session, joinedload

from auth import verify_token
from database import get_db
from models import Book, Quote, User
from schemas import BookOut, QuoteOut, SearchResult

router = APIRouter(prefix="/search", tags=["search"])


@router.get("", response_model=SearchResult)
def search(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_token),
):
    tsquery = func.plainto_tsquery("simple", q)
    tsvector = func.to_tsvector("simple", Quote.text)

    quotes = (
        db.query(Quote)
        .options(joinedload(Quote.book))
        .outerjoin(Quote.book)
        .filter(
            Quote.user_id == current_user.id,
            or_(
                tsvector.op("@@")(tsquery),
                Book.title.ilike(f"%{q}%"),
                Book.author.ilike(f"%{q}%"),
            ),
        )
        .distinct()
        .order_by(Quote.created_at.desc())
        .all()
    )

    results = [
        QuoteOut(
            id=q.id, text=q.text,
            source_type=q.source_type, book_id=q.book_id,
            book=BookOut.model_validate(q.book) if q.book else None,
            page=q.page, created_at=q.created_at,
        )
        for q in quotes
    ]
    return SearchResult(quotes=results)
