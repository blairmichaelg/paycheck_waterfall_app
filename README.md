# Paycheck Waterfall App (python-core)

This folder contains a small Python package with the pure allocation logic (the "allocation engine") and tests for the Paycheck Waterfall App MVP.

Quick test command (PowerShell):

```powershell
pytest -q paycheck_waterfall_app/tests/test_allocations.py -q
```

Contract (short):
- Input: `paycheck_amount: float` (>=0), `bills: List[{'name', 'amount'}]`, `goals: List[{'name','type','value'}]`, optional `percent_apply` which is `'gross'` or `'remainder'`.
- Output: `dict` with keys `bills` (list with allocated/remaining per bill), `goals` (list with desired & allocated), `guilt_free` (float), and `meta` (small summary).

Example usage (from Python):

```python
from paycheck_waterfall.allocations import allocate_paycheck

paycheck = 2000.0
bills = [
	{'name': 'Rent', 'amount': 1200.0},
	{'name': 'Utilities', 'amount': 200.0},
]
goals = [
	{'name': 'Invest', 'type': 'percent', 'value': 10.0},
	{'name': 'Emergency', 'type': 'fixed', 'value': 100.0},
]

result = allocate_paycheck(paycheck, bills, goals, percent_apply='gross')
print(result)
```

Key implementation notes agents should know:
- The module rounds to two decimals using a helper `_round2` (small epsilon added before rounding). This file intentionally uses floats for simplicity (no external Monetary library).
- Goal percent values are provided as percentages (10.0 -> 10%). When total desired goals exceed the available remainder after bills, goals are scaled proportionally and any tiny rounding gap is fixed by adjusting the first goal.
- Negative paychecks raise ValueError.

Where to start when contributing:
- Open `src/paycheck_waterfall/allocations.py` to understand allocation rules.
- Read `tests/test_allocations.py` to see expected behaviors and edge cases already covered (bill ordering, percent base, scaling of goals, negative-paycheck validation).
- The frontend idea and rationale live in `idea_notebook/idea_43_paycheck_waterfall_app.md` if you need product context.

If you modify allocation behavior, add or update tests and run the pytest command above before submitting a PR.

