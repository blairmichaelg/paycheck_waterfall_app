"""Small example script to demonstrate the allocation API.

Run locally with:
    python scripts/allocate_example.py
"""

from paycheck_waterfall.allocations import allocate_paycheck
import json


def main():
    paycheck = 2000.0
    bills = [
        {"name": "Rent", "amount": 1200.0},
        {"name": "Utilities", "amount": 200.0},
    ]
    goals = [
        {"name": "Invest", "type": "percent", "value": 10.0},
        {"name": "Emergency", "type": "fixed", "value": 100.0},
    ]

    out = allocate_paycheck(paycheck, bills, goals, percent_apply="gross")
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
