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
      color: "#aeb7c4",
      fill: false,
      opacity: 0.72,
      smoothFactor: 1.1,
      weight: 3,
    },
    mask: {
      color: "transparent",
      fillColor: "#03060b",
      fillOpacity: 0.5,
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

const DESTINATION_SEARCH_DEBOUNCE_MS = 140;
const SEARCH_RESULT_LIMIT = 10;
const SEARCH_FALLBACK_TRIGGER_COUNT = 4;
const DESTINATION_SEARCH_API_URL = "/api/destination-search";
const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
const RIDE_ROUTE_API_URL = "/api/ride-route";
const ROUTE_WALK_THRESHOLD_METERS = 12;
const ROUTE_WALK_METERS_PER_MINUTE = 80;
const ROUTE_PULSE_PERIOD_MS = 3900;
const ROUTE_PULSE_FILL_FRACTION = 0.34;
const RIDE_BOOKED_DELAY_MS = 3000;
const RIDE_BOOKED_ARRIVAL_DELAY_MS = 3000;
const RIDE_BOOKED_VEHICLE_REVEAL_DELAY_MS = 5000;
const RIDE_BOOKED_NOTIFICATION_DURATION_MS = 3800;
const RIDE_BOOKED_NOTIFICATION_EXIT_DURATION_MS = 240;
const RIDE_BOOKED_SCROLL_DURATION_MS = 340;
const RIDE_CANCEL_DELAY_MS = 3000;
const RIDE_BOOKED_MIN_TOP_PX = 14;
const RIDE_BOOKED_BOTTOM_GAP_PX = 42;
const RIDE_BOOKED_TITLE_DEFAULT = "Your ride is booked";
const RIDE_BOOKED_TITLE_ARRIVING = "Ride is ~ min away";
const RIDE_BOOKED_TITLE_HERE = "Ride is here";
const MOCK_VEHICLE_POLL_MIN_MS = 900;
const MOCK_VEHICLE_POLL_MAX_MS = 1800;
const MOCK_VEHICLE_SIMULATION_MIN_MS = 9000;
const MOCK_VEHICLE_SIMULATION_MAX_MS = 16000;
const MOCK_VEHICLE_MIN_DURATION_SECONDS = 70;
const MOCK_VEHICLE_MAX_DURATION_SECONDS = 330;
const MOCK_VEHICLE_TARGET_DURATION_SECONDS = 170;
const MOCK_VEHICLE_LOOKAHEAD_METERS = 18;
const MOCK_VEHICLE_APPROACH_COLOR = "#3A6BE6";
const MOCK_VEHICLE_APPROACH_BORDER_COLOR = "#064086";
const MOCK_VEHICLE_ASSET_BEARING_OFFSET_DEGREES = -90;
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
      <section
        class="ride-booked-notification"
        data-booked-notification
        role="status"
        aria-live="polite"
        aria-hidden="true"
        hidden
      >
        <span class="ride-booked-notification__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path d="M9.55 15.9 6.4 12.75l-1.4 1.4 4.55 4.55L19 9.25l-1.4-1.4z"></path>
          </svg>
        </span>
        <span class="ride-booked-notification__copy">Ride booked and on its way</span>
      </section>
      <div class="ride-cancel-dialog-backdrop" data-cancel-ride-dialog aria-hidden="true" hidden>
        <section
          class="ride-cancel-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-ride-title"
          aria-describedby="cancel-ride-description"
        >
          <h2 class="ride-cancel-dialog__title" id="cancel-ride-title">Cancel this ride?</h2>
          <p class="ride-cancel-dialog__description" id="cancel-ride-description">
            You won't be charged if you cancel now.
          </p>
          <div class="ride-cancel-dialog__actions">
            <button class="ride-cancel-dialog__confirm" type="button" data-cancel-ride-confirm>
              <span class="ride-cancel-dialog__confirm-label">Yes, Cancel</span>
              <span class="ride-cancel-dialog__confirm-spinner" aria-hidden="true"></span>
            </button>
            <button class="ride-cancel-dialog__dismiss" type="button" data-cancel-ride-dismiss>No</button>
          </div>
        </section>
      </div>

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
                <span data-booking-eta-text>A ride can arrive in <strong>~ min</strong></span>
              </header>
              <header class="ride-booking-card__booked">
                <span class="ride-booking-card__booked-copy">
                  <span class="ride-booking-card__booked-title" data-booking-booked-title>Your ride is booked</span>
                  <span class="ride-booking-card__plate">Plate: XAI</span>
                </span>
                <span class="ride-booking-card__car-wrap" aria-hidden="true">
                  <img
                    class="ride-booking-card__car"
                    src="./ride-booked-model-3-black-white-avatar.svg"
                    alt=""
                  />
                </span>
              </header>
              <div class="ride-booking-card__route">
                <div class="ride-booking-stop ride-booking-stop--pickup">
                  <span class="ride-booking-stop__target" aria-hidden="true"></span>
                  <span class="ride-booking-stop__text">
                    <span class="ride-booking-stop__title">Pickup</span>
                    <span class="ride-booking-stop__subtitle" data-booking-pickup-subtitle>Tap to edit</span>
                  </span>
                  <span class="ride-booking-stop__time" data-booking-pickup-time>~ min</span>
                </div>
                <span class="ride-booking-route__arrow" aria-hidden="true"></span>
                <div class="ride-booking-stop ride-booking-stop--destination">
                  <span class="ride-booking-stop__pin" aria-hidden="true"></span>
                  <span class="ride-booking-stop__text">
                    <span class="ride-booking-stop__title" data-booking-destination-title>Destination</span>
                    <span class="ride-booking-stop__subtitle" data-booking-destination-subtitle>Ride zone</span>
                  </span>
                  <span class="ride-booking-stop__time" data-booking-destination-time>~ min</span>
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
            <button class="ride-book-button" type="button" data-book-ride-button>
              <span class="ride-book-button__label">Book Ride</span>
              <span class="ride-book-button__spinner" aria-hidden="true"></span>
            </button>
            <section class="ride-booked-tips" aria-label="Ride tips">
              <h2 class="ride-booked-tips__title">Tips</h2>
              <div class="ride-booked-tips__scroller" aria-label="Ride tips">
                <article class="ride-booked-tip-card ride-booked-tip-card--wait">
                  <span class="ride-booked-tip-card__media" aria-hidden="true">
                    <img class="ride-booked-tip-card__icon" src="./icons/11-history.svg" alt="" />
                  </span>
                  <span class="ride-booked-tip-card__copy">
                    <span>Your ride will wait up to 7 minutes</span>
                    <small>The vehicle will leave after the timer runs out</small>
                  </span>
                </article>
                <article class="ride-booked-tip-card ride-booked-tip-card--seats">
                  <span class="ride-booked-tip-card__media ride-booked-tip-card__media--seats" aria-hidden="true">
                    <img class="ride-booked-tip-card__seats-image" src="./model-3-available-seats.svg" alt="" />
                  </span>
                  <span class="ride-booked-tip-card__copy">
                    <span>Space for 4 riders</span>
                    <small>Supervisor is seated in the driver seat</small>
                  </span>
                </article>
                <article class="ride-booked-tip-card ride-booked-tip-card--lights">
                  <span class="ride-booked-tip-card__media ride-booked-tip-card__media--lights" aria-hidden="true">
                    <img class="ride-booked-tip-card__car-image" src="./assets/model-3-headlights.svg" alt="" />
                  </span>
                  <span class="ride-booked-tip-card__copy">
                    <span>Vehicle lights will pulse on arrival</span>
                    <small>Wait for the pulse before boarding</small>
                  </span>
                </article>
                <article class="ride-booked-tip-card ride-booked-tip-card--trunk">
                  <span class="ride-booked-tip-card__media ride-booked-tip-card__media--trunk" aria-hidden="true">
                    <img class="ride-booked-tip-card__trunk-image" src="./model-3-trunk.svg" alt="" />
                  </span>
                  <span class="ride-booked-tip-card__copy">
                    <span>Store your items in the trunk</span>
                    <small>The trunk unlocks automatically on arrival</small>
                  </span>
                </article>
                <article class="ride-booked-tip-card ride-booked-tip-card--camera">
                  <span class="ride-booked-tip-card__media ride-booked-tip-card__media--camera" aria-hidden="true">
                    <img class="ride-booked-tip-card__camera-image" src="./interior-camera-white.png" alt="" />
                  </span>
                  <span class="ride-booked-tip-card__copy">
                    <span>The interior camera will be used for your safety</span>
                  </span>
                </article>
              </div>
            </section>
            <div class="ride-booked-actions" aria-label="Ride actions">
              <button class="ride-booked-action" type="button">Report Issue</button>
              <button class="ride-booked-action ride-booked-action--cancel" type="button" data-cancel-ride-button>
                Cancel Ride
              </button>
            </div>
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

function haversineMeters(fromLat, fromLng, toLat, toLng) {
  return haversineMiles(fromLat, fromLng, toLat, toLng) * 1609.344;
}

function getLatLngDistanceMeters(left, right) {
  return haversineMeters(left.lat, left.lng, right.lat, right.lng);
}

function formatWalkTime(distanceMeters) {
  if (!Number.isFinite(distanceMeters)) {
    return "";
  }

  return `${Math.max(1, Math.round(distanceMeters / ROUTE_WALK_METERS_PER_MINUTE))} min walk`;
}

function formatWalkDuration(durationSeconds) {
  if (!Number.isFinite(durationSeconds)) {
    return "";
  }

  return `${Math.max(1, Math.round(durationSeconds / 60))} min walk`;
}

function formatMinutes(durationSeconds, { minimumMinutes = 1, suffix = " min" } = {}) {
  if (!Number.isFinite(durationSeconds)) {
    return "";
  }

  return `${Math.max(minimumMinutes, Math.round(durationSeconds / 60))}${suffix}`;
}

function formatWalkMinutes(durationSeconds, distanceMeters) {
  if (Number.isFinite(durationSeconds)) {
    return formatMinutes(durationSeconds);
  }

  if (!Number.isFinite(distanceMeters)) {
    return "";
  }

  return formatMinutes((distanceMeters / ROUTE_WALK_METERS_PER_MINUTE) * 60);
}

function formatRideArrivalTitle(durationSeconds) {
  const minutesText = formatMinutes(durationSeconds);
  return minutesText ? `Ride is ${minutesText} away` : RIDE_BOOKED_TITLE_ARRIVING;
}

function normalizeBearingDegrees(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return ((value % 360) + 360) % 360;
}

function getBearingBetweenLatLngs(startLatLng, endLatLng) {
  if (!startLatLng || !endLatLng) {
    return 0;
  }

  const startLat = (startLatLng.lat * Math.PI) / 180;
  const endLat = (endLatLng.lat * Math.PI) / 180;
  const deltaLng = ((endLatLng.lng - startLatLng.lng) * Math.PI) / 180;
  const y = Math.sin(deltaLng) * Math.cos(endLat);
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(deltaLng);

  return normalizeBearingDegrees((Math.atan2(y, x) * 180) / Math.PI);
}

function offsetLatLng(latLng, distanceMeters, bearingDegrees) {
  if (!latLng) {
    return null;
  }

  const angularDistance = distanceMeters / 6371000;
  const bearingRadians = (bearingDegrees * Math.PI) / 180;
  const startLat = (latLng.lat * Math.PI) / 180;
  const startLng = (latLng.lng * Math.PI) / 180;
  const nextLat = Math.asin(
    Math.sin(startLat) * Math.cos(angularDistance) +
      Math.cos(startLat) * Math.sin(angularDistance) * Math.cos(bearingRadians),
  );
  const nextLng =
    startLng +
    Math.atan2(
      Math.sin(bearingRadians) * Math.sin(angularDistance) * Math.cos(startLat),
      Math.cos(angularDistance) - Math.sin(startLat) * Math.sin(nextLat),
    );

  return {
    lat: (nextLat * 180) / Math.PI,
    lng: (nextLng * 180) / Math.PI,
  };
}

function getRandomNumber(min, max) {
  return min + Math.random() * (max - min);
}

function hasMeaningfulWalkToPickup(rideRoute) {
  return Number.isFinite(rideRoute?.walkDistanceMeters) && rideRoute.walkDistanceMeters >= ROUTE_WALK_THRESHOLD_METERS;
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

    const rideRoutePane = this.map.createPane("rideRoutePane");
    rideRoutePane.classList.add("leaflet-ride-route-pane");
    rideRoutePane.style.zIndex = "665";

    const rideApproachPane = this.map.createPane("rideApproachPane");
    rideApproachPane.classList.add("leaflet-ride-approach-pane");
    rideApproachPane.style.zIndex = "672";

    const destinationPane = this.map.createPane("destinationPane");
    destinationPane.classList.add("leaflet-destination-pane");
    destinationPane.style.zIndex = "680";

    const rideRouteMarkerPane = this.map.createPane("rideRouteMarkerPane");
    rideRouteMarkerPane.classList.add("leaflet-ride-route-marker-pane");
    rideRouteMarkerPane.style.zIndex = "695";

    const userLocationPane = this.map.createPane("userLocationPane");
    userLocationPane.classList.add("leaflet-user-location-pane");
    userLocationPane.style.zIndex = "690";

    const rideRouteHudPane = this.map.createPane("rideRouteHudPane");
    rideRouteHudPane.classList.add("leaflet-ride-route-hud-pane");
    rideRouteHudPane.style.zIndex = "700";

    const rideVehiclePane = this.map.createPane("rideVehiclePane");
    rideVehiclePane.classList.add("leaflet-ride-vehicle-pane");
    rideVehiclePane.style.zIndex = "699";

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
    const visibleMapButtonRects = [...this.querySelectorAll(".ride-map-button")]
      .map((element) => {
        const style = window.getComputedStyle(element);

        if (element.hidden || style.display === "none" || style.visibility === "hidden") {
          return null;
        }

        return getRectIntersection(element.getBoundingClientRect(), mapRect);
      })
      .filter(Boolean);

    if (visibleMapButtonRects.length > 0) {
      const topBandBottom = Math.max(...visibleMapButtonRects.map((rect) => rect.bottom - mapRect.top));
      occlusionRects.push({
        left: 0,
        top: 0,
        right: mapRect.right - mapRect.left,
        bottom: topBandBottom,
      });
    }

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

  getAvailableFitBoundsOptions({ animate = false, extraPaddingBottom = 0, extraPaddingTop = 0 } = {}) {
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
        Math.round(size.y - primaryRect.bottom + verticalPadding + extraPaddingBottom),
      ],
      paddingTopLeft: [
        Math.round(primaryRect.left + horizontalPadding),
        Math.round(primaryRect.top + verticalPadding + extraPaddingTop),
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

  fitLatLngsInAvailableMap(
    latLngs,
    { animate = true, duration = 0.65, extraPaddingBottom = 0, extraPaddingTop = 0, maxZoom = null } = {},
  ) {
    if (!this.map || typeof window.L === "undefined") {
      return;
    }

    const validLatLngs = latLngs.filter(Boolean);
    if (validLatLngs.length === 0) {
      return;
    }

    if (validLatLngs.length === 1) {
      this.focusLatLngInAvailableMap(validLatLngs[0], {
        animate,
        duration,
        zoom: Math.max(this.map.getZoom(), 16),
      });
      return;
    }

    this.map.fitBounds(window.L.latLngBounds(validLatLngs), {
      ...this.getAvailableFitBoundsOptions({ animate, extraPaddingBottom, extraPaddingTop }),
      duration,
      ...(Number.isFinite(maxZoom) ? { maxZoom } : {}),
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
    this.syncRideViewport(false);
    this.updateBookedTipsOverflowMask();
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
    this.bookedNotification = this.querySelector("[data-booked-notification]");
    this.bookingPanel = this.querySelector("[data-booking-panel]");
    this.bookingPickupSubtitle = this.querySelector("[data-booking-pickup-subtitle]");
    this.bookingPickupTime = this.querySelector("[data-booking-pickup-time]");
    this.bookingDestinationTitle = this.querySelector("[data-booking-destination-title]");
    this.bookingDestinationSubtitle = this.querySelector("[data-booking-destination-subtitle]");
    this.bookingDestinationTime = this.querySelector("[data-booking-destination-time]");
    this.bookingEtaText = this.querySelector("[data-booking-eta-text]");
    this.bookingBookedTitle = this.querySelector("[data-booking-booked-title]");
    this.bookRideButton = this.querySelector("[data-book-ride-button]");
    this.cancelRideButton = this.querySelector("[data-cancel-ride-button]");
    this.cancelRideDialog = this.querySelector("[data-cancel-ride-dialog]");
    this.cancelRideConfirmButton = this.querySelector("[data-cancel-ride-confirm]");
    this.cancelRideDismissButton = this.querySelector("[data-cancel-ride-dismiss]");
    this.bookedTipsScroller = this.querySelector(".ride-booked-tips__scroller");

    if (
      !this.rideSheet ||
      !this.rideSheetSurface ||
      !this.destinationInput ||
      !this.destinationResults ||
      !this.destinationForm ||
      !this.destinationCloseButton ||
      !this.bookingPanel ||
      !this.bookingPickupSubtitle ||
      !this.bookingPickupTime ||
      !this.bookingDestinationTitle ||
      !this.bookingDestinationSubtitle ||
      !this.bookingDestinationTime ||
      !this.bookingEtaText ||
      !this.bookingBookedTitle ||
      !this.bookRideButton ||
      !this.cancelRideButton ||
      !this.cancelRideDialog ||
      !this.cancelRideConfirmButton ||
      !this.cancelRideDismissButton ||
      !this.bookedTipsScroller
    ) {
      return;
    }

    this.rideSheetReady = true;
    this.destinationRotationIndex = this.getRandomDestinationRotationIndex();
    this.destinationInputFocused = false;
    this.activeDestinationResults = [];
    this.activeSearchController = null;
    this.destinationSearchTimeout = null;
    this.destinationViewportSyncTimeout = null;
    this.rideBookedTimeout = null;
    this.rideBookedArrivalDelayTimeout = null;
    this.rideBookedTransitionTimeout = null;
    this.rideBookedNotificationTimeout = null;
    this.rideBookedNotificationResetTimeout = null;
    this.rideBookedTitleSwapTimeout = null;
    this.rideBookedScrollFrame = null;
    this.rideVehicleRevealTimeout = null;
    this.mockVehiclePollTimeout = null;
    this.cancelRideTimeout = null;
    this.selectedDestination = null;
    this.pendingDestinationKey = null;
    this.routeSelectionToken = 0;
    this.activeRideRoute = null;
    this.activeMockVehicleJourney = null;
    this.mockVehicleJourneyPromise = null;
    this.mockVehiclePlanToken = 0;
    this.mockVehicleCurrentLatLng = null;

    this.destinationForm.addEventListener("submit", this.handleDestinationSubmit);
    this.destinationInput.addEventListener("focus", this.handleDestinationFocus);
    this.destinationInput.addEventListener("blur", this.handleDestinationBlur);
    this.destinationInput.addEventListener("input", this.handleDestinationInput);
    this.destinationInput.addEventListener("search", this.handleDestinationInput);
    this.destinationCloseButton.addEventListener("click", this.resetDestinationPicker);
    this.bookRideButton.addEventListener("pointerup", this.handleBookRideRelease);
    this.bookRideButton.addEventListener("click", this.handleBookRide);
    this.cancelRideButton.addEventListener("click", this.handleCancelRideButton);
    this.cancelRideDialog.addEventListener("click", this.handleCancelRideDialogClick);
    this.cancelRideConfirmButton.addEventListener("click", this.handleCancelRideConfirm);
    this.cancelRideDismissButton.addEventListener("click", this.handleCancelRideDismiss);
    this.bookedTipsScroller.addEventListener("scroll", this.handleBookedTipsScroll, { passive: true });

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", this.handleVisualViewportChange, { passive: true });
      window.visualViewport.addEventListener("scroll", this.handleVisualViewportChange, { passive: true });
    }

    this.renderDefaultDestinations();
    this.updateRideSheetViewport();
    this.updateRideSheetMetrics();
    this.updateBookedTipsOverflowMask();
    this.hydrateCuratedDestinations();
  }

  teardownRideSheet() {
    this.clearDestinationSearchTimeout();
    this.abortDestinationSearch();
    this.clearDestinationViewportSyncTimeout();
    this.clearRideBookedTimeout();
    this.clearRideBookedArrivalDelayTimeout();
    this.clearRideBookedTransitionTimeout();
    this.clearRideBookedNotificationTimeout();
    this.clearRideBookedNotificationResetTimeout();
    this.clearRideBookedTitleSwapTimeout();
    this.clearRideBookedScrollFrame();
    this.clearRideVehicleRevealTimeout();
    this.clearMockVehiclePollTimeout();
    this.clearCancelRideTimeout();
    this.clearRideRoute();

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

    if (this.bookRideButton) {
      this.bookRideButton.removeEventListener("pointerup", this.handleBookRideRelease);
      this.bookRideButton.removeEventListener("click", this.handleBookRide);
    }

    if (this.cancelRideButton) {
      this.cancelRideButton.removeEventListener("click", this.handleCancelRideButton);
    }

    if (this.cancelRideDialog) {
      this.cancelRideDialog.removeEventListener("click", this.handleCancelRideDialogClick);
    }

    if (this.cancelRideConfirmButton) {
      this.cancelRideConfirmButton.removeEventListener("click", this.handleCancelRideConfirm);
    }

    if (this.cancelRideDismissButton) {
      this.cancelRideDismissButton.removeEventListener("click", this.handleCancelRideDismiss);
    }

    if (this.bookedTipsScroller) {
      this.bookedTipsScroller.removeEventListener("scroll", this.handleBookedTipsScroll);
    }

    if (window.visualViewport) {
      window.visualViewport.removeEventListener("resize", this.handleVisualViewportChange);
      window.visualViewport.removeEventListener("scroll", this.handleVisualViewportChange);
    }
  }

  handleVisualViewportChange = () => {
    this.updateRideSheetViewport();
  };

  handleBookedTipsScroll = () => {
    this.updateBookedTipsOverflowMask();
  };

  handleCancelRideButton = () => {
    this.openCancelRideDialog();
  };

  handleCancelRideDialogClick = (event) => {
    if (event.target !== this.cancelRideDialog) {
      return;
    }

    this.closeCancelRideDialog();
  };

  handleCancelRideDismiss = () => {
    this.closeCancelRideDialog();
  };

  handleCancelRideConfirm = () => {
    if (!this.cancelRideConfirmButton || this.isCancelRideLoading()) {
      return;
    }

    this.cancelRideConfirmButton.classList.add("is-searching");
    this.cancelRideConfirmButton.setAttribute("aria-busy", "true");

    if (this.cancelRideDismissButton) {
      this.cancelRideDismissButton.disabled = true;
    }

    this.cancelRideDialog?.classList.add("is-cancelling");
    this.clearCancelRideTimeout();
    this.cancelRideTimeout = window.setTimeout(() => {
      this.cancelRideTimeout = null;
      this.resetCancelRideDialogState();
      this.resetDestinationPicker();
    }, RIDE_CANCEL_DELAY_MS);
  };

  clearDestinationViewportSyncTimeout() {
    if (this.destinationViewportSyncTimeout === null) {
      return;
    }

    window.clearTimeout(this.destinationViewportSyncTimeout);
    this.destinationViewportSyncTimeout = null;
  }

  clearRideBookedTimeout() {
    if (this.rideBookedTimeout === null) {
      return;
    }

    window.clearTimeout(this.rideBookedTimeout);
    this.rideBookedTimeout = null;
  }

  clearRideBookedArrivalDelayTimeout() {
    if (this.rideBookedArrivalDelayTimeout === null) {
      return;
    }

    window.clearTimeout(this.rideBookedArrivalDelayTimeout);
    this.rideBookedArrivalDelayTimeout = null;
  }

  clearRideBookedTransitionTimeout() {
    if (this.rideBookedTransitionTimeout === null) {
      return;
    }

    window.clearTimeout(this.rideBookedTransitionTimeout);
    this.rideBookedTransitionTimeout = null;
  }

  clearRideBookedNotificationTimeout() {
    if (this.rideBookedNotificationTimeout === null) {
      return;
    }

    window.clearTimeout(this.rideBookedNotificationTimeout);
    this.rideBookedNotificationTimeout = null;
  }

  clearRideBookedNotificationResetTimeout() {
    if (this.rideBookedNotificationResetTimeout === null) {
      return;
    }

    window.clearTimeout(this.rideBookedNotificationResetTimeout);
    this.rideBookedNotificationResetTimeout = null;
  }

  clearRideBookedTitleSwapTimeout() {
    if (this.rideBookedTitleSwapTimeout === null) {
      return;
    }

    window.clearTimeout(this.rideBookedTitleSwapTimeout);
    this.rideBookedTitleSwapTimeout = null;
  }

  clearRideBookedScrollFrame() {
    if (this.rideBookedScrollFrame === null) {
      return;
    }

    window.cancelAnimationFrame(this.rideBookedScrollFrame);
    this.rideBookedScrollFrame = null;
  }

  clearRideVehicleRevealTimeout() {
    if (this.rideVehicleRevealTimeout === null) {
      return;
    }

    window.clearTimeout(this.rideVehicleRevealTimeout);
    this.rideVehicleRevealTimeout = null;
  }

  clearMockVehiclePollTimeout() {
    if (this.mockVehiclePollTimeout === null) {
      return;
    }

    window.clearTimeout(this.mockVehiclePollTimeout);
    this.mockVehiclePollTimeout = null;
  }

  clearCancelRideTimeout() {
    if (this.cancelRideTimeout === null) {
      return;
    }

    window.clearTimeout(this.cancelRideTimeout);
    this.cancelRideTimeout = null;
  }

  isCancelRideLoading() {
    return Boolean(this.cancelRideConfirmButton?.classList.contains("is-searching"));
  }

  openCancelRideDialog() {
    if (!this.cancelRideDialog || !this.isRideBookedActive() || this.isCancelRideLoading()) {
      return;
    }

    this.cancelRideDialog.hidden = false;
    this.cancelRideDialog.setAttribute("aria-hidden", "false");
  }

  closeCancelRideDialog() {
    if (!this.cancelRideDialog || this.isCancelRideLoading()) {
      return;
    }

    this.cancelRideDialog.hidden = true;
    this.cancelRideDialog.setAttribute("aria-hidden", "true");
  }

  resetCancelRideDialogState({ hide = true } = {}) {
    this.clearCancelRideTimeout();

    if (this.cancelRideConfirmButton) {
      this.cancelRideConfirmButton.classList.remove("is-searching");
      this.cancelRideConfirmButton.removeAttribute("aria-busy");
    }

    if (this.cancelRideDismissButton) {
      this.cancelRideDismissButton.disabled = false;
    }

    if (this.cancelRideDialog) {
      this.cancelRideDialog.classList.remove("is-cancelling");

      if (hide) {
        this.cancelRideDialog.hidden = true;
        this.cancelRideDialog.setAttribute("aria-hidden", "true");
      }
    }
  }

  hideRideBookedNotification(immediate = false) {
    if (!this.bookedNotification) {
      return;
    }

    this.clearRideBookedNotificationTimeout();
    this.clearRideBookedNotificationResetTimeout();

    if (immediate) {
      this.bookedNotification.hidden = true;
      this.bookedNotification.setAttribute("aria-hidden", "true");
      this.bookedNotification.classList.remove("is-visible", "is-hiding");
      return;
    }

    if (this.bookedNotification.hidden) {
      return;
    }

    this.bookedNotification.classList.remove("is-visible");
    this.bookedNotification.classList.add("is-hiding");
    this.bookedNotification.setAttribute("aria-hidden", "true");
    this.rideBookedNotificationResetTimeout = window.setTimeout(() => {
      this.rideBookedNotificationResetTimeout = null;

      if (!this.bookedNotification) {
        return;
      }

      this.bookedNotification.hidden = true;
      this.bookedNotification.classList.remove("is-hiding");
    }, RIDE_BOOKED_NOTIFICATION_EXIT_DURATION_MS);
  }

  showRideBookedNotification() {
    if (!this.bookedNotification) {
      return;
    }

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

    this.clearRideBookedNotificationTimeout();
    this.clearRideBookedNotificationResetTimeout();
    this.bookedNotification.hidden = false;
    this.bookedNotification.setAttribute("aria-hidden", "false");
    this.bookedNotification.classList.remove("is-visible", "is-hiding");

    if (prefersReducedMotion) {
      this.bookedNotification.classList.add("is-visible");
    } else {
      void this.bookedNotification.offsetWidth;
      this.bookedNotification.classList.add("is-visible");
    }

    this.rideBookedNotificationTimeout = window.setTimeout(() => {
      this.rideBookedNotificationTimeout = null;
      this.hideRideBookedNotification(prefersReducedMotion);
    }, RIDE_BOOKED_NOTIFICATION_DURATION_MS);
  }

  isRideBookedActive() {
    return Boolean(this.bookingPanel?.classList.contains("is-booked"));
  }

  updateBookedTipsOverflowMask() {
    if (!this.bookedTipsScroller) {
      return;
    }

    const maxScrollLeft = Math.max(0, this.bookedTipsScroller.scrollWidth - this.bookedTipsScroller.clientWidth);
    const scrollLeft = Math.max(0, this.bookedTipsScroller.scrollLeft);
    const hasLeftOverflow = scrollLeft > 1;
    const hasRightOverflow = maxScrollLeft - scrollLeft > 1;

    this.bookedTipsScroller.classList.toggle("has-overflow-left", hasLeftOverflow);
    this.bookedTipsScroller.classList.toggle("has-overflow-right", hasRightOverflow);
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

  syncRideViewport(animate = false) {
    if (this.activeMockVehicleJourney?.pickupLatLng && this.mockVehicleCurrentLatLng) {
      this.fitLatLngsInAvailableMap([this.mockVehicleCurrentLatLng, this.activeMockVehicleJourney.pickupLatLng], {
        animate,
        duration: animate ? 0.55 : 0,
        extraPaddingBottom: 56,
        extraPaddingTop: 24,
        maxZoom: 16.8,
      });
      return;
    }

    this.syncSelectedDestinationViewport(animate);
  }

  updateRideSheetViewport() {
    const keyboardOffset = this.getKeyboardOffset();
    this.style.setProperty("--ride-keyboard-offset", `${keyboardOffset}px`);

    if (this.selectedDestination) {
      this.setRideSheetState(this.isRideBookedActive() ? "booked" : "selected");
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

    if (state !== "booked") {
      this.clearRideSheetSurfaceOffset();
    }

    this.rideSheet.dataset.sheetState = state;
    this.updateResponsiveZoomBounds(!this.selectedDestinationLatLng);
    this.syncRideViewport(false);
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

  clearRideSheetSurfaceOffset() {
    if (!this.rideSheetSurface) {
      return;
    }

    this.rideSheetSurface.style.setProperty("--ride-surface-offset-y", "0px");
  }

  getRideSheetSurfaceOffset() {
    if (!this.rideSheetSurface) {
      return 0;
    }

    return Number.parseFloat(this.rideSheetSurface.style.getPropertyValue("--ride-surface-offset-y")) || 0;
  }

  setRideSheetSurfaceOffset(offsetY) {
    if (!this.rideSheetSurface || !Number.isFinite(offsetY)) {
      return;
    }

    this.rideSheetSurface.style.setProperty("--ride-surface-offset-y", `${offsetY}px`);
  }

  alignRideSheetSurfaceTop(targetTop) {
    if (!this.rideSheetSurface || !Number.isFinite(targetTop)) {
      return;
    }

    this.clearRideSheetSurfaceOffset();
    const currentTop = this.rideSheetSurface.getBoundingClientRect().top;
    const offsetY = targetTop - currentTop;
    this.rideSheetSurface.style.setProperty("--ride-surface-offset-y", `${offsetY}px`);
  }

  resetRideBookedArrivalState() {
    this.clearRideBookedArrivalDelayTimeout();
    this.clearRideBookedTransitionTimeout();
    this.hideRideBookedNotification(true);
    this.clearRideBookedTitleSwapTimeout();
    this.clearRideBookedScrollFrame();
    this.stopMockVehicleTracking({ clearJourney: false, invalidate: false });
    this.rideSheetSurface?.classList.remove("is-booked-scrolling");
    this.bookingPanel?.classList.remove("is-arriving");

    if (this.bookingBookedTitle) {
      this.bookingBookedTitle.textContent = RIDE_BOOKED_TITLE_DEFAULT;
    }
  }

  getRideBookedAutoScrollTop(currentTop) {
    if (!this.rideSheetSurface || !Number.isFinite(currentTop)) {
      return currentTop;
    }

    const surfaceHeight = this.rideSheetSurface.getBoundingClientRect().height;
    const viewportHeight = window.innerHeight || 0;
    const fittedTop = Math.max(RIDE_BOOKED_MIN_TOP_PX, viewportHeight - RIDE_BOOKED_BOTTOM_GAP_PX - surfaceHeight);
    return Math.min(currentTop, fittedTop);
  }

  finishRideBookedAutoScroll() {
    this.clearRideBookedTransitionTimeout();
    this.rideSheetSurface?.classList.remove("is-booked-scrolling");
    this.bookingPanel?.classList.add("is-arriving");

    if (!this.bookingBookedTitle || this.bookingBookedTitle.textContent === RIDE_BOOKED_TITLE_ARRIVING) {
      return;
    }

    this.clearRideBookedTitleSwapTimeout();
    this.bookingBookedTitle.textContent = RIDE_BOOKED_TITLE_ARRIVING;
    this.scheduleRideVehicleReveal();
  }

  startRideBookedAutoScroll() {
    if (!this.rideSheetSurface) {
      this.finishRideBookedAutoScroll();
      return;
    }

    const currentTop = this.rideSheetSurface.getBoundingClientRect().top;
    const targetTop = this.getRideBookedAutoScrollTop(currentTop);

    if (!Number.isFinite(targetTop) || Math.abs(targetTop - currentTop) < 2) {
      this.finishRideBookedAutoScroll();
      return;
    }

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    const nextOffset = this.getRideSheetSurfaceOffset() + (targetTop - currentTop);

    if (prefersReducedMotion) {
      this.setRideSheetSurfaceOffset(nextOffset);
      this.finishRideBookedAutoScroll();
      return;
    }

    this.rideSheetSurface.classList.add("is-booked-scrolling");
    this.setRideSheetSurfaceOffset(nextOffset);
    this.clearRideBookedTransitionTimeout();
    this.rideBookedTransitionTimeout = window.setTimeout(() => {
      this.rideBookedTransitionTimeout = null;
      this.finishRideBookedAutoScroll();
    }, RIDE_BOOKED_SCROLL_DURATION_MS + 40);
  }

  handleDestinationFocus = () => {
    this.destinationInputFocused = true;
    this.renderCurrentResults();
    this.updateRideSheetViewport();
  };

  handleDestinationBlur = () => {
    window.setTimeout(() => {
      const isStillFocused = this.destinationInput === document.activeElement;
      this.destinationInputFocused = isStillFocused;

      if (!isStillFocused && !this.destinationInput.value.trim()) {
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
      return;
    }

    if (normalizedQuery.length < 2) {
      this.renderDefaultDestinations();
      return;
    }

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

  updateBookingStopTimes({ pickupTimeText = "~ min", destinationTimeText = "~ min" } = {}) {
    if (this.bookingPickupTime) {
      this.bookingPickupTime.textContent = pickupTimeText;
    }

    if (this.bookingDestinationTime) {
      this.bookingDestinationTime.textContent = destinationTimeText;
    }
  }

  renderSelectedDestination(destination, rideRoute = null) {
    if (
      !this.bookingPanel ||
      !this.bookingPickupSubtitle ||
      !this.bookingDestinationTitle ||
      !this.bookingDestinationSubtitle
    ) {
      return;
    }

    this.resetBookRideSearchState();
    const pickupHasWalk = hasMeaningfulWalkToPickup(rideRoute);
    this.bookingPickupSubtitle.textContent = pickupHasWalk ? rideRoute?.walkTimeText || "1 min walk" : "At your location";
    this.bookingDestinationTitle.textContent = destination.title || "Destination";
    this.bookingDestinationSubtitle.textContent = destination.subtitle || "Ride zone";
    this.updateBookingStopTimes({
      pickupTimeText: pickupHasWalk
        ? formatWalkMinutes(rideRoute?.walkDurationSeconds, rideRoute?.walkDistanceMeters) || "~ min"
        : "Now",
      destinationTimeText: formatMinutes(rideRoute?.durationSeconds) || "~ min",
    });
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
    this.resetBookRideSearchState();

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

  handleBookRideRelease = (event) => {
    if (event.button !== undefined && event.button !== 0) {
      return;
    }

    this.startBookRideSearch();
  };

  handleBookRide = () => {
    this.startBookRideSearch();
  };

  startBookRideSearch() {
    if (
      !this.bookRideButton ||
      this.bookRideButton.classList.contains("is-searching") ||
      this.bookRideButton.classList.contains("is-booked")
    ) {
      return;
    }

    this.bookRideButton.classList.add("is-searching");
    this.bookRideButton.setAttribute("aria-busy", "true");

    if (this.bookingPanel) {
      this.bookingPanel.classList.add("is-searching");
    }

    if (this.bookingEtaText) {
      this.bookingEtaText.textContent = "Searching for nearby vehicles...";
    }

    this.clearRideBookedTimeout();
    this.rideBookedTimeout = window.setTimeout(() => {
      this.rideBookedTimeout = null;
      this.showRideBookedState();
    }, RIDE_BOOKED_DELAY_MS);
  }

  resetBookRideSearchState() {
    this.clearRideBookedTimeout();
    this.resetRideBookedArrivalState();
    this.clearRideSheetSurfaceOffset();
    this.resetCancelRideDialogState();

    if (this.bookRideButton) {
      this.bookRideButton.classList.remove("is-searching", "is-booked");
      this.bookRideButton.removeAttribute("aria-busy");
    }

    if (this.bookingPanel) {
      this.bookingPanel.classList.remove("is-searching", "is-booked");
    }

    if (this.rideSheet?.dataset.sheetState === "booked") {
      this.rideSheet.dataset.sheetState = "selected";
    }

    this.updateBookingStopTimes();

    if (this.bookingEtaText) {
      this.bookingEtaText.innerHTML = "A ride can arrive in <strong>~ min</strong>";
    }
  }

  showRideBookedState() {
    if (!this.bookRideButton || !this.bookingPanel) {
      return;
    }

    this.resetRideBookedArrivalState();
    this.prepareMockVehicleApproach();
    const selectedTop = this.rideSheetSurface?.getBoundingClientRect().top ?? null;

    this.bookRideButton.classList.remove("is-searching");
    this.bookRideButton.classList.add("is-booked");
    this.bookRideButton.removeAttribute("aria-busy");
    this.bookingPanel.classList.remove("is-searching");
    this.bookingPanel.classList.add("is-booked");

    if (this.rideSheet) {
      this.rideSheet.dataset.sheetState = "booked";
    }

    if (this.bookedTipsScroller) {
      this.bookedTipsScroller.scrollLeft = 0;
    }

    this.showRideBookedNotification();

    if (Number.isFinite(selectedTop)) {
      window.requestAnimationFrame(() => {
        this.alignRideSheetSurfaceTop(selectedTop);
        this.updateRideSheetMetrics();
        this.updateBookedTipsOverflowMask();
        this.clearRideBookedArrivalDelayTimeout();
        this.rideBookedArrivalDelayTimeout = window.setTimeout(() => {
          this.rideBookedArrivalDelayTimeout = null;
          this.clearRideBookedScrollFrame();
          this.rideBookedScrollFrame = window.requestAnimationFrame(() => {
            this.rideBookedScrollFrame = null;
            this.startRideBookedAutoScroll();
          });
        }, RIDE_BOOKED_ARRIVAL_DELAY_MS);
      });
      return;
    }

    this.clearRideBookedArrivalDelayTimeout();
    this.rideBookedArrivalDelayTimeout = window.setTimeout(() => {
      this.rideBookedArrivalDelayTimeout = null;
      this.updateBookedTipsOverflowMask();
      this.finishRideBookedAutoScroll();
    }, RIDE_BOOKED_ARRIVAL_DELAY_MS);
  }

  clearDestinationMarker() {
    if (!this.map || !this.destinationMarker) {
      return;
    }

    this.map.removeLayer(this.destinationMarker);
    this.destinationMarker = null;
  }

  clearRideRoute() {
    this.stopRoutePulse();
    this.stopMockVehicleTracking({ clearJourney: true, invalidate: true });

    [
      "rideRouteBaseLine",
      "rideRoutePulseLine",
      "rideApproachOutlineLine",
      "rideApproachLine",
      "rideRouteWalkLine",
      "rideRoutePickupMarker",
      "rideRouteDropoffMarker",
      "rideRouteWalkMarker",
      "rideRoutePickupChipMarker",
      "rideRouteDropoffChipMarker",
      "rideVehicleMarker",
      "destinationMarker",
    ].forEach((propertyName) => {
      const layer = this[propertyName];

      if (this.map && layer) {
        this.map.removeLayer(layer);
      }

      this[propertyName] = null;
    });
    this.activeRideRoute = null;
    this.activeRouteLatLngs = [];
    this.activeRouteMeasures = null;
  }

  resetDestinationPicker = () => {
    this.routeSelectionToken = (this.routeSelectionToken ?? 0) + 1;
    this.clearPendingDestination();
    this.selectedDestination = null;
    this.selectedDestinationLatLng = null;
    this.clearDestinationViewportSyncTimeout();
    this.clearDestinationSearchTimeout();
    this.abortDestinationSearch();
    this.clearRideRoute();
    this.hideSelectedDestination();

    if (this.destinationInput) {
      this.destinationInput.value = "";
      this.destinationInput.blur();
    }

    this.destinationInputFocused = false;
    this.renderDefaultDestinations();
    this.setRideSheetState("compact");
    this.updateRideSheetViewport();
    this.updateResponsiveZoomBounds(true);
  };

  getRandomDestinationRotationIndex() {
    const curatedCount = this.getCuratedDestinations().length;
    if (curatedCount <= 1) {
      return 0;
    }

    return Math.floor(Math.random() * curatedCount);
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

  getDestinationKey(destination) {
    if (!destination) {
      return "";
    }

    const lat = Number.isFinite(destination.lat) ? destination.lat.toFixed(5) : "";
    const lng = Number.isFinite(destination.lng) ? destination.lng.toFixed(5) : "";
    return [destination.id ?? "", normalizeQuery(destination.title), normalizeQuery(destination.subtitle), lat, lng].join("|");
  }

  setPendingDestination(destination) {
    this.pendingDestinationKey = this.getDestinationKey(destination);
    this.updateDestinationPendingRows();
  }

  clearPendingDestination(destination = null) {
    const destinationKey = typeof destination === "string" ? destination : this.getDestinationKey(destination);

    if (destination && this.pendingDestinationKey !== destinationKey) {
      return;
    }

    this.pendingDestinationKey = null;
    this.updateDestinationPendingRows();
  }

  updateDestinationPendingRows() {
    if (!this.destinationResults) {
      return;
    }

    this.destinationResults.querySelectorAll(".ride-destination").forEach((row) => {
      const isPending = Boolean(this.pendingDestinationKey && row.dataset.destinationKey === this.pendingDestinationKey);
      row.classList.toggle("is-routing", isPending);

      if (isPending) {
        row.setAttribute("aria-busy", "true");
      } else {
        row.removeAttribute("aria-busy");
      }
    });
  }

  createDestinationRow(destination) {
    const row = document.createElement("button");
    row.className = "ride-destination";
    row.type = "button";
    row.dataset.destinationKey = this.getDestinationKey(destination);

    if (this.pendingDestinationKey && row.dataset.destinationKey === this.pendingDestinationKey) {
      row.classList.add("is-routing");
      row.setAttribute("aria-busy", "true");
    }

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
    row.addEventListener("pointerdown", (event) => {
      if (!event.isPrimary || event.button !== 0) {
        return;
      }

      this.setPendingDestination(destination);
    });
    row.addEventListener("pointercancel", () => {
      this.clearPendingDestination(destination);
    });
    row.addEventListener("pointerleave", (event) => {
      if (event.buttons > 0) {
        this.clearPendingDestination(destination);
      }
    });
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

  async fetchRideRoute(originLatLng, destinationLatLng) {
    const searchParams = new URLSearchParams({
      dropoffLat: String(destinationLatLng.lat),
      dropoffLng: String(destinationLatLng.lng),
      pickupLat: String(originLatLng.lat),
      pickupLng: String(originLatLng.lng),
    });
    const response = await fetch(`${RIDE_ROUTE_API_URL}?${searchParams.toString()}`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Route failed with status ${response.status}`);
    }

    const payload = await response.json();
    const routeCoordinates = payload?.geometry?.coordinates;

    if (!Array.isArray(routeCoordinates) || routeCoordinates.length < 2) {
      throw new Error("Route geometry unavailable");
    }

    const routeLatLngs = routeCoordinates
      .map((coordinate) => {
        const [lng, lat] = coordinate;
        return Number.isFinite(lat) && Number.isFinite(lng) ? window.L.latLng(lat, lng) : null;
      })
      .filter(Boolean);
    const pickupWaypoint = payload?.waypoints?.[0];
    const dropoffWaypoint = payload?.waypoints?.[1];
    const pickupLatLng = this.getWaypointLatLng(pickupWaypoint) ?? routeLatLngs[0] ?? originLatLng;
    const dropoffLatLng =
      this.getWaypointLatLng(dropoffWaypoint) ?? routeLatLngs[routeLatLngs.length - 1] ?? destinationLatLng;
    const walkDistanceMeters = Number.isFinite(pickupWaypoint?.distance)
      ? pickupWaypoint.distance
      : getLatLngDistanceMeters(originLatLng, pickupLatLng);
    const walkDurationSeconds = Number.isFinite(payload?.walk?.duration) ? payload.walk.duration : null;
    const walkRouteLatLngs = Array.isArray(payload?.walk?.geometry?.coordinates)
      ? payload.walk.geometry.coordinates
          .map((coordinate) => {
            const [lng, lat] = coordinate;
            return Number.isFinite(lat) && Number.isFinite(lng) ? window.L.latLng(lat, lng) : null;
          })
          .filter(Boolean)
      : [];

    return {
      distanceMeters: payload.distance,
      dropoffLatLng,
      durationSeconds: payload.duration,
      originLatLng,
      pickupLatLng,
      routeLatLngs,
      walkDurationSeconds,
      walkDistanceMeters,
      walkRouteLatLngs,
      walkTimeText: formatWalkDuration(walkDurationSeconds) || formatWalkTime(walkDistanceMeters),
    };
  }

  getWaypointLatLng(waypoint) {
    const location = waypoint?.location;

    if (!Array.isArray(location) || location.length < 2 || typeof window.L === "undefined") {
      return null;
    }

    const [lng, lat] = location;
    return Number.isFinite(lat) && Number.isFinite(lng) ? window.L.latLng(lat, lng) : null;
  }

  async selectDestination(destination) {
    const selectionToken = (this.routeSelectionToken ?? 0) + 1;
    const pendingDestinationKey = this.getDestinationKey(destination);
    this.routeSelectionToken = selectionToken;
    this.setPendingDestination(destination);
    this.clearDestinationSearchTimeout();
    this.abortDestinationSearch();
    this.clearRideRoute();

    let resolvedDestination;

    try {
      resolvedDestination = await this.resolveDestinationCoordinates(destination);
    } catch (error) {
      if (this.routeSelectionToken === selectionToken) {
        this.clearPendingDestination(pendingDestinationKey);
      }

      console.error("Destination coordinates failed.", error);
      return;
    }

    if (this.routeSelectionToken !== selectionToken) {
      return;
    }

    const destinationLatLng =
      this.map && typeof window.L !== "undefined"
        ? window.L.latLng(resolvedDestination.lat, resolvedDestination.lng)
        : null;

    if (!this.map || !destinationLatLng) {
      this.clearPendingDestination(pendingDestinationKey);
      return;
    }

    const origin = this.getSearchOrigin();
    const originLatLng = window.L.latLng(origin.lat, origin.lng);
    let rideRoute;

    try {
      rideRoute = await this.fetchRideRoute(originLatLng, destinationLatLng);
    } catch (error) {
      if (this.routeSelectionToken === selectionToken) {
        this.clearPendingDestination(pendingDestinationKey);
      }

      console.error("Ride route failed.", error);
      return;
    }

    if (this.routeSelectionToken !== selectionToken) {
      return;
    }

    if (this.destinationInput) {
      this.destinationInput.value = resolvedDestination.title;
      this.destinationInput.blur();
    }

    this.clearDestinationViewportSyncTimeout();
    this.clearPendingDestination(pendingDestinationKey);
    this.selectedDestination = resolvedDestination;
    this.selectedDestinationLatLng = rideRoute.dropoffLatLng;
    this.renderRideRoute(rideRoute);
    this.renderSelectedDestination(resolvedDestination, rideRoute);
    this.fitLatLngsInAvailableMap(this.getRouteFocusLatLngs(rideRoute), {
      animate: true,
      duration: 0.65,
      extraPaddingBottom: 68,
      extraPaddingTop: 68,
      maxZoom: 14.25,
    });
  }

  renderRideRoute(rideRoute) {
    if (!this.map || typeof window.L === "undefined") {
      return;
    }

    this.clearRideRoute();
    this.activeRideRoute = rideRoute;
    const routeLatLngs =
      Array.isArray(rideRoute.routeLatLngs) && rideRoute.routeLatLngs.length >= 2
        ? rideRoute.routeLatLngs
        : [];

    if (routeLatLngs.length < 2) {
      return;
    }

    this.activeRouteLatLngs = routeLatLngs;
    this.rideRouteBaseLine = window.L.polyline(routeLatLngs, {
      color: "#7c7c7c",
      interactive: false,
      lineCap: "round",
      lineJoin: "round",
      opacity: 0.96,
      pane: "rideRoutePane",
      smoothFactor: 1,
      weight: 6,
    }).addTo(this.map);

    this.rideRoutePulseLine = window.L.polyline([], {
      color: "#ffffff",
      interactive: false,
      lineCap: "round",
      lineJoin: "round",
      opacity: 0,
      pane: "rideRoutePane",
      smoothFactor: 1,
      weight: 6,
    }).addTo(this.map);

    this.rideRoutePickupMarker = this.createRidePointMarker(rideRoute.pickupLatLng, "Pickup");
    this.rideRouteDropoffMarker = this.createRidePointMarker(rideRoute.dropoffLatLng, "Dropoff");
    this.renderWalkToPickup(rideRoute);
    this.renderRouteChips(rideRoute);
    this.startRoutePulse(routeLatLngs);
  }

  createRidePointMarker(latLng, label) {
    if (!latLng || !this.map || typeof window.L === "undefined") {
      return null;
    }

    return window.L.marker(latLng, {
      icon: window.L.divIcon({
        className: "ride-route-point-marker",
        html: `<span class="ride-route-point-marker__dot" aria-label="${label} point"></span>`,
        iconAnchor: [9, 9],
        iconSize: [18, 18],
      }),
      interactive: false,
      keyboard: false,
      pane: "rideRouteMarkerPane",
    }).addTo(this.map);
  }

  renderWalkToPickup(rideRoute) {
    if (
      !this.map ||
      !rideRoute.originLatLng ||
      !rideRoute.pickupLatLng ||
      !Number.isFinite(rideRoute.walkDistanceMeters) ||
      rideRoute.walkDistanceMeters < ROUTE_WALK_THRESHOLD_METERS ||
      typeof window.L === "undefined"
    ) {
      return;
    }

    const walkLatLngs =
      Array.isArray(rideRoute.walkRouteLatLngs) && rideRoute.walkRouteLatLngs.length >= 2
        ? rideRoute.walkRouteLatLngs
        : [rideRoute.originLatLng, rideRoute.pickupLatLng];

    this.rideRouteWalkLine = window.L.polyline(walkLatLngs, {
      color: "#ffffff",
      dashArray: "1 11",
      interactive: false,
      lineCap: "round",
      lineJoin: "round",
      opacity: 0.76,
      pane: "rideRoutePane",
      weight: 4,
    }).addTo(this.map);
  }

  renderRouteChips(rideRoute) {
    if (!this.map || typeof window.L === "undefined") {
      return;
    }

    if (rideRoute.dropoffLatLng) {
      this.rideRouteDropoffChipMarker = window.L.marker(rideRoute.dropoffLatLng, {
        icon: window.L.divIcon({
          className: "ride-route-location-marker ride-route-location-marker--dropoff",
          html: `
            <span class="ride-route-location-chip ride-route-location-chip--dropoff">
              <span class="ride-route-location-chip__label">Drop-Off</span>
              <span class="ride-route-location-chip__chevron" aria-hidden="true">
                <span class="ride-route-location-chip__chevron-icon"></span>
              </span>
            </span>
          `,
          iconAnchor: [0, 0],
          iconSize: [0, 0],
        }),
        interactive: false,
        keyboard: false,
        pane: "rideRouteHudPane",
      }).addTo(this.map);
    }

    if (!rideRoute.pickupLatLng) {
      return;
    }

    const hasWalk =
      rideRoute.originLatLng && hasMeaningfulWalkToPickup(rideRoute);
    const pickupChipLatLng = rideRoute.pickupLatLng;
    const pickupMainText = hasWalk ? rideRoute.walkTimeText || "1 min walk" : "Pickup";
    const pickupSubtext = hasWalk ? "to Pickup" : "At your location";

    this.rideRoutePickupChipMarker = window.L.marker(pickupChipLatLng, {
      icon: window.L.divIcon({
        className: "ride-route-location-marker ride-route-location-marker--pickup",
        html: `
          <span class="ride-route-location-chip ride-route-location-chip--pickup">
            <span class="ride-route-location-chip__walk-cell" aria-hidden="true">
              <span class="ride-route-location-chip__walk-icon"></span>
            </span>
            <span class="ride-route-location-chip__text">
              <span class="ride-route-location-chip__label">${pickupMainText}</span>
              <span class="ride-route-location-chip__subtext">${pickupSubtext}</span>
            </span>
            <span class="ride-route-location-chip__chevron" aria-hidden="true">
              <span class="ride-route-location-chip__chevron-icon"></span>
            </span>
          </span>
        `,
        iconAnchor: [0, 0],
        iconSize: [0, 0],
      }),
      interactive: false,
      keyboard: false,
      pane: "rideRouteHudPane",
    }).addTo(this.map);
  }

  getRouteFocusLatLngs(rideRoute) {
    return [
      ...(rideRoute.routeLatLngs ?? []),
      rideRoute.originLatLng,
      rideRoute.pickupLatLng,
      rideRoute.dropoffLatLng,
    ].filter(Boolean);
  }

  scheduleRideVehicleReveal() {
    this.clearRideVehicleRevealTimeout();
    this.rideVehicleRevealTimeout = window.setTimeout(() => {
      this.rideVehicleRevealTimeout = null;
      this.activateMockVehicleTracking();
    }, RIDE_BOOKED_VEHICLE_REVEAL_DELAY_MS);
  }

  async prepareMockVehicleApproach() {
    const pickupLatLng = this.activeRideRoute?.pickupLatLng;

    if (!pickupLatLng) {
      return null;
    }

    const planToken = (this.mockVehiclePlanToken ?? 0) + 1;
    this.mockVehiclePlanToken = planToken;
    this.activeMockVehicleJourney = null;
    const dropoffLatLng = this.activeRideRoute?.dropoffLatLng ?? this.selectedDestinationLatLng ?? null;
    this.mockVehicleJourneyPromise = this.buildMockVehicleJourney(pickupLatLng, dropoffLatLng)
      .then((journey) => {
        if (this.mockVehiclePlanToken !== planToken) {
          return null;
        }

        this.activeMockVehicleJourney = journey;
        return journey;
      })
      .catch((error) => {
        if (this.mockVehiclePlanToken === planToken) {
          this.activeMockVehicleJourney = null;
          this.mockVehicleJourneyPromise = null;
          console.error("Mock vehicle route failed.", error);
        }

        return null;
      });
    return this.mockVehicleJourneyPromise;
  }

  async buildMockVehicleJourney(pickupLatLng, dropoffLatLng) {
    const candidates = this.generateMockVehicleSpawnCandidates(pickupLatLng, dropoffLatLng);
    const attemptedJourneys = [];

    for (const candidate of candidates) {
      try {
        const candidateLatLng = window.L.latLng(candidate.lat, candidate.lng);
        const candidateRoute = await this.fetchRideRoute(candidateLatLng, pickupLatLng);
        const routeLatLngs =
          Array.isArray(candidateRoute.routeLatLngs) && candidateRoute.routeLatLngs.length >= 2
            ? candidateRoute.routeLatLngs
            : [candidateLatLng, pickupLatLng];
        const measures = this.getRouteMeasures(routeLatLngs);

        if (measures.totalMeters <= 8) {
          continue;
        }

        const durationSeconds = Number.isFinite(candidateRoute.durationSeconds)
          ? candidateRoute.durationSeconds
          : measures.totalMeters / 5.8;
        const journey = {
          durationSeconds,
          measures,
          pickupLatLng: candidateRoute.dropoffLatLng ?? pickupLatLng,
          routeLatLngs,
          simulationDurationMs: clampNumber(
            durationSeconds * getRandomNumber(34, 46),
            MOCK_VEHICLE_SIMULATION_MIN_MS,
            MOCK_VEHICLE_SIMULATION_MAX_MS,
          ),
        };
        attemptedJourneys.push(journey);

        if (
          durationSeconds >= MOCK_VEHICLE_MIN_DURATION_SECONDS &&
          durationSeconds <= MOCK_VEHICLE_MAX_DURATION_SECONDS
        ) {
          return journey;
        }
      } catch {
        // Try the next randomized spawn.
      }
    }

    if (attemptedJourneys.length > 0) {
      return attemptedJourneys.sort((left, right) => {
        return (
          Math.abs(left.durationSeconds - MOCK_VEHICLE_TARGET_DURATION_SECONDS) -
          Math.abs(right.durationSeconds - MOCK_VEHICLE_TARGET_DURATION_SECONDS)
        );
      })[0];
    }

    const fallbackBearing = getRandomNumber(0, 360);
    const fallbackOrigin = offsetLatLng(pickupLatLng, 360, fallbackBearing);
    const fallbackLatLng = window.L.latLng(fallbackOrigin.lat, fallbackOrigin.lng);
    const fallbackRouteLatLngs = [fallbackLatLng, pickupLatLng];
    const fallbackMeasures = this.getRouteMeasures(fallbackRouteLatLngs);
    return {
      durationSeconds: Math.max(60, fallbackMeasures.totalMeters / 5.2),
      measures: fallbackMeasures,
      pickupLatLng,
      routeLatLngs: fallbackRouteLatLngs,
      simulationDurationMs: 10_500,
    };
  }

  generateMockVehicleSpawnCandidates(pickupLatLng, dropoffLatLng) {
    const candidates = [];
    const seedBearing = dropoffLatLng ? getBearingBetweenLatLngs(pickupLatLng, dropoffLatLng) : getRandomNumber(0, 360);
    const approachOffsets = [180, 145, 215, 120, 240, 95, 265];

    for (let index = 0; index < 12; index += 1) {
      const bearing = normalizeBearingDegrees(
        seedBearing +
          (approachOffsets[index % approachOffsets.length] ?? 180) +
          getRandomNumber(-22, 22) +
          (index >= approachOffsets.length ? getRandomNumber(-130, 130) : 0),
      );
      const distanceMeters = getRandomNumber(index < 4 ? 260 : 340, index < 7 ? 780 : 1200);
      const candidate = offsetLatLng(pickupLatLng, distanceMeters, bearing);

      if (!candidate || !this.isWithinGeofence(candidate.lat, candidate.lng)) {
        continue;
      }

      candidates.push(candidate);
    }

    if (candidates.length > 0) {
      return candidates;
    }

    const fallbackCandidate = offsetLatLng(pickupLatLng, 420, normalizeBearingDegrees(seedBearing + 180));
    return fallbackCandidate ? [fallbackCandidate] : [];
  }

  async activateMockVehicleTracking() {
    if (!this.isRideBookedActive() || !this.activeRideRoute?.pickupLatLng) {
      return;
    }

    let currentPlanToken = this.mockVehiclePlanToken;
    let resolvedJourney = this.activeMockVehicleJourney;

    if (!resolvedJourney && this.mockVehicleJourneyPromise) {
      resolvedJourney = await this.mockVehicleJourneyPromise;
    }

    if (!resolvedJourney) {
      const pendingJourney = this.prepareMockVehicleApproach();
      currentPlanToken = this.mockVehiclePlanToken;
      resolvedJourney = pendingJourney ? await pendingJourney : null;
    }

    if (
      !resolvedJourney ||
      this.mockVehiclePlanToken !== currentPlanToken ||
      !this.isRideBookedActive() ||
      !this.activeRideRoute?.pickupLatLng
    ) {
      return;
    }

    this.stopMockVehicleTracking({ clearJourney: false, invalidate: false });
    this.stopRoutePulse();

    if (this.rideRoutePulseLine) {
      this.rideRoutePulseLine.setLatLngs([]);
      this.rideRoutePulseLine.setStyle({ opacity: 0 });
    }

    this.activeMockVehicleJourney = resolvedJourney;
    this.mockVehicleSimulationStartedAt = Date.now();
    this.updateMockVehicleTracking(0, { fitViewport: true });
    this.scheduleNextMockVehiclePoll();
  }

  stopMockVehicleTracking({ clearJourney = true, invalidate = true } = {}) {
    this.clearRideVehicleRevealTimeout();
    this.clearMockVehiclePollTimeout();
    this.mockVehicleSimulationStartedAt = null;
    this.mockVehicleCurrentLatLng = null;

    ["rideApproachOutlineLine", "rideApproachLine", "rideVehicleMarker"].forEach((propertyName) => {
      const layer = this[propertyName];

      if (this.map && layer) {
        this.map.removeLayer(layer);
      }

      this[propertyName] = null;
    });

    if (invalidate) {
      this.mockVehiclePlanToken = (this.mockVehiclePlanToken ?? 0) + 1;
      this.mockVehicleJourneyPromise = null;
    }

    if (clearJourney) {
      this.activeMockVehicleJourney = null;
    }
  }

  scheduleNextMockVehiclePoll() {
    if (!this.activeMockVehicleJourney || !this.mockVehicleSimulationStartedAt) {
      return;
    }

    this.clearMockVehiclePollTimeout();
    this.mockVehiclePollTimeout = window.setTimeout(() => {
      this.mockVehiclePollTimeout = null;
      const elapsedMs = Date.now() - this.mockVehicleSimulationStartedAt;
      const progress = clampNumber(elapsedMs / this.activeMockVehicleJourney.simulationDurationMs, 0, 1);
      this.updateMockVehicleTracking(progress);

      if (progress >= 1) {
        return;
      }

      this.scheduleNextMockVehiclePoll();
    }, Math.round(getRandomNumber(MOCK_VEHICLE_POLL_MIN_MS, MOCK_VEHICLE_POLL_MAX_MS)));
  }

  updateMockVehicleTracking(progress, { fitViewport = false } = {}) {
    if (!this.map || !this.activeMockVehicleJourney) {
      return;
    }

    const safeProgress = clampNumber(progress, 0, 1);
    const { measures, pickupLatLng, routeLatLngs } = this.activeMockVehicleJourney;
    const travelledMeters = measures.totalMeters * safeProgress;
    const currentLatLng = this.getRoutePointAtDistance(routeLatLngs, measures, travelledMeters);
    const remainingLatLngs =
      safeProgress >= 1
        ? []
        : this.getRouteSegment(routeLatLngs, measures, travelledMeters, measures.totalMeters);
    const nextBearingTarget =
      safeProgress >= 1
        ? pickupLatLng
        : this.getRoutePointAtDistance(
            routeLatLngs,
            measures,
            Math.min(measures.totalMeters, travelledMeters + MOCK_VEHICLE_LOOKAHEAD_METERS),
          );
    const bearingDegrees = getBearingBetweenLatLngs(currentLatLng, nextBearingTarget);
    const remainingDurationSeconds = Math.max(0, this.activeMockVehicleJourney.durationSeconds * (1 - safeProgress));

    this.mockVehicleCurrentLatLng = currentLatLng;
    this.renderMockVehicleApproachLine(remainingLatLngs, currentLatLng, pickupLatLng);
    this.renderRideVehicleMarker(currentLatLng, bearingDegrees);

    if (fitViewport) {
      this.syncRideViewport(true);
    }

    if (safeProgress >= 1) {
      if (this.bookingBookedTitle) {
        this.bookingBookedTitle.textContent = RIDE_BOOKED_TITLE_HERE;
      }

      this.updateBookingStopTimes({
        pickupTimeText: "Now",
        destinationTimeText: formatMinutes(this.activeRideRoute?.durationSeconds) || "~ min",
      });
      return;
    }

    if (this.bookingBookedTitle) {
      this.bookingBookedTitle.textContent = formatRideArrivalTitle(remainingDurationSeconds);
    }

    this.updateBookingStopTimes({
      pickupTimeText: formatMinutes(remainingDurationSeconds) || "~ min",
      destinationTimeText:
        formatMinutes((this.activeRideRoute?.durationSeconds ?? 0) + remainingDurationSeconds) || "~ min",
    });
  }

  renderMockVehicleApproachLine(remainingLatLngs, currentLatLng, pickupLatLng) {
    if (!this.map || typeof window.L === "undefined") {
      return;
    }

    const approachLatLngs =
      Array.isArray(remainingLatLngs) && remainingLatLngs.length >= 2
        ? remainingLatLngs
        : currentLatLng && pickupLatLng && getLatLngDistanceMeters(currentLatLng, pickupLatLng) > 1
          ? [currentLatLng, pickupLatLng]
          : [];

    if (!this.rideApproachOutlineLine) {
      this.rideApproachOutlineLine = window.L.polyline(approachLatLngs, {
        color: MOCK_VEHICLE_APPROACH_BORDER_COLOR,
        interactive: false,
        lineCap: "round",
        lineJoin: "round",
        opacity: 0.98,
        pane: "rideApproachPane",
        smoothFactor: 1,
        weight: 7,
      }).addTo(this.map);
    } else {
      this.rideApproachOutlineLine.setLatLngs(approachLatLngs);
    }

    if (!this.rideApproachLine) {
      this.rideApproachLine = window.L.polyline(approachLatLngs, {
        color: MOCK_VEHICLE_APPROACH_COLOR,
        interactive: false,
        lineCap: "round",
        lineJoin: "round",
        opacity: 1,
        pane: "rideApproachPane",
        smoothFactor: 1,
        weight: 5,
      }).addTo(this.map);
      return;
    }

    this.rideApproachLine.setLatLngs(approachLatLngs);
  }

  renderRideVehicleMarker(latLng, bearingDegrees) {
    if (!latLng || !this.map || typeof window.L === "undefined") {
      return;
    }

    const icon = window.L.divIcon({
      className: "ride-vehicle-marker-wrapper",
      html: `
        <span class="ride-vehicle-marker" style="--ride-vehicle-bearing: ${normalizeBearingDegrees(bearingDegrees + MOCK_VEHICLE_ASSET_BEARING_OFFSET_DEGREES)}deg;">
          <span class="ride-vehicle-marker__shadow"></span>
          <img class="ride-vehicle-marker__car" src="./when-driving-model-3-black-white-asset.svg" alt="" />
        </span>
      `,
      iconAnchor: [38, 20],
      iconSize: [76, 40],
    });

    if (!this.rideVehicleMarker) {
      this.rideVehicleMarker = window.L.marker(latLng, {
        icon,
        interactive: false,
        keyboard: false,
        pane: "rideVehiclePane",
        zIndexOffset: 1280,
      }).addTo(this.map);
      return;
    }

    this.rideVehicleMarker.setLatLng(latLng);
    this.rideVehicleMarker.setIcon(icon);
  }

  startRoutePulse(routeLatLngs) {
    this.stopRoutePulse();

    if (!Array.isArray(routeLatLngs) || routeLatLngs.length < 2 || !this.rideRoutePulseLine) {
      return;
    }

    const measures = this.getRouteMeasures(routeLatLngs);
    if (measures.totalMeters <= 0) {
      return;
    }

    this.activeRouteMeasures = measures;

    const animatePulse = (timestamp) => {
      if (!this.rideRoutePulseLine || !this.activeRouteMeasures) {
        return;
      }

      if (!this.routePulseStartTime) {
        this.routePulseStartTime = timestamp;
      }

      const elapsed = (timestamp - this.routePulseStartTime) % ROUTE_PULSE_PERIOD_MS;
      const progress = elapsed / ROUTE_PULSE_PERIOD_MS;
      const fillProgress = Math.min(progress / ROUTE_PULSE_FILL_FRACTION, 1);
      const fadeProgress =
        progress > ROUTE_PULSE_FILL_FRACTION
          ? 1 - (progress - ROUTE_PULSE_FILL_FRACTION) / (1 - ROUTE_PULSE_FILL_FRACTION)
          : 1;
      const visibleLatLngs =
        fillProgress >= 1
          ? routeLatLngs
          : this.getRouteSegment(routeLatLngs, measures, 0, measures.totalMeters * Math.pow(fillProgress, 1.08));

      this.rideRoutePulseLine.setLatLngs(visibleLatLngs);
      this.rideRoutePulseLine.setStyle({
        opacity: Math.max(0, Math.min(0.9, fadeProgress * 0.9)),
      });
      this.routePulseAnimationFrame = window.requestAnimationFrame(animatePulse);
    };

    this.routePulseStartTime = null;
    this.routePulseAnimationFrame = window.requestAnimationFrame(animatePulse);
  }

  stopRoutePulse() {
    if (this.routePulseAnimationFrame) {
      window.cancelAnimationFrame(this.routePulseAnimationFrame);
    }

    this.routePulseAnimationFrame = null;
    this.routePulseStartTime = null;
  }

  getRouteMeasures(routeLatLngs) {
    const cumulativeMeters = [0];
    let totalMeters = 0;

    for (let index = 1; index < routeLatLngs.length; index += 1) {
      totalMeters += getLatLngDistanceMeters(routeLatLngs[index - 1], routeLatLngs[index]);
      cumulativeMeters.push(totalMeters);
    }

    return { cumulativeMeters, totalMeters };
  }

  getRoutePointAtDistance(routeLatLngs, measures, distanceMeters) {
    const targetDistance = clampNumber(distanceMeters, 0, measures.totalMeters);

    for (let index = 1; index < measures.cumulativeMeters.length; index += 1) {
      const segmentStartDistance = measures.cumulativeMeters[index - 1];
      const segmentEndDistance = measures.cumulativeMeters[index];

      if (targetDistance > segmentEndDistance) {
        continue;
      }

      const segmentDistance = Math.max(0.001, segmentEndDistance - segmentStartDistance);
      const segmentProgress = (targetDistance - segmentStartDistance) / segmentDistance;
      return this.interpolateBetweenLatLngs(routeLatLngs[index - 1], routeLatLngs[index], segmentProgress);
    }

    return routeLatLngs[routeLatLngs.length - 1];
  }

  getRouteSegment(routeLatLngs, measures, startDistance, endDistance) {
    if (endDistance <= 0) {
      return [];
    }

    const segment = [this.getRoutePointAtDistance(routeLatLngs, measures, startDistance)];

    for (let index = 1; index < routeLatLngs.length - 1; index += 1) {
      const distance = measures.cumulativeMeters[index];

      if (distance > startDistance && distance < endDistance) {
        segment.push(routeLatLngs[index]);
      }
    }

    segment.push(this.getRoutePointAtDistance(routeLatLngs, measures, endDistance));
    return segment;
  }

  interpolateBetweenLatLngs(startLatLng, endLatLng, progress) {
    const safeProgress = clampNumber(progress, 0, 1);
    return window.L.latLng(
      startLatLng.lat + (endLatLng.lat - startLatLng.lat) * safeProgress,
      startLatLng.lng + (endLatLng.lng - startLatLng.lng) * safeProgress,
    );
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
