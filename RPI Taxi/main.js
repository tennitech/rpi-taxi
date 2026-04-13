import { GEOFENCE_COORDS } from "./geofence.js";

const GEOFENCE_OUTER_RING = [
  [42.81, -73.79],
  [42.81, -73.57],
  [42.64, -73.57],
  [42.64, -73.79],
];

const GEOFENCE_THEME_STYLES = {
  dark: {
    border: {
      color: "#b8bcc2",
      fill: false,
      opacity: 0.72,
      smoothFactor: 1.1,
      weight: 3,
    },
    mask: {
      color: "transparent",
      fillColor: "#050608",
      fillOpacity: 0.46,
      interactive: false,
      smoothFactor: 1.1,
      stroke: false,
    },
  },
  light: {
    border: {
      color: "#aeb3ba",
      fill: false,
      opacity: 0.86,
      smoothFactor: 1.1,
      weight: 3,
    },
    mask: {
      color: "transparent",
      fillColor: "#b8bcc4",
      fillOpacity: 0.44,
      interactive: false,
      smoothFactor: 1.1,
      stroke: false,
    },
  },
};

const LOCATION_PREFERENCE_KEY = "rpi_taxi_location_permission";
const LOCATION_PREFERENCE_GRANTED = "granted";
const LOCATION_PREFERENCE_DENIED = "denied";
const CURATED_DESTINATION_CACHE_KEY = "rpi_taxi_curated_destinations_v1";

const RIDE_SHEET_ROTATION_INTERVAL_MS = 4200;
const DESTINATION_SEARCH_DEBOUNCE_MS = 140;
const SEARCH_RESULT_LIMIT = 10;
const SEARCH_FALLBACK_TRIGGER_COUNT = 4;
const DESTINATION_SEARCH_API_URL = "/api/destination-search";
const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
const GEOFENCE = createGeofenceProfile(GEOFENCE_COORDS);
const DEFAULT_SEARCH_ORIGIN = GEOFENCE.centroid;

const TILE_LAYERS = {
  dark: [
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      options: {
        detectRetina: true,
        maxZoom: 20,
        pane: "darkBasePane",
        subdomains: "abcd",
      },
      url: "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
    },
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      options: {
        detectRetina: true,
        maxZoom: 20,
        opacity: 0.56,
        pane: "darkLabelsPane",
        subdomains: "abcd",
      },
      url: "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png",
    },
  ],
  light: [
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      options: {
        detectRetina: true,
        maxZoom: 20,
        pane: "lightBasePane",
        subdomains: "abcd",
      },
      url: "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
    },
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      options: {
        detectRetina: true,
        maxZoom: 20,
        opacity: 0.72,
        pane: "lightLabelsPane",
        subdomains: "abcd",
      },
      url: "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png",
    },
  ],
};

const CURATED_DESTINATIONS = [
  {
    id: "student-union",
    lat: 42.7294,
    lng: -73.6762,
    lookup: "Rensselaer Student Union, 15th Street and Sage Avenue, Troy, NY 12180",
    title: "Rensselaer Student Union",
    subtitle: "15th St & Sage Ave, Troy, NY",
  },
  {
    id: "parking-garage",
    lat: 42.7302,
    lng: -73.6772,
    lookup: "RPI Parking Garage, 15th Street and Sage Avenue, Troy, NY 12180",
    title: "RPI Parking Garage",
    subtitle: "15th St & Sage Ave, Troy, NY",
  },
  {
    id: "north-lot",
    lat: 42.7339,
    lng: -73.6795,
    lookup: "North Lot, Peoples Avenue, Troy, NY 12180",
    title: "North Lot",
    subtitle: "People Ave, Troy, NY",
  },
  {
    id: "empac",
    lat: 42.7302,
    lng: -73.6834,
    lookup: "50 8th Street, Troy, NY 12180",
    title: "EMPAC",
    subtitle: "110 8th St, Troy, NY",
  },
  {
    id: "blitman",
    lat: 42.7304,
    lng: -73.6917,
    lookup: "Blitman Residence Commons, Commons West, Troy, NY 12180",
    title: "Blitman Residence Commons",
    subtitle: "Blitman Hall, Troy, NY",
  },
  {
    id: "dinosaur",
    lat: 42.7331,
    lng: -73.6891,
    lookup: "377 River St, Troy, NY 12180",
    title: "Dinosaur Bar-B-Que",
    subtitle: "377 River St, Troy, NY",
  },
  {
    id: "herbies",
    lat: 42.7287,
    lng: -73.6906,
    lookup: "415 Fulton St, Troy, NY 12180",
    title: "Herbie's Burgers",
    subtitle: "415 Fulton St, Troy, NY",
  },
  {
    id: "k-plate",
    lat: 42.7288,
    lng: -73.6895,
    lookup: "76 4th St, Troy, NY 12180",
    title: "K-Plate Korean BBQ",
    subtitle: "76 4th St, Troy, NY",
  },
  {
    id: "walmart",
    lat: 42.745785,
    lng: -73.638741,
    lookup: "760 Hoosick Rd, Troy, NY 12180",
    title: "Walmart Supercenter",
    subtitle: "760 Hoosick Rd, Troy, NY",
  },
];

const template = String.raw`
  <section class="app-shell" data-view="welcome">
    <section class="welcome-screen" aria-label="RPI Taxi welcome screen">
      <img
        class="welcome-screen__logo"
        src="./RPI%20Taxi%20Logo%20-%20Wide.png"
        alt="RPI Taxi"
      />
      <div class="welcome-screen__actions" aria-label="Welcome actions">
        <button
          class="welcome-screen__button welcome-screen__button--primary"
          type="button"
          data-enter-mode="ride"
        >
          Let's Ride
        </button>
        <button
          class="welcome-screen__button welcome-screen__button--secondary"
          type="button"
          data-enter-mode="dev"
        >
          Dev Mode
        </button>
      </div>
    </section>

    <section class="map-screen" data-theme="dark" data-dev-mode="false" aria-label="RPI campus map">
      <div class="theme-toggle" data-map-occlusion="true" role="group" aria-label="Map theme">
        <button class="theme-toggle__option is-active" type="button" data-theme-option="dark" aria-pressed="true">Dark</button>
        <button class="theme-toggle__option" type="button" data-theme-option="light" aria-pressed="false">Light</button>
      </div>
      <div class="map-root" data-map-root></div>
      <button class="ride-map-button ride-map-button--back" type="button" data-destination-close hidden aria-label="Back to destination search">
        <img class="ride-map-button__icon" src="./icons/05-chevron-left.svg" alt="" aria-hidden="true" />
      </button>
      <button class="ride-map-button ride-map-button--menu" type="button" data-destination-menu hidden aria-label="Menu">
        <img class="ride-map-button__icon" src="./icons/06-menu.svg" alt="" aria-hidden="true" />
      </button>

      <section class="ride-sheet" data-sheet-state="compact" aria-label="Choose a destination">
        <div class="ride-sheet__surface" data-map-occlusion="true">
          <form class="ride-search-card" data-destination-form novalidate>
            <div class="ride-search-card__panel">
              <label class="ride-search-card__search" aria-label="Search for destination">
                <img
                  class="ride-search-card__search-icon ride-sheet__icon"
                  src="./icons/08-search.svg"
                  alt=""
                />
                <input
                  class="ride-search-card__input"
                  data-destination-input
                  type="search"
                  inputmode="search"
                  enterkeyhint="search"
                  spellcheck="false"
                  autocomplete="off"
                  placeholder="Search for destination"
                />
              </label>
              <div class="ride-search-card__actions" aria-label="Saved destinations">
                <button class="ride-search-card__action" type="button">
                  <img class="ride-sheet__icon" src="./icons/09-home.svg" alt="" />
                  <span>Add Home</span>
                </button>
                <span class="ride-search-card__divider" aria-hidden="true"></span>
                <button class="ride-search-card__action" type="button">
                  <img class="ride-sheet__icon" src="./icons/10-briefcase.svg" alt="" />
                  <span>Work</span>
                </button>
              </div>
            </div>
            <div class="ride-search-card__eta" aria-hidden="true">
              <span class="ride-search-card__eta-text">A ride can arrive in <strong>~ min</strong></span>
            </div>
          </form>

          <div class="ride-results" data-destination-results aria-live="polite"></div>
          <section class="ride-booking" data-booking-panel hidden aria-label="Ride booking">
            <article class="ride-booking-card" aria-label="Ride summary">
              <header class="ride-booking-card__eta">
                <span>A ride can arrive in <strong>~ min</strong></span>
              </header>
              <div class="ride-booking-card__route">
                <div class="ride-booking-stop ride-booking-stop--pickup">
                  <span class="ride-booking-stop__target" aria-hidden="true"></span>
                  <span class="ride-booking-stop__text">
                    <span class="ride-booking-stop__title">Pickup</span>
                    <span class="ride-booking-stop__subtitle">Tap to edit</span>
                  </span>
                  <span class="ride-booking-stop__time">~ min</span>
                </div>
                <span class="ride-booking-route__arrow" aria-hidden="true"></span>
                <div class="ride-booking-stop ride-booking-stop--destination">
                  <span class="ride-booking-stop__pin" aria-hidden="true"></span>
                  <span class="ride-booking-stop__text">
                    <span class="ride-booking-stop__title" data-booking-destination-title>Destination</span>
                    <span class="ride-booking-stop__subtitle" data-booking-destination-subtitle>Ride zone</span>
                  </span>
                  <span class="ride-booking-stop__time">~ min</span>
                </div>
              </div>
            </article>
            <div class="ride-payment" aria-label="Payment method">
              <span class="ride-payment__brand">DEMO</span>
              <span class="ride-payment__number">•••• 1824</span>
              <span class="ride-payment__chevron" aria-hidden="true"></span>
              <span class="ride-payment__spacer"></span>
              <span class="ride-payment__price">
                <span class="ride-payment__badge">NEW</span>
                <span class="ride-payment__price-value">$0.00</span>
                <s>$19.56</s>
              </span>
            </div>
            <button class="ride-book-button" type="button">Book Ride</button>
          </section>
        </div>
      </section>
    </section>
  </section>
`;

