Agent / Assistant Instructions for Paycheck Waterfall Project

Purpose and role
- Act as an automated coding partner for this repository. Maintain, test, and improve the `paycheck_waterfall_app` package.
- Keep changes minimal, well-tested, and consistent with the project style.

Capabilities
- Read and modify repository files, run tests, and run linters/formatters.
- Create and update unit tests, CI workflows, and pre-commit hooks.
- Initialize and manage a local git repository and attempt to push to remotes when credentials are available.
- Recommend, scaffold, and install developer tooling (formatters, linters, pre-commit) but avoid system-level installs that require elevated privileges unless explicitly authorized.

Conventions and constraints
- Use `pytest` for tests and ensure all tests pass before committing changes.
- Use `black` for formatting (line-length 88) and `flake8` for linting. Keep `isort` off unless a stable pre-commit hook can be fetched.
- Keep public API stable: `allocate_paycheck(paycheck_amount, bills, goals, percent_apply='gross')` must remain a pure, deterministic mapper.
- Handle monetary values with `_round2` and maintain rounding-gap correction behavior.
- Do not commit unrelated refactors. Keep edits focused and minimal.

Responsibilities
- Maintain a concise TODO list of steps and progress (use the repo's TODO mechanism).
- Run `pytest -q` after edits; add tests for new behaviors or edge cases.
- Add/maintain a `CHANGELOG.md` for notable changes.
- Create or update CI (GitHub Actions) to run `black --check`, `flake8`, and `pytest` on PRs.
- When remote operations are required, request credentials or ask the user to install/configure `gh`. If `gh` is available and authenticated, push changes and create PRs as requested.

See also: `.github/copilot-instructions.md` for a concise, actionable agent manifest (tooling, permissions, and PowerShell setup commands).

Helpful commands (Windows PowerShell)
- Run tests: `pytest -q`
- Format: `python -m black .`
- Lint: `python -m flake8 --max-line-length=88 .`
- Install pre-commit hooks: `python -m pip install pre-commit && pre-commit install`
- Run hooks on all files: `pre-commit run --all-files`

Failure handling
- If pre-commit hook envs fail to install (network or checkout errors), remove or pin problematic hooks and add a comment explaining the change.
- If any test fails after an edit, revert the change or create a targeted fix + new test.

Next actions (automated)
1. Ensure `pre-commit` is installed and hooks run successfully.
2. Add `CHANGELOG.md` entry for the initial commit.
3. If `gh` is available and authenticated, create a remote repo `paycheck_waterfall_app` and push the `main` branch; otherwise provide exact instructions for the user.
4. Add a minimal GitHub Actions workflow to run tests and linters on PRs.

If uncertain, ask only when the action requires credentials or elevated permissions (creating remote repos, installing system packages).