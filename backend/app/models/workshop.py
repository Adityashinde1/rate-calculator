import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class Workshop(Base):
    __tablename__ = "workshops"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    users = relationship("User", back_populates="workshop", cascade="all, delete-orphan")
    materials = relationship("MaterialMaster", back_populates="workshop", cascade="all, delete-orphan")
    operations = relationship("OperationMaster", back_populates="workshop", cascade="all, delete-orphan")
    settings = relationship("AppSettings", back_populates="workshop", uselist=False, cascade="all, delete-orphan")
    jobs = relationship("Job", back_populates="workshop", cascade="all, delete-orphan")
