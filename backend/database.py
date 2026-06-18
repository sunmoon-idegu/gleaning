import logging
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from fastapi import HTTPException

load_dotenv()

logger = logging.getLogger(__name__)

engine = create_engine(
    os.environ["DATABASE_URL"],
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=5,
    max_overflow=10,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    except HTTPException:
        raise
    except Exception:
        logger.exception("Database session error")
        raise
    finally:
        db.close()


def check_db() -> dict:
    """Probe the DB and return connection pool stats."""
    pool = engine.pool
    stats = {
        "pool_size": pool.size(),
        "checked_in": pool.checkedin(),
        "checked_out": pool.checkedout(),
        "overflow": pool.overflow(),
    }
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        stats["status"] = "ok"
    except Exception as e:
        logger.error("DB health check failed: %s", e)
        stats["status"] = "error"
        stats["detail"] = str(e)
    return stats
