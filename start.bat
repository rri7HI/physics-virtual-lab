@echo off
echo Starting Visuallab-MERN Ecosystem...

:: Launch Backend
cd backend
start cmd /k "title Visuallab-BACKEND && node server.js"

:: Launch Frontend
cd ../frontend
start cmd /k "title Visuallab-FRONTEND && npm run dev"

echo Done. Backend on 3002, Frontend on 5173.
pause
