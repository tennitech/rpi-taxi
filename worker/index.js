const DESTINATION_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
const ROUTE_URL = "https://router.project-osrm.org/route/v1/driving";
const WALK_ROUTE_URL = "https://router.project-osrm.org/route/v1/foot";
const REQUEST_TIMEOUT_MS = 8_000;
const WALK_FALLBACK_METERS_PER_SECOND = 1.35;

const SERVICE_AREA_COORDS = [
  [
    [42.7548, -73.7255],
    [42.7506, -73.7008],
    [42.7534, -73.6678],
    [42.7426, -73.6378],
    [42.7248, -73.6292],
    [42.7058, -73.6374],
    [42.6978, -73.6628],
    [42.6986, -73.6938],
    [42.7098, -73.7194],
    [42.7306, -73.7278],
  ],
  [
    [43.681, -73.713],
    [43.682, -73.625],
    [43.655, -73.602],
    [43.605, -73.604],
    [43.548, -73.62],
    [43.525, -73.651],
    [43.535, -73.699],
    [43.575, -73.722],
    [43.632, -73.724],
  ],
];

function createGeofenceViewbox(coords) {
  const bounds = coords.reduce(
    (result, [lat, lng]) => ({
      maxLat: Math.max(result.maxLat, lat),
      maxLng: Math.max(result.maxLng, lng),
      minLat: Math.min(result.minLat, lat),
      minLng: Math.min(result.minLng, lng),
    }),
    {
      maxLat: Number.NEGATIVE_INFINITY,
      maxLng: Number.NEGATIVE_INFINITY,
      minLat: Number.POSITIVE_INFINITY,
      minLng: Number.POSITIVE_INFINITY,
    },
  );

  return `${bounds.minLng},${bounds.maxLat},${bounds.maxLng},${bounds.minLat}`;
}

const GEOFENCE_VIEWBOX = createGeofenceViewbox(SERVICE_AREA_COORDS.flat());

function clampInteger(value, fallback, min, max) {
  const parsedValue = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsedValue)
    ? Math.min(Math.max(parsedValue, min), max)
    : fallback;
}

function parseCoordinate(value) {
  const coordinate = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(coordinate) ? coordinate : null;
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    },
    status,
  });
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      "User-Agent": "RPI Taxi/1.0 (Cloudflare Worker)",
      ...options.headers,
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Upstream request failed with status ${response.status}`);
  }

  return response.json();
}

async function handleDestinationSearch(url) {
  const query = url.searchParams.get("q")?.trim();
  if (!query) {
    return json([]);
  }

  const searchParams = new URLSearchParams({
    addressdetails: "1",
    countrycodes: "us",
    dedupe: "1",
    format: "jsonv2",
    limit: String(clampInteger(url.searchParams.get("limit"), 10, 1, 25)),
    namedetails: "1",
    q: query,
    viewbox: GEOFENCE_VIEWBOX,
  });

  if (url.searchParams.get("bounded") === "1") {
    searchParams.set("bounded", "1");
  }

  try {
    const payload = await fetchJson(`${DESTINATION_SEARCH_URL}?${searchParams}`);
    return json(Array.isArray(payload) ? payload : []);
  } catch {
    return json({ error: "destination_search_unavailable" }, 502);
  }
}

function fastestRoute(payload) {
  return (Array.isArray(payload?.routes) ? payload.routes : [])
    .filter((route) => Number.isFinite(route?.duration))
    .sort((left, right) => left.duration - right.duration)[0];
}

async function fetchRoute(baseUrl, coordinates) {
  const searchParams = new URLSearchParams({
    alternatives: "false",
    geometries: "geojson",
    overview: "full",
    steps: "false",
  });
  const payload = await fetchJson(`${baseUrl}/${coordinates}?${searchParams}`);
  const route = fastestRoute(payload);

  if (!route?.geometry?.coordinates?.length) {
    throw new Error("Route geometry unavailable");
  }

  return {
    distance: route.distance,
    duration: route.duration,
    geometry: route.geometry,
    waypoints: Array.isArray(payload?.waypoints) ? payload.waypoints : [],
  };
}

async function handleRideRoute(url) {
  const pickupLat = parseCoordinate(url.searchParams.get("pickupLat"));
  const pickupLng = parseCoordinate(url.searchParams.get("pickupLng"));
  const dropoffLat = parseCoordinate(url.searchParams.get("dropoffLat"));
  const dropoffLng = parseCoordinate(url.searchParams.get("dropoffLng"));
  const coordinatesAreValid =
    pickupLat !== null &&
    pickupLng !== null &&
    dropoffLat !== null &&
    dropoffLng !== null &&
    Math.abs(pickupLat) <= 90 &&
    Math.abs(dropoffLat) <= 90 &&
    Math.abs(pickupLng) <= 180 &&
    Math.abs(dropoffLng) <= 180;

  if (!coordinatesAreValid) {
    return json({ error: "invalid_route_coordinates" }, 400);
  }

  try {
    const drive = await fetchRoute(
      ROUTE_URL,
      `${pickupLng},${pickupLat};${dropoffLng},${dropoffLat}`,
    );
    const pickupWaypoint = drive.waypoints[0];
    const snappedLocation = pickupWaypoint?.location;
    let walk = null;

    if (Array.isArray(snappedLocation) && snappedLocation.length >= 2) {
      const [snappedLng, snappedLat] = snappedLocation;
      try {
        walk = await fetchRoute(
          WALK_ROUTE_URL,
          `${pickupLng},${pickupLat};${snappedLng},${snappedLat}`,
        );
      } catch {
        const fallbackDistance = Number.isFinite(pickupWaypoint?.distance)
          ? pickupWaypoint.distance
          : 0;
        walk = {
          distance: fallbackDistance,
          duration: fallbackDistance / WALK_FALLBACK_METERS_PER_SECOND,
          geometry: {
            coordinates: [
              [pickupLng, pickupLat],
              [snappedLng, snappedLat],
            ],
            type: "LineString",
          },
        };
      }
    }

    return json({ ...drive, walk });
  } catch {
    return json({ error: "ride_route_unavailable" }, 502);
  }
}

async function serveAsset(request, env) {
  let response = await env.ASSETS.fetch(request);
  const url = new URL(request.url);

  if (response.status === 404 && !url.pathname.split("/").pop()?.includes(".")) {
    response = await env.ASSETS.fetch(new Request(new URL("/", request.url), request));
  }

  const headers = new Headers(response.headers);
  headers.set("Permissions-Policy", "geolocation=(self)");

  if (headers.get("Content-Type")?.includes("text/html")) {
    const html = (await response.text()).replaceAll("__SITE_ORIGIN__", url.origin);
    headers.set("Cache-Control", "no-store");
    return new Response(html, {
      headers,
      status: response.status,
      statusText: response.statusText,
    });
  }

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health" || url.pathname === "/api/health") {
      return json({ ok: true });
    }

    if (url.pathname === "/api/destination-search") {
      return handleDestinationSearch(url);
    }

    if (url.pathname === "/api/ride-route") {
      return handleRideRoute(url);
    }

    return serveAsset(request, env);
  },
};

export default worker;
