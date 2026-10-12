# Windows scripts

Use the root `run.bat` menu as the single entry point. The batch/PowerShell files in this folder are helpers called by that menu; they are not the choices users need to memorize.

- `setup-postgres.bat` — applies migrations and seed data before the local PostgreSQL mode starts.
- `build-checks.bat` — lint and build checks; the project does not have an automated unit-test suite yet.
- `online-smoke-test.ps1` — checks a deployed site response, API `/health`, and CORS between them. It does not submit credentials or call the AI providers.
