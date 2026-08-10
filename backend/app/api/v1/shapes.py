from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_user
from app.models.masters import ShapeMaster
from app.models.user import User
from app.schemas.masters import ShapeResponse

router = APIRouter()


@router.get("", response_model=list[ShapeResponse])
def list_shapes(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[ShapeMaster]:
    return db.query(ShapeMaster).order_by(ShapeMaster.name.asc()).all()
