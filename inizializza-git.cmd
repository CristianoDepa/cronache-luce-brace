@echo off
rem Prima impostazione di Git per CLB: crea il repository locale e il commit di partenza. Si lancia una volta sola.
cd /d "%~dp0"
where git >nul 2>nul
if errorlevel 1 (
  echo Git non risulta installato: installalo da https://git-scm.com e riprova.
  pause
  exit /b 1
)
if exist ".git" (
  echo Qui c'e' gia' un repository Git: non cambio nulla.
  git status --short
  pause
  exit /b 0
)
set /p VERSIONE=<VERSIONE.txt
git init
git add -A
git commit -m "CLB %VERSIONE%: punto di partenza"
git branch -M principale
echo.
echo Fatto. Ora un ramo per la prossima versione:  git switch -c v0.7.1
pause
