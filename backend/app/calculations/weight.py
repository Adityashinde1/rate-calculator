import math
from typing import TypedDict

from app.calculations.rounding import round_money, round_weight
from app.calculations.shapes import ShapeDimensions, ShapeFormulaKey, calculate_cross_section_area


class WeightResult(TypedDict):
    cross_section_area: float
    weight_kg: float


def calculate_weight(
    formula_key: ShapeFormulaKey,
    dimensions: ShapeDimensions,
    length_mm: float,
    density_gcm3: float,
) -> WeightResult:
    if not math.isfinite(length_mm) or length_mm <= 0:
        raise ValueError("Length must be a positive number")
    if not math.isfinite(density_gcm3) or density_gcm3 <= 0:
        raise ValueError("Density must be a positive number")

    cross_section_area = calculate_cross_section_area(formula_key, dimensions)
    weight_kg = round_weight((cross_section_area * length_mm * density_gcm3) / 1_000_000)
    return {"cross_section_area": cross_section_area, "weight_kg": weight_kg}


def calculate_material_cost(weight_kg: float, rate_per_kg: float) -> float:
    if not math.isfinite(rate_per_kg) or rate_per_kg < 0:
        raise ValueError("Rate per kg must be a non-negative number")
    return round_money(weight_kg * rate_per_kg)
