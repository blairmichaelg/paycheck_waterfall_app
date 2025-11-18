"""
Pure allocation logic for the Paycheck Waterfall App.

Copied into the standalone `paycheck_waterfall_app` package so this module and
its tests can be run in isolation.
"""

from __future__ import annotations

from typing import List, Dict, Literal


def _round2(x: float) -> float:
    return round(x + 1e-12, 2)


def allocate_paycheck(
    paycheck_amount: float,
    bills: List[Dict],
    goals: List[Dict],
    percent_apply: Literal["gross", "remainder"] = "gross",
) -> Dict:
    """Allocate a single paycheck across bills, goals, and guilt-free spending.

    Simple deterministic algorithm:
      1. Fund bills in order until exhausted or paycheck runs out.
      2. Compute desired goal allocations (percent or fixed). Percent base is either
         the paycheck gross or the remainder after bills based on `percent_apply`.
      3. If desired goals exceed the remaining money, scale goal allocations down
         proportionally so they fit.
      4. Remaining money becomes `guilt_free`.
    """
    if paycheck_amount < 0:
        raise ValueError("paycheck_amount must be non-negative")

    # Step 1: Fund bills in order
    remaining = float(paycheck_amount)
    bills_out = []
    for b in bills:
        required = float(b.get("amount", 0.0))
        alloc = min(remaining, required)
        remaining -= alloc
        bills_out.append(
            {
                "name": b.get("name", ""),
                "required": _round2(required),
                "allocated": _round2(alloc),
                "remaining": _round2(required - alloc),
            }
        )

    remaining_after_bills = _round2(remaining)

    # Step 2: Compute desired goal allocations
    base_for_percent = (
        float(paycheck_amount) if percent_apply == "gross" else remaining_after_bills
    )

    goals_desired = []
    for g in goals:
        gtype = g.get("type", "percent")
        if gtype == "percent":
            pct = float(g.get("value", 0.0)) / 100.0
            desired = _round2(pct * base_for_percent)
        else:  # fixed
            desired = _round2(float(g.get("value", 0.0)))
        goals_desired.append(
            {
                "name": g.get("name", ""),
                "type": gtype,
                "value": g.get("value"),
                "desired": desired,
                "allocated": 0.0,
            }
        )

    desired_total = sum(g["desired"] for g in goals_desired)

    # Step 3: Cap goals by remaining_after_bills and allocate proportionally if needed
    cap = min(desired_total, remaining_after_bills)

    if desired_total <= 0.0 or cap <= 0.0:
        # nothing to allocate
        for g in goals_desired:
            g["allocated"] = 0.0
        guilt_free = remaining_after_bills
    else:
        factor = cap / desired_total if desired_total > 0 else 0.0
        allocated_sum = 0.0
        for g in goals_desired:
            alloc = _round2(g["desired"] * factor)
            g["allocated"] = alloc
            allocated_sum += alloc

        # fix any rounding gap by adjusting the first goal
        rounding_gap = _round2(cap - allocated_sum)
        if abs(rounding_gap) >= 0.01 and goals_desired:
            goals_desired[0]["allocated"] = _round2(
                goals_desired[0]["allocated"] + rounding_gap
            )

        guilt_free = _round2(
            remaining_after_bills - sum(g["allocated"] for g in goals_desired)
        )

    return {
        "bills": bills_out,
        "goals": goals_desired,
        "guilt_free": _round2(guilt_free),
        "meta": {
            "paycheck": _round2(paycheck_amount),
            "remaining_after_bills": remaining_after_bills,
        },
    }


if __name__ == "__main__":
    # small demo
    demo = allocate_paycheck(
        2000.0,
        bills=[
            {"name": "Rent", "amount": 1200.0},
            {"name": "Utilities", "amount": 200.0},
        ],
        goals=[
            {"name": "Invest", "type": "percent", "value": 10.0},
            {"name": "Emergency", "type": "fixed", "value": 100.0},
        ],
        percent_apply="gross",
    )
    import json

    print(json.dumps(demo, indent=2))
