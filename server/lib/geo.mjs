const CAMPUS_CENTER = { lng: -73.6779, lat: 42.7296 };
const CAMPUS_BOUNDS = {
  north: 42.76,
  south: 42.7,
  east: -73.63,
  west: -73.73,
};

export const POPULAR_PLACES = [
  { name: "DCC", address: "Darrin Communications, RPI", lng: -73.6784, lat: 42.73, category: "campus" },
  { name: "Folsom Library", address: "110 8th St, Troy, NY", lng: -73.6779, lat: 42.7298, category: "campus" },
  { name: "ECAV", address: "East Campus Athletic Village", lng: -73.6726, lat: 42.7333, category: "campus" },
  { name: "Downtown Troy", address: "Downtown Troy, NY", lng: -73.6886, lat: 42.7262, category: "nearby" },
  { name: "Walmart Troy", address: "591 Hoosick St, Troy, NY", lng: -73.6723, lat: 42.7479, category: "nearby" },
  { name: "Stuyvesant Plaza", address: "Stuyvesant Plaza, Albany", lng: -73.7934, lat: 42.675, category: "nearby" },
];

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function haversineDistanceMeters(fromLat, fromLng, toLat, toLng) {
  const earthRadiusMeters = 6371000;
  const latDelta = toRadians(toLat - fromLat);
  const lngDelta = toRadians(toLng - fromLng);
  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.sin(lngDelta / 2) *
      Math.sin(lngDelta / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function buildCurvedLine(fromLng, fromLat, toLng, toLat) {
  const dx = toLng - fromLng;
  const dy = toLat - fromLat;
  const distance = Math.hypot(dx, dy) || 1;
  const normalLng = (-dy / distance) * 0.0022;
  const normalLat = (dx / distance) * 0.0012;
  const midLng = (fromLng + toLng) / 2;
  const midLat = (fromLat + toLat) / 2;

  return [
    [fromLng, fromLat],
    [fromLng + dx * 0.2 + normalLng * 0.5, fromLat + dy * 0.2 + normalLat * 0.5],
    [midLng + normalLng, midLat + normalLat],
    [fromLng + dx * 0.8 - normalLng * 0.35, fromLat + dy * 0.8 - normalLat * 0.35],
    [toLng, toLat],
  ];
}

export function buildFallbackRoute(fromLng, fromLat, toLng, toLat) {
  const geometry = {
    type: "LineString",
    coordinates: buildCurvedLine(fromLng, fromLat, toLng, toLat),
  };

  const directDistanceMeters = haversineDistanceMeters(fromLat, fromLng, toLat, toLng);
  const adjustedDistanceMeters = Math.max(120, directDistanceMeters * 1.18);
  const rideDurationSeconds = Math.max(180, Math.round((adjustedDistanceMeters / 4.5) * 0.65));

  return {
    code: "Ok",
    routes: [
      {
        distance: adjustedDistanceMeters,
        duration: rideDurationSeconds,
        geometry,
      },
    ],
    waypoints: [],
  };
}

export function searchLocalPlaces(query) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  return POPULAR_PLACES.filter(({ name, address }) => {
    return name.toLowerCase().includes(normalizedQuery) || address.toLowerCase().includes(normalizedQuery);
  }).map((place, index) => ({
    place_id: `local-${index}`,
    display_name: `${place.name}, ${place.address}`,
    lat: String(place.lat),
    lon: String(place.lng),
    importance: 0.9 - index * 0.05,
  }));
}

export async function geocodeSearch(query, fetchImpl = fetch) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "5");
  url.searchParams.set("viewbox", `${CAMPUS_BOUNDS.west},${CAMPUS_BOUNDS.north},${CAMPUS_BOUNDS.east},${CAMPUS_BOUNDS.south}`);
  url.searchParams.set("bounded", "0");
  url.searchParams.set("countrycodes", "us");

  try {
    const response = await fetchImpl(url, {
      headers: {
        "User-Agent": "RPI Taxi Local Server",
      },
      signal: AbortSignal.timeout(4500),
    });

    if (!response.ok) {
      throw new Error(`Geocoder returned ${response.status}`);
    }

    const payload = await response.json();
    if (!Array.isArray(payload) || payload.length === 0) {
      return searchLocalPlaces(query);
    }

    return payload.slice(0, 5);
  } catch {
    return searchLocalPlaces(query);
  }
}

export async function calculateRoute(fromLng, fromLat, toLng, toLat, fetchImpl = fetch) {
  const safeFromLng = clamp(fromLng, -180, 180);
  const safeFromLat = clamp(fromLat, -90, 90);
  const safeToLng = clamp(toLng, -180, 180);
  const safeToLat = clamp(toLat, -90, 90);

  const url = new URL(
    `https://router.project-osrm.org/route/v1/driving/${safeFromLng},${safeFromLat};${safeToLng},${safeToLat}`,
  );
  url.searchParams.set("overview", "full");
  url.searchParams.set("geometries", "geojson");

  try {
    const response = await fetchImpl(url, {
      headers: {
        "User-Agent": "RPI Taxi Local Server",
      },
      signal: AbortSignal.timeout(4500),
    });

    if (!response.ok) {
      throw new Error(`Router returned ${response.status}`);
    }

    const payload = await response.json();
    if (!payload?.routes?.[0]?.geometry) {
      throw new Error("Router response missing geometry");
    }

    return payload;
  } catch {
    return buildFallbackRoute(safeFromLng, safeFromLat, safeToLng, safeToLat);
  }
}

export function buildDefaultRide() {
  return {
    pickupAddress: "RPI Main Campus",
    pickupLng: CAMPUS_CENTER.lng,
    pickupLat: CAMPUS_CENTER.lat,
    destAddress: "Downtown Troy",
    destLng: -73.6886,
    destLat: 42.7262,
    eta: 3,
    rideDuration: 8,
    estimatedRideMin: 8,
    fare: "$0.00",
    arrivalTime: new Date(Date.now() + 11 * 60_000).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

