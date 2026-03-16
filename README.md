# Asset Management Service

## Development
```bash
cd asset_management
npm install
npm run dev
```

## Docker Debug
```bash
docker compose -f docker-compose.debug.yml up asset_management
```

## Docker Prod Build
```bash
docker compose -f docker-compose.prod.yml up --build asset_management
```

API endpoints:
- GET /api/health
- GET /api/assets

Uses existing `asset_management` MySQL DB.
Port: 3002 (host):3001 (container)

