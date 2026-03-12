# rpi-taxi
Autonomy meets ridesharing — at RPI.

## Run locally

```bash
npm start
```

The app will be served at `http://127.0.0.1:5000`.

## What is included

- Static Tesla Robotaxi-style frontend bundle in [`RPI Taxi/index.html`](/Users/kaden/GitHub/rpi-taxi/RPI%20Taxi/index.html)
- Local Node server with ride, route, geocode, and Tesla demo endpoints in [`server/index.mjs`](/Users/kaden/GitHub/rpi-taxi/server/index.mjs)
- File-backed state persistence in `data/state.json` (created automatically on first run)
- Browser bridge that fixes the shipped bundle’s missing rider-to-driver sync in [`RPI Taxi/app-bridge.js`](/Users/kaden/GitHub/rpi-taxi/RPI%20Taxi/app-bridge.js)

## Test

```bash
npm test
```
