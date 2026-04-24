# 03_deploy_code.ps1

$SERVER="root@89.33.237.149"
$PORT=2112

Write-Host '=== DEPLOY START ==='

# 1. Upload cod (fără node_modules)
Write-Host 'Uploading code...'

Write-Host 'Creating quick runtime backup...'
ssh -p $PORT $SERVER "cp -r /root/medreminder /root/medreminder_backup_runtime"

rsync -avz --delete `
  --exclude node_modules `
  --exclude .git `
  --exclude dist `
  E:\medreminder\ `
  -e "ssh -p $PORT" `
 "${SERVER}:/root/medreminder/"

if ($LASTEXITCODE -ne 0) {
    Write-Host 'Upload failed'
    exit 1
}

Write-Host 'Upload OK'

# 2. Install backend deps
Write-Host 'Installing backend deps...'

ssh -p $PORT $SERVER "cd /root/medreminder/backend && npm install"

if ($LASTEXITCODE -ne 0) {
    Write-Host 'Backend install failed'
    exit 1
}

Write-Host 'Backend install OK'

# 3. Build frontend
Write-Host 'Building frontend on server...'

ssh -p $PORT $SERVER "cd /root/medreminder/frontend && npm install && npm run build"

if ($LASTEXITCODE -ne 0) {
    Write-Host 'Frontend build failed'
    exit 1
}

Write-Host 'Frontend build OK'

Write-Host '=== DEPLOY OK ==='