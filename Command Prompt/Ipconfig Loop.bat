@echo off
:loop
ipconfig
timeout /t 0 >nul
goto loop
