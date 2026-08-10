from __future__ import annotations

import math
from typing import TypedDict

from app.calculations.labour import (
    OperationCostResult,
    OperationInput,
    calculate_operation_cost,
    calculate_total_labour_cost,
)
from app.calculations.rounding import round_final_rate, round_money
from app.calculations.shapes import ShapeDimensions, ShapeFormulaKey
from app.calculations.weight import calculate_material_cost, calculate_weight


class QuoteInput(TypedDict):
    material_density: float
    material_rate_per_kg: float
    raw_formula_key: ShapeFormulaKey
    raw_dimensions: ShapeDimensions
    raw_length: float
    finished_formula_key: ShapeFormulaKey
    finished_dimensions: ShapeDimensions
    finished_length: float
    operations: list[OperationInput]
    plating_enabled: bool
    plating_rate_per_kg: float | None
    packing_basis: str
    packing_value: float
    transport_basis: str
    transport_value: float
    margin_percent: float


class QuoteResult(TypedDict):
    raw: dict[str, float]
    finished: dict[str, float]
    operations: list[OperationCostResult]
    total_labour_cost: float
    plating_cost: float
    packing_cost: float
    transport_cost: float
    running_total: float
    final_rate: float


def _calculate_basis_cost(basis: str, value: float, finished_weight_kg: float) -> float:
    if not math.isfinite(value) or value < 0:
        raise ValueError("Cost value must be a non-negative number")
    if basis == "flat":
        return round_money(value)
    return round_money(value * finished_weight_kg)


def calculate_quote(input_data: QuoteInput) -> QuoteResult:
    raw_weight = calculate_weight(
        input_data["raw_formula_key"],
        input_data["raw_dimensions"],
        input_data["raw_length"],
        input_data["material_density"],
    )
    raw_material_cost = calculate_material_cost(
        raw_weight["weight_kg"],
        input_data["material_rate_per_kg"],
    )

    finished_weight = calculate_weight(
        input_data["finished_formula_key"],
        input_data["finished_dimensions"],
        input_data["finished_length"],
        input_data["material_density"],
    )

    operations = [calculate_operation_cost(op) for op in input_data["operations"]]
    total_labour_cost = calculate_total_labour_cost(input_data["operations"])

    plating_cost = 0.0
    if input_data["plating_enabled"]:
        rate = input_data.get("plating_rate_per_kg") or 0
        if not math.isfinite(rate) or rate < 0:
            raise ValueError("Plating rate must be a non-negative number")
        plating_cost = round_money(finished_weight["weight_kg"] * rate)

    packing_cost = _calculate_basis_cost(
        input_data["packing_basis"],
        input_data["packing_value"],
        finished_weight["weight_kg"],
    )
    transport_cost = _calculate_basis_cost(
        input_data["transport_basis"],
        input_data["transport_value"],
        finished_weight["weight_kg"],
    )

    # Cost base before extras (used for display)
    running_total = round_money(
        raw_material_cost
        + total_labour_cost
        + plating_cost
        + packing_cost
        + transport_cost
    )

    margin = input_data["margin_percent"]
    if not math.isfinite(margin) or margin < 0:
        raise ValueError("Margin percent must be a non-negative number")

    # Margin applies only to material + labour; plating, packing, transport are pass-through
    margin_base = round_money(raw_material_cost + total_labour_cost)
    final_rate = round_final_rate(
        margin_base * (1 + margin / 100) + plating_cost + packing_cost + transport_cost
    )

    return {
        "raw": {
            "cross_section_area": raw_weight["cross_section_area"],
            "weight_kg": raw_weight["weight_kg"],
            "material_cost": raw_material_cost,
        },
        "finished": {
            "cross_section_area": finished_weight["cross_section_area"],
            "weight_kg": finished_weight["weight_kg"],
        },
        "operations": operations,
        "total_labour_cost": total_labour_cost,
        "plating_cost": plating_cost,
        "packing_cost": packing_cost,
        "transport_cost": transport_cost,
        "running_total": running_total,
        "final_rate": final_rate,
    }
