@echo off
title Slime Flip - Local Game Server
echo ============================================================
echo           SLIME FLIP - 2D GRAVITY PLATFORMER
echo ============================================================
echo Starting local web server...
echo.

:: Open default browser after 1 second
start "" http://localhost:8000

:: Start Python HTTP server (default on port 8000)
python -m http.server 8000

:: If Python isn't in path, try Node.js npx serve
if %ERRORLEVEL% NEQ 0 (
    echo Python not found, trying Node.js...
    npx -y serve . -l 8000
)

pause

