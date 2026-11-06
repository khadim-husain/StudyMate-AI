@echo off
title StudyMate AI - Build Android APK
cd /d "%~dp0mobile"
echo ========================================================
echo        StudyMate AI - Build Standalone Android APK
echo ========================================================
echo.
echo This command builds an installable .apk file using EAS Build.
echo.
echo 1. If prompted, log in with your free Expo account (https://expo.dev).
echo 2. Once the build completes, EAS provides a direct download link and QR code.
echo.
call npx eas-cli build -p android --profile preview
echo.
pause

