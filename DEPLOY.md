# MedReminder Deploy Flow

## Local development

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Recommended local frontend environment:

```env
VITE_API_BASE_URL=http://127.0.0.1:4000
VITE_SESSION_STORAGE_KEY=medreminder.session
```

## Local validation before deploy

```bash
cd backend
npm run build
npm test -- --runInBand

cd ../frontend
npm run build
```

## Database backup and restore

Local export:

```bash
pg_dump -h 127.0.0.1 -U postgres -d medreminder -Fc -f medreminder_local_$(date +%Y%m%d_%H%M%S).dump
```

Server backup:

```bash
sudo -u postgres pg_dump -d medreminder -Fc -f /root/backups/medreminder_$(date +%Y%m%d_%H%M%S).dump
```

Server restore:

```bash
sudo -u postgres pg_restore -d medreminder --clean --if-exists /root/backups/medreminder_YYYYMMDD_HHMMSS.dump
```

Incremental schema changes must be stored as new SQL files in `backend/sql/` and applied explicitly:

```bash
sudo -u postgres psql -d medreminder -f /root/medreminder/backend/sql/FILE_NAME.sql
```

## Production frontend configuration

The frontend uses `VITE_API_BASE_URL` from `frontend/src/api/client.ts`.
Production should use a relative API base URL:

```env
VITE_API_BASE_URL=/api
VITE_SESSION_STORAGE_KEY=medreminder.session
```

The file template is available at `frontend/.env.production.example`.

## Nginx expectation

The frontend build expects `/api` to proxy to the backend running on `127.0.0.1:4000`.

Example:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:4000/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location / {
    try_files $uri $uri/ /index.html;
}
```

## Server deploy

Use the root deploy script:

```bash
cd /root/medreminder
./deploy.sh
```

It will:

1. Pull the `dev` branch.
2. Create a PostgreSQL backup.
3. Build the backend.
4. Write `frontend/.env.production` with the correct API base URL.
5. Build the frontend.
6. Restart the backend.

## Post-deploy verification

```bash
curl -i http://127.0.0.1:4000/auth/login || true
grep -R "undefined/api" /root/medreminder/frontend/dist || true
```

## Rollback

Restore the latest backup if needed:

```bash
sudo -u postgres pg_restore -d medreminder --clean --if-exists /root/backups/medreminder_YYYYMMDD_HHMMSS.dump
```

Then redeploy the previous commit and rebuild.