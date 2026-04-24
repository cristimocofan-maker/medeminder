Write-Host '=== FULL DEPLOY START ==='

cd E:\medreminder\scripts

.\01_precheck.ps1
if ($LASTEXITCODE -ne 0) { exit 1 }

.\02_backup_server.ps1
if ($LASTEXITCODE -ne 0) { exit 1 }

.\03_deploy_code.ps1
if ($LASTEXITCODE -ne 0) { exit 1 }

.\04_restart_and_check.ps1
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host '=== FULL DEPLOY SUCCESS ==='