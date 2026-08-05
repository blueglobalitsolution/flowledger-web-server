@echo off
title FlowLedger - Development Mode (Hot Reload)
cd /d "%~dp0"

echo.
echo ==========================================
echo   FlowLedger - Dev servers (hot reload)
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

REM ---- 3. Start Ollama if not running ----
curl -s -o nul http://localhost:11434/ >nul 2>nul
if errorlevel 1 (
    echo [..] Starting Ollama...
    start "" "%LOCALAPPDATA%\Programs\Ollama\ollama.exe"
    timeout /t 6 /nobreak >nul
)
echo [OK] Ollama ready

REM ---- 4. Start dev servers (api + app + admin + superadmin) ----
echo [..] Starting dev servers...
start "FlowLedger Dev (npm run dev)" cmd /k "npm run dev"

timeout /t 8 /nobreak >nul
start "" http://localhost:5173

echo.
echo ==========================================
echo   Dev servers starting...
echo   App       : http://localhost:5173
echo   Admin     : http://localhost:5174
echo   SuperAdmin: http://localhost:5175
echo   API       : http://localhost:3000
echo ==========================================
echo.
pause
