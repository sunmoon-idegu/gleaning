from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from auth import verify_token
from database import get_db
from models import Book, Quote, User
from schemas import BookCreate, BookOut, BookUpdate, BookWithQuotes, QuoteOut

router = APIRouter(prefix="/books", tags=["books"])


def _own_book_or_404(book_id: UUID, user: User, db: Session) -> Book:
    book = db.query(Book).filter(Book.id == book_id, Book.user_id == user.id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


@router.get("", response_model=List[BookOut])
def list_books(
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_token),
):
    return db.query(Book).filter(Book.user_id == current_user.id).order_by(Book.title).all()


@router.post("", response_model=BookOut, status_code=status.HTTP_201_CREATED)
def create_book(
    body: BookCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_token),
):
    book = Book(user_id=current_user.id, title=body.title, author=body.author, language=body.language)
    db.add(book)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Book already exists")
    db.refresh(book)
    return book


@router.get("/{book_id}", response_model=BookWithQuotes)
def get_book(
    book_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_token),
):
    book = _own_book_or_404(book_id, current_user, db)

    raw_quotes = (
        db.query(Quote)
        .filter(Quote.user_id == current_user.id, Quote.book_id == book_id)
        .order_by(Quote.page.nullslast(), Quote.created_at)
        .all()
    )

    book_out = BookOut.model_validate(book)
    quotes_out = [
        QuoteOut(
            id=q.id, text=q.text,
            source_type=q.source_type, book_id=q.book_id, book=book_out,
            page=q.page, created_at=q.created_at,
        )
        for q in raw_quotes
    ]

    result = BookWithQuotes.model_validate(book)
    result.quotes = quotes_out
    return result


@router.patch("/{book_id}", response_model=BookOut)
def update_book(
    book_id: UUID,
    body: BookUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_token),
):
    book = _own_book_or_404(book_id, current_user, db)
    if body.title is not None:
        book.title = body.title
    if body.author is not None:
        book.author = body.author
    if body.language is not None:
        book.language = body.language
    db.commit()
    db.refresh(book)
    return book


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(
    book_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_token),
):
    book = _own_book_or_404(book_id, current_user, db)
    db.query(Quote).filter(Quote.book_id == book_id, Quote.user_id == current_user.id).delete()
    db.delete(book)
    db.commit()
