"""unique book title per user

Revision ID: b3c1d2e4f5a6
Revises: 07a05db5d5ab
Create Date: 2026-06-18 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = 'b3c1d2e4f5a6'
down_revision: Union[str, Sequence[str], None] = '07a05db5d5ab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_unique_constraint("uq_books_user_title", "books", ["user_id", "title"])


def downgrade() -> None:
    op.drop_constraint("uq_books_user_title", "books", type_="unique")
