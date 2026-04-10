const GEOFENCE_COORDS = [
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
];

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
      <div class="theme-toggle" role="group" aria-label="Map theme">
        <button class="theme-toggle__option is-active" type="button" data-theme-option="dark" aria-pressed="true">Dark</button>
        <button class="theme-toggle__option" type="button" data-theme-option="light" aria-pressed="false">Light</button>
      </div>
      <div class="map-root" data-map-root></div>
    </section>
  </section>
`;

class RobotaxiMap extends HTMLElement {
  connectedCallback() {
    if (this.dataset.mounted === "true") {
      return;
    }

    this.dataset.mounted = "true";
    this.innerHTML = template;
    this.setupEntryActions();
  }

  disconnectedCallback() {
    window.removeEventListener("resize", this.handleResize);
    this.stopLocationTracking();
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
    const constrainedBounds = geofenceBounds.pad(0.035);
    this.map.setMaxBounds(constrainedBounds);

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

    const initialPadding = this.getResponsivePadding();
    this.map.fitBounds(geofenceBounds, {
      animate: false,
      padding: initialPadding,
    });

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

    shell.dataset.view = "map";
    window.requestAnimationFrame(() => {
      this.updateResponsiveZoomBounds(true);
    });
  }

  getResponsivePadding() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    return [
      Math.max(28, Math.round(height * 0.07)),
      Math.max(24, Math.round(width * 0.07)),
    ];
  }

  updateResponsiveZoomBounds(resetView = false) {
    if (!this.map || !this.geofenceBounds) {
      return;
    }

    this.map.invalidateSize({ pan: false });
    const padding = this.getResponsivePadding();
    const fitZoom = this.map.getBoundsZoom(this.geofenceBounds, false, padding);
    const minZoom = Math.min(fitZoom, 15.5);

    this.map.setMinZoom(minZoom);

    if (resetView) {
      this.map.fitBounds(this.geofenceBounds, {
        animate: false,
        padding,
      });
      return;
    }

    if (this.map.getZoom() < minZoom) {
      this.map.setZoom(minZoom, {
        animate: false,
      });
    }
  }

  handleResize = () => {
    this.updateResponsiveZoomBounds(false);
  };

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
      return;
    }

    this.userLocationMarker.setLatLng(latLng);
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
