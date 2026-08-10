from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_user
from app.models.masters import MaterialMaster
from app.models.user import User
from app.schemas.masters import MaterialCreate, MaterialResponse, MaterialUpdate

router = APIRouter()


@router.get("", response_model=list[MaterialResponse])
def list_materials(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[MaterialMaster]:
    return (
        db.query(MaterialMaster)
        .filter(
            MaterialMaster.workshop_id == current_user.workshop_id,
            MaterialMaster.deleted_at.is_(None),
        )
        .order_by(MaterialMaster.name.asc())
        .all()
    )


@router.post("", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
def create_material(
    body: MaterialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MaterialMaster:
    material = MaterialMaster(
        workshop_id=current_user.workshop_id,
        name=body.name,
        density_gcm3=body.density_gcm3,
        default_rate_per_kg=body.default_rate_per_kg,
    )
    db.add(material)
    db.commit()
    db.refresh(material)
    return material


@router.patch("/{material_id}", response_model=MaterialResponse)
def update_material(
    material_id: str,
    body: MaterialUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MaterialMaster:
    material = (
        db.query(MaterialMaster)
        .filter(
            MaterialMaster.id == material_id,
            MaterialMaster.workshop_id == current_user.workshop_id,
            MaterialMaster.deleted_at.is_(None),
        )
        .first()
    )
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    material.name = body.name
    material.density_gcm3 = body.density_gcm3
    material.default_rate_per_kg = body.default_rate_per_kg
    db.commit()
    db.refresh(material)
    return material


@router.delete("/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_material(
    material_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    material = (
        db.query(MaterialMaster)
        .filter(
            MaterialMaster.id == material_id,
            MaterialMaster.workshop_id == current_user.workshop_id,
            MaterialMaster.deleted_at.is_(None),
        )
        .first()
    )
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    material.deleted_at = datetime.now(timezone.utc)
    db.commit()