function normalizeQuery(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeSearchText(value) {
  return normalizeQuery(value)
    .replace(/&/gu, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function tokenizeSearchText(value) {
  const normalizedValue = normalizeSearchText(value);
  return normalizedValue ? normalizedValue.split(" ") : [];
}

function buildSearchQueries(query) {
  const queries = [];
  const seen = new Set();

  const appendQuery = (value) => {
    const trimmedValue = String(value ?? "").trim();
    const normalizedValue = normalizeSearchText(trimmedValue);

    if (!normalizedValue || seen.has(normalizedValue)) {
      return;
    }

    seen.add(normalizedValue);
    queries.push(trimmedValue);
  };

  appendQuery(query);
  appendQuery(normalizeSearchText(query));

  if (!hasLocalityHint(query)) {
    appendQuery(`${query}, Troy, NY`);

    if (looksLikeAddressQuery(query)) {
      appendQuery(`${query}, Troy, NY 12180`);
      appendQuery(`${query}, Rensselaer Polytechnic Institute, Troy, NY`);
    } else {
      appendQuery(`${query}, RPI, Troy, NY`);
    }
  }

  return queries;
}

function hasLocalityHint(query) {
  return /\b(troy|rensselaer|rpi|new york|ny|12180)\b/iu.test(String(query ?? ""));
}

function looksLikeAddressQuery(query) {
  return /^\s*\d/u.test(String(query ?? "")) || /\b(st|street|ave|avenue|rd|road|dr|drive|ln|lane|ct|court|blvd|boulevard|pl|place|way|cir|circle|pkwy|parkway)\b/iu.test(String(query ?? ""));
}

function createGeofenceProfile(coords) {
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

  return {
    bounds,
    centroid: getPolygonCentroid(coords, bounds),
    coords: coords.map(([lat, lng]) => [lat, lng]),
    viewbox: `${bounds.minLng},${bounds.maxLat},${bounds.maxLng},${bounds.minLat}`,
  };
}

function getPolygonCentroid(polygon, bounds) {
  let twiceArea = 0;
  let centroidLat = 0;
  let centroidLng = 0;

  for (let index = 0; index < polygon.length; index += 1) {
    const [currentLat, currentLng] = polygon[index];
    const [nextLat, nextLng] = polygon[(index + 1) % polygon.length];
    const crossProduct = currentLng * nextLat - nextLng * currentLat;

    twiceArea += crossProduct;
    centroidLat += (currentLat + nextLat) * crossProduct;
    centroidLng += (currentLng + nextLng) * crossProduct;
  }

  if (!Number.isFinite(twiceArea) || Math.abs(twiceArea) < 1e-9) {
    return {
      lat: (bounds.minLat + bounds.maxLat) / 2,
      lng: (bounds.minLng + bounds.maxLng) / 2,
    };
  }

  return {
    lat: centroidLat / (3 * twiceArea),
    lng: centroidLng / (3 * twiceArea),
  };
}

function abbreviateState(state) {
  if (state === "New York") {
    return "NY";
  }

  return state ?? "";
}

function buildStreetLine(address = {}) {
  const houseNumber = address.house_number ?? "";
  const street =
    address.road ??
    address.pedestrian ??
    address.residential ??
    address.footway ??
    address.path ??
    address.neighbourhood ??
    "";
  const combined = [houseNumber, street].filter(Boolean).join(" ").trim();
  return combined || street || "";
}

function buildLocalityLine(address = {}) {
  const city =
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.hamlet ??
    address.suburb ??
    "";
  const state = abbreviateState(address.state);
  return [city, state].filter(Boolean).join(", ");
}

function isStreetTitle(title = "") {
  return /^\d/u.test(title.trim());
}

function haversineMiles(fromLat, fromLng, toLat, toLng) {
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusMiles = 3958.7613;
  const latDelta = toRadians(toLat - fromLat);
  const lngDelta = toRadians(toLng - fromLng);
  const startLat = toRadians(fromLat);
  const endLat = toRadians(toLat);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDelta / 2) ** 2;
  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(distanceMiles) {
  if (!Number.isFinite(distanceMiles)) {
    return "";
  }

  if (distanceMiles < 0.1) {
    return "<0.1 mi";
  }

  return `${distanceMiles.toFixed(1)} mi`;
}

function pointInBounds(lat, lng, bounds) {
  return lat >= bounds.minLat && lat <= bounds.maxLat && lng >= bounds.minLng && lng <= bounds.maxLng;
}

function isPointOnSegment(lat, lng, start, end) {
  const [startLat, startLng] = start;
  const [endLat, endLng] = end;
  const crossProduct = (lng - startLng) * (endLat - startLat) - (lat - startLat) * (endLng - startLng);

  if (Math.abs(crossProduct) > 1e-10) {
    return false;
  }

  const dotProduct = (lat - startLat) * (lat - endLat) + (lng - startLng) * (lng - endLng);
  return dotProduct <= 1e-10;
}

function pointInPolygon(lat, lng, polygon, bounds = null) {
  if (bounds && !pointInBounds(lat, lng, bounds)) {
    return false;
  }

  let inside = false;

  for (let currentIndex = 0, previousIndex = polygon.length - 1; currentIndex < polygon.length; previousIndex = currentIndex++) {
    const [currentLat, currentLng] = polygon[currentIndex];
    const [previousLat, previousLng] = polygon[previousIndex];

    if (isPointOnSegment(lat, lng, [currentLat, currentLng], [previousLat, previousLng])) {
      return true;
    }

    const lngIntersects = currentLng > lng !== previousLng > lng;

    if (!lngIntersects) {
      continue;
    }

    const slopeLat = ((previousLat - currentLat) * (lng - currentLng)) / (previousLng - currentLng) + currentLat;
    if (lat < slopeLat) {
      inside = !inside;
    }
  }

  return inside;
}

function getEditDistance(left, right, maxDistance = 2) {
  if (left === right) {
    return 0;
  }

  if (Math.abs(left.length - right.length) > maxDistance) {
    return maxDistance + 1;
  }

  let previousRow = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const currentRow = [leftIndex];
    let rowMinimum = currentRow[0];

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      const nextDistance = Math.min(
        previousRow[rightIndex] + 1,
        currentRow[rightIndex - 1] + 1,
        previousRow[rightIndex - 1] + substitutionCost,
      );

      currentRow.push(nextDistance);
      rowMinimum = Math.min(rowMinimum, nextDistance);
    }

    if (rowMinimum > maxDistance) {
      return maxDistance + 1;
    }

    previousRow = currentRow;
  }

  return previousRow[right.length];
}

function getTextMatchScore(candidate, query) {
  const normalizedCandidate = normalizeSearchText(candidate);
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedCandidate || !normalizedQuery) {
    return 0;
  }

  if (normalizedCandidate === normalizedQuery) {
    return 160;
  }

  if (normalizedCandidate.startsWith(normalizedQuery)) {
    return 140;
  }

  if (normalizedCandidate.includes(normalizedQuery)) {
    return 120;
  }

  const candidateTokens = tokenizeSearchText(normalizedCandidate);
  const queryTokens = tokenizeSearchText(normalizedQuery);
  let matchedTokens = 0;
  let score = 0;

  queryTokens.forEach((queryToken) => {
    let bestTokenScore = 0;

    candidateTokens.forEach((candidateToken) => {
      if (candidateToken === queryToken) {
        bestTokenScore = Math.max(bestTokenScore, 52);
        return;
      }

      if (candidateToken.startsWith(queryToken)) {
        bestTokenScore = Math.max(bestTokenScore, 40);
        return;
      }

      if (candidateToken.includes(queryToken) || queryToken.includes(candidateToken)) {
        bestTokenScore = Math.max(bestTokenScore, 24);
        return;
      }

      if (queryToken.length >= 5 && candidateToken.length >= 5) {
        const maxDistance = Math.min(2, Math.floor(queryToken.length / 4));
        const editDistance = getEditDistance(queryToken, candidateToken, maxDistance);

        if (editDistance <= maxDistance) {
          bestTokenScore = Math.max(bestTokenScore, maxDistance === 1 ? 18 : 14);
        }
      }
    });

    if (bestTokenScore > 0) {
      matchedTokens += 1;
      score += bestTokenScore;
    }
  });

  if (matchedTokens === 0) {
    return 0;
  }

  if (matchedTokens === queryTokens.length) {
    score += 16;
  } else {
    score -= (queryTokens.length - matchedTokens) * 12;
  }

  return Math.max(score, 0);
}

