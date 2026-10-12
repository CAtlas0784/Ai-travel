@echo off
setlocal EnableExtensions
for %%I in ("%~dp0..") do set "PROJECT_ROOT=%%~fI"
pushd "%PROJECT_ROOT%"

echo Applying database migrations...
call npm run db:migrate -w apps/api
if errorlevel 1 goto failed

echo.
echo Seeding tourist attractions...
call npm run db:seed -w apps/api
if errorlevel 1 goto failed

set "EXIT_CODE=0"
goto finish

:failed
echo.
echo Database setup failed. Check apps\api\.env and make sure PostgreSQL is running.
set "EXIT_CODE=1"
pause

:finish
popd
endlocal & exit /b %EXIT_CODE%
