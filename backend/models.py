import uuid
from sqlalchemy import (
    Column, Text, Integer, ForeignKey, UniqueConstraint,
    Index, DateTime
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, relationship
from sqlalchemy.sql import func
from sqlalchemy import text as sa_text


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clerk_id = Column(Text, unique=True, nullable=False)
    email = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Book(Base):
    __tablename__ = "books"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(Text, nullable=False)
    author = Column(Text)
    language = Column(Text)  # e.g. 'en', 'zh', 'ja', 'fr', 'other'
    cover_url = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Source(Base):
    __tablename__ = "sources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(Text, nullable=False)  # 'book' | 'video' | 'spoken' | 'unknown'
    title = Column(Text)
    author = Column(Text)
    url = Column(Text)
    context = Column(Text)
    book_id = Column(UUID(as_uuid=True), ForeignKey("books.id", ondelete="SET NULL"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Quote(Base):
    __tablename__ = "quotes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    text = Column(Text, nullable=False)
    author = Column(Text)
    page = Column(Integer)
    source_id = Column(UUID(as_uuid=True), ForeignKey("sources.id", ondelete="SET NULL"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    source = relationship("Source", foreign_keys=[source_id], lazy="select")
    tags = relationship("Tag", secondary="quote_tags", lazy="select")

    __table_args__ = (
        Index(
            "quotes_text_search",
            sa_text("to_tsvector('english', text)"),
            postgresql_using="gin",
        ),
    )


class Tag(Base):
    __tablename__ = "tags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(Text, nullable=False)

    __table_args__ = (UniqueConstraint("user_id", "name"),)


class QuoteTag(Base):
    __tablename__ = "quote_tags"

    quote_id = Column(UUID(as_uuid=True), ForeignKey("quotes.id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(UUID(as_uuid=True), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)
