@echo off
setlocal EnableExtensions
for %%I in ("%~dp0..") do set "PROJECT_ROOT=%%~fI"
pushd "%PROJECT_ROOT%"

echo Local checks: unit tests, optional PostgreSQL integration tests, ESLint, TypeScript, Prisma generation, and production builds.
echo.
call npm test
if errorlevel 1 goto failed

if defined TEST_DATABASE_URL (
  echo.
  echo Running PostgreSQL API integration tests using TEST_DATABASE_URL.
  call npm run test:integration
  if errorlevel 1 goto failed
) else (
  echo PostgreSQL integration tests skipped; set TEST_DATABASE_URL to a disposable migrated test database to enable them.
)

echo.
call npm run lint
if errorlevel 1 goto failed

echo.
call npm run build
if errorlevel 1 goto failed

echo.
echo Local checks passed.
set "EXIT_CODE=0"
goto finish

:failed
echo.
echo A local check failed. Read the error above.
set "EXIT_CODE=1"
pause

:finish
popd
endlocal & exit /b %EXIT_CODE%
