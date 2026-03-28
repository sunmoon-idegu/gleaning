from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, func
from sqlalchemy.orm import Session, joinedload

from auth import verify_token
from database import get_db
from models import Quote, Source, Tag, QuoteTag, User
from schemas import QuoteOut, SearchResult, SourceOut, TagOut

router = APIRouter(prefix="/search", tags=["search"])


@router.get("", response_model=SearchResult)
def search(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_token),
):
    tsquery = func.plainto_tsquery("english", q)
    tsvector = func.to_tsvector("english", Quote.text)

    quotes = (
        db.query(Quote)
        .options(joinedload(Quote.source), joinedload(Quote.tags))
        .outerjoin(Quote.source)
        .outerjoin(Quote.tags)
        .filter(
            Quote.user_id == current_user.id,
            or_(
                tsvector.op("@@")(tsquery),
                Source.title.ilike(f"%{q}%"),
                Source.author.ilike(f"%{q}%"),
                Quote.author.ilike(f"%{q}%"),
                Tag.name.ilike(f"%{q}%"),
            ),
        )
        .distinct()
        .order_by(Quote.created_at.desc())
        .all()
    )

    results = []
    for quote in quotes:
        source_out = SourceOut.model_validate(quote.source) if quote.source else None
        tags_out = [TagOut.model_validate(t) for t in quote.tags]
        results.append(QuoteOut(
            id=quote.id, text=quote.text, author=quote.author, page=quote.page,
            source_id=quote.source_id, source=source_out, tags=tags_out,
            created_at=quote.created_at,
        ))

    return SearchResult(quotes=results)
