@echo off
title FlowLedger - Start All Services (Production)
cd /d "%~dp0"

echo.
echo ==========================================
echo   FlowLedger - Starting all services
echo ==========================================
echo.

REM ---- 1. Node check ----
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js not found. Please install it from https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js found

REM ---- 2. Install dependencies if missing ----
if not exist node_modules (
    echo [..] node_modules missing - running npm install...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed
        pause
        exit /b 1
    )
)
echo [OK] Dependencies ready

REM ---- 3. Build if production bundle missing ----
if not exist dist\server.cjs (
    echo [..] Production bundle missing - running npm run build...
    call npm run build
    if errorlevel 1 (
        echo [ERROR] Build failed
        pause
        exit /b 1
    )
)
echo [OK] Production bundle ready

REM ---- 4. Start Ollama if not running ----
curl -s -o nul http://localhost:11434/ >nul 2>nul
if errorlevel 1 (
    echo [..] Starting Ollama...
    start "" "%LOCALAPPDATA%\Programs\Ollama\ollama.exe"
    timeout /t 6 /nobreak >nul
)
echo [OK] Ollama ready

REM ---- 5. Start the API gateway (serves web + API) ----
echo Starting FlowLedger Production Server...
echo ==========================================

:: 4. Start the API Server in the background
start "FlowLedger Web API" cmd /c "npm run start -w @flowledger/api"

:: 5. Start the Mobile API Server in the background
start "FlowLedger Mobile API" cmd /c "npm run start -w @flowledger/api-mobile"

echo.
echo ==========================================
echo   FlowLedger is running!
echo   Web app   : http://localhost:3000
echo   Mobile API: http://localhost:3001
echo.
echo   Phone (same Wi-Fi): http://192.168.0.105:3000
echo ==========================================
echo.
echo Press any key to stop all servers...
pause >nul

:: Cleanup on exit
taskkill /FI "WindowTitle eq FlowLedger Web API*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq FlowLedger Mobile API*" /T /F >nul 2>&1
taskkill /IM ollama.exe /F >nul 2>&1

echo Servers stopped.
