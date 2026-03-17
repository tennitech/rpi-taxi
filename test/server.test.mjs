import test, { after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { createAppServer } from "../server/index.mjs";

const tempRoot = await mkdtemp(path.join(os.tmpdir(), "rpi-taxi-"));
const stateFile = path.join(tempRoot, "state.json");
const outboxDir = path.join(tempRoot, "outbox");
const server = await createAppServer({ outboxDir, stateFile });

await new Promise((resolve) => {
  server.listen(0, "127.0.0.1", resolve);
});

const address = server.address();
const baseUrl = `http://${address.address}:${address.port}`;

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await rm(tempRoot, { force: true, recursive: true });
});

test("serves the static app shell", async () => {
  const response = await fetch(baseUrl);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /RPI Taxi/);
  assert.match(html, /app-bridge\.js/);
});

test("creates and updates rides", async () => {
  const createResponse = await fetch(`${baseUrl}/api/rides`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pickupAddress: "RPI Main Campus",
      destAddress: "Downtown Troy",
      eta: 4,
      rideDuration: 7,
      estimatedRideMin: 7,
    }),
  });
  const ride = await createResponse.json();

  assert.equal(createResponse.status, 201);
  assert.equal(ride.status, "pending");
  assert.ok(ride.id);

  const updateResponse = await fetch(`${baseUrl}/api/rides/${ride.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: "driver_accepted" }),
  });
  const updatedRide = await updateResponse.json();

  assert.equal(updateResponse.status, 200);
  assert.equal(updatedRide.status, "driver_accepted");

  const ridesResponse = await fetch(`${baseUrl}/api/rides`);
  const rides = await ridesResponse.json();

  assert.equal(ridesResponse.status, 200);
  assert.equal(rides.length, 1);
  assert.equal(rides[0].status, "driver_accepted");
});

test("supports Tesla demo commands", async () => {
  const unlockResponse = await fetch(`${baseUrl}/api/tesla/unlock`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  const unlockPayload = await unlockResponse.json();
  assert.equal(unlockResponse.status, 200);
  assert.equal(unlockPayload.state.locked, false);

  const climateResponse = await fetch(`${baseUrl}/api/tesla/climate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ temp: 19 }),
  });
  const climatePayload = await climateResponse.json();
  assert.equal(climateResponse.status, 200);
  assert.equal(climatePayload.state.climate_state.inside_temp, 19);

  const statusResponse = await fetch(`${baseUrl}/api/tesla/status`);
  const statusPayload = await statusResponse.json();
  assert.equal(statusResponse.status, 200);
  assert.equal(statusPayload.locked, false);
});

test("creates verified @rpi.edu sessions and returns scoped rider history", async () => {
  const requestCodeResponse = await fetch(`${baseUrl}/api/auth/request-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "student@rpi.edu",
    }),
  });
  const requestCodePayload = await requestCodeResponse.json();

  assert.equal(requestCodeResponse.status, 200);
  assert.equal(requestCodePayload.ok, true);
  assert.equal(requestCodePayload.delivery.method, "file");

  const outboxFiles = await readdir(path.join(tempRoot, "outbox"));
  assert.ok(outboxFiles.length >= 1);
  const latestOutboxFile = path.join(tempRoot, "outbox", outboxFiles.at(-1));
  const outboxBody = await readFile(latestOutboxFile, "utf8");
  const codeMatch = outboxBody.match(/\b(\d{6})\b/u);
  assert.ok(codeMatch);

  const verifyResponse = await fetch(`${baseUrl}/api/auth/verify-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code: codeMatch[1],
      displayName: "Test Rider",
      email: "student@rpi.edu",
    }),
  });
  const verifyPayload = await verifyResponse.json();
  const sessionCookie = verifyResponse.headers.get("set-cookie")?.split(";", 1)[0];

  assert.equal(verifyResponse.status, 200);
  assert.equal(verifyPayload.user.email, "student@rpi.edu");
  assert.ok(sessionCookie);

  const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
    headers: {
      Cookie: sessionCookie,
    },
  });
  const sessionPayload = await sessionResponse.json();

  assert.equal(sessionResponse.status, 200);
  assert.equal(sessionPayload.authenticated, true);
  assert.equal(sessionPayload.user.displayName, "Test Rider");

  const historyResponse = await fetch(`${baseUrl}/api/users/me/rides`, {
    headers: {
      Cookie: sessionCookie,
    },
  });
  const historyPayload = await historyResponse.json();

  assert.equal(historyResponse.status, 200);
  assert.ok(Array.isArray(historyPayload));
});

test("returns local geocode and route fallbacks", async () => {
  const geocodeResponse = await fetch(`${baseUrl}/api/geocode/search?q=Folsom`);
  const geocodePayload = await geocodeResponse.json();

  assert.equal(geocodeResponse.status, 200);
  assert.ok(Array.isArray(geocodePayload));
  assert.ok(geocodePayload.length >= 1);

  const routeResponse = await fetch(
    `${baseUrl}/api/route?fromLng=-73.6779&fromLat=42.7296&toLng=-73.6886&toLat=42.7262`,
  );
  const routePayload = await routeResponse.json();

  assert.equal(routeResponse.status, 200);
  assert.equal(routePayload.code, "Ok");
  assert.ok(routePayload.routes[0].distance > 0);
  assert.equal(routePayload.routes[0].geometry.type, "LineString");
});
