import pytest

from paycheck_waterfall.allocations import allocate_paycheck


def test_full_bills_then_guilt_free():
    paycheck = 1500.0
    bills = [{"name": "Rent", "amount": 1000.0}, {"name": "Utilities", "amount": 200.0}]
    goals = []
    out = allocate_paycheck(paycheck, bills, goals)
    assert out["bills"][0]["allocated"] == 1000.0
    assert out["bills"][1]["allocated"] == 200.0
    assert out["guilt_free"] == 300.0


def test_partial_bill_funding():
    paycheck = 900.0
    bills = [{"name": "Rent", "amount": 1000.0}, {"name": "Utilities", "amount": 200.0}]
    out = allocate_paycheck(paycheck, bills, [])
    # rent partially funded, utilities get 0
    assert out["bills"][0]["allocated"] == 900.0
    assert out["bills"][0]["remaining"] == 100.0
    assert out["bills"][1]["allocated"] == 0.0
    assert out["guilt_free"] == 0.0


def test_percent_goal_on_gross():
    paycheck = 1000.0
    bills = [{"name": "Rent", "amount": 400.0}]
    goals = [{"name": "Invest", "type": "percent", "value": 10.0}]
    out = allocate_paycheck(paycheck, bills, goals, percent_apply="gross")
    # percent applied on gross => 10% of 1000 = 100 desired
    # bills get 400 -> remaining 600 -> goals cap 100 -> guilt_free 500
    assert out["goals"][0]["desired"] == 100.0
    assert out["goals"][0]["allocated"] == 100.0
    assert out["guilt_free"] == 500.0


def test_percent_goal_on_remainder():
    paycheck = 1000.0
    bills = [{"name": "Rent", "amount": 400.0}]
    goals = [{"name": "Invest", "type": "percent", "value": 10.0}]
    out = allocate_paycheck(paycheck, bills, goals, percent_apply="remainder")
    # percent applied on remainder => 10% of (1000-400)=600 => 60 desired
    assert out["goals"][0]["desired"] == 60.0
    assert out["goals"][0]["allocated"] == 60.0
    assert out["guilt_free"] == 540.0


def test_goals_exceed_remaining_are_scaled():
    paycheck = 500.0
    bills = [{"name": "Rent", "amount": 200.0}]
    goals = [
        {"name": "A", "type": "fixed", "value": 200.0},
        {"name": "B", "type": "fixed", "value": 200.0},
    ]
    out = allocate_paycheck(paycheck, bills, goals)
    # remaining after bills = 300, desired total goals = 400, so should be scaled to 300
    allocated_total = sum(g["allocated"] for g in out["goals"])
    assert allocated_total == 300.0
    assert out["guilt_free"] == 0.0


def test_negative_paycheck_raises():
    with pytest.raises(ValueError):
        allocate_paycheck(-100.0, [], [])
