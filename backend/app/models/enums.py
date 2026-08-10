import enum


class DrivingParamType(str, enum.Enum):
    length = "length"
    diameter = "diameter"
    depth = "depth"
    area = "area"
    passes = "passes"
    count = "count"
    custom = "custom"


class JobStatus(str, enum.Enum):
    draft = "draft"
    finalized = "finalized"


class CostBasis(str, enum.Enum):
    flat = "flat"
    per_kg = "per_kg"
