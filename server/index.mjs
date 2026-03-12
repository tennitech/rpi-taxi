import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildDefaultRide, calculateRoute, geocodeSearch } from "./lib/geo.mjs";
import { JsonStateStore } from "./lib/state-store.mjs";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const staticDir = path.join(projectRoot, "RPI Taxi");
const stateFile = path.join(projectRoot, "data", "state.json");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
};

function json(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

function text(response, statusCode, payload, contentType = "text/plain; charset=utf-8") {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": contentType,
  });
  response.end(payload);
}

function parseNumber(value, fallback) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function parseRidePayload(body) {
  const defaultRide = buildDefaultRide();
  const eta = parseNumber(body?.eta, defaultRide.eta);
  const rideDuration = parseNumber(body?.rideDuration, defaultRide.rideDuration);

  return {
    pickupAddress: String(body?.pickupAddress ?? defaultRide.pickupAddress),
    pickupLng: parseNumber(body?.pickupLng, defaultRide.pickupLng),
    pickupLat: parseNumber(body?.pickupLat, defaultRide.pickupLat),
    destAddress: String(body?.destAddress ?? defaultRide.destAddress),
    destLng: parseNumber(body?.destLng, defaultRide.destLng),
    destLat: parseNumber(body?.destLat, defaultRide.destLat),
    eta,
    rideDuration,
    estimatedRideMin: parseNumber(body?.estimatedRideMin, rideDuration),
    fare: String(body?.fare ?? "$0.00"),
    arrivalTime: String(body?.arrivalTime ?? defaultRide.arrivalTime),
    routeGeojson: body?.routeGeojson ?? null,
  };
}

async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON body");
  }
}

function updateTeslaVehicleState(teslaState) {
  teslaState.updatedAt = new Date().toISOString();
  teslaState.vehicle_state.locked = teslaState.locked;
  return teslaState;
}

async function serveStaticAsset(requestPath, response) {
  const relativePath = requestPath === "/" ? "/index.html" : requestPath;
  const filePath = path.join(staticDir, relativePath);
  const normalizedPath = path.normalize(filePath);

  if (!normalizedPath.startsWith(staticDir)) {
    json(response, 403, { error: "Forbidden" });
    return true;
  }

  try {
    await access(normalizedPath);
    const extension = path.extname(normalizedPath);
    const contentType = contentTypes[extension] ?? "application/octet-stream";
    const payload = await readFile(normalizedPath);
    response.writeHead(200, {
      "Cache-Control": extension === ".html" ? "no-store" : "public, max-age=31536000, immutable",
      "Content-Type": contentType,
    });
    response.end(payload);
    return true;
  } catch {
    if (!path.extname(requestPath)) {
      const fallback = await readFile(path.join(staticDir, "index.html"));
      response.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Type": "text/html; charset=utf-8",
      });
      response.end(fallback);
      return true;
    }

    return false;
  }
}

