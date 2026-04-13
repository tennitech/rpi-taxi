import { createServer } from "node:http";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GEOFENCE_COORDS } from "../RPI Taxi/geofence.js";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const appDir = path.join(projectRoot, "RPI Taxi");
const fontsDir = path.join(projectRoot, "fonts");
const DESTINATION_SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;
const DESTINATION_SEARCH_CACHE_LIMIT = 200;
const DESTINATION_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
const GEOFENCE_VIEWBOX = createGeofenceViewbox(GEOFENCE_COORDS);
const destinationSearchCache = new Map();

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

function isSafePath(rootDir, candidatePath) {
  const relativePath = path.relative(rootDir, candidatePath);
  return relativePath && !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
}

async function tryRead(filePath) {
  await access(filePath);
  return readFile(filePath);
}

function serve(response, statusCode, body, headers = {}) {
  response.writeHead(statusCode, headers);
  response.end(body);
}

function clampInteger(value, fallback, min, max) {
  const parsedValue = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }

  return Math.min(Math.max(parsedValue, min), max);
}

function createGeofenceViewbox(coords) {
  const bounds = coords.reduce(
    (result, [lat, lng]) => {
      return {
        minLat: Math.min(result.minLat, lat),
        maxLat: Math.max(result.maxLat, lat),
        minLng: Math.min(result.minLng, lng),
        maxLng: Math.max(result.maxLng, lng),
      };
    },
    {
      minLat: Number.POSITIVE_INFINITY,
      maxLat: Number.NEGATIVE_INFINITY,
      minLng: Number.POSITIVE_INFINITY,
      maxLng: Number.NEGATIVE_INFINITY,
    },
  );

  return `${bounds.minLng},${bounds.maxLat},${bounds.maxLng},${bounds.minLat}`;
}

function readDestinationSearchCache(cacheKey) {
  const cachedEntry = destinationSearchCache.get(cacheKey);

  if (!cachedEntry) {
    return null;
  }

  if (cachedEntry.expiresAt <= Date.now()) {
    destinationSearchCache.delete(cacheKey);
    return null;
  }

  return cachedEntry.payload;
}

function writeDestinationSearchCache(cacheKey, payload) {
  destinationSearchCache.set(cacheKey, {
    expiresAt: Date.now() + DESTINATION_SEARCH_CACHE_TTL_MS,
    payload,
  });

  if (destinationSearchCache.size <= DESTINATION_SEARCH_CACHE_LIMIT) {
    return;
  }

  const oldestKey = destinationSearchCache.keys().next().value;
  if (oldestKey) {
    destinationSearchCache.delete(oldestKey);
  }
}

async function fetchDestinationSearchResults(requestUrl) {
  const query = requestUrl.searchParams.get("q")?.trim();

  if (!query) {
    return [];
  }

  const searchParams = new URLSearchParams({
    addressdetails: "1",
    countrycodes: "us",
    dedupe: "1",
    format: "jsonv2",
    limit: String(clampInteger(requestUrl.searchParams.get("limit"), 10, 1, 25)),
    namedetails: "1",
    q: query,
    viewbox: GEOFENCE_VIEWBOX,
  });

  if (requestUrl.searchParams.get("bounded") === "1") {
    searchParams.set("bounded", "1");
  }

  const upstreamUrl = `${DESTINATION_SEARCH_URL}?${searchParams.toString()}`;
  const cachedPayload = readDestinationSearchCache(upstreamUrl);
  if (cachedPayload) {
    return cachedPayload;
  }

  const response = await fetch(upstreamUrl, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "en-US,en;q=0.9",
      "User-Agent": "RPI Taxi/1.0 (local destination search proxy)",
    },
    signal: AbortSignal.timeout(6500),
  });

  if (!response.ok) {
    throw new Error(`Destination search upstream failed with status ${response.status}`);
  }

  const payload = await response.json();
  const results = Array.isArray(payload) ? payload : [];
  writeDestinationSearchCache(upstreamUrl, results);
  return results;
}

async function handleDestinationSearch(requestUrl, response) {
  try {
    const payload = await fetchDestinationSearchResults(requestUrl);
    serve(response, 200, JSON.stringify(payload), {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    });
  } catch {
    serve(response, 502, JSON.stringify({ error: "destination_search_unavailable" }), {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    });
  }
}

function resolveAssetPath(urlPathname) {
  if (urlPathname === "/" || urlPathname === "") {
    return path.join(appDir, "index.html");
  }

  if (urlPathname === "/health") {
    return null;
  }

  if (urlPathname.startsWith("/fonts/")) {
    const candidate = path.resolve(projectRoot, `.${urlPathname}`);
    return isSafePath(fontsDir, candidate) ? candidate : null;
  }

  const candidate = path.resolve(appDir, `.${urlPathname}`);
  return isSafePath(appDir, candidate) ? candidate : null;
}

async function requestHandler(request, response) {
  const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
  const pathname = decodeURIComponent(requestUrl.pathname);

  if (pathname === "/health") {
    serve(response, 200, JSON.stringify({ ok: true }), {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    });
    return;
  }

  if (pathname === "/api/destination-search") {
    await handleDestinationSearch(requestUrl, response);
    return;
  }

  let filePath = resolveAssetPath(pathname);
  if (!filePath) {
    serve(response, 404, "Not found", {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    });
    return;
  }

  try {
    let body = await tryRead(filePath);
    const extension = path.extname(filePath).toLowerCase();
    const contentType = contentTypes[extension] ?? "application/octet-stream";
    const cacheControl = "no-store";

    serve(response, 200, body, {
      "Cache-Control": cacheControl,
      "Content-Type": contentType,
    });
  } catch {
    if (!path.extname(pathname)) {
      filePath = path.join(appDir, "index.html");
      try {
        const body = await tryRead(filePath);
        serve(response, 200, body, {
          "Cache-Control": "no-store",
          "Content-Type": contentTypes[".html"],
        });
        return;
      } catch {
        // Fall through to 404 below.
      }
    }

    serve(response, 404, "Not found", {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    });
  }
}

export { requestHandler };

export function startServer(options = {}) {
  const host = options.host ?? process.env.HOST ?? "127.0.0.1";
  const port = Number(options.port ?? process.env.PORT ?? 5000);
  const server = createServer(requestHandler);

  server.listen(port, host, () => {
    console.log(`RPI Taxi running at http://${host}:${port}`);
  });

  return server;
}

const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMainModule) {
  startServer();
}
