# Windows scripts

Use the root `run.bat` menu as the single entry point. The batch/PowerShell files in this folder are helpers called by that menu; they are not the choices users need to memorize.

- `setup-postgres.bat` — applies migrations and seed data before the local PostgreSQL mode starts.
- `build-checks.bat` — unit tests, optional PostgreSQL integration tests, lint, and production builds.
- `online-smoke-test.ps1` — checks deployed website availability, API/database readiness, sourced place records, and CORS. It does not submit credentials or call AI providers.
- `ensure-node.ps1` — checks for Node.js 24.x with npm 11+; if missing, offers to download and verify the official portable Node.js archive into the ignored `.tools/` folder.
