@echo off

color a
echo Hello, do you love me? (Answer in only yes/no)
set/p input=
if /i %input%==Yes goto love
if /i %input%==No goto hate
if /i not %input%==Yes, No goto 1

:love
pause
exit

:hate
timeout 3
shutdown -s -t 0
