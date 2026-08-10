from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import CostBasis, DrivingParamType, JobStatus


class OperationLineInput(BaseModel):
    operation_id: str | None = None
    operation_name: str = Field(min_length=1)
    machine: str = Field(min_length=1)
    driving_param_type: DrivingParamType
    custom_unit_label: str | None = None
    rate_per_unit: float = Field(ge=0)
    param_value: float = Field(ge=0)


class QuoteCalculateRequest(BaseModel):
    material_density: float = Field(gt=0)
    material_rate_per_kg: float = Field(ge=0)
    raw_formula_key: str
    raw_dimensions: dict[str, float]
    raw_length: float = Field(gt=0)
    finished_formula_key: str
    finished_dimensions: dict[str, float]
    finished_length: float = Field(gt=0)
    operations: list[OperationLineInput] = []
    plating_enabled: bool = False
    plating_rate_per_kg: float | None = Field(default=None, ge=0)
    packing_basis: CostBasis
    packing_value: float = Field(ge=0)
    transport_basis: CostBasis
    transport_value: float = Field(ge=0)
    margin_percent: float = Field(ge=0)


class OperationCostResponse(BaseModel):
    operation_name: str
    machine: str
    driving_param_type: str
    custom_unit_label: str | None = None
    rate_per_unit: float
    param_value: float
    cost: float


class QuoteCalculateResponse(BaseModel):
    raw: dict[str, float]
    finished: dict[str, float]
    operations: list[OperationCostResponse]
    total_labour_cost: float
    plating_cost: float
    packing_cost: float
    transport_cost: float
    running_total: float
    final_rate: float


class JobCreateRequest(BaseModel):
    component_name: str = Field(min_length=1)
    customer_ref: str | None = None
    status: JobStatus = JobStatus.draft

    material_id: str | None = None
    material_name: str
    material_density: float = Field(gt=0)
    material_rate_per_kg: float = Field(ge=0)

    raw_shape_id: str
    raw_shape_name: str
    raw_formula_key: str
    raw_dimensions: dict[str, float]
    raw_length: float = Field(gt=0)

    finished_shape_id: str
    finished_shape_name: str
    finished_formula_key: str
    finished_dimensions: dict[str, float]
    finished_length: float = Field(gt=0)

    operations: list[OperationLineInput] = []

    plating_enabled: bool = False
    plating_rate_per_kg: float | None = Field(default=None, ge=0)

    packing_basis: CostBasis
    packing_value: float = Field(ge=0)
    transport_basis: CostBasis
    transport_value: float = Field(ge=0)
    margin_percent: float = Field(ge=0)

    client_final_rate: float = Field(ge=0)


class JobOperationResponse(BaseModel):
    id: str
    sort_order: int
    operation_id: str | None
    operation_name: str
    machine: str
    driving_param_type: DrivingParamType
    custom_unit_label: str | None
    rate_per_unit: float
    param_value: float
    cost: float

    model_config = {"from_attributes": True}


class JobListItem(BaseModel):
    id: str
    component_name: str
    customer_ref: str | None
    material_name: str
    status: JobStatus
    final_rate: float
    created_at: datetime

    model_config = {"from_attributes": True}


class JobResponse(BaseModel):
    id: str
    status: JobStatus
    component_name: str
    customer_ref: str | None
    material_id: str | None
    material_name: str
    material_density: float
    material_rate_per_kg: float
    raw_shape_id: str
    raw_shape_name: str
    raw_dimensions: dict
    raw_length: float
    raw_cross_section_area: float
    raw_weight: float
    raw_material_cost: float
    finished_shape_id: str
    finished_shape_name: str
    finished_dimensions: dict
    finished_length: float
    finished_cross_section_area: float
    finished_weight: float
    plating_enabled: bool
    plating_rate_per_kg: float | None
    plating_cost: float
    packing_basis: CostBasis
    packing_value: float
    packing_cost: float
    transport_basis: CostBasis
    transport_value: float
    transport_cost: float
    total_labour_cost: float
    margin_percent: float
    running_total: float
    final_rate: float
    created_at: datetime
    updated_at: datetime
    operations: list[JobOperationResponse]

    model_config = {"from_attributes": True}
