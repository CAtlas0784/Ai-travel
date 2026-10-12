@echo off
setlocal EnableExtensions
set "PROJECT_ROOT=%~dp0"
cd /d "%PROJECT_ROOT%"

:menu
if not defined KEEP_MENU_OUTPUT cls
set "KEEP_MENU_OUTPUT="
echo ==============================================
echo        Uthai Thani AI Travel Assistant
echo ==============================================
echo 1. Local preview (web only, mock AI)
echo 2. Local demo (web + in-memory API)
echo 3. Local PostgreSQL (web + real API)
echo 4. Local checks (tests + lint + production build)
echo 5. Online smoke check (website + API health)
echo 0. Exit
echo.
echo Options 1-4 need the tools listed in requirements.txt; missing tools are installed with winget.
echo Option 3 also needs PostgreSQL. Option 5 needs internet but no Node.js/npm.
echo.
choice /C 123450 /N /M "Choose an option: "
if errorlevel 6 goto finish
if errorlevel 5 goto online
if errorlevel 4 goto checks
if errorlevel 3 goto postgres
if errorlevel 2 goto demo
if errorlevel 1 goto preview
goto menu

:preview
call :ensureDependencies
if errorlevel 1 goto menu
set "VITE_DEMO_MODE=true"
set "VITE_API_URL=http://127.0.0.1:4000"
echo Starting the web preview with mock AI. No API server or database is used.
echo Open http://127.0.0.1:5173/
echo Press Ctrl+C to return to this menu.
echo.
call npm run dev -w apps/web
goto menu

:demo
call :ensureDependencies
if errorlevel 1 goto menu
set "VITE_DEMO_MODE=false"
set "VITE_API_URL=http://127.0.0.1:4000"
echo.
echo Starting the web and in-memory demo API together.
echo Data resets when you press Ctrl+C.
echo.
call npm run dev:demo
goto menu

:postgres
call :ensureDependencies
if errorlevel 1 goto menu
if not exist "%PROJECT_ROOT%apps\api\.env" (
  if not exist "%PROJECT_ROOT%apps\api\.env.example" (
    echo Missing apps\api\.env.example. Cannot configure the PostgreSQL backend.
    pause
    goto menu
  )
  copy /Y "%PROJECT_ROOT%apps\api\.env.example" "%PROJECT_ROOT%apps\api\.env" >nul
  echo Created apps\api\.env from the example.
  echo Add your local PostgreSQL URL and a private JWT secret, then select option 3 again.
  pause
  goto menu
)
set "VITE_DEMO_MODE=false"
set "VITE_API_URL=http://127.0.0.1:4000"
echo.
call "%PROJECT_ROOT%scripts\setup-postgres.bat"
if errorlevel 1 goto menu
echo.
echo Starting the PostgreSQL API and frontend together.
echo Press Ctrl+C to return to this menu.
echo.
call npm run dev
goto menu

:checks
call :ensureDependencies
if errorlevel 1 goto menu
call "%PROJECT_ROOT%scripts\build-checks.bat"
pause
goto menu

:online
set "ONLINE_WEB_URL="
set "ONLINE_API_URL="
echo Enter the deployed website and API base URLs. No API keys are requested.
set /p "ONLINE_WEB_URL=Website URL: "
set /p "ONLINE_API_URL=API base URL: "
if not defined ONLINE_WEB_URL goto onlineMissing
if not defined ONLINE_API_URL goto onlineMissing
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%PROJECT_ROOT%scripts\online-smoke-test.ps1"
if errorlevel 1 (
  echo.
  echo Online smoke check failed. See the message above.
) else (
  echo.
  echo Online smoke check passed.
)
pause
goto menu

:onlineMissing
echo Both URLs are required.
pause
goto menu

