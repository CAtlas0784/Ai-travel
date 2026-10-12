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
echo Options 1-4 need Node.js 24/npm 11; the launcher offers to download them if missing.
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
if not exist "%PROJECT_ROOT%.tools" mkdir "%PROJECT_ROOT%.tools"
set "RUN_LOG=%PROJECT_ROOT%.tools\run.log"
set "RUN_ERROR_LOG=%PROJECT_ROOT%.tools\run-error.log"
>"%RUN_LOG%" echo AI Travel launcher log - %date% %time%
>"%RUN_ERROR_LOG%" echo.
echo Log: %RUN_LOG%
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%PROJECT_ROOT%scripts\ensure-node.ps1" -InstallRoot "%PROJECT_ROOT%.tools\node24" -LogPath "%RUN_LOG%" 2>>"%RUN_ERROR_LOG%"
set "NODE_SETUP_RESULT=%ERRORLEVEL%"
type "%RUN_ERROR_LOG%" >>"%RUN_LOG%"
if %NODE_SETUP_RESULT% GEQ 11 goto prerequisitesFailed
if %NODE_SETUP_RESULT% GEQ 10 goto useLocalNode
if not "%NODE_SETUP_RESULT%"=="0" goto prerequisitesFailed
goto nodeReady

:useLocalNode
set "PATH=%PROJECT_ROOT%.tools\node24;%PATH%"
goto nodeReady

:nodeReady
echo.
echo Node.js and npm are ready:
node --version
npm --version
if exist "%PROJECT_ROOT%node_modules" exit /b 0
echo node_modules is missing. Installing project dependencies...
pushd "%PROJECT_ROOT%"
call npm install >>"%RUN_LOG%" 2>&1
set "INSTALL_RESULT=%ERRORLEVEL%"
popd
type "%RUN_LOG%"
if not "%INSTALL_RESULT%"=="0" goto prerequisitesFailed
exit /b 0

:prerequisitesFailed
echo.
echo Requirements could not be prepared. Check the message above and try again.
if defined RUN_LOG (
  echo Details saved to "%RUN_LOG%":
  if exist "%RUN_LOG%" type "%RUN_LOG%"
)
pause
set "KEEP_MENU_OUTPUT=1"
exit /b 1

:finish
endlocal
exit /b 0
