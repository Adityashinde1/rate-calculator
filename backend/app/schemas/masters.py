from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import CostBasis, DrivingParamType


class MaterialCreate(BaseModel):
    name: str = Field(min_length=1)
    density_gcm3: float = Field(gt=0)
    default_rate_per_kg: float | None = Field(default=None, ge=0)


class MaterialUpdate(MaterialCreate):
    pass


class MaterialResponse(BaseModel):
    id: str
    name: str
    density_gcm3: float
    default_rate_per_kg: float | None

    model_config = {"from_attributes": True}


class ShapeResponse(BaseModel):
    id: str
    name: str
    formula_key: str
    required_fields: list[str]
    dimension_labels: dict[str, str]

    model_config = {"from_attributes": True}


class OperationCreate(BaseModel):
    name: str = Field(min_length=1)
    machine: str = Field(min_length=1)
    machine_other: str | None = None
    driving_param_type: DrivingParamType
    custom_unit_label: str | None = None
    rate_per_unit: float = Field(ge=0)


class OperationUpdate(OperationCreate):
    pass


class OperationResponse(BaseModel):
    id: str
    name: str
    machine: str
    machine_other: str | None
    driving_param_type: DrivingParamType
    custom_unit_label: str | None
    rate_per_unit: float

    model_config = {"from_attributes": True}


class AppSettingsUpdate(BaseModel):
    default_plating_rate_per_kg: float | None = Field(default=None, ge=0)
    default_packing_basis: CostBasis | None = None
    default_packing_value: float | None = Field(default=None, ge=0)
    default_transport_basis: CostBasis | None = None
    default_transport_value: float | None = Field(default=None, ge=0)


class AppSettingsResponse(BaseModel):
    id: str
    workshop_id: str
    default_plating_rate_per_kg: float | None
    default_packing_basis: CostBasis | None
    default_packing_value: float | None
    default_transport_basis: CostBasis | None
    default_transport_value: float | None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
