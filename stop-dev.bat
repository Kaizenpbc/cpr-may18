@echo off
echo.
echo ====================================
echo    CPR May18 Development Shutdown
echo ====================================
echo.

echo [1/3] Stopping all Node processes...
taskkill /f /im node.exe 2>nul || echo No Node processes to kill

echo.
echo [2/3] Waiting for processes to terminate...
timeout /t 2 /nobreak >nul

echo.
echo [3/3] Checking port status...
echo.
echo Port 3001 (Backend):
netstat -ano | findstr ":3001" || echo   ✓ Port 3001 is free

echo.
echo Port 5173 (Frontend):
netstat -ano | findstr ":5173" || echo   ✓ Port 5173 is free

echo.
echo ====================================
echo  All development servers stopped
echo ====================================
echo.
pause 