import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models.enums import CostBasis, DrivingParamType
from app.models.sa_enums import cost_basis_enum, driving_param_enum


class MaterialMaster(Base):
    __tablename__ = "material_masters"
    __table_args__ = (Index("ix_material_workshop_deleted", "workshop_id", "deleted_at"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workshop_id: Mapped[str] = mapped_column(ForeignKey("workshops.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    density_gcm3: Mapped[float] = mapped_column(Float, nullable=False)
    default_rate_per_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    workshop = relationship("Workshop", back_populates="materials")


class ShapeMaster(Base):
    __tablename__ = "shape_masters"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    formula_key: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    required_fields: Mapped[list] = mapped_column(JSONB, nullable=False)
    dimension_labels: Mapped[dict] = mapped_column(JSONB, nullable=False)


class OperationMaster(Base):
    __tablename__ = "operation_masters"
    __table_args__ = (Index("ix_operation_workshop_deleted", "workshop_id", "deleted_at"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workshop_id: Mapped[str] = mapped_column(ForeignKey("workshops.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    machine: Mapped[str] = mapped_column(String, nullable=False)
    machine_other: Mapped[str | None] = mapped_column(String, nullable=True)
    driving_param_type: Mapped[DrivingParamType] = mapped_column(driving_param_enum, nullable=False)
    custom_unit_label: Mapped[str | None] = mapped_column(String, nullable=True)
    rate_per_unit: Mapped[float] = mapped_column(Float, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    workshop = relationship("Workshop", back_populates="operations")


class AppSettings(Base):
    __tablename__ = "app_settings"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workshop_id: Mapped[str] = mapped_column(
        ForeignKey("workshops.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    default_plating_rate_per_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    default_packing_basis: Mapped[CostBasis | None] = mapped_column(cost_basis_enum, nullable=True)
    default_packing_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    default_transport_basis: Mapped[CostBasis | None] = mapped_column(cost_basis_enum, nullable=True)
    default_transport_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    workshop = relationship("Workshop", back_populates="settings")
