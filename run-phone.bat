@echo off
title FlowLedger - Run on Phone (Hot Reload, LOCAL data)
cd /d "%~dp0"

set "FLUTTER=D:\tools\flutter\bin\flutter.bat"
set "ADB=D:\Android\Sdk\platform-tools\adb.exe"

echo.
echo ==========================================
echo   FlowLedger - Hot reload on your phone
echo   (uses LOCAL api-mobile data on :3001)
echo ==========================================
echo.

REM ---- 1. Make sure the mobile API (:3001) is running ----
curl -s -o nul http://localhost:3001/ >nul 2>nul
if errorlevel 1 (
    echo [..] Starting FlowLedger Mobile API (:3001)...
    start "FlowLedger Mobile API" cmd /k "npm run dev:api-mobile"
    timeout /t 6 /nobreak >nul
) else (
    echo [OK] Mobile API running on :3001
)

REM ---- 2. Detect the connected phone ----
set "DEVICE="
for /f "skip=1 tokens=1,2" %%a in ('"%ADB%" devices') do (
    if "%%b"=="device" if not defined DEVICE set "DEVICE=%%a"
)
if not defined DEVICE (
    echo [ERROR] No phone detected. Enable USB debugging and connect your phone.
    pause
    exit /b 1
)
echo [OK] Phone found: %DEVICE%

REM ---- 3. Forward the phone's localhost:3001 -> this PC's :3001 (USB) ----
"%ADB%" -s %DEVICE% reverse tcp:3001 tcp:3001
if errorlevel 1 (
    echo [ERROR] adb reverse failed. Is USB debugging enabled?
    pause
    exit /b 1
)
echo [OK] adb reverse tcp:3001 tcp:3001

REM ---- 4. Launch with hot reload pointing at the LOCAL server ----
cd /d "%~dp0mobile"
echo.
echo ==========================================
echo   App launching... keep this window open.
echo   In this window press:
echo     r  = hot reload  (keeps app state)
echo     R  = hot restart (resets state)
echo     q  = quit
echo ==========================================
call "%FLUTTER%" run -d %DEVICE% --dart-define=API_BASE=http://127.0.0.1:3001 --dart-define=CRM_API_BASE=http://127.0.0.1:3100/api
pause
