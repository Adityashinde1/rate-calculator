from sqlalchemy import Enum

from app.models.enums import CostBasis, DrivingParamType, JobStatus

cost_basis_enum = Enum(
    CostBasis,
    name="cost_basis",
    values_callable=lambda x: [e.value for e in x],
)

driving_param_enum = Enum(
    DrivingParamType,
    name="driving_param_type",
    values_callable=lambda x: [e.value for e in x],
)

job_status_enum = Enum(
    JobStatus,
    name="job_status",
    values_callable=lambda x: [e.value for e in x],
)
