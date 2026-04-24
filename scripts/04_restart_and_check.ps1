# 04_restart_and_check.ps1

$SERVER="root@89.33.237.149"
$PORT=2112

Write-Host '=== RESTART START ==='

# 1. Restart backend (zero downtime)
Write-Host 'Reloading backend...'
ssh -p $PORT $SERVER "pm2 reload medreminder"

if ($LASTEXITCODE -ne 0) {
    Write-Host 'Backend reload failed'
    exit 1
}

Write-Host 'Backend reload OK'

# 2. Reload nginx
Write-Host 'Reloading nginx...'
ssh -p $PORT $SERVER "systemctl reload nginx"

if ($LASTEXITCODE -ne 0) {
    Write-Host 'Nginx reload failed'
    exit 1
}

Write-Host 'Nginx reload OK'

# 3. Health check
Write-Host 'Checking API health...'

$response = Invoke-WebRequest -Uri "http://89.33.237.149" -UseBasicParsing -TimeoutSec 5

if ($response.StatusCode -ne 200) {
    Write-Host 'Health check failed'
    exit 1
}

Write-Host 'Health OK'

Write-Host '=== DEPLOY COMPLETE ==='