@echo off
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "TS=%dt:~0,12%"
echo {"v":"%TS%"} > version.json
git add -A
git commit -m "deploy %TS%"
git push
echo.
echo デプロイ完了！iPadを開くだけで自動更新されます。
pause
