@echo off
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "TS=%dt:~0,12%"
powershell -Command "$c = Get-Content sw.js -Raw; $c = $c -replace \"hachibeipOS-[^']+\", \"hachibeipOS-%TS%\"; Set-Content sw.js $c"
git add -A
git commit -m "deploy %TS%"
git push
echo.
echo デプロイ完了！iPadのSafariを開くだけで更新されます。
pause
