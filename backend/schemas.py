from __future__ import annotations
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


# ── Books ──────────────────────────────────────────────────────────────────

class BookCreate(BaseModel):
    title: str
    author: Optional[str] = None
    language: Optional[str] = None  # 'en' | 'zh' 


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


# ── Sources ────────────────────────────────────────────────────────────────

class SourceCreate(BaseModel):
    type: str  # 'book' | 'video' | 'spoken' | 'unknown'
    title: Optional[str] = None
    author: Optional[str] = None
    url: Optional[str] = None
    context: Optional[str] = None
    book_id: Optional[UUID] = None


class SourceOut(BaseModel):
    id: UUID
    type: str
    title: Optional[str]
    author: Optional[str]
    url: Optional[str]
    context: Optional[str]
    book_id: Optional[UUID]
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Tags ───────────────────────────────────────────────────────────────────

class TagCreate(BaseModel):
    name: str


class TagOut(BaseModel):
    id: UUID
    name: str

    model_config = {"from_attributes": True}


# ── Quotes ─────────────────────────────────────────────────────────────────

class QuoteCreate(BaseModel):
    text: str
    author: Optional[str] = None
    page: Optional[int] = None
    source_id: Optional[UUID] = None
    tag_ids: Optional[List[UUID]] = None


class QuoteUpdate(BaseModel):
    text: Optional[str] = None
    author: Optional[str] = None
    page: Optional[int] = None
    source_id: Optional[UUID] = None
    tag_ids: Optional[List[UUID]] = None


class QuoteOut(BaseModel):
    id: UUID
    text: str
    author: Optional[str]
    page: Optional[int]
    source_id: Optional[UUID]
    source: Optional[SourceOut]
    tags: List[TagOut] = []
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Search ─────────────────────────────────────────────────────────────────

class SearchResult(BaseModel):
    quotes: List[QuoteOut]


# forward refs
BookWithQuotes.model_rebuild()
