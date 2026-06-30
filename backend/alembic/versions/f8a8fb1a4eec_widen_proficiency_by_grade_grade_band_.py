"""widen proficiency_by_grade.grade_band to varchar(20)

Revision ID: f8a8fb1a4eec
Revises: ee4130346388
Create Date: 2026-06-30 16:20:19.610015

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f8a8fb1a4eec'
down_revision: Union[str, Sequence[str], None] = 'ee4130346388'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("proficiency_by_grade", "grade_band",
                    type_=sa.String(20), existing_type=sa.String(10))


def downgrade() -> None:
    op.alter_column("proficiency_by_grade", "grade_band",
                    type_=sa.String(10), existing_type=sa.String(20))
