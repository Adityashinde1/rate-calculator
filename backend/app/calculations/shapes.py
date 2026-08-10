from __future__ import annotations

import math
from typing import TypedDict

from app.calculations.rounding import round_area

ShapeFormulaKey = str
ShapeDimensions = dict[str, float]


class ShapeValidationError(ValueError):
    pass


class ShapeDefinition(TypedDict):
    name: str
    required_fields: list[str]
    dimension_labels: dict[str, str]


def _require_positive(value: float | None, label: str) -> None:
    if value is None or not math.isfinite(value) or value <= 0:
        raise ShapeValidationError(f"{label} must be a positive number")


def calculate_cross_section_area(formula_key: ShapeFormulaKey, dimensions: ShapeDimensions) -> float:
    if formula_key == "round_solid":
        d = dimensions.get("diameter")
        _require_positive(d, "Diameter")
        return round_area((math.pi / 4) * d * d)

    if formula_key == "square_solid":
        s = dimensions.get("side")
        _require_positive(s, "Side")
        return round_area(s * s)

    if formula_key == "hex_solid":
        s = dimensions.get("side")
        _require_positive(s, "Hex side length")
        return round_area((3 * math.sqrt(3) / 2) * s * s)

    if formula_key == "round_pipe":
        od = dimensions.get("outerDiameter")
        id_ = dimensions.get("innerDiameter")
        _require_positive(od, "Outer diameter")
        _require_positive(id_, "Inner diameter")
        if od <= id_:
            raise ShapeValidationError("Outer diameter must be greater than inner diameter")
        return round_area((math.pi / 4) * (od * od - id_ * id_))

    if formula_key == "flat_rect":
        w = dimensions.get("width")
        t = dimensions.get("thickness")
        _require_positive(w, "Width")
        _require_positive(t, "Thickness")
        return round_area(w * t)

    if formula_key == "square_rect_tube":
        outer_w = dimensions.get("outerWidth")
        outer_h = dimensions.get("outerHeight")
        wall = dimensions.get("wallThickness")
        _require_positive(outer_w, "Outer width")
        _require_positive(outer_h, "Outer height")
        _require_positive(wall, "Wall thickness")
        inner_w = outer_w - 2 * wall
        inner_h = outer_h - 2 * wall
        if inner_w <= 0 or inner_h <= 0:
            raise ShapeValidationError(
                "Wall thickness is too large for the given outer dimensions"
            )
        return round_area(outer_w * outer_h - inner_w * inner_h)

    if formula_key == "angle_l":
        a = dimensions.get("legA")
        b = dimensions.get("legB")
        t = dimensions.get("thickness")
        _require_positive(a, "Leg A")
        _require_positive(b, "Leg B")
        _require_positive(t, "Thickness")
        if b < t:
            raise ShapeValidationError("Leg B must be greater than or equal to thickness")
        return round_area(a * t + (b - t) * t)

    if formula_key in {"i_beam", "channel_c"}:
        h = dimensions.get("totalHeight")
        flange_w = dimensions.get("flangeWidth")
        flange_t = dimensions.get("flangeThickness")
        web_t = dimensions.get("webThickness")
        _require_positive(h, "Total height")
        _require_positive(flange_w, "Flange width")
        _require_positive(flange_t, "Flange thickness")
        _require_positive(web_t, "Web thickness")
        if h <= 2 * flange_t:
            raise ShapeValidationError(
                "Total height must be greater than twice the flange thickness"
            )
        if web_t > flange_w:
            raise ShapeValidationError(
                "Web thickness cannot be greater than flange width"
            )
        return round_area(2 * flange_w * flange_t + (h - 2 * flange_t) * web_t)

    if formula_key == "t_section":
        h = dimensions.get("totalHeight")
        flange_w = dimensions.get("flangeWidth")
        flange_t = dimensions.get("flangeThickness")
        web_t = dimensions.get("webThickness")
        _require_positive(h, "Total height")
        _require_positive(flange_w, "Flange width")
        _require_positive(flange_t, "Flange thickness")
        _require_positive(web_t, "Web thickness")
        if h <= flange_t:
            raise ShapeValidationError(
                "Total height must be greater than flange thickness"
            )
        if web_t > flange_w:
            raise ShapeValidationError(
                "Web thickness cannot be greater than flange width"
            )
        return round_area(flange_w * flange_t + (h - flange_t) * web_t)

    if formula_key == "triangle_solid":
        base = dimensions.get("base")
        height = dimensions.get("height")
        _require_positive(base, "Triangle base")
        _require_positive(height, "Triangle height")
        return round_area(base * height / 2)

    if formula_key == "hex_hollow":
        outer_side = dimensions.get("outerSide")
        inner_side = dimensions.get("innerSide")
        _require_positive(outer_side, "Outer hex side length")
        _require_positive(inner_side, "Inner hex side length")
        if outer_side <= inner_side:
            raise ShapeValidationError(
                "Outer hex side length must be greater than inner side length"
            )
        factor = 3 * math.sqrt(3) / 2
        return round_area(factor * (outer_side * outer_side - inner_side * inner_side))

    if formula_key == "round_tube_wall":
        outer_diameter = dimensions.get("outerDiameter")
        wall = dimensions.get("wallThickness")
        _require_positive(outer_diameter, "Outer diameter")
        _require_positive(wall, "Wall thickness")
        inner_diameter = outer_diameter - 2 * wall
        if inner_diameter <= 0:
            raise ShapeValidationError(
                "Wall thickness is too large for the outer diameter"
            )
        return round_area(
            (math.pi / 4)
            * (outer_diameter * outer_diameter - inner_diameter * inner_diameter)
        )

    if formula_key == "ellipse_solid":
        major = dimensions.get("majorDiameter")
        minor = dimensions.get("minorDiameter")
        _require_positive(major, "Major diameter")
        _require_positive(minor, "Minor diameter")
        return round_area((math.pi / 4) * major * minor)

    if formula_key == "ellipse_tube":
        outer_major = dimensions.get("outerMajorDiameter")
        outer_minor = dimensions.get("outerMinorDiameter")
        inner_major = dimensions.get("innerMajorDiameter")
        inner_minor = dimensions.get("innerMinorDiameter")
        _require_positive(outer_major, "Outer major diameter")
        _require_positive(outer_minor, "Outer minor diameter")
        _require_positive(inner_major, "Inner major diameter")
        _require_positive(inner_minor, "Inner minor diameter")
        if outer_major <= inner_major or outer_minor <= inner_minor:
            raise ShapeValidationError(
                "Both outer ellipse diameters must be greater than the inner diameters"
            )
        return round_area(
            (math.pi / 4)
            * (outer_major * outer_minor - inner_major * inner_minor)
        )

    if formula_key == "custom_area":
        area = dimensions.get("crossSectionArea")
        _require_positive(area, "Cross-section area")
        return round_area(area)

    raise ShapeValidationError(f"Unknown shape formula key: {formula_key}")


