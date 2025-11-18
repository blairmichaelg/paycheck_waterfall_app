# Contributing

Developer setup (Windows PowerShell):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -e .
python -m pip install -U pytest black flake8 pre-commit

cd webapp
npm install
```

Tests:
- Python tests: `pytest -q` from repo root.
- Webapp tests: `cd webapp && npm run test`.

Coding conventions:
- Python: `black` formatting, `flake8` linting.
- Webapp: follow TypeScript strictness and use `vitest` for unit tests.

Working with GitHub:
- Use `gh` CLI to create PRs: `gh pr create`.
