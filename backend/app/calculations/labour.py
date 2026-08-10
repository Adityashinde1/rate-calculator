from __future__ import annotations

import math
from typing import TypedDict

from app.calculations.rounding import round_money


class OperationInput(TypedDict, total=False):
    operation_name: str
    machine: str
    driving_param_type: str
    custom_unit_label: str | None
    rate_per_unit: float
    param_value: float


class OperationCostResult(TypedDict):
    operation_name: str
    machine: str
    driving_param_type: str
    custom_unit_label: str | None
    rate_per_unit: float
    param_value: float
    cost: float


def calculate_operation_cost(operation: OperationInput) -> OperationCostResult:
    param_value = operation["param_value"]
    rate_per_unit = operation["rate_per_unit"]
    if not math.isfinite(param_value) or param_value < 0:
        raise ValueError("Parameter value must be a non-negative number")
    if not math.isfinite(rate_per_unit) or rate_per_unit < 0:
        raise ValueError("Rate per unit must be a non-negative number")

    return {
        "operation_name": operation["operation_name"],
        "machine": operation["machine"],
        "driving_param_type": operation["driving_param_type"],
        "custom_unit_label": operation.get("custom_unit_label"),
        "rate_per_unit": rate_per_unit,
        "param_value": param_value,
        "cost": round_money(param_value * rate_per_unit),
    }


def calculate_total_labour_cost(operations: list[OperationInput]) -> float:
    return round_money(sum(calculate_operation_cost(op)["cost"] for op in operations))
