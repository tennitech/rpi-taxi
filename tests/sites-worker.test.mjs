import assert from "node:assert/strict";
import test from "node:test";

import worker from "../dist/server/index.js";

test("the Sites worker exposes a health endpoint", async () => {
  const response = await worker.fetch(new Request("https://rpi-taxi.test/api/health"), {});

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
});

test("the Sites worker serves assets with the geolocation policy", async () => {
  const env = {
    ASSETS: {
      async fetch() {
        return new Response(
          '<meta property="og:image" content="__SITE_ORIGIN__/og.png">',
          { headers: { "Content-Type": "text/html; charset=utf-8" } },
        );
      },
    },
  };
  const response = await worker.fetch(new Request("https://rpi-taxi.test/"), env);

  assert.equal(response.headers.get("Permissions-Policy"), "geolocation=(self)");
  assert.match(await response.text(), /https:\/\/rpi-taxi\.test\/og\.png/);
});
