@echo off
set "PATH=%PATH%;C:\Program Files\nodejs"
cd /d "%~dp0"
echo Signing in to Expo (organization: gracies-delight-delicacies)...
call npx --yes eas-cli@latest login
echo.
echo Login finished. You can close this window and return to Qoder.
pause
