import { createServer } from "node:http";
import { randomInt, randomUUID } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { deliverVerificationCode } from "./lib/email.mjs";
import { loadLocalEnv } from "./lib/env.mjs";
import { buildDefaultRide, buildFallbackRoute, calculateRoute, geocodeSearch } from "./lib/geo.mjs";
import { JsonStateStore } from "./lib/state-store.mjs";
import {
  buildTeslaAuthorizeUrl,
  buildTeslaKeyPairUrl,
  buildTeslaShareText,
  createTeslaOauthState,
  exchangeTeslaCodeForTokens,
  fetchTeslaVehicleData,
  fetchTeslaVehicles,
  getTeslaConfig,
  isTeslaConfigured,
  sendTeslaCommand,
  sendTeslaOwnerApiShare,
} from "./lib/tesla.mjs";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const staticDir = path.join(projectRoot, "RPI Taxi");
const stateFile = path.join(projectRoot, "data", "state.json");
const outboxDir = path.join(projectRoot, "data", "outbox");

loadLocalEnv(projectRoot);

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
  ".webp": "image/webp",
};

function json(response, statusCode, payload, headers = {}) {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    ...headers,
  });
  response.end(JSON.stringify(payload));
}

function text(response, statusCode, payload, contentType = "text/plain; charset=utf-8", headers = {}) {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": contentType,
    ...headers,
  });
  response.end(payload);
}

function parseNumber(value, fallback) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function parseCookies(cookieHeader = "") {
  return cookieHeader.split(/;\s*/u).reduce((accumulator, pair) => {
    const separatorIndex = pair.indexOf("=");
    if (separatorIndex === -1) {
      return accumulator;
    }

    const key = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1).trim();
    if (key) {
      accumulator[key] = decodeURIComponent(value);
    }
    return accumulator;
  }, {});
}

function createSessionCookie(value, options = {}) {
  const segments = [`${options.name}=${encodeURIComponent(value)}`, "Path=/", "HttpOnly", "SameSite=Lax"];
  if (options.maxAge !== undefined) {
    segments.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  }
  if (options.expires) {
    segments.push(`Expires=${options.expires.toUTCString()}`);
  }
  return segments.join("; ");
}

