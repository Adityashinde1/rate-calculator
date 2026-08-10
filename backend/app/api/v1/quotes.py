from fastapi import APIRouter, Depends, HTTPException

from app.calculations import ShapeValidationError, calculate_quote
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.jobs import QuoteCalculateRequest, QuoteCalculateResponse

router = APIRouter()


@router.post("/calculate", response_model=QuoteCalculateResponse)
def calculate(
    body: QuoteCalculateRequest,
    _: User = Depends(get_current_user),
) -> QuoteCalculateResponse:
    try:
        result = calculate_quote(
            {
                "material_density": body.material_density,
                "material_rate_per_kg": body.material_rate_per_kg,
                "raw_formula_key": body.raw_formula_key,
                "raw_dimensions": body.raw_dimensions,
                "raw_length": body.raw_length,
                "finished_formula_key": body.finished_formula_key,
                "finished_dimensions": body.finished_dimensions,
                "finished_length": body.finished_length,
                "operations": [
                    {
                        "operation_name": op.operation_name,
                        "machine": op.machine,
                        "driving_param_type": op.driving_param_type.value,
                        "custom_unit_label": op.custom_unit_label,
                        "rate_per_unit": op.rate_per_unit,
                        "param_value": op.param_value,
                    }
                    for op in body.operations
                ],
                "plating_enabled": body.plating_enabled,
                "plating_rate_per_kg": body.plating_rate_per_kg,
                "packing_basis": body.packing_basis.value,
                "packing_value": body.packing_value,
                "transport_basis": body.transport_basis.value,
                "transport_value": body.transport_value,
                "margin_percent": body.margin_percent,
            }
        )
    except (ShapeValidationError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return QuoteCalculateResponse(**result)
