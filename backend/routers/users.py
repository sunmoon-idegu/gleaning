import os
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from auth import verify_token, verify_token_any
from database import get_db
from models import User
from schemas import PreferencesOut, PreferencesUpdate

router = APIRouter(prefix="/users", tags=["users"])

DELETION_GRACE_DAYS = 30


@router.get("/me/preferences", response_model=PreferencesOut)
def get_preferences(current_user: User = Depends(verify_token)):
    prefs = current_user.preferences or {}
    return PreferencesOut(**prefs)


@router.patch("/me/preferences", response_model=PreferencesOut)
def update_preferences(
    body: PreferencesUpdate,
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db),
):
    existing = current_user.preferences or {}
    patch = body.model_dump(exclude_none=True)
    updated = {**existing, **patch}
    current_user.preferences = updated
    db.commit()
    db.refresh(current_user)
    return PreferencesOut(**updated)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db),
):
    current_user.deleted_at = datetime.now(timezone.utc)
    db.commit()


@router.post("/me/recover", status_code=status.HTTP_200_OK)
def recover_account(
    current_user: User = Depends(verify_token_any),
    db: Session = Depends(get_db),
):
    """Cancel a pending deletion. Only works within the grace period."""
    if current_user.deleted_at is None:
        return {"ok": True}

    deadline = current_user.deleted_at + timedelta(days=DELETION_GRACE_DAYS)
    if datetime.now(timezone.utc) > deadline:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Grace period has passed. Account cannot be recovered.",
        )

    current_user.deleted_at = None
    db.commit()
    return {"ok": True}


@router.post("/purge-deleted", status_code=status.HTTP_200_OK)
def purge_deleted_accounts(
    x_purge_secret: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    """
    Hard-deletes accounts past their 30-day grace period.
    Called by a daily Render cron job — pass PURGE_SECRET in X-Purge-Secret header.
    """
    expected = os.environ.get("PURGE_SECRET", "")
    if not expected or x_purge_secret != expected:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid secret.")

    cutoff = datetime.now(timezone.utc) - timedelta(days=DELETION_GRACE_DAYS)
    expired = db.query(User).filter(
        User.deleted_at.isnot(None),
        User.deleted_at < cutoff,
    ).all()

    count = len(expired)
    for user in expired:
        db.delete(user)
    db.commit()
    return {"purged": count}
