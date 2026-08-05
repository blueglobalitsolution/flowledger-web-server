@echo off
title FlowLedger - Run on Phone (Hot Reload)
cd /d "%~dp0"

set "FLUTTER=D:\tools\flutter\bin\flutter.bat"
set "ADB=D:\Android\Sdk\platform-tools\adb.exe"

echo.
echo ==========================================
echo   FlowLedger - Hot reload on your phone
echo ==========================================
echo.

REM ---- 1. Make sure the gateway is running ----
curl -s -o nul http://localhost:3000/api/health >nul 2>nul
if errorlevel 1 (
    echo [..] Starting FlowLedger Gateway...
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-gateway.ps1"
    timeout /t 5 /nobreak >nul
) else (
    echo [OK] Gateway running on :3000
)

REM ---- 2. Detect the PC's LAN IP (what the phone connects to) ----
powershell -NoProfile -Command "(Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -ne $null -and $_.NetAdapter.Status -eq 'Up' } | Select-Object -First 1).IPv4Address.IPAddress" > "%TEMP%\flowledger_ip.txt" 2>nul
set /p API_IP=<"%TEMP%\flowledger_ip.txt"
if not defined API_IP set "API_IP=192.168.1.133"
echo [OK] Phone will connect to: http://%API_IP%:3000/api

REM ---- 3. Detect the connected phone ----
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

REM ---- 4. Launch with hot reload ----
cd /d "%~dp0mobile"
echo.
echo ==========================================
echo   App launching... keep this window open.
echo   In this window press:
echo     r  = hot reload  (keeps app state)
echo     R  = hot restart (resets state)
echo     q  = quit
echo ==========================================
call "%FLUTTER%" run -d %DEVICE% --dart-define=API_BASE=http://%API_IP%:3000/api
pause