function createVerificationCode() {
  return String(randomInt(100000, 1000000));
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function sanitizeDisplayName(email, displayName) {
  const normalized = String(displayName || "").trim();
  if (normalized) {
    return normalized;
  }
  return normalizeEmail(email).split("@")[0] || "RPI Rider";
}

function isAllowedRpiEmail(email, env = process.env) {
  const domain = String(env.RPI_ALLOWED_EMAIL_DOMAIN || "rpi.edu").toLowerCase();
  return normalizeEmail(email).endsWith(`@${domain}`);
}

function sortRides(rides) {
  return [...rides].sort((left, right) => {
    return new Date(right.updatedAt ?? right.createdAt ?? 0) - new Date(left.updatedAt ?? left.createdAt ?? 0);
  });
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

function getSessionContext(request, state, env = process.env) {
  const cookies = parseCookies(request.headers.cookie);
  const sessionCookieName = env.SESSION_COOKIE_NAME || "rpi_taxi_session";
  const sessionId = cookies[sessionCookieName];
  if (!sessionId) {
    return { session: null, user: null };
  }

  const session = state.auth.sessions.find((candidate) => candidate.id === sessionId) ?? null;
  const user = session ? state.auth.users.find((candidate) => candidate.id === session.userId) ?? null : null;
  return { session, user };
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    createdAt: user.createdAt,
    displayName: user.displayName,
    email: user.email,
    id: user.id,
    verifiedAt: user.verifiedAt,
  };
}

function updateTeslaVehicleState(teslaState) {
  teslaState.updatedAt = new Date().toISOString();
  teslaState.vehicle_state.locked = teslaState.locked;
  return teslaState;
}

function sanitizeTeslaConnection(connection, env = process.env) {
  const config = getTeslaConfig(env);
  const vehicleVin = config.vehicleVin || connection?.selectedVehicle?.vin || null;
  return {
    authorized: Boolean(connection?.tokens?.accessToken),
    authorizedAt: connection?.authorizedAt ?? null,
    commandProxyConfigured: Boolean(config.commandProxyUrl),
    configured: isTeslaConfigured(env),
    developerDomain: config.developerDomain || null,
    enableOwnerApiShare: config.enableOwnerApiShare,
    keyPairUrl: buildTeslaKeyPairUrl(env, vehicleVin),
    lastError: connection?.lastError ?? null,
    lastNavigation: connection?.lastNavigation ?? null,
    lastSyncAt: connection?.lastSyncAt ?? null,
    redirectUri: config.redirectUri,
    selectedVehicle: connection?.selectedVehicle ?? null,
    vehicleVin,
  };
}

function appendTeslaCommandSetupHint(message, env = process.env) {
  const config = getTeslaConfig(env);
  if (config.commandProxyUrl) {
    return message;
  }

  return `${message}. Tesla vehicle commands now usually require a registered virtual key plus TESLA_COMMAND_PROXY_URL.`;
}

function mergeTeslaVehicleData(baseTeslaState, vehicleData) {
  if (!vehicleData) {
    return baseTeslaState;
  }

  const nextState = structuredClone(baseTeslaState);
  nextState.demo = false;
  nextState.battery_level = parseNumber(vehicleData?.charge_state?.battery_level, nextState.battery_level);
  nextState.battery_range = parseNumber(vehicleData?.charge_state?.battery_range, nextState.battery_range);
  nextState.locked = Boolean(vehicleData?.vehicle_state?.locked ?? nextState.locked);
  nextState.climate_state.inside_temp = parseNumber(
    vehicleData?.climate_state?.inside_temp,
    nextState.climate_state.inside_temp,
  );
  nextState.climate_state.outside_temp = parseNumber(
    vehicleData?.climate_state?.outside_temp,
    nextState.climate_state.outside_temp,
  );
  nextState.drive_state.speed = parseNumber(vehicleData?.drive_state?.speed, nextState.drive_state.speed);
  nextState.vehicle_state = {
    ...nextState.vehicle_state,
    ...(vehicleData?.vehicle_state ?? {}),
    locked: Boolean(vehicleData?.vehicle_state?.locked ?? nextState.locked),
  };
  return updateTeslaVehicleState(nextState);
}

async function serveStaticAsset(requestPath, response) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(requestPath);
  } catch {
    json(response, 400, { error: "Invalid asset path" });
    return true;
  }

  const relativePath = decodedPath === "/" ? "/index.html" : decodedPath;
  const filePath = path.join(staticDir, relativePath);
  const normalizedPath = path.normalize(filePath);

  if (!normalizedPath.startsWith(staticDir)) {
    json(response, 403, { error: "Forbidden" });
    return true;
  }

  try {
    await access(normalizedPath);
    const extension = path.extname(normalizedPath);
    const baseName = path.basename(normalizedPath);
    const isFingerprintedAsset =
      normalizedPath.startsWith(path.join(staticDir, "assets")) && /^index-[\w-]+\.(css|js)$/u.test(baseName);
    const contentType = contentTypes[extension] ?? "application/octet-stream";
    const payload = await readFile(normalizedPath);
    response.writeHead(200, {
      "Cache-Control":
        extension === ".html" || !isFingerprintedAsset ? "no-store" : "public, max-age=31536000, immutable",
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

async function persistTeslaConnection(store, partialConnection) {
  await store.update((state) => {
    state.tesla.connection = {
      ...state.tesla.connection,
      ...partialConnection,
    };
    return state;
  });
}

async function attemptTeslaDestinationPush({ env, label, lat, lng, store }) {
  const state = store.getState();
  if (!state.tesla.connection?.tokens?.accessToken) {
    return {
      attempted: false,
      reason: "tesla_not_connected",
    };
  }

  try {
    const textPayload = buildTeslaShareText({ address: label, label, lat, lng });
    const { payload, tokens } = await sendTeslaOwnerApiShare({
      connectionState: state.tesla.connection,
      env,
      text: textPayload,
    });

    const lastNavigation = {
      label,
      lat,
      lng,
      pushedAt: new Date().toISOString(),
      result: payload,
      textPayload,
    };

    await persistTeslaConnection(store, {
      authorized: true,
      lastError: null,
      lastNavigation,
      lastSyncAt: new Date().toISOString(),
      tokens,
    });

    return {
      attempted: true,
      result: payload,
      success: true,
    };
  } catch (error) {
    const message = appendTeslaCommandSetupHint(
      error instanceof Error ? error.message : "Tesla navigation push failed",
      env,
    );
    await persistTeslaConnection(store, {
      lastError: message,
      lastSyncAt: new Date().toISOString(),
    });
    return {
      attempted: true,
      error: message,
      success: false,
    };
  }
}

async function attemptRideNavigation(store, ride, phase, env = process.env) {
  if (phase === "pickup") {
    return attemptTeslaDestinationPush({
      env,
      label: ride.pickupAddress,
      lat: ride.pickupLat,
      lng: ride.pickupLng,
      store,
    });
  }

  return attemptTeslaDestinationPush({
    env,
    label: ride.destAddress,
    lat: ride.destLat,
    lng: ride.destLng,
    store,
  });
}

export async function createAppServer(options = {}) {
  const env = options.env ?? process.env;
  const store = await new JsonStateStore(options.stateFile ?? stateFile).init();

  const server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");
    const { pathname, searchParams } = requestUrl;

    try {
      if (request.method === "GET" && pathname === "/api/health") {
        json(response, 200, { ok: true });
        return;
      }

      if (request.method === "POST" && pathname === "/api/auth/request-code") {
        const body = await readJsonBody(request);
        const email = normalizeEmail(body?.email);

        if (!isAllowedRpiEmail(email, env)) {
          json(response, 400, { error: "Only @rpi.edu email addresses can create RPI Taxi accounts." });
          return;
        }

        const code = createVerificationCode();
        const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();

        await store.update((state) => {
          state.auth.verificationCodes = state.auth.verificationCodes.filter((entry) => entry.email !== email);
          state.auth.verificationCodes.push({
            code,
            createdAt: new Date().toISOString(),
            email,
            expiresAt,
          });
          return state;
        });

        const delivery = await deliverVerificationCode({
          code,
          email,
          outboxDir: options.outboxDir ?? outboxDir,
        });

        json(response, 200, {
          delivery,
          ok: true,
          requiresCode: true,
        });
        return;
      }

      if (request.method === "POST" && pathname === "/api/auth/verify-code") {
        const body = await readJsonBody(request);
        const email = normalizeEmail(body?.email);
        const code = String(body?.code ?? "").trim();

        if (!isAllowedRpiEmail(email, env)) {
          json(response, 400, { error: "Only @rpi.edu email addresses can create RPI Taxi accounts." });
          return;
        }

        const now = Date.now();
        const state = store.getState();
        const verificationRecord = state.auth.verificationCodes.find((entry) => entry.email === email && entry.code === code);
        if (!verificationRecord || Date.parse(verificationRecord.expiresAt) < now) {
          json(response, 401, { error: "Verification code is invalid or expired." });
          return;
        }

        const userId = state.auth.users.find((entry) => entry.email === email)?.id ?? randomUUID();
        const sessionId = randomUUID();
        const createdAt = new Date().toISOString();
        let nextUser = null;

        await store.update((draft) => {
          draft.auth.verificationCodes = draft.auth.verificationCodes.filter((entry) => {
            return !(entry.email === email && entry.code === code);
          });

          const existingUser = draft.auth.users.find((entry) => entry.id === userId);
          nextUser = {
            createdAt: existingUser?.createdAt ?? createdAt,
            displayName: sanitizeDisplayName(email, body?.displayName ?? existingUser?.displayName),
            email,
            id: userId,
            verifiedAt: createdAt,
          };

          draft.auth.users = draft.auth.users.filter((entry) => entry.id !== userId);
          draft.auth.users.push(nextUser);
          draft.auth.sessions.push({
            createdAt,
            id: sessionId,
            lastSeenAt: createdAt,
            userId,
          });
          return draft;
        });

        const sessionCookie = createSessionCookie(sessionId, {
          maxAge: 60 * 60 * 24 * 14,
          name: env.SESSION_COOKIE_NAME || "rpi_taxi_session",
        });

        json(
          response,
          200,
          {
            ok: true,
            user: sanitizeUser(nextUser),
          },
          {
            "Set-Cookie": sessionCookie,
          },
        );
        return;
      }

      if (request.method === "GET" && pathname === "/api/auth/session") {
        const state = store.getState();
        const { user } = getSessionContext(request, state, env);
        if (!user) {
          json(response, 200, {
            authenticated: false,
            tesla: sanitizeTeslaConnection(state.tesla.connection, env),
            user: null,
          });
          return;
        }

        json(response, 200, {
          authenticated: true,
          rides: sortRides(state.rides.filter((ride) => ride.userId === user.id)),
          tesla: sanitizeTeslaConnection(state.tesla.connection, env),
          user: sanitizeUser(user),
        });
        return;
      }

      if (request.method === "POST" && pathname === "/api/auth/logout") {
        const state = store.getState();
        const { session } = getSessionContext(request, state, env);
        if (session) {
          await store.update((draft) => {
            draft.auth.sessions = draft.auth.sessions.filter((entry) => entry.id !== session.id);
            return draft;
          });
        }

        json(
          response,
          200,
          { ok: true },
          {
            "Set-Cookie": createSessionCookie("", {
              expires: new Date(0),
              maxAge: 0,
              name: env.SESSION_COOKIE_NAME || "rpi_taxi_session",
            }),
          },
        );
        return;
      }

      if (request.method === "GET" && pathname === "/api/users/me/rides") {
        const state = store.getState();
        const { user } = getSessionContext(request, state, env);
        if (!user) {
          json(response, 401, { error: "Not signed in" });
          return;
        }

        json(response, 200, sortRides(state.rides.filter((ride) => ride.userId === user.id)));
        return;
      }

      if (request.method === "GET" && pathname === "/api/rides") {
        json(response, 200, sortRides(store.getState().rides));
        return;
      }

      if (request.method === "POST" && pathname === "/api/rides") {
        const body = await readJsonBody(request);
        const { user } = getSessionContext(request, store.getState(), env);
        const now = new Date().toISOString();
        const ride = {
          id: randomUUID(),
          status: String(body?.status ?? "pending"),
          createdAt: now,
          navigation: null,
          riderEmail: user?.email ?? null,
          updatedAt: now,
          userId: user?.id ?? null,
          ...parseRidePayload(body),
        };

        await store.update((state) => {
          state.rides.unshift(ride);
          return state;
        });

        const navigation = await attemptRideNavigation(store, ride, "pickup", env);
        if (navigation.attempted) {
          await store.update((state) => {
            state.rides = state.rides.map((entry) => {
              return entry.id === ride.id
                ? {
                    ...entry,
                    navigation: {
                      ...(entry.navigation ?? {}),
                      pickup: navigation,
                    },
                  }
                : entry;
            });
            return state;
          });
          ride.navigation = {
            pickup: navigation,
          };
        }

        json(response, 201, ride);
        return;
      }

      if (request.method === "PATCH" && pathname.startsWith("/api/rides/")) {
        const rideId = pathname.slice("/api/rides/".length);
        const body = await readJsonBody(request);
        let updatedRide = null;
        let enteredRide = false;

        await store.update((state) => {
          state.rides = state.rides.map((ride) => {
            if (ride.id !== rideId) {
              return ride;
            }

            enteredRide = body?.status === "in_ride" && ride.status !== "in_ride";
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

        if (enteredRide) {
          const navigation = await attemptRideNavigation(store, updatedRide, "destination", env);
          if (navigation.attempted) {
            await store.update((state) => {
              state.rides = state.rides.map((ride) => {
                return ride.id === updatedRide.id
                  ? {
                      ...ride,
                      navigation: {
                        ...(ride.navigation ?? {}),
                        destination: navigation,
                      },
                    }
                  : ride;
              });
              return state;
            });
            updatedRide.navigation = {
              ...(updatedRide.navigation ?? {}),
              destination: navigation,
            };
          }
        }

        json(response, 200, updatedRide);
        return;
      }

      if (request.method === "GET" && pathname === "/api/tesla/oauth/status") {
        const connection = store.getState().tesla.connection;
        json(response, 200, sanitizeTeslaConnection(connection, env));
        return;
      }

      if (request.method === "GET" && pathname === "/auth/tesla/start") {
        if (!isTeslaConfigured(env)) {
          text(response, 400, "Tesla OAuth is not configured. Set TESLA_CLIENT_ID, TESLA_CLIENT_SECRET, and TESLA_REDIRECT_URI.");
          return;
        }

        const { session } = getSessionContext(request, store.getState(), env);
        const oauthState = createTeslaOauthState(session?.id ?? null);
        await store.update((state) => {
          state.tesla.connection.oauthStates = state.tesla.connection.oauthStates.filter((entry) => {
            return Date.parse(entry.createdAt) > Date.now() - 15 * 60_000;
          });
          state.tesla.connection.oauthStates.push(oauthState);
          return state;
        });

        response.writeHead(302, {
          Location: buildTeslaAuthorizeUrl(env, oauthState),
        });
        response.end();
        return;
      }

      if (request.method === "GET" && pathname === "/auth/tesla/callback") {
        const code = searchParams.get("code");
        const stateId = searchParams.get("state");
        if (!code || !stateId) {
          text(response, 400, "Missing Tesla OAuth callback parameters.");
          return;
        }

        const state = store.getState();
        const oauthState = state.tesla.connection.oauthStates.find((entry) => entry.id === stateId);
        if (!oauthState) {
          text(response, 400, "Tesla OAuth state is invalid or expired.");
          return;
        }

        try {
          const tokens = await exchangeTeslaCodeForTokens({ code, env });
          const vehiclesResult = await fetchTeslaVehicles({
            connectionState: {
              ...state.tesla.connection,
              tokens,
            },
            env,
          });
          const selectedVehicle =
            vehiclesResult.vehicles.find((vehicle) => vehicle.vin === (env.TESLA_VIN || "")) ??
            vehiclesResult.vehicles[0] ??
            null;

          await store.update((draft) => {
            draft.tesla.connection = {
              ...draft.tesla.connection,
              authorized: true,
              authorizedAt: new Date().toISOString(),
              lastError: null,
              lastSyncAt: new Date().toISOString(),
              oauthStates: draft.tesla.connection.oauthStates.filter((entry) => entry.id !== stateId),
              selectedVehicle,
              tokens: vehiclesResult.tokens,
            };
            return draft;
          });

          response.writeHead(302, {
            Location: "/#/ride?tesla=connected",
          });
          response.end();
          return;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Tesla connection failed";
          await persistTeslaConnection(store, {
            lastError: message,
            oauthStates: store
              .getState()
              .tesla.connection.oauthStates.filter((entry) => entry.id !== stateId),
          });
          text(response, 500, message);
          return;
        }
      }

      if (request.method === "GET" && pathname === "/api/tesla/status") {
        const state = store.getState();
        const activeRide = state.rides.find((ride) => ride.status === "in_ride");
        const queuedRide = state.rides.find((ride) => ["pending", "driver_accepted", "arrived"].includes(ride.status));
        let tesla = structuredClone(state.tesla);
        tesla.drive_state.speed = activeRide ? 28 : queuedRide ? 9 : 0;
        tesla.battery_level = Math.max(40, tesla.battery_level - Math.min(state.rides.length, 8));
        tesla.battery_range = Math.max(120, tesla.battery_range - Math.min(state.rides.length * 2, 20));

        if (state.tesla.connection?.tokens?.accessToken) {
          try {
            const { tokens, vehicleData } = await fetchTeslaVehicleData({
              connectionState: state.tesla.connection,
              env,
            });
            tesla = mergeTeslaVehicleData(tesla, vehicleData);
            await persistTeslaConnection(store, {
              lastError: null,
              lastSyncAt: new Date().toISOString(),
              tokens,
              vehicleData,
            });
          } catch (error) {
            await persistTeslaConnection(store, {
              lastError: error instanceof Error ? error.message : "Unable to fetch Tesla vehicle data",
              lastSyncAt: new Date().toISOString(),
            });
          }
        } else {
          tesla = updateTeslaVehicleState(tesla);
        }

        tesla.connection = sanitizeTeslaConnection(store.getState().tesla.connection, env);
        json(response, 200, tesla);
        return;
      }

      if (request.method === "POST" && pathname === "/api/tesla/navigation") {
        const body = await readJsonBody(request);
        const label = String(body?.label ?? body?.address ?? "Pickup destination").trim();
        const lat = parseNumber(body?.lat, NaN);
        const lng = parseNumber(body?.lng, NaN);
        const navigation = await attemptTeslaDestinationPush({
          env,
          label,
          lat,
          lng,
          store,
        });

        json(response, navigation.success === false ? 502 : 200, navigation);
        return;
      }

      if (request.method === "POST" && pathname.startsWith("/api/tesla/")) {
        const command = pathname.slice("/api/tesla/".length);
        const body = await readJsonBody(request);
        let payload = null;

        await store.update((state) => {
          const tesla = state.tesla;
          const connection = state.tesla.connection;

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

          payload.connection = sanitizeTeslaConnection(connection, env);
          return state;
        });

        const remoteCommandMap = {
          climate: {
            body: {
              driver_temp: parseNumber(body?.temp, 21),
              passenger_temp: parseNumber(body?.temp, 21),
            },
            path: "set_temps",
          },
          "flash-lights": { path: "flash_lights" },
          "honk-horn": { path: "honk_horn" },
          lock: { path: "door_lock" },
          trunk: {
            body: {
              which_trunk: body?.which === "front" ? "front" : "rear",
            },
            path: "actuate_trunk",
          },
          unlock: { path: "door_unlock" },
        };

        if (payload?.ok && remoteCommandMap[command] && store.getState().tesla.connection?.tokens?.accessToken) {
          try {
            const { payload: remotePayload, tokens } = await sendTeslaCommand({
              body: remoteCommandMap[command].body,
              commandPath: remoteCommandMap[command].path,
              connectionState: store.getState().tesla.connection,
              env,
            });
            await persistTeslaConnection(store, {
              lastError: null,
              lastSyncAt: new Date().toISOString(),
              tokens,
            });
            payload.remote = {
              attempted: true,
              payload: remotePayload,
              success: true,
            };
          } catch (error) {
            const message = appendTeslaCommandSetupHint(error instanceof Error ? error.message : "Tesla command failed", env);
            await persistTeslaConnection(store, {
              lastError: message,
              lastSyncAt: new Date().toISOString(),
            });
            payload.remote = {
              attempted: true,
              error: message,
              success: false,
            };
          }
        }

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
