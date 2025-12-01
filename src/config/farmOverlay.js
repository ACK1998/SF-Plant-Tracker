// src/config/farmOverlay.js
// Update the 4 corner coordinates to match real-world lat/lng (use Google Earth or on-site GPS).
// Coordinate format: [lng, lat]

const topLeft = [78.053642, 12.686782];
const topRight = [78.056308, 12.686782];
const bottomRight = [78.056308, 12.682382];
const bottomLeft = [78.053642, 12.682382];

// Actual surveyed centroid for SF3 (provided by user)
const ACTUAL_SF3_CENTROID = [77.98934864938698, 12.775572615689068];

// Centroid we get from the raw overlay math (before applying any offset)
const RAW_SF3_CENTROID = [78.054975, 12.68458222687429];

const COORDINATE_OFFSET = {
  lng: ACTUAL_SF3_CENTROID[0] - RAW_SF3_CENTROID[0],
  lat: ACTUAL_SF3_CENTROID[1] - RAW_SF3_CENTROID[1],
};

export const FARM_OVERLAY = {
  imageUrl: '/assets/farm-phase1-overlay.png',
  imageSize: { width: 6898, height: 9697 }, // adjust if your PNG differs
  coordinates: [topLeft, topRight, bottomRight, bottomLeft],
};

/**
 * Convert pixel X,Y (origin top-left) into [lng, lat] using the four overlay corners.
 * - x ranges 0..width
 * - y ranges 0..height
 *
 * This assumes linear mapping (no rotation/shear beyond an axis-aligned image).
 * If your exported image is rotated, re-export or update coordinates accordingly.
 */
export const pixelToLngLat = (x, y) => {
  const { width, height } = FARM_OVERLAY.imageSize;
  const lngSpan = topRight[0] - topLeft[0]; // delta longitude across image width
  const latSpan = bottomLeft[1] - topLeft[1]; // delta latitude across image height
  const lng = topLeft[0] + lngSpan * (x / width) + COORDINATE_OFFSET.lng;
  const lat = topLeft[1] + latSpan * (y / height) + COORDINATE_OFFSET.lat;
  return [lng, lat];
};

