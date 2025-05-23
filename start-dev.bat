@echo off
echo.
echo ====================================
echo    CPR May18 Development Startup
echo ====================================
echo.

echo [1/4] Killing existing Node processes...
taskkill /f /im node.exe 2>nul || echo No Node processes to kill

echo.
echo [2/4] Waiting for ports to clear...
timeout /t 2 /nobreak >nul

echo.
echo [3/4] Starting Backend Server (Port 3001)...
start "Backend Server" cmd /k "cd backend && npm run dev"

echo.
echo [4/4] Starting Frontend Server (Port 5173)...
timeout /t 3 /nobreak >nul
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ====================================
echo  Development servers starting...
echo  Backend:  http://localhost:3001
echo  Frontend: http://localhost:5173
echo ====================================
echo.
echo Press any key to continue...
pause >nul 