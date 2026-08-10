from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.calculations import ShapeValidationError, amounts_match, calculate_quote
from app.core.db import get_db
from app.core.deps import get_current_user
from app.models.enums import JobStatus
from app.models.job import Job, JobOperation
from app.models.user import User
from app.schemas.jobs import JobCreateRequest, JobListItem, JobResponse

router = APIRouter()


def _quote_from_request(body: JobCreateRequest):
    return calculate_quote(
        {
            "material_density": body.material_density,
            "material_rate_per_kg": body.material_rate_per_kg,
            "raw_formula_key": body.raw_formula_key,
            "raw_dimensions": body.raw_dimensions,
            "raw_length": body.raw_length,
            "finished_formula_key": body.finished_formula_key,
            "finished_dimensions": body.finished_dimensions,
            "finished_length": body.finished_length,
            "operations": [
                {
                    "operation_name": op.operation_name,
                    "machine": op.machine,
                    "driving_param_type": op.driving_param_type.value,
                    "custom_unit_label": op.custom_unit_label,
                    "rate_per_unit": op.rate_per_unit,
                    "param_value": op.param_value,
                }
                for op in body.operations
            ],
            "plating_enabled": body.plating_enabled,
            "plating_rate_per_kg": body.plating_rate_per_kg,
            "packing_basis": body.packing_basis.value,
            "packing_value": body.packing_value,
            "transport_basis": body.transport_basis.value,
            "transport_value": body.transport_value,
            "margin_percent": body.margin_percent,
        }
    )


def _apply_quote_to_job(job: Job, body: JobCreateRequest, quote: dict, user: User) -> None:
    job.workshop_id = user.workshop_id
    job.user_id = user.id
    job.status = body.status
    job.component_name = body.component_name
    job.customer_ref = body.customer_ref
    job.material_id = body.material_id
    job.material_name = body.material_name
    job.material_density = body.material_density
    job.material_rate_per_kg = body.material_rate_per_kg
    job.raw_shape_id = body.raw_shape_id
    job.raw_shape_name = body.raw_shape_name
    job.raw_dimensions = body.raw_dimensions
    job.raw_length = body.raw_length
    job.raw_cross_section_area = quote["raw"]["cross_section_area"]
    job.raw_weight = quote["raw"]["weight_kg"]
    job.raw_material_cost = quote["raw"]["material_cost"]
    job.finished_shape_id = body.finished_shape_id
    job.finished_shape_name = body.finished_shape_name
    job.finished_dimensions = body.finished_dimensions
    job.finished_length = body.finished_length
    job.finished_cross_section_area = quote["finished"]["cross_section_area"]
    job.finished_weight = quote["finished"]["weight_kg"]
    job.plating_enabled = body.plating_enabled
    job.plating_rate_per_kg = body.plating_rate_per_kg if body.plating_enabled else None
    job.plating_cost = quote["plating_cost"]
    job.packing_basis = body.packing_basis
    job.packing_value = body.packing_value
    job.packing_cost = quote["packing_cost"]
    job.transport_basis = body.transport_basis
    job.transport_value = body.transport_value
    job.transport_cost = quote["transport_cost"]
    job.total_labour_cost = quote["total_labour_cost"]
    job.margin_percent = body.margin_percent
    job.running_total = quote["running_total"]
    job.final_rate = quote["final_rate"]


def _build_operations(job: Job, body: JobCreateRequest, quote: dict) -> list[JobOperation]:
    return [
        JobOperation(
            job_id=job.id,
            sort_order=index,
            operation_id=body.operations[index].operation_id,
            operation_name=op["operation_name"],
            machine=op["machine"],
            driving_param_type=body.operations[index].driving_param_type,
            custom_unit_label=op.get("custom_unit_label"),
            rate_per_unit=op["rate_per_unit"],
            param_value=op["param_value"],
            cost=op["cost"],
        )
        for index, op in enumerate(quote["operations"])
    ]


@router.get("", response_model=list[JobListItem])
def list_jobs(
    search: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    material: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Job]:
    query = db.query(Job).filter(Job.workshop_id == current_user.workshop_id)

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                Job.component_name.ilike(pattern),
                Job.customer_ref.ilike(pattern),
            )
        )
    if status_filter and status_filter != "all":
        query = query.filter(Job.status == status_filter)
    if material:
        query = query.filter(Job.material_name.ilike(f"%{material}%"))

    return query.order_by(Job.created_at.desc()).all()


@router.get("/{job_id}", response_model=JobResponse)
def get_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Job:
    job = (
        db.query(Job)
        .options(joinedload(Job.operations))
        .filter(Job.id == job_id, Job.workshop_id == current_user.workshop_id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    body: JobCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Job:
    try:
        quote = _quote_from_request(body)
    except (ShapeValidationError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not amounts_match(quote["final_rate"], body.client_final_rate):
        raise HTTPException(
            status_code=400,
            detail=(
                f"Quote totals mismatch. Server: ₹{quote['final_rate']}, "
                f"Client: ₹{body.client_final_rate}. Please refresh and try again."
            ),
        )

    job = Job()
    _apply_quote_to_job(job, body, quote, current_user)
    db.add(job)
    db.flush()
    job.operations = _build_operations(job, body, quote)
    db.commit()
    db.refresh(job)
    return (
        db.query(Job)
        .options(joinedload(Job.operations))
        .filter(Job.id == job.id)
        .one()
    )


@router.put("/{job_id}", response_model=JobResponse)
def update_job(
    job_id: str,
    body: JobCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Job:
    job = (
        db.query(Job)
        .options(joinedload(Job.operations))
        .filter(Job.id == job_id, Job.workshop_id == current_user.workshop_id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status == JobStatus.finalized:
        raise HTTPException(
            status_code=400,
            detail="Finalized quotes cannot be edited. Duplicate instead.",
        )
    if body.status == JobStatus.draft and job.status == JobStatus.finalized:
        raise HTTPException(
            status_code=400,
            detail="Cannot revert finalized quote to draft. Duplicate instead.",
        )

    try:
        quote = _quote_from_request(body)
    except (ShapeValidationError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not amounts_match(quote["final_rate"], body.client_final_rate):
        raise HTTPException(
            status_code=400,
            detail=(
                f"Quote totals mismatch. Server: ₹{quote['final_rate']}, "
                f"Client: ₹{body.client_final_rate}. Please refresh and try again."
            ),
        )

    job.operations.clear()
    _apply_quote_to_job(job, body, quote, current_user)
    db.flush()
    for op in _build_operations(job, body, quote):
        db.add(op)
    db.commit()
    return (
        db.query(Job)
        .options(joinedload(Job.operations))
        .filter(Job.id == job.id)
        .one()
    )


@router.post("/{job_id}/duplicate", response_model=JobResponse)
def duplicate_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Job:
    job = (
        db.query(Job)
        .options(joinedload(Job.operations))
        .filter(Job.id == job_id, Job.workshop_id == current_user.workshop_id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