SHAPE_DEFINITIONS: dict[str, ShapeDefinition] = {
    "round_solid": {
        "name": "Round solid bar",
        "required_fields": ["diameter"],
        "dimension_labels": {"diameter": "Diameter (mm)"},
    },
    "square_solid": {
        "name": "Square solid bar",
        "required_fields": ["side"],
        "dimension_labels": {"side": "Side (mm)"},
    },
    "hex_solid": {
        "name": "Hexagonal bar",
        "required_fields": ["side"],
        "dimension_labels": {"side": "Hex side length (mm)"},
    },
    "round_pipe": {
        "name": "Round pipe / tube",
        "required_fields": ["outerDiameter", "innerDiameter"],
        "dimension_labels": {
            "outerDiameter": "Outer diameter (mm)",
            "innerDiameter": "Inner diameter (mm)",
        },
    },
    "flat_rect": {
        "name": "Flat / rectangular bar",
        "required_fields": ["width", "thickness"],
        "dimension_labels": {"width": "Width (mm)", "thickness": "Thickness (mm)"},
    },
    "square_rect_tube": {
        "name": "Square / rectangular tube",
        "required_fields": ["outerWidth", "outerHeight", "wallThickness"],
        "dimension_labels": {
            "outerWidth": "Outer width (mm)",
            "outerHeight": "Outer height (mm)",
            "wallThickness": "Wall thickness (mm)",
        },
    },
    "angle_l": {
        "name": "Angle (L-section)",
        "required_fields": ["legA", "legB", "thickness"],
        "dimension_labels": {
            "legA": "Leg A (mm)",
            "legB": "Leg B (mm)",
            "thickness": "Thickness (mm)",
        },
    },
    "i_beam": {
        "name": "I / H beam (simplified)",
        "required_fields": [
            "totalHeight",
            "flangeWidth",
            "flangeThickness",
            "webThickness",
        ],
        "dimension_labels": {
            "totalHeight": "Total height (mm)",
            "flangeWidth": "Flange width (mm)",
            "flangeThickness": "Flange thickness (mm)",
            "webThickness": "Web thickness (mm)",
        },
    },
    "channel_c": {
        "name": "Channel (C / U-section, simplified)",
        "required_fields": [
            "totalHeight",
            "flangeWidth",
            "flangeThickness",
            "webThickness",
        ],
        "dimension_labels": {
            "totalHeight": "Total height (mm)",
            "flangeWidth": "Flange width (mm)",
            "flangeThickness": "Flange thickness (mm)",
            "webThickness": "Web thickness (mm)",
        },
    },
    "t_section": {
        "name": "T-section (simplified)",
        "required_fields": [
            "totalHeight",
            "flangeWidth",
            "flangeThickness",
            "webThickness",
        ],
        "dimension_labels": {
            "totalHeight": "Total height (mm)",
            "flangeWidth": "Flange width (mm)",
            "flangeThickness": "Flange thickness (mm)",
            "webThickness": "Web thickness (mm)",
        },
    },
    "triangle_solid": {
        "name": "Solid triangular bar",
        "required_fields": ["base", "height"],
        "dimension_labels": {
            "base": "Triangle base (mm)",
            "height": "Triangle height (mm)",
        },
    },
    "hex_hollow": {
        "name": "Hollow hexagonal bar",
        "required_fields": ["outerSide", "innerSide"],
        "dimension_labels": {
            "outerSide": "Outer hex side length (mm)",
            "innerSide": "Inner hex side length (mm)",
        },
    },
    "round_tube_wall": {
        "name": "Round tube (OD + wall thickness)",
        "required_fields": ["outerDiameter", "wallThickness"],
        "dimension_labels": {
            "outerDiameter": "Outer diameter (mm)",
            "wallThickness": "Wall thickness (mm)",
        },
    },
    "ellipse_solid": {
        "name": "Solid elliptical bar",
        "required_fields": ["majorDiameter", "minorDiameter"],
        "dimension_labels": {
            "majorDiameter": "Major diameter (mm)",
            "minorDiameter": "Minor diameter (mm)",
        },
    },
    "ellipse_tube": {
        "name": "Elliptical tube",
        "required_fields": [
            "outerMajorDiameter",
            "outerMinorDiameter",
            "innerMajorDiameter",
            "innerMinorDiameter",
        ],
        "dimension_labels": {
            "outerMajorDiameter": "Outer major diameter (mm)",
            "outerMinorDiameter": "Outer minor diameter (mm)",
            "innerMajorDiameter": "Inner major diameter (mm)",
            "innerMinorDiameter": "Inner minor diameter (mm)",
        },
    },
    "custom_area": {
        "name": "Custom / manufacturer section area",
        "required_fields": ["crossSectionArea"],
        "dimension_labels": {
            "crossSectionArea": "Cross-section area (mm²)",
        },
    },
}
