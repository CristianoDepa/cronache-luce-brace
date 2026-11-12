@echo off
setlocal
rem Applica clb-delta.zip (dalla cartella Download) sopra la versione BASE indicata qui sotto.
set BASE=0.16.2
set NUOVA=0.16.3
cd /d "%~dp0"
if not exist VERSIONE.txt ( echo Non trovo VERSIONE.txt: lancia lo script dalla cartella del progetto. & pause & exit /b 1 )
set /p ATTUALE=<VERSIONE.txt
if not "%ATTUALE%"=="%BASE%" (
  echo Versione installata: %ATTUALE%. Questo delta si applica solo sulla %BASE%.
  echo Usa lo ZIP completo con aggiorna.cmd.
  pause & exit /b 1
)
set DELTA=%USERPROFILE%\Downloads\clb-delta.zip
if not exist "%DELTA%" ( echo Non trovo %DELTA% & pause & exit /b 1 )
echo Applico il delta %BASE% -^> %NUOVA% ...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -LiteralPath '%DELTA%' -DestinationPath '%TEMP%\clb-delta' -Force; Copy-Item -Path '%TEMP%\clb-delta\*' -Destination '.' -Recurse -Force; if (Test-Path '%TEMP%\clb-delta\DELTA-ELIMINA.txt') { Get-Content '%TEMP%\clb-delta\DELTA-ELIMINA.txt' | Where-Object { $_.Trim() -ne '' } | ForEach-Object { Remove-Item -LiteralPath $_.Trim() -Force -ErrorAction SilentlyContinue } }; Remove-Item '.\DELTA-ELIMINA.txt' -Force -ErrorAction SilentlyContinue; Remove-Item '%TEMP%\clb-delta' -Recurse -Force"
if errorlevel 1 ( echo Applicazione fallita. & pause & exit /b 1 )
call npm install
call npm run typecheck
call npm test
echo.
echo Fatto: versione %NUOVA%.
pause
