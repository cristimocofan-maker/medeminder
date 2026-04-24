# 01_precheck.ps1

Write-Host '=== PRECHECK START ==='

# 1. Verifică dacă ești în folder corect
if (!(Test-Path "E:\medreminder\backend")) {
    Write-Host '❌ Backend folder missing'
    exit 1
}

if (!(Test-Path "E:\medreminder\frontend")) {
    Write-Host '❌ Frontend folder missing'
    exit 1
}

Write-Host '✔ Folders OK'

# 2. Verifică node_modules backend
if (!(Test-Path "E:\medreminder\backend\node_modules")) {
    Write-Host '❌ backend node_modules missing'
    exit 1
}

# 3. Verifică node_modules frontend
if (!(Test-Path "E:\medreminder\frontend\node_modules")) {
    Write-Host '❌ frontend node_modules missing'
    exit 1
}

Write-Host '✔ node_modules OK'

# 4. Build frontend
Write-Host '🔨 Building frontend...'
cd E:\medreminder\frontend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host '❌ Frontend build failed'
    exit 1
}
Write-Host '✔ Frontend build OK'

# 5. Verifică .env backend
if (!(Test-Path "E:\medreminder\backend\.env")) {
    Write-Host '❌ backend .env missing'
    exit 1
}

Write-Host '✔ .env exists'

# 6. Test DB connection
Write-Host '🔌 Testing DB connection...'

cd E:\medreminder\backend

node -e "require('dotenv').config(); const { Client } = require('pg'); (async () => { const c = new Client({ host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD || undefined }); await c.connect(); console.log('DB OK'); await c.end(); })().catch(e => { console.error('DB FAIL', e.message); process.exit(1); });"

if ($LASTEXITCODE -ne 0) {
    Write-Host '❌ DB connection failed'
    exit 1
}

Write-Host '✔ DB connection OK'

Write-Host '=== PRECHECK OK ==='