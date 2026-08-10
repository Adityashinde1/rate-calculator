from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_user
from app.models.masters import OperationMaster
from app.models.user import User
from app.schemas.masters import OperationCreate, OperationResponse, OperationUpdate

router = APIRouter()


@router.get("", response_model=list[OperationResponse])
def list_operations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[OperationMaster]:
    return (
        db.query(OperationMaster)
        .filter(
            OperationMaster.workshop_id == current_user.workshop_id,
            OperationMaster.deleted_at.is_(None),
        )
        .order_by(OperationMaster.name.asc())
        .all()
    )


@router.post("", response_model=OperationResponse, status_code=status.HTTP_201_CREATED)
def create_operation(
    body: OperationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OperationMaster:
    operation = OperationMaster(
        workshop_id=current_user.workshop_id,
        name=body.name,
        machine=body.machine,
        machine_other=body.machine_other,
        driving_param_type=body.driving_param_type,
        custom_unit_label=body.custom_unit_label,
        rate_per_unit=body.rate_per_unit,
    )
    db.add(operation)
    db.commit()
    db.refresh(operation)
    return operation


@router.patch("/{operation_id}", response_model=OperationResponse)
def update_operation(
    operation_id: str,
    body: OperationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OperationMaster:
    operation = (
        db.query(OperationMaster)
        .filter(
            OperationMaster.id == operation_id,
            OperationMaster.workshop_id == current_user.workshop_id,
            OperationMaster.deleted_at.is_(None),
        )
        .first()
    )
    if not operation:
        raise HTTPException(status_code=404, detail="Operation not found")
    operation.name = body.name
    operation.machine = body.machine
    operation.machine_other = body.machine_other
    operation.driving_param_type = body.driving_param_type
    operation.custom_unit_label = body.custom_unit_label
    operation.rate_per_unit = body.rate_per_unit
    db.commit()
    db.refresh(operation)
    return operation


@router.delete("/{operation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_operation(
    operation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    operation = (
        db.query(OperationMaster)
        .filter(
            OperationMaster.id == operation_id,
            OperationMaster.workshop_id == current_user.workshop_id,
            OperationMaster.deleted_at.is_(None),
        )
        .first()
    )
    if not operation:
        raise HTTPException(status_code=404, detail="Operation not found")
    operation.deleted_at = datetime.now(timezone.utc)
    db.commit()
