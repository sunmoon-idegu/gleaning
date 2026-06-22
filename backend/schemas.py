from __future__ import annotations
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


# ── User / Preferences ─────────────────────────────────────────────────────

class PreferencesUpdate(BaseModel):
    theme: Optional[str] = None
    feed_mode: Optional[str] = None
    sort_order: Optional[str] = None
    font_size: Optional[str] = None
    language: Optional[str] = None


class PreferencesOut(BaseModel):
    theme: Optional[str] = None
    feed_mode: Optional[str] = None
    sort_order: Optional[str] = None
    font_size: Optional[str] = None
    language: Optional[str] = None


# ── Feedback ───────────────────────────────────────────────────────────────

class FeedbackCreate(BaseModel):
    category: Optional[str] = None
    message: Optional[str] = None


# ── Books ──────────────────────────────────────────────────────────────────

class BookCreate(BaseModel):
    title: str
    author: Optional[str] = None
    language: Optional[str] = None


class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    language: Optional[str] = None


class BookOut(BaseModel):
    id: UUID
    title: str
    author: Optional[str]
    language: Optional[str]
    cover_url: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class BookWithQuotes(BookOut):
    quotes: List[QuoteOut] = []


# ── Quotes ─────────────────────────────────────────────────────────────────

class QuoteCreate(BaseModel):
    text: str
    source_type: Optional[str] = None  # 'book' | None
    book_id: Optional[UUID] = None
    page: Optional[int] = None


class QuoteUpdate(BaseModel):
    text: Optional[str] = None
    source_type: Optional[str] = None
    book_id: Optional[UUID] = None
    page: Optional[int] = None


class QuoteOut(BaseModel):
    id: UUID
    text: str
    source_type: Optional[str]
    book_id: Optional[UUID]
    book: Optional[BookOut] = None
    page: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Reflections ────────────────────────────────────────────────────────────

class ReflectionCreate(BaseModel):
    target_type: str
    target_id: UUID
    content: str


class ReflectionUpdate(BaseModel):
    content: str


class ReflectionOut(BaseModel):
    id: UUID
    target_type: str
    target_id: UUID
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Search ─────────────────────────────────────────────────────────────────

class SearchResult(BaseModel):
    quotes: List[QuoteOut]


BookWithQuotes.model_rebuild()
