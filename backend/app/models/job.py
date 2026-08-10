import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models.enums import CostBasis, DrivingParamType, JobStatus
from app.models.sa_enums import cost_basis_enum, driving_param_enum, job_status_enum


class Job(Base):
    __tablename__ = "jobs"
    __table_args__ = (
        Index("ix_job_workshop_status", "workshop_id", "status"),
        Index("ix_job_customer_ref", "customer_ref"),
        Index("ix_job_created_at", "created_at"),
        Index("ix_job_component_name", "component_name"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workshop_id: Mapped[str] = mapped_column(ForeignKey("workshops.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[JobStatus] = mapped_column(job_status_enum, nullable=False, default=JobStatus.draft)

    component_name: Mapped[str] = mapped_column(String, nullable=False)
    customer_ref: Mapped[str | None] = mapped_column(String, nullable=True)

    material_id: Mapped[str | None] = mapped_column(String, nullable=True)
    material_name: Mapped[str] = mapped_column(String, nullable=False)
    material_density: Mapped[float] = mapped_column(Float, nullable=False)
    material_rate_per_kg: Mapped[float] = mapped_column(Float, nullable=False)

    raw_shape_id: Mapped[str] = mapped_column(String, nullable=False)
    raw_shape_name: Mapped[str] = mapped_column(String, nullable=False)
    raw_dimensions: Mapped[dict] = mapped_column(JSONB, nullable=False)
    raw_length: Mapped[float] = mapped_column(Float, nullable=False)
    raw_cross_section_area: Mapped[float] = mapped_column(Float, nullable=False)
    raw_weight: Mapped[float] = mapped_column(Float, nullable=False)
    raw_material_cost: Mapped[float] = mapped_column(Float, nullable=False)

    finished_shape_id: Mapped[str] = mapped_column(String, nullable=False)
    finished_shape_name: Mapped[str] = mapped_column(String, nullable=False)
    finished_dimensions: Mapped[dict] = mapped_column(JSONB, nullable=False)
    finished_length: Mapped[float] = mapped_column(Float, nullable=False)
    finished_cross_section_area: Mapped[float] = mapped_column(Float, nullable=False)
    finished_weight: Mapped[float] = mapped_column(Float, nullable=False)

    plating_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    plating_rate_per_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    plating_cost: Mapped[float] = mapped_column(Float, nullable=False, default=0)

    packing_basis: Mapped[CostBasis] = mapped_column(cost_basis_enum, nullable=False)
    packing_value: Mapped[float] = mapped_column(Float, nullable=False)
    packing_cost: Mapped[float] = mapped_column(Float, nullable=False)

    transport_basis: Mapped[CostBasis] = mapped_column(cost_basis_enum, nullable=False)
    transport_value: Mapped[float] = mapped_column(Float, nullable=False)
    transport_cost: Mapped[float] = mapped_column(Float, nullable=False)

    total_labour_cost: Mapped[float] = mapped_column(Float, nullable=False)
    margin_percent: Mapped[float] = mapped_column(Float, nullable=False)
    running_total: Mapped[float] = mapped_column(Float, nullable=False)
    final_rate: Mapped[float] = mapped_column(Float, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    workshop = relationship("Workshop", back_populates="jobs")
    user = relationship("User", back_populates="jobs")
    operations = relationship(
        "JobOperation",
        back_populates="job",
        cascade="all, delete-orphan",
        order_by="JobOperation.sort_order",
    )


class JobOperation(Base):
    __tablename__ = "job_operations"
    __table_args__ = (Index("ix_job_operation_job_id", "job_id"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id: Mapped[str] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False)
    operation_id: Mapped[str | None] = mapped_column(String, nullable=True)
    operation_name: Mapped[str] = mapped_column(String, nullable=False)
    machine: Mapped[str] = mapped_column(String, nullable=False)
    driving_param_type: Mapped[DrivingParamType] = mapped_column(driving_param_enum, nullable=False)
    custom_unit_label: Mapped[str | None] = mapped_column(String, nullable=True)
    rate_per_unit: Mapped[float] = mapped_column(Float, nullable=False)
    param_value: Mapped[float] = mapped_column(Float, nullable=False)
    cost: Mapped[float] = mapped_column(Float, nullable=False)

    job = relationship("Job", back_populates="operations")
