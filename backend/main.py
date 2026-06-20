import logging
import os

import sentry_sdk
from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from auth import verify_token
from database import check_db, create_tables
from models import User
from routers import books, quotes, search, ocr, users, feedback

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

create_tables()

_is_prod = os.environ.get("ENV") == "production"

sentry_sdk.init(
    dsn=os.environ.get("SENTRY_DSN"),
    traces_sample_rate=0.1 if _is_prod else 1.0,
    send_default_pii=False,
)

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])
app = FastAPI(title="Gleaning API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


_raw_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000")
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(users.router)
app.include_router(feedback.router)
app.include_router(books.router)
app.include_router(quotes.router)
app.include_router(search.router)
app.include_router(ocr.router)


@app.get("/health")
def health():
    db_status = check_db()
    ok = db_status["status"] == "ok"
    return JSONResponse(
        status_code=200 if ok else 503,
        content={"status": "ok" if ok else "degraded", "db": db_status},
    )



@app.get("/me")
def me(current_user: User = Depends(verify_token)):
    return {"clerk_id": current_user.clerk_id, "email": current_user.email}
