import uuid
from sqlalchemy import (
    Column, Text, Integer, ForeignKey, UniqueConstraint,
    Index, DateTime
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
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
    preferences = Column(JSONB, nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Book(Base):
    __tablename__ = "books"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(Text, nullable=False)
    author = Column(Text)
    language = Column(Text)
    cover_url = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("user_id", "title"),)


class Quote(Base):
    __tablename__ = "quotes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    text = Column(Text, nullable=False)
    source_type = Column(Text)  # 'book' | None — extensible
    book_id = Column(UUID(as_uuid=True), ForeignKey("books.id", ondelete="SET NULL"))
    page = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    book = relationship("Book", foreign_keys=[book_id], lazy="select")

    __table_args__ = (
        Index(
            "quotes_text_search",
            sa_text("to_tsvector('simple', text)"),
            postgresql_using="gin",
        ),
    )


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    category = Column(Text, nullable=True)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
