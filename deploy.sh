#!/bin/bash
set -euo pipefail

APP_ROOT="/root/medreminder"
BACKUP_DIR="/root/backups"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
DB_NAME="medreminder"
FRONTEND_ENV_FILE="$APP_ROOT/frontend/.env.production"

mkdir -p "$BACKUP_DIR"

cd "$APP_ROOT"

git checkout dev
git pull

sudo -u postgres pg_dump -d "$DB_NAME" -Fc -f "$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.dump"

cd "$APP_ROOT/backend"
npm install
npm run build

cd "$APP_ROOT/frontend"
cat > "$FRONTEND_ENV_FILE" <<'EOF'
VITE_API_BASE_URL=/api
VITE_SESSION_STORAGE_KEY=medreminder.session
EOF
npm install
npm run build

if command -v systemctl >/dev/null 2>&1; then
	sudo systemctl restart medreminder-backend
else
	pkill -f "$APP_ROOT/backend/dist/server.js" || true
	nohup node "$APP_ROOT/backend/dist/server.js" > "$APP_ROOT/backend/backend.log" 2>&1 &
fi

echo "Deploy completed. DB backup: $BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.dump"