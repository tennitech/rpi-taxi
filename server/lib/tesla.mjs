import { randomUUID } from "node:crypto";

const TESLA_AUTHORIZE_URL = "https://auth.tesla.com/oauth2/v3/authorize";
const TESLA_TOKEN_URL = "https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token";
const TESLA_FLEET_API_BASE = "https://fleet-api.prd.na.vn.cloud.tesla.com";
const TESLA_OWNER_API_BASE = "https://owner-api.teslamotors.com";
const DEFAULT_SCOPES = [
  "openid",
  "offline_access",
  "user_data",
  "vehicle_device_data",
  "vehicle_cmds",
  "vehicle_location",
].join(" ");

function normalizeBaseUrl(value, fallback = "") {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return fallback;
  }

  try {
    return new URL(trimmed).toString().replace(/\/$/u, "");
  } catch {
    return fallback;
  }
}

function encodeFormBody(payload) {
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined && value !== null && value !== "") {
      form.set(key, String(value));
    }
  }
  return form;
}

function toExpiresAt(expiresInSeconds) {
  return new Date(Date.now() + Number(expiresInSeconds || 0) * 1000).toISOString();
}

function buildTokenRecord(payload) {
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: toExpiresAt(payload.expires_in),
    scope: payload.scope ?? DEFAULT_SCOPES,
    tokenType: payload.token_type ?? "Bearer",
  };
}

async function parseTeslaResponse(response) {
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const detail = payload?.error_description ?? payload?.message ?? payload?.error ?? response.statusText;
    throw new Error(`Tesla API request failed: ${detail}`);
  }

  return payload;
}

function resolveVehicleIdentifier(connectionState, env) {
  return env.TESLA_VIN || connectionState?.selectedVehicle?.vin || null;
}

function resolveTeslaCommandBaseUrl(env = process.env) {
  const config = getTeslaConfig(env);
  return config.commandProxyUrl || config.audience || TESLA_FLEET_API_BASE;
}

export function getTeslaConfig(env = process.env) {
  const audience = normalizeBaseUrl(env.TESLA_AUDIENCE || TESLA_FLEET_API_BASE, TESLA_FLEET_API_BASE);

  return {
    audience,
    clientId: env.TESLA_CLIENT_ID || "",
    clientSecret: env.TESLA_CLIENT_SECRET || "",
    commandProxyUrl: normalizeBaseUrl(env.TESLA_COMMAND_PROXY_URL || ""),
    developerDomain: String(env.TESLA_DEVELOPER_DOMAIN || "").trim().toLowerCase(),
    enableOwnerApiShare: String(env.TESLA_ENABLE_OWNER_API_SHARE || "").toLowerCase() === "true",
    redirectUri: env.TESLA_REDIRECT_URI || "http://127.0.0.1:5000/auth/tesla/callback",
    scopes: env.TESLA_SCOPES || DEFAULT_SCOPES,
    vehicleVin: env.TESLA_VIN || "",
  };
}

export function isTeslaConfigured(env = process.env) {
  const config = getTeslaConfig(env);
  return Boolean(config.clientId && config.clientSecret && config.redirectUri);
}

export function createTeslaOauthState(sessionId = "") {
  return {
    id: randomUUID(),
    sessionId: sessionId || null,
    createdAt: new Date().toISOString(),
  };
}

export function buildTeslaAuthorizeUrl(env = process.env, oauthState) {
  const config = getTeslaConfig(env);
  const url = new URL(TESLA_AUTHORIZE_URL);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("locale", "en-US");
  url.searchParams.set("prompt", "login");
  url.searchParams.set("prompt_missing_scopes", "true");
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", config.scopes);
  url.searchParams.set("state", oauthState.id);
  if (config.developerDomain) {
    url.searchParams.set("show_keypair_step", "true");
  }
  if (config.audience) {
    url.searchParams.set("audience", config.audience);
  }
  return url.toString();
}

export function buildTeslaKeyPairUrl(env = process.env, vin = "") {
  const config = getTeslaConfig(env);
  if (!config.developerDomain) {
    return null;
  }

  const url = new URL(`https://tesla.com/_ak/${config.developerDomain}`);
  const targetVin = String(vin || config.vehicleVin || "").trim();
  if (targetVin) {
    url.searchParams.set("vin", targetVin);
  }
  return url.toString();
}

