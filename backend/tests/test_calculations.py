import math

import pytest

from app.calculations import (
    calculate_cross_section_area,
    calculate_quote,
    calculate_total_labour_cost,
    calculate_weight,
    round_final_rate,
    round_money,
)
from app.calculations.shapes import ShapeValidationError


def test_ms_round_bar_weight():
    result = calculate_weight("round_solid", {"diameter": 50}, 100, 7.85)
    assert result["cross_section_area"] == pytest.approx(1963.5, abs=0.1)
    assert result["weight_kg"] == pytest.approx(1.541, abs=0.01)


def test_round_pipe_area():
    area = calculate_cross_section_area(
        "round_pipe", {"outerDiameter": 60, "innerDiameter": 40}
    )
    expected = (math.pi / 4) * (60 * 60 - 40 * 40)
    assert area == pytest.approx(expected, abs=0.01)


def test_round_pipe_rejects_invalid():
    with pytest.raises(ShapeValidationError, match="Outer diameter must be greater"):
        calculate_cross_section_area(
            "round_pipe", {"outerDiameter": 40, "innerDiameter": 50}
        )


def test_square_rect_tube():
    area = calculate_cross_section_area(
        "square_rect_tube",
        {"outerWidth": 100, "outerHeight": 50, "wallThickness": 5},
    )
    assert area == 1400


def test_square_rect_tube_rejects_thick_wall():
    with pytest.raises(ShapeValidationError, match="Wall thickness is too large"):
        calculate_cross_section_area(
            "square_rect_tube",
            {"outerWidth": 20, "outerHeight": 20, "wallThickness": 15},
        )


def test_hex_side_length():
    area = calculate_cross_section_area("hex_solid", {"side": 10})
    expected = (3 * math.sqrt(3) / 2) * 100
    assert area == pytest.approx(expected, abs=0.01)


@pytest.mark.parametrize(
    ("formula_key", "dimensions", "expected"),
    [
        (
            "i_beam",
            {
                "totalHeight": 300,
                "flangeWidth": 150,
                "flangeThickness": 12,
                "webThickness": 8,
            },
            2 * 150 * 12 + (300 - 2 * 12) * 8,
        ),
        (
            "channel_c",
            {
                "totalHeight": 200,
                "flangeWidth": 75,
                "flangeThickness": 10,
                "webThickness": 6,
            },
            2 * 75 * 10 + (200 - 2 * 10) * 6,
        ),
        (
            "t_section",
            {
                "totalHeight": 150,
                "flangeWidth": 100,
                "flangeThickness": 10,
                "webThickness": 8,
            },
            100 * 10 + (150 - 10) * 8,
        ),
        ("triangle_solid", {"base": 50, "height": 40}, 1000),
        (
            "hex_hollow",
            {"outerSide": 20, "innerSide": 10},
            (3 * math.sqrt(3) / 2) * (20**2 - 10**2),
        ),
        (
            "round_tube_wall",
            {"outerDiameter": 60, "wallThickness": 5},
            (math.pi / 4) * (60**2 - 50**2),
        ),
        (
            "ellipse_solid",
            {"majorDiameter": 80, "minorDiameter": 40},
            (math.pi / 4) * 80 * 40,
        ),
        (
            "ellipse_tube",
            {
                "outerMajorDiameter": 80,
                "outerMinorDiameter": 50,
                "innerMajorDiameter": 70,
                "innerMinorDiameter": 40,
            },
            (math.pi / 4) * (80 * 50 - 70 * 40),
        ),
        ("custom_area", {"crossSectionArea": 1234.567}, 1234.57),
    ],
)
def test_extended_shape_areas(formula_key, dimensions, expected):
    assert calculate_cross_section_area(formula_key, dimensions) == pytest.approx(
        expected, abs=0.01
    )


@pytest.mark.parametrize(
    ("formula_key", "dimensions", "message"),
    [
        (
            "i_beam",
            {
                "totalHeight": 20,
                "flangeWidth": 100,
                "flangeThickness": 12,
                "webThickness": 8,
            },
            "twice the flange thickness",
        ),
        (
            "t_section",
            {
                "totalHeight": 10,
                "flangeWidth": 100,
                "flangeThickness": 10,
                "webThickness": 8,
            },
            "greater than flange thickness",
        ),
        (
            "hex_hollow",
            {"outerSide": 10, "innerSide": 20},
            "greater than inner side length",
        ),
        (
            "round_tube_wall",
            {"outerDiameter": 20, "wallThickness": 10},
            "too large for the outer diameter",
        ),
        (
            "ellipse_tube",
            {
                "outerMajorDiameter": 80,
                "outerMinorDiameter": 40,
                "innerMajorDiameter": 70,
                "innerMinorDiameter": 45,
            },
            "outer ellipse diameters",
        ),
    ],
)
def test_extended_shapes_reject_invalid_dimensions(
    formula_key, dimensions, message
):
    with pytest.raises(ShapeValidationError, match=message):
        calculate_cross_section_area(formula_key, dimensions)


def test_labour_sum():
    total = calculate_total_labour_cost(
        [
            {
                "operation_name": "Facing",
                "machine": "Lathe",
                "driving_param_type": "diameter",
                "rate_per_unit": 2,
                "param_value": 50,
            },
            {
                "operation_name": "Drilling",
                "machine": "Drilling",
                "driving_param_type": "depth",
                "rate_per_unit": 5,
                "param_value": 10,
            },
        ]
    )
    assert total == 150


BASE_INPUT = {
    "material_density": 7.85,
    "material_rate_per_kg": 80,
    "raw_formula_key": "round_solid",
    "raw_dimensions": {"diameter": 50},
    "raw_length": 100,
    "finished_formula_key": "round_solid",
    "finished_dimensions": {"diameter": 45},
    "finished_length": 100,
    "operations": [
        {
            "operation_name": "Turning",
            "machine": "Lathe",
            "driving_param_type": "length",
            "rate_per_unit": 3,
            "param_value": 100,
        }
    ],
    "plating_enabled": True,
    "plating_rate_per_kg": 50,
    "packing_basis": "per_kg",
    "packing_value": 10,
    "transport_basis": "flat",
    "transport_value": 200,
    "margin_percent": 10,
}


def test_plating_on_finished_weight():
    result = calculate_quote(BASE_INPUT)
    expected_plating = round_money(result["finished"]["weight_kg"] * 50)
    assert result["plating_cost"] == expected_plating
    assert result["finished"]["weight_kg"] < result["raw"]["weight_kg"]


def test_margin_excludes_plating_packing_transport():
    result = calculate_quote(BASE_INPUT)
    expected_running = round_money(
        result["raw"]["material_cost"]
        + result["total_labour_cost"]
        + result["plating_cost"]
        + result["packing_cost"]
        + result["transport_cost"]
    )
    assert result["running_total"] == expected_running

    margin_base = round_money(
        result["raw"]["material_cost"] + result["total_labour_cost"]
    )
    expected_final = round_final_rate(
        margin_base * 1.1
        + result["plating_cost"]
        + result["packing_cost"]
        + result["transport_cost"]
    )
    assert result["final_rate"] == expected_final


def test_different_finished_shape():
    result = calculate_quote(
        {
            **BASE_INPUT,
            "finished_formula_key": "square_solid",
            "finished_dimensions": {"side": 40},
        }
    )
    assert result["finished"]["cross_section_area"] == 1600


def test_rounding():
    assert round_money(1.234) == 1.23
    assert round_money(1.235) == 1.24
    assert round_final_rate(1234.4) == 1234
    assert round_final_rate(1234.6) == 1235
