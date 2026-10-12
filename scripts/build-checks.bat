@echo off
setlocal EnableExtensions
for %%I in ("%~dp0..") do set "PROJECT_ROOT=%%~fI"
pushd "%PROJECT_ROOT%"

echo Local checks: ESLint, TypeScript, Prisma generation, and production builds.
echo The project does not currently define unit or end-to-end tests.
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
