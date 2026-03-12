import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function createDefaultTeslaState() {
  return {
    demo: true,
    battery_level: 82,
    battery_range: 247,
    locked: true,
    trunkOpen: false,
    frunkOpen: false,
    lightsFlashed: false,
    climate_state: {
      inside_temp: 22,
      outside_temp: 18,
    },
    drive_state: {
      speed: 0,
    },
    vehicle_state: {
      locked: true,
      software_version: "demo-1.0.0",
    },
    updatedAt: new Date().toISOString(),
  };
}

function createDefaultState() {
  return {
    rides: [],
    tesla: createDefaultTeslaState(),
  };
}

function normalizeState(rawState) {
  const defaultState = createDefaultState();

  return {
    rides: Array.isArray(rawState?.rides) ? rawState.rides : defaultState.rides,
    tesla: {
      ...defaultState.tesla,
      ...(rawState?.tesla ?? {}),
      climate_state: {
        ...defaultState.tesla.climate_state,
        ...(rawState?.tesla?.climate_state ?? {}),
      },
      drive_state: {
        ...defaultState.tesla.drive_state,
        ...(rawState?.tesla?.drive_state ?? {}),
      },
      vehicle_state: {
        ...defaultState.tesla.vehicle_state,
        ...(rawState?.tesla?.vehicle_state ?? {}),
      },
    },
  };
}

export class JsonStateStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.state = createDefaultState();
    this.writePromise = Promise.resolve();
  }

  async init() {
    await mkdir(path.dirname(this.filePath), { recursive: true });

    try {
      const raw = await readFile(this.filePath, "utf8");
      this.state = normalizeState(JSON.parse(raw));
    } catch {
      this.state = createDefaultState();
      await this.persist();
    }

    return this;
  }

  getState() {
    return this.state;
  }

  async setState(nextState) {
    this.state = normalizeState(nextState);
    await this.persist();
    return this.state;
  }

  async update(updater) {
    const draft = structuredClone(this.state);
    const nextState = updater(draft) ?? draft;
    return this.setState(nextState);
  }

  async persist() {
    const payload = JSON.stringify(this.state, null, 2);
    this.writePromise = this.writePromise.then(() => writeFile(this.filePath, payload));
    await this.writePromise;
  }
}

