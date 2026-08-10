MONEY_TOLERANCE = 0.01
WEIGHT_TOLERANCE = 0.001


def round_area(value: float) -> float:
    return round(value * 100) / 100


def round_weight(value: float) -> float:
    return round(value * 1000) / 1000


def round_money(value: float) -> float:
    return round(value * 100) / 100


def round_final_rate(value: float) -> float:
    return round(value)


def amounts_match(a: float, b: float, tolerance: float = MONEY_TOLERANCE) -> bool:
    return abs(a - b) <= tolerance


def weights_match(a: float, b: float) -> bool:
    return abs(a - b) <= WEIGHT_TOLERANCE
