"""
routers/data_sources.py

Returns metadata about ingested data sources.
Powes the Settings → Data Sources tab freshness display.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from database import get_db
from models import DataSource

router = APIRouter(prefix="/data-sources", tags=["data-sources"])


class DataSourceResponse(BaseModel):
    id:           int
    name:         str
    organization: Optional[str] = None
    url:          Optional[str] = None
    vintage:      Optional[str] = None
    is_historical: bool
    notes:        Optional[str] = None
    retrieved_at: Optional[str] = None

    class Config:
        from_attributes = True

    def model_post_init(self, __context):
        if self.retrieved_at and hasattr(self.retrieved_at, 'isoformat'):
            object.__setattr__(self, 'retrieved_at', self.retrieved_at.isoformat())


@router.get("/", response_model=List[dict])
def get_data_sources(db: Session = Depends(get_db)):
    """Returns all ingested data sources with freshness metadata."""
    sources = db.query(DataSource).order_by(DataSource.is_historical.asc(), DataSource.id.asc()).all()
    return [
        {
            "id":           s.id,
            "name":         s.name,
            "organization": s.organization,
            "url":          s.url,
            "vintage":      s.vintage,
            "is_historical": s.is_historical,
            "notes":        s.notes,
            "retrieved_at": s.retrieved_at.isoformat() if s.retrieved_at else None,
        }
        for s in sources
    ]
