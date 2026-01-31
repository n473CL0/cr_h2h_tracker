import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# RAILWAY CONFIGURATION
# 1. Tries to get the secure DATABASE_URL from Railway environment variables.
# 2. Fallback to local Docker connection string only if env var is missing.
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@db:5432/cr_tracker")

# Ensure we use the correct driver prefix for SQLAlchemy (postgres:// -> postgresql://)
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()