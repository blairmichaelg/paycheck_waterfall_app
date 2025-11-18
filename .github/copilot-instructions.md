## Paycheck Waterfall — Copilot / Agent instructions

This package is the pure Python allocation engine used by the Paycheck Waterfall app MVP. Keep edits small, well-tested, and explicit.

- Start here: open `src/paycheck_waterfall/allocations.py` and `tests/test_allocations.py`.
- High-level: this module exposes a single function `allocate_paycheck(paycheck_amount, bills, goals, percent_apply='gross')` which is a pure, deterministic mapper from input data to an allocation result.

Key data shapes and conventions (copy/paste friendly):
- `bills`: list of dicts, each with `{'name': str, 'amount': float}`. Allocations fund bills in order until money runs out.
- `goals`: list of dicts, each either `{'name': str, 'type': 'percent', 'value': 10.0}` or `{'name': str, 'type': 'fixed', 'value': 100.0}`. Percent values are percentages (10.0 = 10%).
- `percent_apply`: one of `'gross'` or `'remainder'`. If `'gross'`, percent goals are computed from the whole paycheck; if `'remainder'`, from remainder after bills.

Important behaviors to preserve when editing:
- Negative `paycheck_amount` raises ValueError.
- All monetary values are rounded to 2 decimals via `_round2`. Small rounding gaps are corrected by adjusting the first goal allocation.
- If goals' desired total exceeds available remainder, goals are scaled proportionally to fit; guilt_free is whatever remains.

Testing and workflows:
- Tests are small and use pytest. Run tests from the package root (PowerShell):
  ```powershell
  pytest -q paycheck_waterfall_app/tests/test_allocations.py -q
  ```
- When changing allocation logic, add a unit test that covers the new behavior and edge cases (zero paycheck, negative values, fractional cents, cap/scale logic).

Notes and pointers:
- No external dependencies — keep the core package dependency-free.
- The `__main__` demo in `allocations.py` shows a simple usage example and can be used for manual smoke tests.
- Product context is in `idea_notebook/idea_43_paycheck_waterfall_app.md` (frontend idea, localStorage, not part of this package). Mention it in PR descriptions if behavior changes affect UX assumptions.

If you need to expand the API (e.g., support more goal rule types), prefer adding explicit unit-tested functions and keeping the public `allocate_paycheck` stable.

If anything is unclear or you want a short example added to this file, ask and I'll include a runnable example and exact pytest commands.
