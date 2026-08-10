from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_user
from app.models.masters import AppSettings
from app.models.user import User
from app.schemas.masters import AppSettingsResponse, AppSettingsUpdate

router = APIRouter()


@router.get("", response_model=AppSettingsResponse)
def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AppSettings:
    settings = (
        db.query(AppSettings)
        .filter(AppSettings.workshop_id == current_user.workshop_id)
        .first()
    )
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    return settings


@router.patch("", response_model=AppSettingsResponse)
def update_settings(
    body: AppSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AppSettings:
    settings = (
        db.query(AppSettings)
        .filter(AppSettings.workshop_id == current_user.workshop_id)
        .first()
    )
    if not settings:
        settings = AppSettings(workshop_id=current_user.workshop_id)
        db.add(settings)

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)

    db.commit()
    db.refresh(settings)
    return settings