export async function exchangeTeslaCodeForTokens({ code, env = process.env, fetchImpl = fetch }) {
  const config = getTeslaConfig(env);
  const body = encodeFormBody({
    grant_type: "authorization_code",
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: config.redirectUri,
    audience: config.audience,
  });

  const response = await fetchImpl(TESLA_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  return buildTokenRecord(await parseTeslaResponse(response));
}

export async function refreshTeslaTokens({ refreshToken, env = process.env, fetchImpl = fetch }) {
  const config = getTeslaConfig(env);
  const body = encodeFormBody({
    grant_type: "refresh_token",
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    audience: config.audience,
  });

  const response = await fetchImpl(TESLA_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  return buildTokenRecord(await parseTeslaResponse(response));
}

export async function ensureFreshTeslaTokens({ connectionState, env = process.env, fetchImpl = fetch }) {
  const tokens = connectionState?.tokens;
  if (!tokens?.accessToken) {
    throw new Error("Tesla is not connected");
  }

  const expiresAt = Date.parse(tokens.expiresAt || "");
  const refreshThreshold = Date.now() + 60_000;
  if (!Number.isFinite(expiresAt) || expiresAt > refreshThreshold) {
    return tokens;
  }

  if (!tokens.refreshToken) {
    throw new Error("Tesla session has expired and no refresh token is available");
  }

  return refreshTeslaTokens({
    env,
    fetchImpl,
    refreshToken: tokens.refreshToken,
  });
}

export async function teslaFleetGet({ path, tokens, env = process.env, fetchImpl = fetch }) {
  const config = getTeslaConfig(env);
  const response = await fetchImpl(new URL(path, config.audience || TESLA_FLEET_API_BASE), {
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
    },
  });
  return parseTeslaResponse(response);
}

export async function teslaFleetPost({ path, tokens, body, env = process.env, fetchImpl = fetch }) {
  const response = await fetchImpl(new URL(path, resolveTeslaCommandBaseUrl(env)), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return parseTeslaResponse(response);
}

export async function fetchTeslaVehicles({ connectionState, env = process.env, fetchImpl = fetch }) {
  const tokens = await ensureFreshTeslaTokens({ connectionState, env, fetchImpl });
  const payload = await teslaFleetGet({
    env,
    fetchImpl,
    path: "/api/1/vehicles",
    tokens,
  });

  return {
    tokens,
    vehicles: payload?.response ?? [],
  };
}

export async function fetchTeslaVehicleData({ connectionState, env = process.env, fetchImpl = fetch }) {
  const tokens = await ensureFreshTeslaTokens({ connectionState, env, fetchImpl });
  const vehicleId = resolveVehicleIdentifier(connectionState, env);
  if (!vehicleId) {
    throw new Error("Tesla vehicle VIN or ID is not configured");
  }

  const payload = await teslaFleetGet({
    env,
    fetchImpl,
    path: `/api/1/vehicles/${vehicleId}/vehicle_data`,
    tokens,
  });

  return {
    tokens,
    vehicleData: payload?.response ?? null,
  };
}

export async function sendTeslaCommand({ commandPath, body, connectionState, env = process.env, fetchImpl = fetch }) {
  const tokens = await ensureFreshTeslaTokens({ connectionState, env, fetchImpl });
  const vehicleId = resolveVehicleIdentifier(connectionState, env);
  if (!vehicleId) {
    throw new Error("Tesla vehicle VIN or ID is not configured");
  }

  const payload = await teslaFleetPost({
    body,
    env,
    fetchImpl,
    path: `/api/1/vehicles/${vehicleId}/command/${commandPath}`,
    tokens,
  });

  return {
    payload,
    tokens,
  };
}

export function buildTeslaShareText({ address, label, lat, lng }) {
  const title = label || address || "Pickup destination";
  const coordinateLine =
    Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) ? `${Number(lat)}, ${Number(lng)}` : null;
  return [title, coordinateLine].filter(Boolean).join("\n\n");
}

export async function sendTeslaOwnerApiShare({
  connectionState,
  env = process.env,
  fetchImpl = fetch,
  text,
}) {
  const config = getTeslaConfig(env);
  if (!config.enableOwnerApiShare) {
    throw new Error("TESLA_ENABLE_OWNER_API_SHARE is not enabled");
  }

  const tokens = await ensureFreshTeslaTokens({ connectionState, env, fetchImpl });
  const vehicleId = resolveVehicleIdentifier(connectionState, env);
  if (!vehicleId) {
    throw new Error("Tesla vehicle VIN or ID is not configured");
  }

  const response = await fetchImpl(`${TESLA_OWNER_API_BASE}/api/1/vehicles/${vehicleId}/command/share`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      locale: "en-US",
      timestamp_ms: String(Date.now()),
      type: "share_ext_content_raw",
      value: {
        "android.intent.extra.TEXT": text,
      },
    }),
  });

  return {
    payload: await parseTeslaResponse(response),
    tokens,
  };
}