:ensureDependencies
set "REQUIREMENTS_FILE=%PROJECT_ROOT%requirements.txt"
set "REQUIRED_NODE_MAJOR="
set "REQUIRED_NPM_MAJOR="
if not exist "%REQUIREMENTS_FILE%" goto requirementsFileMissing
for /f "usebackq eol=# tokens=1,2 delims==" %%A in ("%REQUIREMENTS_FILE%") do (
  if /i "%%A"=="node-major" set "REQUIRED_NODE_MAJOR=%%B"
  if /i "%%A"=="npm-major" set "REQUIRED_NPM_MAJOR=%%B"
)
if not defined REQUIRED_NODE_MAJOR goto requirementsFileInvalid
if not defined REQUIRED_NPM_MAJOR goto requirementsFileInvalid

call :checkRuntimeRequirements
if errorlevel 1 goto installRuntime
goto installProjectDependencies

:installRuntime
where.exe winget >nul 2>&1
if errorlevel 1 (
  echo Node.js is missing or does not match requirements.txt, and winget is unavailable.
  echo Install Node.js %REQUIRED_NODE_MAJOR%.x with npm %REQUIRED_NPM_MAJOR% or newer, then reopen run.bat.
  echo Download: https://nodejs.org/en/download/
  goto requirementsFailed
)
echo Installing Node.js LTS with winget because the required runtime is missing or outdated...
winget install --id OpenJS.NodeJS.LTS --exact --accept-source-agreements --accept-package-agreements
if errorlevel 1 goto runtimeInstallFailed
set "PATH=%ProgramFiles%\nodejs;%ProgramFiles(x86)%\nodejs;%LOCALAPPDATA%\Programs\nodejs;%PATH%"
call :checkRuntimeRequirements
if errorlevel 1 goto runtimeInstallFailed
goto installProjectDependencies

:checkRuntimeRequirements
set "FOUND_NODE_MAJOR="
set "FOUND_NPM_MAJOR="
for /f "tokens=1 delims=." %%V in ('node -p "process.versions.node" 2^>nul') do set "FOUND_NODE_MAJOR=%%V"
for /f "tokens=1 delims=." %%V in ('npm --version 2^>nul') do set "FOUND_NPM_MAJOR=%%V"
if not defined FOUND_NODE_MAJOR exit /b 1
if not defined FOUND_NPM_MAJOR exit /b 1
if not "%FOUND_NODE_MAJOR%"=="%REQUIRED_NODE_MAJOR%" exit /b 1
if %FOUND_NPM_MAJOR% LSS %REQUIRED_NPM_MAJOR% exit /b 1
echo Using Node.js %FOUND_NODE_MAJOR% and npm %FOUND_NPM_MAJOR%.
exit /b 0

:installProjectDependencies
if exist "%PROJECT_ROOT%node_modules\.package-lock.json" exit /b 0
if not exist "%PROJECT_ROOT%package-lock.json" (
  echo package-lock.json is missing. Cannot install the project dependencies reliably.
  goto requirementsFailed
)
echo Project dependencies are missing. Installing them from package-lock.json...
pushd "%PROJECT_ROOT%"
call npm ci
set "INSTALL_RESULT=%ERRORLEVEL%"
popd
if not "%INSTALL_RESULT%"=="0" goto npmInstallFailed
exit /b 0

:requirementsFileMissing
echo requirements.txt is missing from the project folder.
goto requirementsFailed

:requirementsFileInvalid
echo requirements.txt must contain node-major and npm-major values.
goto requirementsFailed

:runtimeInstallFailed
echo Could not install a compatible Node.js/npm runtime with winget.
echo Required: Node.js %REQUIRED_NODE_MAJOR%.x and npm %REQUIRED_NPM_MAJOR% or newer.
echo Install Node.js manually from https://nodejs.org/en/download/ and reopen run.bat.
goto requirementsFailed

:npmInstallFailed
echo npm could not install the project dependencies. Review the error above and retry.

:requirementsFailed
echo.
echo Setup could not finish. Press any key to return to the menu.
pause
set "KEEP_MENU_OUTPUT=1"
exit /b 1

:finish
endlocal
exit /b 0
