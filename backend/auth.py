import base64
import os
from typing import Optional

import httpx
import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from database import get_db
from models import User

load_dotenv()

bearer_scheme = HTTPBearer()

_jwks_cache: Optional[dict] = None
_jwks_fetched_at: float = 0.0
_JWKS_TTL = 3600  # refresh every hour


def _clerk_issuer() -> str:
    pk = os.environ["CLERK_PUBLISHABLE_KEY"]
    suffix = pk.split("_", 2)[-1]
    padding = (4 - len(suffix) % 4) % 4
    domain = base64.b64decode(suffix + "=" * padding).decode().rstrip("$")
    return f"https://{domain}"


def _fetch_jwks() -> dict:
    url = f"{_clerk_issuer()}/.well-known/jwks.json"
    resp = httpx.get(url, timeout=10)
    resp.raise_for_status()
    return resp.json()


def _get_jwks(force_refresh: bool = False) -> dict:
    global _jwks_cache, _jwks_fetched_at
    import time
    if force_refresh or _jwks_cache is None or (time.time() - _jwks_fetched_at) > _JWKS_TTL:
        _jwks_cache = _fetch_jwks()
        _jwks_fetched_at = time.time()
    return _jwks_cache


def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = None
    for force_refresh in (False, True):
        try:
            jwks = _get_jwks(force_refresh=force_refresh)
            header = jwt.get_unverified_header(token)
            kid = header.get("kid")
            key_data = next((k for k in jwks["keys"] if k["kid"] == kid), None)
            if key_data is None:
                if not force_refresh:
                    continue  # key not found — retry with fresh JWKS
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unknown signing key")
            signing_key = jwt.algorithms.RSAAlgorithm.from_jwk(key_data)
            payload = jwt.decode(
                token,
                signing_key,
                algorithms=["RS256"],
                options={"verify_aud": False},
            )
            break
        except HTTPException:
            raise
        except Exception as e:
            if not force_refresh:
                continue  # try once more with fresh JWKS
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            ) from e
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    clerk_id: str = payload["sub"]

    user = db.query(User).filter(User.clerk_id == clerk_id).first()
    if user is None:
        email = payload.get("email", "")
        user = User(clerk_id=clerk_id, email=email)
        db.add(user)
        db.commit()
        db.refresh(user)

    return user
