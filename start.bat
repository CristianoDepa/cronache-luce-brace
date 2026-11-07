@echo off
rem Avvia il gioco con le opzioni di prova. DEV=1 abilita i comandi di prova; ORA=-1 usa l'ora vera (oppure un numero 0-24).
set DEV=1
set ORA=-1
cd /d "%~dp0"
set PARAMETRI=
if "%DEV%"=="1" set PARAMETRI=?dev=1
if not "%ORA%"=="-1" (
  if "%PARAMETRI%"=="" ( set PARAMETRI=?ora=%ORA% ) else ( set PARAMETRI=%PARAMETRI%^&ora=%ORA% )
)
start "" "http://localhost:5173/%PARAMETRI%"
call npm run dev
