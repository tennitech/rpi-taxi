# rpi-taxi

Minimal mobile PWA starter for an RPI Tesla-style ride-hailing app.

## Run locally

```bash
npm start
```

The app is served at `http://127.0.0.1:5000`.

## Build for Sites

```bash
npm run build
```

The Sites build emits a Cloudflare Worker bundle in `dist/`. GitHub remains the
source of truth; Sites publishes an exact commit from `main`.

## Scope

- Mobile-first shell with PWA manifest and service worker
- One full-screen Tesla-inspired dark map scene
- No booking sheet or other app UI yet
