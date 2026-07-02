# Holz-Monitor Stack

## Technologie-Plan

- Sensor: Arduino C
- API: Node.js / Express
- Datenbank: PostgreSQL
- Analyse: Python (FastAPI)
- Frontend: Next.js

## Aktueller Stand im Repo

- Frontend liegt in `dashboard` (Next.js).
- API liegt in `holz-monitor` (Express + PostgreSQL).
- Analyse-Service (FastAPI) ist als naechste Schicht vorgesehen.

## Lokales Setup

### 1) API starten

```powershell
Set-Location .\holz-monitor
Copy-Item .env.example .env
npm install
npm run dev
```

API laeuft standardmaessig auf `http://localhost:3001`.

### 2) Frontend starten

```powershell
Set-Location .\dashboard
Copy-Item .env.example .env.local
npm install
npm run dev
```

Frontend laeuft auf `http://localhost:3000` und ruft die API ueber `NEXT_PUBLIC_API_BASE_URL` auf.

## API Endpunkte

- `GET /health` prueft API + Datenbank Verbindung.
- `GET /sensor` liefert den neuesten Messwert pro Sensor.
- `POST /sensor` erwartet JSON:

```json
{
  "sensor_id": 1,
  "abstand": 42.5
}
```

Regeln:

- `sensor_id`: 1 bis 4
- `abstand`: 0 bis 200