export async function createAppServer(options = {}) {
  const store = await new JsonStateStore(options.stateFile ?? stateFile).init();

  const server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");
    const { pathname, searchParams } = requestUrl;

    try {
      if (request.method === "GET" && pathname === "/api/health") {
        json(response, 200, { ok: true });
        return;
      }

      if (request.method === "GET" && pathname === "/api/rides") {
        const rides = [...store.getState().rides].sort((left, right) => {
          return new Date(right.updatedAt ?? right.createdAt ?? 0) - new Date(left.updatedAt ?? left.createdAt ?? 0);
        });
        json(response, 200, rides);
        return;
      }

      if (request.method === "POST" && pathname === "/api/rides") {
        const body = await readJsonBody(request);
        const now = new Date().toISOString();
        const ride = {
          id: randomUUID(),
          status: String(body?.status ?? "pending"),
          createdAt: now,
          updatedAt: now,
          ...parseRidePayload(body),
        };

        await store.update((state) => {
          state.rides.unshift(ride);
          return state;
        });

        json(response, 201, ride);
        return;
      }

      if (request.method === "PATCH" && pathname.startsWith("/api/rides/")) {
        const rideId = pathname.slice("/api/rides/".length);
        const body = await readJsonBody(request);
        let updatedRide = null;

        await store.update((state) => {
          state.rides = state.rides.map((ride) => {
            if (ride.id !== rideId) {
              return ride;
            }

            updatedRide = {
              ...ride,
              ...body,
              updatedAt: new Date().toISOString(),
            };
            return updatedRide;
          });
          return state;
        });

        if (!updatedRide) {
          json(response, 404, { error: "Ride not found" });
          return;
        }

        json(response, 200, updatedRide);
        return;
      }

      if (request.method === "GET" && pathname === "/api/tesla/status") {
        const state = store.getState();
        const activeRide = state.rides.find((ride) => ride.status === "in_ride");
        const queuedRide = state.rides.find((ride) => ["pending", "driver_accepted", "arrived"].includes(ride.status));
        const tesla = structuredClone(state.tesla);
        tesla.drive_state.speed = activeRide ? 28 : queuedRide ? 9 : 0;
        tesla.battery_level = Math.max(40, tesla.battery_level - Math.min(state.rides.length, 8));
        tesla.battery_range = Math.max(120, tesla.battery_range - Math.min(state.rides.length * 2, 20));
        updateTeslaVehicleState(tesla);
        json(response, 200, tesla);
        return;
      }

      if (request.method === "POST" && pathname.startsWith("/api/tesla/")) {
        const command = pathname.slice("/api/tesla/".length);
        const body = await readJsonBody(request);
        let payload = null;

        await store.update((state) => {
          const tesla = state.tesla;

          switch (command) {
            case "flash-lights":
              tesla.lightsFlashed = true;
              tesla.lastFlashAt = new Date().toISOString();
              payload = { ok: true, result: true, command, state: updateTeslaVehicleState(tesla) };
              break;
            case "honk-horn":
              tesla.lastHornAt = new Date().toISOString();
              payload = { ok: true, result: true, command, state: updateTeslaVehicleState(tesla) };
              break;
            case "unlock":
              tesla.locked = false;
              payload = { ok: true, result: true, command, state: updateTeslaVehicleState(tesla) };
              break;
            case "lock":
              tesla.locked = true;
              payload = { ok: true, result: true, command, state: updateTeslaVehicleState(tesla) };
              break;
            case "trunk":
              if (body?.which === "front") {
                tesla.frunkOpen = !tesla.frunkOpen;
              } else {
                tesla.trunkOpen = !tesla.trunkOpen;
              }
              payload = { ok: true, result: true, command, state: updateTeslaVehicleState(tesla) };
              break;
            case "climate":
              tesla.climate_state.inside_temp = parseNumber(body?.temp, tesla.climate_state.inside_temp);
              payload = { ok: true, result: true, command, state: updateTeslaVehicleState(tesla) };
              break;
            default:
              payload = { ok: false, error: "Unknown Tesla command" };
          }

          return state;
        });

        json(response, payload?.ok === false ? 404 : 200, payload);
        return;
      }

      if (request.method === "GET" && pathname === "/api/geocode/search") {
        const query = searchParams.get("q") ?? "";
        const results = await geocodeSearch(query);
        json(response, 200, results);
        return;
      }

      if (request.method === "GET" && pathname === "/api/route") {
        const fromLng = parseNumber(searchParams.get("fromLng"), -73.6779);
        const fromLat = parseNumber(searchParams.get("fromLat"), 42.7296);
        const toLng = parseNumber(searchParams.get("toLng"), -73.6886);
        const toLat = parseNumber(searchParams.get("toLat"), 42.7262);
        const route = await calculateRoute(fromLng, fromLat, toLng, toLat);
        json(response, 200, route);
        return;
      }

      const served = await serveStaticAsset(pathname, response);
      if (!served) {
        json(response, 404, { error: "Not found" });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      json(response, 500, {
        error: message,
      });
    }
  });

  return server;
}

async function start() {
  const port = Number(process.env.PORT ?? 5000);
  const host = process.env.HOST ?? "127.0.0.1";
  const server = await createAppServer();

  server.listen(port, host, () => {
    console.log(`RPI Taxi running at http://${host}:${port}`);
  });
}

const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMainModule) {
  start();
}

