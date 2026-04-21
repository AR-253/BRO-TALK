@echo off
echo Starting BRO-TALK Live Demo Environment...

:: Start Backend
start "Backend Server" cmd /k "cd backend && npm start"

:: Start Frontend with Tunnel URL
start "Frontend Server" cmd /k "cd frontend && set REACT_APP_API_URL=https://brotalk-api-meraj.loca.lt && npm start"

:: Start Tunnels
start "Backend Tunnel" cmd /k "lt --port 5000 --subdomain brotalk-api-meraj"
start "Frontend Tunnel" cmd /k "lt --port 3000 --subdomain brotalk-web-meraj"

echo.
echo ======================================================
echo BRO-TALK IS GOING LIVE!
echo ======================================================
echo Frontend Link: https://brotalk-web-meraj.loca.lt
echo Backend Link: https://brotalk-api-meraj.loca.lt
echo IP for Password: 72.255.39.79
echo ======================================================
echo.
echo Keep these windows open while showing the demo.
pause