function dedupeDestinations(destinations) {
  const seen = new Set();
  const deduped = [];

  destinations.forEach((destination) => {
    const key = `${normalizeQuery(destination.title)}|${normalizeQuery(destination.subtitle)}|${destination.lat.toFixed(4)}|${destination.lng.toFixed(4)}`;
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    deduped.push(destination);
  });

  return deduped;
}

function clampNumber(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getRectArea(rect) {
  return Math.max(0, rect.right - rect.left) * Math.max(0, rect.bottom - rect.top);
}

function getRectIntersection(rect, bounds) {
  const left = Math.max(rect.left, bounds.left);
  const top = Math.max(rect.top, bounds.top);
  const right = Math.min(rect.right, bounds.right);
  const bottom = Math.min(rect.bottom, bounds.bottom);

  if (right <= left || bottom <= top) {
    return null;
  }

  return { left, top, right, bottom };
}

function subtractRect(rect, cutout) {
  const intersection = getRectIntersection(rect, cutout);

  if (!intersection) {
    return [rect];
  }

  const pieces = [];

  if (intersection.top > rect.top) {
    pieces.push({
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: intersection.top,
    });
  }

  if (intersection.bottom < rect.bottom) {
    pieces.push({
      left: rect.left,
      top: intersection.bottom,
      right: rect.right,
      bottom: rect.bottom,
    });
  }

  if (intersection.left > rect.left) {
    pieces.push({
      left: rect.left,
      top: intersection.top,
      right: intersection.left,
      bottom: intersection.bottom,
    });
  }

  if (intersection.right < rect.right) {
    pieces.push({
      left: intersection.right,
      top: intersection.top,
      right: rect.right,
      bottom: intersection.bottom,
    });
  }

  return pieces.filter((piece) => getRectArea(piece) > 0);
}

function isPointInRect(point, rect) {
  return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
}

class RobotaxiMap extends HTMLElement {
  connectedCallback() {
    if (this.dataset.mounted === "true") {
      return;
    }

    this.dataset.mounted = "true";
    this.innerHTML = template;
    this.searchCache = new Map();
    this.curatedDestinations = CURATED_DESTINATIONS.map((destination) => ({ ...destination }));
    this.hydrateCuratedDestinationsFromStorage();
    this.setupEntryActions();
  }

  disconnectedCallback() {
    window.removeEventListener("resize", this.handleResize);
    this.stopLocationTracking();
    this.teardownRideSheet();
  }

  setupMap() {
    const mapRoot = this.querySelector("[data-map-root]");

    if (!mapRoot || typeof window.L === "undefined") {
      return;
    }

    this.map = window.L.map(mapRoot, {
      attributionControl: false,
      bounceAtZoomLimits: false,
      inertia: true,
      preferCanvas: true,
      worldCopyJump: false,
      zoomControl: false,
      maxBoundsViscosity: 0.72,
      zoomSnap: 0.25,
    });

    const lightBasePane = this.map.createPane("lightBasePane");
    lightBasePane.classList.add("leaflet-light-base-pane");
    lightBasePane.style.zIndex = "200";

    const darkBasePane = this.map.createPane("darkBasePane");
    darkBasePane.classList.add("leaflet-dark-base-pane");
    darkBasePane.style.zIndex = "200";

    const darkLabelsPane = this.map.createPane("darkLabelsPane");
    darkLabelsPane.classList.add("leaflet-dark-labels-pane");
    darkLabelsPane.style.zIndex = "650";

    const geofenceMaskPane = this.map.createPane("geofenceMaskPane");
    geofenceMaskPane.classList.add("leaflet-geofence-mask-pane");
    geofenceMaskPane.style.zIndex = "430";

    const geofenceBorderPane = this.map.createPane("geofenceBorderPane");
    geofenceBorderPane.classList.add("leaflet-geofence-border-pane");
    geofenceBorderPane.style.zIndex = "620";

    const lightLabelsPane = this.map.createPane("lightLabelsPane");
    lightLabelsPane.classList.add("leaflet-light-labels-pane");
    lightLabelsPane.style.zIndex = "650";

    const destinationPane = this.map.createPane("destinationPane");
    destinationPane.classList.add("leaflet-destination-pane");
    destinationPane.style.zIndex = "680";

    const userLocationPane = this.map.createPane("userLocationPane");
    userLocationPane.classList.add("leaflet-user-location-pane");
    userLocationPane.style.zIndex = "690";

    this.tileLayers = Object.fromEntries(
      Object.entries(TILE_LAYERS).map(([theme, definitions]) => {
        const layers = definitions.map((definition) => {
          return window.L.tileLayer(definition.url, {
            ...definition.options,
            attribution: definition.attribution ?? "",
          });
        });

        return [theme, window.L.layerGroup(layers)];
      }),
    );

    const geofenceBounds = window.L.latLngBounds(GEOFENCE_COORDS);
    this.geofenceBounds = geofenceBounds;

    this.geofenceMask = window.L.polygon([GEOFENCE_OUTER_RING, GEOFENCE_COORDS], {
      fillRule: "evenodd",
      pane: "geofenceMaskPane",
      ...GEOFENCE_THEME_STYLES.dark.mask,
    }).addTo(this.map);

    this.geofenceBorder = window.L.polygon(GEOFENCE_COORDS, {
      pane: "geofenceBorderPane",
      ...GEOFENCE_THEME_STYLES.dark.border,
    }).addTo(this.map);

    this.activeTheme = null;
    this.applyTheme("dark");

    this.updateResponsiveZoomBounds(true);
    window.addEventListener("resize", this.handleResize, { passive: true });
  }

  setupEntryActions() {
    const actionButtons = [...this.querySelectorAll("[data-enter-mode]")];

    if (actionButtons.length === 0) {
      return;
    }

    actionButtons.forEach((button) => {
      button.addEventListener("click", () => {
        this.enterApp(button.dataset.enterMode === "dev");
      });
    });
  }

  enterApp(devMode = false) {
    const shell = this.querySelector(".app-shell");
    const screen = this.querySelector(".map-screen");

    if (!shell || !screen) {
      return;
    }

    screen.dataset.devMode = String(devMode);

    if (!this.map) {
      this.setupMap();
      this.setupThemeToggle();
      this.setupLocationTracking();
    }

    this.setupRideSheet();
    shell.dataset.view = "map";

    window.requestAnimationFrame(() => {
      this.updateRideSheetViewport();
      this.updateResponsiveZoomBounds(true);
    });
  }

  getResponsivePadding() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const sheetState = this.rideSheet?.dataset.sheetState ?? "compact";
    const verticalPaddingFactor = sheetState === "expanded" ? 0.34 : 0.24;

    return [
      Math.max(24, Math.round(width * 0.07)),
      Math.max(32, Math.round(height * verticalPaddingFactor)),
    ];
  }

  getMapOcclusionRects() {
    if (!this.map) {
      return [];
    }

    const mapRect = this.map.getContainer().getBoundingClientRect();
    const occlusionRects = [...this.querySelectorAll("[data-map-occlusion]")]
      .map((element) => {
        const style = window.getComputedStyle(element);

        if (style.display === "none" || style.visibility === "hidden") {
          return null;
        }

        const rect = getRectIntersection(element.getBoundingClientRect(), mapRect);

        if (!rect || getRectArea(rect) < 1) {
          return null;
        }

        return {
          left: rect.left - mapRect.left,
          top: rect.top - mapRect.top,
          right: rect.right - mapRect.left,
          bottom: rect.bottom - mapRect.top,
        };
      })
      .filter(Boolean);

    return occlusionRects;
  }

  getAvailableMapRects() {
    if (!this.map) {
      return [];
    }

    const size = this.map.getSize();
    const baseRect = {
      left: 0,
      top: 0,
      right: size.x,
      bottom: size.y,
    };

    return this.getMapOcclusionRects()
      .reduce((availableRects, occlusionRect) => {
        return availableRects.flatMap((rect) => subtractRect(rect, occlusionRect));
      }, [baseRect])
      .filter((rect) => getRectArea(rect) > 0);
  }

  getPrimaryAvailableMapRect() {
    if (!this.map) {
      return null;
    }

    const size = this.map.getSize();
    const availableRects = this.getAvailableMapRects();

    if (availableRects.length === 0) {
      return {
        left: 0,
        top: 0,
        right: size.x,
        bottom: size.y,
      };
    }

    const mapCenter = {
      x: size.x / 2,
      y: size.y / 2,
    };

    return availableRects.reduce((bestRect, rect) => {
      const rectArea = getRectArea(rect);
      const bestArea = getRectArea(bestRect);

      if (rectArea !== bestArea) {
        return rectArea > bestArea ? rect : bestRect;
      }

      const rectCenterX = (rect.left + rect.right) / 2;
      const rectCenterY = (rect.top + rect.bottom) / 2;
      const bestCenterX = (bestRect.left + bestRect.right) / 2;
      const bestCenterY = (bestRect.top + bestRect.bottom) / 2;
      const rectDistance = Math.hypot(rectCenterX - mapCenter.x, rectCenterY - mapCenter.y);
      const bestDistance = Math.hypot(bestCenterX - mapCenter.x, bestCenterY - mapCenter.y);

      return rectDistance < bestDistance ? rect : bestRect;
    }, availableRects[0]);
  }

  getPrimaryAvailableMapFocusPoint() {
    if (!this.map || typeof window.L === "undefined") {
      return null;
    }

    const size = this.map.getSize();
    const primaryRect = this.getPrimaryAvailableMapRect();

    if (!primaryRect) {
      return window.L.point(size.x / 2, size.y / 2);
    }

    const horizontalMargin = Math.min(Math.max(24, Math.round(size.x * 0.06)), size.x / 2);
    const verticalMargin = Math.min(Math.max(24, Math.round(size.y * 0.06)), size.y / 2);

    return window.L.point(
      clampNumber((primaryRect.left + primaryRect.right) / 2, horizontalMargin, size.x - horizontalMargin),
      clampNumber(
        (primaryRect.top + primaryRect.bottom) / 2,
        verticalMargin,
        size.y - verticalMargin,
      ),
    );
  }

  getAvailableFitBoundsOptions({ animate = false } = {}) {
    const fallbackPadding = this.getResponsivePadding();

    if (!this.map) {
      return {
        animate,
        padding: fallbackPadding,
      };
    }

    const size = this.map.getSize();
    const primaryRect = this.getPrimaryAvailableMapRect();

    if (!primaryRect || primaryRect.bottom <= primaryRect.top || primaryRect.right <= primaryRect.left) {
      return {
        animate,
        padding: fallbackPadding,
      };
    }

    const horizontalPadding = clampNumber(Math.round((primaryRect.right - primaryRect.left) * 0.06), 18, 34);
    const verticalPadding = clampNumber(Math.round((primaryRect.bottom - primaryRect.top) * 0.06), 18, 34);

    return {
      animate,
      paddingBottomRight: [
        Math.round(size.x - primaryRect.right + horizontalPadding),
        Math.round(size.y - primaryRect.bottom + verticalPadding),
      ],
      paddingTopLeft: [
        Math.round(primaryRect.left + horizontalPadding),
        Math.round(primaryRect.top + verticalPadding),
      ],
    };
  }

  getAvailableMapFocusPoint() {
    if (!this.map || typeof window.L === "undefined") {
      return null;
    }

    const size = this.map.getSize();
    const availableRects = this.getAvailableMapRects();

    if (availableRects.length === 0) {
      return window.L.point(size.x / 2, size.y / 2);
    }

    const totalArea = availableRects.reduce((sum, rect) => sum + getRectArea(rect), 0);
    const centroid =
      totalArea > 0
        ? {
            x: availableRects.reduce((sum, rect) => sum + ((rect.left + rect.right) / 2) * getRectArea(rect), 0) / totalArea,
            y: availableRects.reduce((sum, rect) => sum + ((rect.top + rect.bottom) / 2) * getRectArea(rect), 0) / totalArea,
          }
        : null;

    const mapCenter = {
      x: size.x / 2,
      y: size.y / 2,
    };

    const fallbackRect = availableRects.reduce((bestRect, rect) => {
      const rectArea = getRectArea(rect);
      const bestArea = getRectArea(bestRect);

      if (rectArea !== bestArea) {
        return rectArea > bestArea ? rect : bestRect;
      }

      const rectCenterX = (rect.left + rect.right) / 2;
      const rectCenterY = (rect.top + rect.bottom) / 2;
      const bestCenterX = (bestRect.left + bestRect.right) / 2;
      const bestCenterY = (bestRect.top + bestRect.bottom) / 2;
      const rectDistance = Math.hypot(rectCenterX - mapCenter.x, rectCenterY - mapCenter.y);
      const bestDistance = Math.hypot(bestCenterX - mapCenter.x, bestCenterY - mapCenter.y);

      return rectDistance < bestDistance ? rect : bestRect;
    }, availableRects[0]);

    const fallbackPoint = {
      x: (fallbackRect.left + fallbackRect.right) / 2,
      y: (fallbackRect.top + fallbackRect.bottom) / 2,
    };

    const targetPoint =
      centroid && availableRects.some((rect) => isPointInRect(centroid, rect)) ? centroid : fallbackPoint;

    const horizontalMargin = Math.min(Math.max(24, Math.round(size.x * 0.06)), size.x / 2);
    const verticalMargin = Math.min(Math.max(24, Math.round(size.y * 0.06)), size.y / 2);

    return window.L.point(
      clampNumber(targetPoint.x, horizontalMargin, size.x - horizontalMargin),
      clampNumber(targetPoint.y, verticalMargin, size.y - verticalMargin),
    );
  }

  getViewportAdjustedCenterLatLng(targetLatLng, zoom = this.map?.getZoom() ?? 0, focusPoint = this.getAvailableMapFocusPoint()) {
    if (!this.map || typeof window.L === "undefined") {
      return targetLatLng;
    }

    if (!focusPoint) {
      return targetLatLng;
    }

    const mapSize = this.map.getSize();
    const projectedTarget = this.map.project(window.L.latLng(targetLatLng), zoom);
    const focusOffset = window.L.point(focusPoint.x - mapSize.x / 2, focusPoint.y - mapSize.y / 2);

    return this.map.unproject(projectedTarget.subtract(focusOffset), zoom);
  }

  focusLatLngInAvailableMap(latLng, { animate = true, duration = 0.65, zoom = this.map?.getZoom() ?? 0 } = {}) {
    if (!this.map) {
      return;
    }

    const adjustedCenter = this.getViewportAdjustedCenterLatLng(latLng, zoom);

    if (animate) {
      this.map.flyTo(adjustedCenter, zoom, {
        animate: true,
        duration,
      });
      return;
    }

    this.map.setView(adjustedCenter, zoom, {
      animate: false,
    });
  }

  updateResponsiveZoomBounds(resetView = false) {
    if (!this.map || !this.geofenceBounds) {
      return;
    }

    this.map.invalidateSize({ pan: false });
    const padding = this.getResponsivePadding();
    const fitZoom = this.map.getBoundsZoom(this.geofenceBounds, false, padding);
    const minZoom = Math.min(fitZoom, 15.5);

    if (resetView) {
      this.map.setMinZoom(0);
      this.map.fitBounds(this.geofenceBounds, {
        ...this.getAvailableFitBoundsOptions({ animate: false }),
      });
      this.map.setMinZoom(Math.min(this.map.getZoom(), 15.5));
      return;
    }

    this.map.setMinZoom(minZoom);

    if (this.map.getZoom() < minZoom) {
      this.map.setZoom(minZoom, {
        animate: false,
      });
    }
  }

  handleResize = () => {
    this.updateRideSheetViewport();
    this.updateResponsiveZoomBounds(!this.selectedDestinationLatLng);
    this.syncSelectedDestinationViewport(false);
  };

  setupRideSheet() {
    if (this.rideSheetReady) {
      return;
    }

    this.rideSheet = this.querySelector(".ride-sheet");
    this.rideSheetSurface = this.querySelector(".ride-sheet__surface");
    this.destinationInput = this.querySelector("[data-destination-input]");
    this.destinationResults = this.querySelector("[data-destination-results]");
    this.destinationForm = this.querySelector("[data-destination-form]");
    this.destinationCloseButton = this.querySelector("[data-destination-close]");
    this.destinationMenuButton = this.querySelector("[data-destination-menu]");
    this.bookingPanel = this.querySelector("[data-booking-panel]");
    this.bookingDestinationTitle = this.querySelector("[data-booking-destination-title]");
    this.bookingDestinationSubtitle = this.querySelector("[data-booking-destination-subtitle]");

    if (
      !this.rideSheet ||
      !this.rideSheetSurface ||
      !this.destinationInput ||
      !this.destinationResults ||
      !this.destinationForm ||
      !this.destinationCloseButton ||
      !this.bookingPanel ||
      !this.bookingDestinationTitle ||
      !this.bookingDestinationSubtitle
    ) {
      return;
    }

    this.rideSheetReady = true;
    this.destinationRotationIndex = 0;
    this.destinationInputFocused = false;
    this.activeDestinationResults = [];
    this.activeSearchController = null;
    this.destinationSearchTimeout = null;
    this.destinationViewportSyncTimeout = null;
    this.selectedDestination = null;

    this.destinationForm.addEventListener("submit", this.handleDestinationSubmit);
    this.destinationInput.addEventListener("focus", this.handleDestinationFocus);
    this.destinationInput.addEventListener("blur", this.handleDestinationBlur);
    this.destinationInput.addEventListener("input", this.handleDestinationInput);
    this.destinationInput.addEventListener("search", this.handleDestinationInput);
    this.destinationCloseButton.addEventListener("click", this.resetDestinationPicker);

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", this.handleVisualViewportChange, { passive: true });
      window.visualViewport.addEventListener("scroll", this.handleVisualViewportChange, { passive: true });
    }

    this.renderDefaultDestinations();
    this.startSuggestionRotation();
    this.updateRideSheetViewport();
    this.updateRideSheetMetrics();
    this.hydrateCuratedDestinations();
  }

  teardownRideSheet() {
    this.stopSuggestionRotation();
    this.clearDestinationSearchTimeout();
    this.abortDestinationSearch();
    this.clearDestinationViewportSyncTimeout();

    if (this.destinationForm) {
      this.destinationForm.removeEventListener("submit", this.handleDestinationSubmit);
    }

    if (this.destinationInput) {
      this.destinationInput.removeEventListener("focus", this.handleDestinationFocus);
      this.destinationInput.removeEventListener("blur", this.handleDestinationBlur);
      this.destinationInput.removeEventListener("input", this.handleDestinationInput);
      this.destinationInput.removeEventListener("search", this.handleDestinationInput);
    }

    if (this.destinationCloseButton) {
      this.destinationCloseButton.removeEventListener("click", this.resetDestinationPicker);
    }

    if (window.visualViewport) {
      window.visualViewport.removeEventListener("resize", this.handleVisualViewportChange);
      window.visualViewport.removeEventListener("scroll", this.handleVisualViewportChange);
    }
  }

  handleVisualViewportChange = () => {
    this.updateRideSheetViewport();
  };

  clearDestinationViewportSyncTimeout() {
    if (this.destinationViewportSyncTimeout === null) {
      return;
    }

    window.clearTimeout(this.destinationViewportSyncTimeout);
    this.destinationViewportSyncTimeout = null;
  }

  syncSelectedDestinationViewport(animate = false) {
    if (!this.selectedDestinationLatLng) {
      return;
    }

    this.focusLatLngInAvailableMap(this.selectedDestinationLatLng, {
      animate,
      duration: animate ? 0.65 : 0,
      zoom: this.map?.getZoom() ?? 0,
    });
  }

  updateRideSheetViewport() {
    const keyboardOffset = this.getKeyboardOffset();
    this.style.setProperty("--ride-keyboard-offset", `${keyboardOffset}px`);

    if (this.selectedDestination) {
      this.setRideSheetState("selected");
      this.updateRideSheetMetrics();
      return;
    }

    const shouldExpand = this.destinationInputFocused || keyboardOffset > 80;
    this.setRideSheetState(shouldExpand ? "expanded" : "compact");
    this.updateRideSheetMetrics();
  }

  getKeyboardOffset() {
    if (!window.visualViewport) {
      return 0;
    }

    const viewport = window.visualViewport;
    const offset = window.innerHeight - viewport.height - viewport.offsetTop;
    return Math.max(0, Math.round(offset));
  }

  setRideSheetState(state) {
    if (!this.rideSheet || this.rideSheet.dataset.sheetState === state) {
      return;
    }

    this.rideSheet.dataset.sheetState = state;
    this.updateResponsiveZoomBounds(!this.selectedDestinationLatLng);
    this.syncSelectedDestinationViewport(false);
    window.requestAnimationFrame(() => {
      this.updateRideSheetMetrics();
    });
  }

  updateRideSheetMetrics() {
    if (!this.rideSheet || !this.rideSheetSurface) {
      return;
    }

    const surfaceHeight = this.rideSheetSurface.getBoundingClientRect().height;
    const viewportHeight = window.innerHeight || 1;
    const isBookingState = this.rideSheet.dataset.sheetState === "selected";
    const fadeStart = isBookingState
      ? clampNumber(((viewportHeight - surfaceHeight - 10) / viewportHeight) * 100, 52, 62)
      : clampNumber(((viewportHeight - surfaceHeight - 132) / viewportHeight) * 100, 48, 58);
    const blackStart = isBookingState
      ? clampNumber(((viewportHeight - 140) / viewportHeight) * 100, 76, 86)
      : clampNumber(((viewportHeight - surfaceHeight - 36) / viewportHeight) * 100, 68, 76);

    this.rideSheet.style.setProperty("--ride-fade-start", `${fadeStart}%`);
    this.rideSheet.style.setProperty("--ride-black-start", `${Math.max(blackStart, fadeStart + 12)}%`);
  }

  handleDestinationFocus = () => {
    this.destinationInputFocused = true;
    this.stopSuggestionRotation();
    this.renderCurrentResults();
    this.updateRideSheetViewport();
  };

  handleDestinationBlur = () => {
    window.setTimeout(() => {
      const isStillFocused = this.destinationInput === document.activeElement;
      this.destinationInputFocused = isStillFocused;

      if (!isStillFocused && !this.destinationInput.value.trim()) {
        this.startSuggestionRotation();
        this.renderDefaultDestinations();
      }

      this.updateRideSheetViewport();
    }, 90);
  };

  handleDestinationInput = () => {
    const query = this.destinationInput?.value ?? "";
    const normalizedQuery = normalizeSearchText(query);
    this.clearDestinationSearchTimeout();
    this.abortDestinationSearch();

    if (!query.trim()) {
      this.renderDefaultDestinations();

      if (!this.destinationInputFocused) {
        this.startSuggestionRotation();
      }

      return;
    }

    if (normalizedQuery.length < 2) {
      this.stopSuggestionRotation();
      this.renderDefaultDestinations();
      return;
    }

    this.stopSuggestionRotation();
    this.renderResultsMessage("Searching nearby destinations…", { loading: true });
    this.scheduleDestinationSearch(query);
  };

  handleDestinationSubmit = (event) => {
    event.preventDefault();

    const firstResult = this.activeDestinationResults?.[0];
    if (firstResult) {
      this.selectDestination(firstResult);
    }
  };

  renderSelectedDestination(destination) {
    if (!this.bookingPanel || !this.bookingDestinationTitle || !this.bookingDestinationSubtitle) {
      return;
    }

    this.bookingDestinationTitle.textContent = destination.title || "Destination";
    this.bookingDestinationSubtitle.textContent = destination.subtitle || "Ride zone";
    this.bookingPanel.hidden = false;

    if (this.destinationCloseButton) {
      this.destinationCloseButton.hidden = false;
    }

    if (this.destinationMenuButton) {
      this.destinationMenuButton.hidden = false;
    }

    if (this.rideSheet) {
      this.rideSheet.dataset.sheetState = "selected";
    }

    this.updateRideSheetMetrics();
  }

  hideSelectedDestination() {
    if (this.bookingPanel) {
      this.bookingPanel.hidden = true;
    }

    if (this.destinationCloseButton) {
      this.destinationCloseButton.hidden = true;
    }

    if (this.destinationMenuButton) {
      this.destinationMenuButton.hidden = true;
    }
  }

  clearDestinationMarker() {
    if (!this.map || !this.destinationMarker) {
      return;
    }

    this.map.removeLayer(this.destinationMarker);
    this.destinationMarker = null;
  }

  resetDestinationPicker = () => {
    this.selectedDestination = null;
    this.selectedDestinationLatLng = null;
    this.clearDestinationViewportSyncTimeout();
    this.clearDestinationSearchTimeout();
    this.abortDestinationSearch();
    this.clearDestinationMarker();
    this.hideSelectedDestination();

    if (this.destinationInput) {
      this.destinationInput.value = "";
      this.destinationInput.blur();
    }

    this.destinationInputFocused = false;
    this.renderDefaultDestinations();
    this.startSuggestionRotation();
    this.setRideSheetState("compact");
    this.updateRideSheetViewport();
    this.updateResponsiveZoomBounds(true);
  };

  startSuggestionRotation() {
    if (this.destinationRotationInterval || this.destinationInput?.value.trim()) {
      return;
    }

    const curatedCount = this.getCuratedDestinations().length;
    if (curatedCount <= 1) {
      return;
    }

    this.destinationRotationInterval = window.setInterval(() => {
      this.destinationRotationIndex = (this.destinationRotationIndex + 1) % curatedCount;
      this.renderDefaultDestinations();
    }, RIDE_SHEET_ROTATION_INTERVAL_MS);
  }

  stopSuggestionRotation() {
    if (!this.destinationRotationInterval) {
      return;
    }

    window.clearInterval(this.destinationRotationInterval);
    this.destinationRotationInterval = null;
  }

  getCuratedDestinations() {
    return this.curatedDestinations.filter((destination) => {
      return this.isWithinGeofence(destination.lat, destination.lng);
    });
  }

  getVisibleCuratedDestinations() {
    const curated = this.sortDestinationsByDistance(this.getCuratedDestinations());
    const visibleCount = Math.min(6, curated.length);

    if (visibleCount === 0) {
      return [];
    }

    return Array.from({ length: visibleCount }, (_, index) => {
      const itemIndex = (this.destinationRotationIndex + index) % curated.length;
      return curated[itemIndex];
    });
  }

  renderDefaultDestinations() {
    this.renderDestinations(this.getVisibleCuratedDestinations(), "suggested");
  }

  renderCurrentResults() {
    const query = this.destinationInput?.value.trim();

    if (!query) {
      this.renderDefaultDestinations();
      return;
    }

    if (this.activeDestinationResults.length > 0) {
      this.renderDestinations(this.activeDestinationResults, "search", query);
    }
  }

  async searchDestinations(query) {
    const normalizedQuery = normalizeSearchText(query);

    if (normalizedQuery.length < 2) {
      this.renderDefaultDestinations();
      return;
    }

    this.abortDestinationSearch();

    const cachedResults = this.searchCache.get(normalizedQuery);
    if (cachedResults) {
      this.renderDestinations(cachedResults, "search", query);
      return;
    }

    const controller = new AbortController();
    this.activeSearchController = controller;

    const curatedMatches = this.getCuratedDestinations().filter((destination) => {
      return this.getDestinationRelevance(destination, normalizedQuery) > 0;
    });

    let remoteMatches = [];
    let searchFailed = false;

    try {
      remoteMatches = await this.fetchDestinationCandidates(query, controller.signal);
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }

      searchFailed = true;
      console.error("Destination search failed.", error);
    }

    if (this.activeSearchController !== controller) {
      return;
    }

    this.activeSearchController = null;
    const mergedResults = dedupeDestinations([...curatedMatches, ...remoteMatches]);

    if (searchFailed && mergedResults.length === 0) {
      this.renderResultsMessage("Destination search is temporarily unavailable.");
      return;
    }

    this.searchCache.set(normalizedQuery, mergedResults);
    this.renderDestinations(mergedResults, "search", query);
  }

  async fetchDestinationCandidates(query, signal, { stopAfter = SEARCH_RESULT_LIMIT } = {}) {
    const searchQueries = buildSearchQueries(query);

    if (searchQueries.length === 0) {
      return [];
    }

    const strictMatches = await this.fetchSearchQueryVariants(searchQueries, signal, {
      bounded: true,
      limit: Math.max(stopAfter + 2, 6),
      stopAfter,
    });

    if (signal?.aborted || strictMatches.length >= Math.min(stopAfter, SEARCH_FALLBACK_TRIGGER_COUNT)) {
      return strictMatches.slice(0, stopAfter);
    }

    const fallbackMatches = await this.fetchSearchQueryVariants(searchQueries, signal, {
      bounded: false,
      limit: Math.max(stopAfter + 6, 10),
      stopAfter,
    });

    return dedupeDestinations([...strictMatches, ...fallbackMatches]).slice(0, stopAfter);
  }

  async fetchSearchQueryVariants(searchQueries, signal, options) {
    let matches = [];

    for (const searchQuery of searchQueries) {
      const queryMatches = await this.fetchDestinationSearchResultsWithFallback(searchQuery, signal, options);
      matches = dedupeDestinations([...matches, ...queryMatches]);

      if (matches.length >= (options?.stopAfter ?? Number.POSITIVE_INFINITY)) {
        break;
      }
    }

    return matches;
  }

  async fetchDestinationSearchResultsWithFallback(query, signal, options) {
    try {
      return await this.fetchDestinationSearchResults(query, signal, options, DESTINATION_SEARCH_API_URL);
    } catch (error) {
      if (error?.name === "AbortError") {
        throw error;
      }

      return this.fetchDestinationSearchResults(query, signal, options, NOMINATIM_SEARCH_URL);
    }
  }

  async fetchDestinationSearchResults(query, signal, { bounded = true, limit = SEARCH_RESULT_LIMIT } = {}, endpointUrl) {
    const searchParams = new URLSearchParams({
      addressdetails: "1",
      countrycodes: "us",
      dedupe: "1",
      format: "jsonv2",
      limit: String(limit),
      namedetails: "1",
      q: query,
    });

    searchParams.set("viewbox", GEOFENCE.viewbox);

    if (bounded) {
      searchParams.set("bounded", "1");
    }

    const response = await fetch(`${endpointUrl}?${searchParams.toString()}`, {
      headers: {
        Accept: "application/json",
      },
      signal,
    });

    if (!response.ok) {
      throw new Error(`Search failed with status ${response.status}`);
    }

    const json = await response.json();
    return json
      .map((result) => this.normalizeSearchResult(result))
      .filter(Boolean);
  }

  abortDestinationSearch() {
    if (this.activeSearchController) {
      this.activeSearchController.abort();
      this.activeSearchController = null;
    }
  }

  clearDestinationSearchTimeout() {
    if (this.destinationSearchTimeout === null) {
      return;
    }

    window.clearTimeout(this.destinationSearchTimeout);
    this.destinationSearchTimeout = null;
  }

  scheduleDestinationSearch(query) {
    this.clearDestinationSearchTimeout();
    this.destinationSearchTimeout = window.setTimeout(() => {
      this.destinationSearchTimeout = null;
      this.searchDestinations(query);
    }, DESTINATION_SEARCH_DEBOUNCE_MS);
  }

  normalizeSearchResult(result) {
    const lat = Number(result?.lat);
    const lng = Number(result?.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !this.isWithinGeofence(lat, lng)) {
      return null;
    }

    const address = result?.address ?? {};
    const streetLine = buildStreetLine(address);
    const localityLine = buildLocalityLine(address);
    const displayNameParts = String(result?.display_name ?? "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    const fallbackLocality = localityLine || displayNameParts.slice(1, 3).join(", ") || "Ride zone";
    const namedTitle =
      result?.namedetails?.["name:en"] ??
      result?.namedetails?.name ??
      result?.namedetails?.official_name ??
      result?.name ??
      address.amenity ??
      address.building ??
      address.shop ??
      address.tourism ??
      address.leisure ??
      address.office ??
      address.attraction ??
      address.university ??
      address.college ??
      address.school ??
      address.hospital ??
      address.healthcare ??
      address.public_transport ??
      address.railway ??
      address.place ??
      "";
    const fallbackTitle = streetLine || displayNameParts[0] || "Destination";
    const title = namedTitle || fallbackTitle;
    const subtitle = isStreetTitle(title)
      ? fallbackLocality || streetLine || "Ride zone"
      : [streetLine, fallbackLocality].filter(Boolean).join(", ") || fallbackLocality || "Ride zone";

    return {
      id: `search-${result?.place_id ?? Math.random().toString(36).slice(2)}`,
      lat,
      lng,
      title,
      subtitle,
    };
  }

  renderDestinations(destinations, mode = "suggested", query = "") {
    if (!this.destinationResults) {
      return;
    }

    const normalizedQuery = normalizeSearchText(query);
    const sortedDestinations = this.sortDestinationsByDistance(destinations, normalizedQuery);

    this.activeDestinationResults = sortedDestinations;
    this.destinationResults.textContent = "";
    this.destinationResults.dataset.resultsMode = mode;
    this.destinationResults.dataset.resultsState = "list";
    delete this.destinationResults.dataset.resultsMessage;

    if (sortedDestinations.length === 0) {
      this.renderResultsMessage(
        mode === "search" ? "No destinations in the ride zone match that search." : "No nearby destinations available yet.",
      );
      return;
    }

    const list = document.createElement("div");
    list.className = "ride-results__list";

    sortedDestinations.forEach((destination) => {
      list.append(this.createDestinationRow(destination));
    });

    this.destinationResults.append(list);
    this.destinationResults.scrollTop = 0;
    this.updateRideSheetMetrics();
  }

  renderResultsMessage(message, { loading = false } = {}) {
    if (!this.destinationResults) {
      return;
    }

    if (
      loading &&
      this.destinationResults.dataset.resultsState === "loading" &&
      this.destinationResults.dataset.resultsMessage === message
    ) {
      return;
    }

    this.activeDestinationResults = [];
    this.destinationResults.textContent = "";
    this.destinationResults.dataset.resultsState = loading ? "loading" : "message";
    this.destinationResults.dataset.resultsMessage = message;

    const state = document.createElement("div");
    state.className = loading ? "ride-results__state ride-results__state--loading" : "ride-results__state";

    if (loading) {
      state.setAttribute("role", "status");
      state.setAttribute("aria-label", message);

      const spinner = document.createElement("span");
      spinner.className = "ride-results__spinner";
      spinner.setAttribute("aria-hidden", "true");

      const text = document.createElement("span");
      text.className = "ride-results__sr-only";
      text.textContent = message;

      state.append(spinner, text);
    } else {
      state.textContent = message;
    }

    this.destinationResults.append(state);
    this.updateRideSheetMetrics();
  }

  createDestinationRow(destination) {
    const row = document.createElement("button");
    row.className = "ride-destination";
    row.type = "button";

    const icon = document.createElement("img");
    icon.className = "ride-destination__icon";
    icon.src = "./icons/03-map-pin.svg";
    icon.alt = "";

    const textWrap = document.createElement("span");
    textWrap.className = "ride-destination__text";

    const title = document.createElement("span");
    title.className = "ride-destination__title";
    title.textContent = destination.title;

    const subtitle = document.createElement("span");
    subtitle.className = "ride-destination__subtitle";
    subtitle.textContent = destination.subtitle;

    textWrap.append(title, subtitle);

    const distance = document.createElement("span");
    distance.className = "ride-destination__distance";
    distance.textContent = formatDistance(this.getDistanceFromOrigin(destination.lat, destination.lng));

    row.append(icon, textWrap, distance);
    row.addEventListener("click", () => {
      this.selectDestination(destination);
    });

    return row;
  }

  sortDestinationsByDistance(destinations, normalizedQuery = "") {
    return [...destinations]
      .map((destination) => {
        return {
          ...destination,
          distanceMiles: this.getDistanceFromOrigin(destination.lat, destination.lng),
          relevance: this.getDestinationRelevance(destination, normalizedQuery),
        };
      })
      .sort((left, right) => {
        if (left.relevance !== right.relevance) {
          return right.relevance - left.relevance;
        }

        return left.distanceMiles - right.distanceMiles;
      });
  }

  getDestinationRelevance(destination, normalizedQuery) {
    if (!normalizedQuery) {
      return 0;
    }

    const titleScore = getTextMatchScore(destination.title, normalizedQuery);
    const subtitleScore = getTextMatchScore(destination.subtitle, normalizedQuery);
    const combinedScore = getTextMatchScore(`${destination.title} ${destination.subtitle}`, normalizedQuery);

    return Math.max(titleScore > 0 ? titleScore + 8 : 0, subtitleScore, combinedScore);
  }

  getDistanceFromOrigin(lat, lng) {
    const origin = this.getSearchOrigin();
    return haversineMiles(origin.lat, origin.lng, lat, lng);
  }

  getSearchOrigin() {
    if (this.userLocationMarker?.getLatLng) {
      const location = this.userLocationMarker.getLatLng();
      return {
        lat: location.lat,
        lng: location.lng,
      };
    }

    return DEFAULT_SEARCH_ORIGIN;
  }

  async selectDestination(destination) {
    const resolvedDestination = await this.resolveDestinationCoordinates(destination);
    const shouldWaitForViewportUpdate = this.destinationInputFocused;
    const latLng =
      this.map && typeof window.L !== "undefined"
        ? window.L.latLng(resolvedDestination.lat, resolvedDestination.lng)
        : null;

    this.selectedDestinationLatLng = latLng;
    this.stopSuggestionRotation();
    this.clearDestinationSearchTimeout();
    this.abortDestinationSearch();

    if (this.destinationInput) {
      this.destinationInput.value = resolvedDestination.title;
      this.destinationInput.blur();
    }

    const showSelectedDestination = () => {
      this.selectedDestination = resolvedDestination;
      this.renderSelectedDestination(resolvedDestination);
    };

    if (this.map && latLng) {
      const targetZoom = Math.max(this.map.getZoom(), 16);
      this.renderDestinationMarker(latLng);
      this.clearDestinationViewportSyncTimeout();

      const focusSelection = () => {
        this.destinationViewportSyncTimeout = null;

        if (!this.selectedDestinationLatLng || !this.selectedDestinationLatLng.equals(latLng)) {
          return;
        }

        this.focusLatLngInAvailableMap(latLng, {
          animate: true,
          duration: 0.65,
          zoom: targetZoom,
        });
        showSelectedDestination();
      };

      if (shouldWaitForViewportUpdate) {
        this.destinationViewportSyncTimeout = window.setTimeout(focusSelection, 120);
      } else {
        focusSelection();
      }

      return;
    }

    showSelectedDestination();
  }

  renderDestinationMarker(latLng) {
    if (!this.map || typeof window.L === "undefined") {
      return;
    }

    if (!this.destinationMarker) {
      this.destinationMarker = window.L.circleMarker(latLng, {
        color: "#fff3dd",
        fillColor: "#d3af78",
        fillOpacity: 0.96,
        interactive: false,
        opacity: 1,
        pane: "destinationPane",
        radius: 8,
        weight: 3,
      }).addTo(this.map);
      return;
    }

    this.destinationMarker.setLatLng(latLng);
  }

  isWithinGeofence(lat, lng) {
    return pointInPolygon(lat, lng, GEOFENCE.coords, GEOFENCE.bounds);
  }

  async resolveDestinationCoordinates(destination) {
    if (destination.resolvedAt || !destination.lookup) {
      return destination;
    }

    const exactCoordinates = await this.lookupDestinationCoordinates(destination.lookup);
    if (!exactCoordinates) {
      return destination;
    }

    const resolvedDestination = {
      ...destination,
      lat: exactCoordinates.lat,
      lng: exactCoordinates.lng,
      resolvedAt: Date.now(),
      subtitle: exactCoordinates.subtitle ?? destination.subtitle,
    };

    this.curatedDestinations = this.curatedDestinations.map((entry) => {
      return entry.id === resolvedDestination.id ? resolvedDestination : entry;
    });
    this.persistCuratedDestinations();

    return resolvedDestination;
  }

  hydrateCuratedDestinationsFromStorage() {
    try {
      const rawValue = window.localStorage.getItem(CURATED_DESTINATION_CACHE_KEY);
      if (!rawValue) {
        return;
      }

      const cachedDestinations = JSON.parse(rawValue);
      if (!Array.isArray(cachedDestinations)) {
        return;
      }

      this.curatedDestinations = this.curatedDestinations.map((destination) => {
        const cachedDestination = cachedDestinations.find((entry) => entry.id === destination.id);
        return cachedDestination ? { ...destination, ...cachedDestination } : destination;
      });
    } catch {
      // Ignore cache parse failures and rebuild from network when needed.
    }
  }

  async hydrateCuratedDestinations() {
    if (this.curatedDestinationHydrationPromise) {
      return this.curatedDestinationHydrationPromise;
    }

    this.curatedDestinationHydrationPromise = Promise.all(
      this.curatedDestinations.map(async (destination) => {
        const exactCoordinates = await this.lookupDestinationCoordinates(destination.lookup ?? destination.subtitle);
        if (!exactCoordinates) {
          return destination;
        }

        return {
          ...destination,
          lat: exactCoordinates.lat,
          lng: exactCoordinates.lng,
          resolvedAt: Date.now(),
          subtitle: exactCoordinates.subtitle ?? destination.subtitle,
        };
      }),
    )
      .then((resolvedDestinations) => {
        this.curatedDestinations = resolvedDestinations;
        this.persistCuratedDestinations();

        if (!this.destinationInput?.value.trim()) {
          this.renderDefaultDestinations();
        }
      })
      .catch(() => {
        // Keep fallback coordinates when network lookup fails.
      });

    return this.curatedDestinationHydrationPromise;
  }

  persistCuratedDestinations() {
    try {
      window.localStorage.setItem(CURATED_DESTINATION_CACHE_KEY, JSON.stringify(this.curatedDestinations));
    } catch {
      // Ignore storage failures.
    }
  }

  async lookupDestinationCoordinates(query) {
    if (!query) {
      return null;
    }

    try {
      const exactMatch = (await this.fetchDestinationCandidates(query, undefined, { stopAfter: 1 }))[0];

      if (!exactMatch) {
        return null;
      }

      return {
        lat: exactMatch.lat,
        lng: exactMatch.lng,
        subtitle: exactMatch.subtitle,
      };
    } catch {
      return null;
    }
  }

  setupLocationTracking() {
    if (this.locationTrackingReady || !this.map || !navigator.geolocation) {
      return;
    }

    this.locationTrackingReady = true;
    const storedPreference = this.getStoredLocationPreference();

    if (!navigator.permissions?.query) {
      if (storedPreference !== LOCATION_PREFERENCE_DENIED) {
        this.startLocationWatch();
      }
      return;
    }

    navigator.permissions
      .query({ name: "geolocation" })
      .then((status) => {
        this.locationPermissionStatus = status;
        this.handleLocationPermissionState(status.state, storedPreference);

        this.handleLocationPermissionChange = () => {
          this.handleLocationPermissionState(status.state, this.getStoredLocationPreference());
        };

        status.addEventListener?.("change", this.handleLocationPermissionChange);
      })
      .catch(() => {
        if (storedPreference !== LOCATION_PREFERENCE_DENIED) {
          this.startLocationWatch();
        }
      });
  }

  handleLocationPermissionState(state, storedPreference) {
    if (state === "granted") {
      this.setStoredLocationPreference(LOCATION_PREFERENCE_GRANTED);
      this.startLocationWatch();
      return;
    }

    if (state === "denied") {
      this.setStoredLocationPreference(LOCATION_PREFERENCE_DENIED);
      this.stopLocationTracking();
      return;
    }

    if (storedPreference !== LOCATION_PREFERENCE_DENIED) {
      this.startLocationWatch();
    }
  }

  startLocationWatch() {
    if (!this.map || !navigator.geolocation || this.locationWatchId !== undefined) {
      return;
    }

    this.locationWatchId = navigator.geolocation.watchPosition(
      (position) => {
        this.setStoredLocationPreference(LOCATION_PREFERENCE_GRANTED);
        this.renderUserLocation(position);
      },
      (error) => {
        if (error?.code === 1) {
          this.setStoredLocationPreference(LOCATION_PREFERENCE_DENIED);
        }

        this.clearUserLocationMarker();
        this.clearLocationWatch();
      },
      {
        enableHighAccuracy: true,
        maximumAge: 60_000,
        timeout: 12_000,
      },
    );
  }

  stopLocationTracking() {
    if (this.locationPermissionStatus && this.handleLocationPermissionChange) {
      this.locationPermissionStatus.removeEventListener?.("change", this.handleLocationPermissionChange);
    }

    this.handleLocationPermissionChange = null;
    this.locationPermissionStatus = null;
    this.clearLocationWatch();
    this.clearUserLocationMarker();
  }

  clearLocationWatch() {
    if (this.locationWatchId !== undefined && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.locationWatchId);
    }

    this.locationWatchId = undefined;
  }

  renderUserLocation(position) {
    if (!this.map || typeof window.L === "undefined") {
      return;
    }

    const latitude = position?.coords?.latitude;
    const longitude = position?.coords?.longitude;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return;
    }

    const latLng = window.L.latLng(latitude, longitude);

    if (!this.userLocationMarker) {
      this.userLocationMarker = window.L.marker(latLng, {
        icon: window.L.divIcon({
          className: "user-location-marker",
          html: '<span class="user-location-marker__dot" aria-hidden="true"></span>',
          iconAnchor: [11, 11],
          iconSize: [22, 22],
        }),
        interactive: false,
        keyboard: false,
        pane: "userLocationPane",
        zIndexOffset: 1200,
      }).addTo(this.map);
    } else {
      this.userLocationMarker.setLatLng(latLng);
    }

    if (this.rideSheetReady) {
      this.renderCurrentResults();
    }
  }

  clearUserLocationMarker() {
    if (!this.map || !this.userLocationMarker) {
      return;
    }

    this.map.removeLayer(this.userLocationMarker);
    this.userLocationMarker = null;
  }

  getStoredLocationPreference() {
    try {
      return window.localStorage.getItem(LOCATION_PREFERENCE_KEY);
    } catch {
      return null;
    }
  }

  setStoredLocationPreference(value) {
    try {
      window.localStorage.setItem(LOCATION_PREFERENCE_KEY, value);
    } catch {
      // Ignore storage write failures and rely on browser permission persistence.
    }
  }

  applyTheme(theme) {
    const screen = this.querySelector(".map-screen");

    if (!screen) {
      return;
    }

    if (this.map && this.tileLayers?.[theme] && this.activeTheme !== theme) {
      if (this.activeTheme && this.tileLayers[this.activeTheme]) {
        this.map.removeLayer(this.tileLayers[this.activeTheme]);
      }
      this.tileLayers[theme].addTo(this.map);
      this.activeTheme = theme;
    }

    if (this.geofenceMask && this.geofenceBorder) {
      this.geofenceMask.setStyle(GEOFENCE_THEME_STYLES[theme].mask);
      this.geofenceBorder.setStyle(GEOFENCE_THEME_STYLES[theme].border);
    }

    screen.dataset.theme = theme;
  }

  setupThemeToggle() {
    if (this.themeToggleReady) {
      return;
    }

    const screen = this.querySelector(".map-screen");
    const buttons = [...this.querySelectorAll("[data-theme-option]")];

    if (!screen || buttons.length === 0) {
      return;
    }

    const setTheme = (theme) => {
      this.applyTheme(theme);

      buttons.forEach((button) => {
        const active = button.dataset.themeOption === theme;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
    };

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        setTheme(button.dataset.themeOption ?? "dark");
      });
    });

    this.themeToggleReady = true;
    setTheme("dark");
  }
}

if (!customElements.get("robotaxi-map")) {
  customElements.define("robotaxi-map", RobotaxiMap);
}

document.querySelector("#app")?.append(document.createElement("robotaxi-map"));

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
      });
    });

    if ("caches" in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => {
          caches.delete(key);
        });
      });
    }
  });
}
