from paycheck_waterfall.allocations import allocate_paycheck


def test_zero_paycheck_allocations_are_zero():
    paycheck = 0.0
    bills = [{"name": "Rent", "amount": 500.0}, {"name": "Utilities", "amount": 100.0}]
    goals = [
        {"name": "Invest", "type": "percent", "value": 10.0},
        {"name": "Save", "type": "fixed", "value": 50.0},
    ]
    out = allocate_paycheck(paycheck, bills, goals)
    # nothing should be allocated anywhere
    assert all(b["allocated"] == 0.0 for b in out["bills"])
    assert all(g["allocated"] == 0.0 for g in out["goals"])
    assert out["guilt_free"] == 0.0


def test_fractional_rounding_preserves_total():
    # This test checks that rounding logic doesn't lose or create money
    paycheck = 1000.0
    bills = [{"name": "Rent", "amount": 333.33}]
    goals = [
        {"name": "A", "type": "percent", "value": 33.333},
        {"name": "B", "type": "percent", "value": 33.333},
    ]

    out = allocate_paycheck(paycheck, bills, goals, percent_apply="gross")

    total_out = (
        sum(b["allocated"] for b in out["bills"])
        + sum(g["allocated"] for g in out["goals"])
        + out["guilt_free"]
    )
    # the totals should sum to the original paycheck (rounded to 2 decimals)
    assert round(total_out, 2) == round(paycheck, 2)


def test_large_number_of_goals_scale_and_round():
    paycheck = 1234.56
    bills = [{"name": "Rent", "amount": 200.0}]
    # create many small fixed goals whose sum exceeds remainder
    goals = [{"name": f"G{i}", "type": "fixed", "value": 50.0} for i in range(20)]
    out = allocate_paycheck(paycheck, bills, goals)
    allocated_total = sum(g["allocated"] for g in out["goals"])
    # allocated_total should not exceed remaining after bills
    assert allocated_total <= out["meta"]["remaining_after_bills"] + 1e-9
