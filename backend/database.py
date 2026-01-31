import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# SECURITY: The app will now fail if DATABASE_URL is not provided (e.g. via Railway).
# We do not fallback to a hardcoded string anymore.
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Optional: fallback ONLY for local Docker if needed, but safer to rely on .env
    # We allow this specific string because it matches the docker-compose default
    DATABASE_URL = "postgresql://user:password@db:5432/cr_tracker"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()