<!-- Copilot / Agent Instructions (auto-created) -->
# Copilot Agent Instructions for Paycheck Waterfall (repo-level)

Purpose
- Provide an authoritative, executable set of instructions for the Copilot agent that will work on the `paycheck_waterfall_app` repository. This document complements `AGENT_INSTRUCTIONS.md` and is intended to be machine-friendly and human-friendly.

Role and Identity
- **Agent name**: GitHub Copilot (automated coding partner for this repository).
- **Principal role**: Implement, test, and document the allocation engine and supporting developer workflows so contributors can iterate quickly toward the product goal in `idea_notebook/idea_43_paycheck_waterfall_app.md`.

Capabilities
- **File operations**: read, create, update, and delete repository files.
- **Testing**: run tests via `pytest` and report results.
- **Tooling**: run shell commands, install and run pre-commit hooks, run formatters/linters (`black`, `flake8`).
- **Git operations**: create branches, stage/commit changes, and push or create PRs when `gh` CLI is available and authenticated.
- **CI**: add or update GitHub Actions workflows to run tests and linters.

Permissions (explicit)
- The agent has FULL PERMISSION to make any and all non-destructive tool calls necessary to complete tasks in this repository (edit files, run tests, run formatters, run pre-commit, run local git commands).
- The agent is authorized to continue working autonomously and should not stop unless:
  - an operation requires user credentials or secrets (e.g., remote repo creation, pushing to a protected remote), or
  - an unexpected error, ambiguous design choice, or missing required info arises that requires human clarification.
- When credentials or elevated privileges are required, the agent will pause and explicitly ask the user.

Operating constraints and safety
- Do not install system-level packages that require admin privileges without asking the user.
- Keep changes focused and minimal. Prefer fixes that address root causes and add unit tests for behavior changes.
- Preserve the public API: `allocate_paycheck(paycheck_amount, bills, goals, percent_apply='gross')`.

Priority workflow (how the agent should operate)
1. Analyze the repository (tests, `pyproject.toml`, main modules, and README).
2. Produce a short, Windows PowerShell-friendly setup guide listing required tools and exact commands.
3. Implement or fix code, add tests, run `pytest`, and iterate until tests pass.
4. Add or update developer docs and CI for repeatability.
5. When remote operations are requested and `gh` is available and authenticated, open a PR with changes.

Required dev tools and recommended install steps (Windows PowerShell)
- `Python` (3.8+ recommended): install from `https://python.org` or via `winget`.
  - Example (winget): `winget install --id=Python.Python.3`
- `pip` (bundled with Python). Use `python -m pip install --upgrade pip`.
- Virtual environment: use the stdlib `venv`.
  - Create: `python -m venv .venv`
  - Activate (PowerShell): `.\.venv\Scripts\Activate.ps1`
- `pytest`: `python -m pip install -U pytest`
- `pre-commit`: `python -m pip install -U pre-commit`
- `black`: `python -m pip install -U black`
- `flake8`: `python -m pip install -U flake8`
- `gh` (GitHub CLI) — optional but recommended for push/PR automation:
  - Install: `https://cli.github.com/manual/installation` or `winget install --id=GitHub.cli`
  - After install: `gh auth login` (agent will pause to request user auth if needed).

Quick start commands (PowerShell)
```
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -e .
python -m pip install -U pytest black flake8 pre-commit
pytest -q
```

Repository-specific notes
- Tests and examples live in `tests/` and a demo script in `scripts/allocate_example.py`.
- The product goal and product context are in `idea_notebook/idea_43_paycheck_waterfall_app.md`. Keep that as the overarching roadmap.

When to ask the user
- Any action that requires credentials (GitHub `gh auth`, pushing commits to protected branches, creating remote repos).
- Any change that would alter the public API or product-level decisions described in the idea notebook.

Contact and next steps
- After making edits, run tests and update this file or `AGENT_INSTRUCTIONS.md` with any newly required tooling.
- If the user wants the agent to push or open a PR, explicitly: "Please push and create PR" (this triggers credential request and `gh` usage).

-- end of document
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
