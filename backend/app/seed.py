from sqlalchemy.orm import Session

from app.calculations.shapes import SHAPE_DEFINITIONS
from app.core.config import settings
from app.core.security import hash_password
from app.models.enums import CostBasis
from app.models.masters import AppSettings, MaterialMaster, ShapeMaster
from app.models.user import User
from app.models.workshop import Workshop


def run_seed(db: Session) -> None:
    workshop = db.query(Workshop).filter(Workshop.name == "My Workshop").first()
    if not workshop:
        workshop = Workshop(id="default-workshop", name="My Workshop")
        db.add(workshop)
        db.flush()

    # Keep admin credentials in sync with ADMIN_EMAIL / ADMIN_PASSWORD from .env
    admin = (
        db.query(User)
        .filter(User.workshop_id == workshop.id, User.name == "Admin")
        .first()
    )
    if not admin:
        admin = (
            db.query(User)
            .filter(User.email.in_([settings.admin_email, "admin@workshop.local"]))
            .first()
        )
    if admin:
        admin.email = settings.admin_email
        admin.password_hash = hash_password(settings.admin_password)
        admin.name = "Admin"
        admin.workshop_id = workshop.id
    else:
        db.add(
            User(
                email=settings.admin_email,
                password_hash=hash_password(settings.admin_password),
                name="Admin",
                workshop_id=workshop.id,
            )
        )

    for formula_key, definition in SHAPE_DEFINITIONS.items():
        existing = db.query(ShapeMaster).filter(ShapeMaster.formula_key == formula_key).first()
        if existing:
            existing.name = definition["name"]
            existing.required_fields = definition["required_fields"]
            existing.dimension_labels = definition["dimension_labels"]
        else:
            db.add(
                ShapeMaster(
                    name=definition["name"],
                    formula_key=formula_key,
                    required_fields=definition["required_fields"],
                    dimension_labels=definition["dimension_labels"],
                )
            )

    # Nominal room-temperature densities in g/cm³. Rates are intentionally
    # unset for new grades because market prices must be maintained by the shop.
    materials = [
        {"name": "Mild Steel (MS)", "density_gcm3": 7.85, "default_rate_per_kg": 80},
        {"name": "Stainless Steel (SS 304/316)", "density_gcm3": 8.0, "default_rate_per_kg": 250},
        {"name": "OHNS", "density_gcm3": 7.8, "default_rate_per_kg": 150},
        {"name": "EN8 / EN9", "density_gcm3": 7.85, "default_rate_per_kg": 120},
        {"name": "Brass", "density_gcm3": 8.5, "default_rate_per_kg": 600},
        {"name": "Aluminium", "density_gcm3": 2.7, "default_rate_per_kg": 280},
        {"name": "Copper", "density_gcm3": 8.9, "default_rate_per_kg": 800},
        {"name": "Carbon Steel 1018", "density_gcm3": 7.85, "default_rate_per_kg": None},
        {"name": "Carbon Steel 1045", "density_gcm3": 7.85, "default_rate_per_kg": None},
        {"name": "EN19 / AISI 4140", "density_gcm3": 7.85, "default_rate_per_kg": None},
        {"name": "EN24 / AISI 4340", "density_gcm3": 7.85, "default_rate_per_kg": None},
        {"name": "Tool Steel D2", "density_gcm3": 7.70, "default_rate_per_kg": None},
        {"name": "Tool Steel H13", "density_gcm3": 7.80, "default_rate_per_kg": None},
        {"name": "M2 High Speed Steel (HSS)", "density_gcm3": 8.16, "default_rate_per_kg": None},
        {"name": "Stainless Steel 304", "density_gcm3": 7.90, "default_rate_per_kg": None},
        {"name": "Stainless Steel 316", "density_gcm3": 8.00, "default_rate_per_kg": None},
        {"name": "Stainless Steel 410", "density_gcm3": 7.75, "default_rate_per_kg": None},
        {"name": "Stainless Steel 430", "density_gcm3": 7.75, "default_rate_per_kg": None},
        {"name": "Stainless Steel 17-4 PH", "density_gcm3": 7.80, "default_rate_per_kg": None},
        {"name": "Duplex Stainless Steel 2205", "density_gcm3": 7.80, "default_rate_per_kg": None},
        {"name": "Grey Cast Iron", "density_gcm3": 7.15, "default_rate_per_kg": None},
        {"name": "Ductile / Nodular Cast Iron", "density_gcm3": 7.20, "default_rate_per_kg": None},
        {"name": "White Cast Iron", "density_gcm3": 7.70, "default_rate_per_kg": None},
        {"name": "Aluminium 2024", "density_gcm3": 2.78, "default_rate_per_kg": None},
        {"name": "Aluminium 6061", "density_gcm3": 2.70, "default_rate_per_kg": None},
        {"name": "Aluminium 7075", "density_gcm3": 2.81, "default_rate_per_kg": None},
        {"name": "Phosphor Bronze", "density_gcm3": 8.80, "default_rate_per_kg": None},
        {"name": "Aluminium Bronze", "density_gcm3": 7.65, "default_rate_per_kg": None},
        {"name": "Gunmetal", "density_gcm3": 8.80, "default_rate_per_kg": None},
        {"name": "Titanium Grade 2", "density_gcm3": 4.51, "default_rate_per_kg": None},
        {"name": "Titanium Grade 5 (Ti-6Al-4V)", "density_gcm3": 4.43, "default_rate_per_kg": None},
        {"name": "Nickel", "density_gcm3": 8.90, "default_rate_per_kg": None},
        {"name": "Monel 400", "density_gcm3": 8.80, "default_rate_per_kg": None},
        {"name": "Inconel 625", "density_gcm3": 8.44, "default_rate_per_kg": None},
        {"name": "Inconel 718", "density_gcm3": 8.19, "default_rate_per_kg": None},
        {"name": "Zinc", "density_gcm3": 7.14, "default_rate_per_kg": None},
        {"name": "Lead", "density_gcm3": 11.34, "default_rate_per_kg": None},
        {"name": "Magnesium", "density_gcm3": 1.74, "default_rate_per_kg": None},
    ]
    for material in materials:
        exists = (
            db.query(MaterialMaster)
            .filter(
                MaterialMaster.workshop_id == workshop.id,
                MaterialMaster.name == material["name"],
                MaterialMaster.deleted_at.is_(None),
            )
            .first()
        )
        if not exists:
            db.add(MaterialMaster(workshop_id=workshop.id, **material))

    app_settings = (
        db.query(AppSettings).filter(AppSettings.workshop_id == workshop.id).first()
    )
    if not app_settings:
        db.add(
            AppSettings(
                workshop_id=workshop.id,
                default_plating_rate_per_kg=50,
                default_packing_basis=CostBasis.per_kg,
                default_packing_value=10,
                default_transport_basis=CostBasis.flat,
                default_transport_value=200,
            )
        )

    db.commit()
 