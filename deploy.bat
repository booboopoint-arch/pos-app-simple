@echo off
powershell -Command "$ts = Get-Date -Format 'yyyyMMddHHmm'; Set-Content version.json ('{\"v\":\"' + $ts + '\"}'); git add -A; git commit -m ('deploy ' + $ts); git push"
echo.
echo デプロイ完了！iPadを開くだけで自動更新されます。
pause
