"""
database.py

Sets up the SQLAlchemy connection to PostgreSQL.

SQLAlchemy is a Python library that lets you:
  - Define database tables as Python classes (models.py)
  - Write queries in Python instead of raw SQL
  - Manage connections automatically

How it works:
  1. engine      → the actual connection to PostgreSQL
  2. SessionLocal → a factory that creates database sessions
  3. Base        → all our table models will inherit from this
  4. get_db()    → a FastAPI dependency that opens/closes a
                   session for each API request automatically
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

# Get the database URL from .env
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres123@localhost:5432/edupulse")

# Create the engine — this is the actual PostgreSQL connection
# pool_pre_ping=True means it checks connection is alive before each query
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# SessionLocal is a class — each instance is a database session
# autocommit=False → we control when changes are saved
# autoflush=False  → we control when pending changes are sent to DB
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class — all our database models will inherit from this
Base = declarative_base()


def get_db():
    """
    FastAPI dependency — automatically manages database sessions.
    
    Usage in any route:
        @app.get("/something")
        def my_route(db: Session = Depends(get_db)):
            results = db.query(Parish).all()
            return results
    
    The 'yield' makes this a generator — FastAPI calls it,
    gets the db session, runs the route, then runs the finally
    block to close the session even if an error occurred.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
