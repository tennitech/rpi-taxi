var trunkAnimating = false;

(function bridgeBundle() {
  const nativeFetch = window.fetch.bind(window);
  const state = {
    activeRideId: null,
    bookingLocked: false,
    lastRouteRequest: null,
    lastRoutePayload: null,
    syncedStates: new Set(),
  };

  function normalizeText(value) {
    return (value || "").replace(/\s+/g, " ").trim();
  }

  function parseRouteRequest(url) {
    return {
      fromLng: Number(url.searchParams.get("fromLng")),
      fromLat: Number(url.searchParams.get("fromLat")),
      toLng: Number(url.searchParams.get("toLng")),
      toLat: Number(url.searchParams.get("toLat")),
    };
  }

  function findParagraphByText(label) {
    return Array.from(document.querySelectorAll("p")).find((paragraph) => {
      return normalizeText(paragraph.textContent) === label;
    });
  }

  function extractRouteRow(label) {
    const labelParagraph = findParagraphByText(label);
    if (!labelParagraph) {
      return null;
    }

    const textGroup = labelParagraph.parentElement;
    const row = textGroup?.parentElement;
    if (!textGroup || !row) {
      return null;
    }

    const textParagraphs = Array.from(textGroup.querySelectorAll("p")).map((paragraph) => normalizeText(paragraph.textContent));
    const rowParagraphs = Array.from(row.querySelectorAll("p")).map((paragraph) => normalizeText(paragraph.textContent));

    return {
      label,
      value: textParagraphs.find((text) => text && text !== label) ?? "",
      time: rowParagraphs.reverse().find((text) => text && text !== label && text !== textParagraphs[1]) ?? "",
    };
  }

  function findSummaryMetrics() {
    const candidates = Array.from(document.querySelectorAll("div, span, p"));
    for (const candidate of candidates) {
      const text = normalizeText(candidate.textContent);
      const match = text.match(/(\d+)\s*min\s*[·-]\s*([\d.]+\s*(?:km|mi))/i);
      if (match) {
        return {
          totalMinutes: Number(match[1]),
          distance: match[2],
        };
      }
    }

    return null;
  }

  function inferArrivalTime(totalMinutes) {
    const arrivalDate = new Date(Date.now() + totalMinutes * 60_000);
    return arrivalDate.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function buildRidePayload() {
    const pickup = extractRouteRow("Pickup");
    const destination = extractRouteRow("Destination");
    const summary = findSummaryMetrics();
    const route = state.lastRoutePayload?.routes?.[0];
    const routeMinutes = route?.duration ? Math.max(1, Math.round(route.duration / 60)) : 8;
    const totalMinutes = summary?.totalMinutes ?? routeMinutes + 3;
    const eta = Math.max(1, totalMinutes - routeMinutes);
    const arrivalTime = destination?.time || inferArrivalTime(totalMinutes);

    return {
      pickupAddress: pickup?.value || "Current Location",
      pickupLng: state.lastRouteRequest?.fromLng ?? -73.6779,
      pickupLat: state.lastRouteRequest?.fromLat ?? 42.7296,
      destAddress: destination?.value || "Downtown Troy",
      destLng: state.lastRouteRequest?.toLng ?? -73.6886,
      destLat: state.lastRouteRequest?.toLat ?? 42.7262,
      eta,
      rideDuration: routeMinutes,
      estimatedRideMin: routeMinutes,
      fare: "$0.00",
      arrivalTime,
      routeGeojson: route?.geometry ?? null,
    };
  }

  async function patchRideStatus(status) {
    if (!state.activeRideId || state.syncedStates.has(status)) {
      return;
    }

    state.syncedStates.add(status);
    try {
      await nativeFetch(`/api/rides/${state.activeRideId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
    } catch {
      state.syncedStates.delete(status);
    }
  }

  async function createRide() {
    const response = await nativeFetch("/api/rides", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildRidePayload()),
    });

    if (!response.ok) {
      throw new Error(`Ride creation failed: ${response.status}`);
    }

    const ride = await response.json();
    state.activeRideId = ride.id;
    state.syncedStates = new Set(["pending"]);
  }

  function hideNonTeslaChrome() {
    const threeDButton = document.querySelector('[data-testid="btn-toggle-3d"]');
    if (threeDButton instanceof HTMLElement) {
      threeDButton.style.display = "none";
    }

    const credits = Array.from(document.querySelectorAll("a")).filter((anchor) => {
      return anchor.href.includes("perplexity.ai/computer");
    });
    for (const credit of credits) {
      const parent = credit.closest("p");
      if (parent instanceof HTMLElement) {
        parent.style.display = "none";
      }
    }

    const demoBadge = Array.from(document.querySelectorAll("span")).find((span) => {
      return normalizeText(span.textContent) === "DEMO";
    });
    const demoBar = demoBadge?.closest("div");
    if (demoBar instanceof HTMLElement && normalizeText(demoBar.textContent).includes("Next")) {
      demoBar.style.display = "none";
    }
  }

  function watchRideProgress() {
    if (!state.activeRideId) {
      return;
    }

    if (document.querySelector('[data-testid="btn-enter-vehicle"]')) {
      patchRideStatus("arrived");
    }

    if (document.querySelector('[data-testid="btn-pull-over"]')) {
      patchRideStatus("in_ride");
    }

    if (normalizeText(document.body.textContent).includes("You've arrived.")) {
      patchRideStatus("completed");
    }
  }

  window.fetch = async function patchedFetch(input, init) {
    const requestUrl = new URL(typeof input === "string" ? input : input.url, window.location.href);
    const response = await nativeFetch(input, init);

    if (requestUrl.pathname === "/api/route") {
      try {
        state.lastRouteRequest = parseRouteRequest(requestUrl);
        state.lastRoutePayload = await response.clone().json();
      } catch {
        state.lastRoutePayload = null;
      }
    }

    return response;
  };

  document.addEventListener("click", async (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) {
      return;
    }

    const bookButton = target.closest('[data-testid="btn-book-ride"]');
    if (bookButton && !state.bookingLocked && !state.activeRideId) {
      state.bookingLocked = true;
      try {
        await createRide();
      } catch {
        state.activeRideId = null;
      } finally {
        window.setTimeout(() => {
          state.bookingLocked = false;
        }, 1200);
      }
      return;
    }

    const cancelButton = target.closest('[data-testid="btn-cancel-ride"], [data-testid="btn-cancel-start"]');
    if (cancelButton) {
      patchRideStatus("cancelled");
      state.activeRideId = null;
      state.syncedStates.clear();
      return;
    }

    const doneButton = target.closest('[data-testid="btn-done"]');
    if (doneButton) {
      patchRideStatus("completed");
      window.setTimeout(() => {
        state.activeRideId = null;
        state.syncedStates.clear();
      }, 250);
    }
  });

  window.setInterval(() => {
    hideNonTeslaChrome();
    watchRideProgress();
  }, 400);
})();

