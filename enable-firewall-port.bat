@echo off
title StudyMate AI - Open Firewall Port 8000
echo Requesting Administrator privileges to open Port 8000 in Windows Firewall...
powershell -Command "Start-Process powershell -ArgumentList '-NoProfile -Command \"New-NetFirewallRule -DisplayName ''StudyMate Backend Port 8000'' -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow -Force; Write-Host ''Firewall rule added successfully! You can close this window.''; Read-Host ''Press Enter to exit'''\" -Verb RunAs"
echo Done.

