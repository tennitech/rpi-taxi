export const RPI_GEOFENCE_COORDS = [
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

// Northern Lake George service zone, including Bolton Landing, Federal Hill,
// Padanarum Road, and the nearby trail/recreation corridor shown in the app.
export const BOLTON_GEOFENCE_COORDS = [
  [43.681, -73.713],
  [43.682, -73.625],
  [43.655, -73.602],
  [43.605, -73.604],
  [43.548, -73.620],
  [43.525, -73.651],
  [43.535, -73.699],
  [43.575, -73.722],
  [43.632, -73.724],
];

export const SERVICE_AREA_COORDS = [RPI_GEOFENCE_COORDS, BOLTON_GEOFENCE_COORDS];

// Kept for callers that still use the original single-zone export.
export const GEOFENCE_COORDS = RPI_GEOFENCE_COORDS;
