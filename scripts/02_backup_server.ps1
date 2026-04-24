# 02_backup_server.ps1

$SERVER="root@89.33.237.149"
$PORT=2112
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host '=== BACKUP SERVER START ==='

# 1. Creează folder backup pe server
ssh -p $PORT $SERVER "mkdir -p /root/backups"

# 2. Backup DB
Write-Host 'Backing up DB...'
ssh -p $PORT $SERVER "sudo -u postgres pg_dump medeminder > /root/backups/db_$TIMESTAMP.sql"

if ($LASTEXITCODE -ne 0) {
    Write-Host 'DB backup failed'
    exit 1
}

Write-Host 'DB backup OK'

# 3. Backup cod
Write-Host 'Backing up code...'
ssh -p $PORT $SERVER "tar -czf /root/backups/code_$TIMESTAMP.tar.gz /root/medreminder"

if ($LASTEXITCODE -ne 0) {
    Write-Host 'Code backup failed'
    exit 1
}

Write-Host 'Code backup OK'

Write-Host '=== BACKUP OK ==='