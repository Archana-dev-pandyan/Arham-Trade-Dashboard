# Arham Trade Dashboard

A mock BSE trade API plus a live dashboard. A full pull can take up to 15 minutes, but connections are killed after 30 seconds, so nothing in this system waits on a long request.

## Structure
- `mock-bse/`: simulates the slow exchange API (port 4000)
- `server/`: backend, stores trades and pushes live updates (port 5000)
- `client/`: React dashboard (port 5173)

## Requirements
Node.js 18 or higher.

## Setup
```bash
cd mock-bse
npm install
cd ../server
npm install
cd ../client
npm install
```

## Run (three terminals)
```bash
cd mock-bse
node index.js 15000     # delay in ms. Omit the number for the default 15 minutes
```
```bash
cd server
node index.js
```
```bash
cd client
npm run dev
```
Open http://localhost:5173 and click **Start pull**.

## Configuring the delay
Pass milliseconds as an argument (`node index.js 60000`) or set `PULL_DELAY_MS`. Default is 900000 (15 minutes).

## API
| Service | Endpoint | Purpose |
|---|---|---|
| Mock BSE | `GET /getTrades?callbackUrl=...` | Returns 202 instantly, POSTs trades to the callback after the delay |
| Server | `POST /api/pull` | Starts a pull, returns immediately |
| Server | `GET /api/trades` | Returns trades stored so far |
| Server | `GET /api/events` | SSE stream: `trades` and `status` events |
| Server | `POST /api/callback` | Receives trades from the mock BSE |

## Known limitations
- Trades are stored in memory and are lost on restart.
- Single server instance, one pull at a time.
- No authentication or retry logic.