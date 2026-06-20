@echo off
chcp 65001 >nul
cd /d "%~dp0.."
echo Starting AgentRoster...
node bin\cli.mjs
echo.
pause
