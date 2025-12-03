const topLeft = [78.053642, 12.686782];
const topRight = [78.056308, 12.686782];
const bottomRight = [78.056308, 12.682382];
const bottomLeft = [78.053642, 12.682382];

const ACTUAL_SF3_CENTROID = [77.98934864938698, 12.775572615689068];
const RAW_SF3_CENTROID = [78.054975, 12.68458222687429];

const COORDINATE_OFFSET = {
  lng: ACTUAL_SF3_CENTROID[0] - RAW_SF3_CENTROID[0],
  lat: ACTUAL_SF3_CENTROID[1] - RAW_SF3_CENTROID[1],
};

const FARM_OVERLAY = {
  imageUrl: '/assets/farm-phase1-overlay.png',
  imageSize: { width: 6898, height: 9697 },
  coordinates: [topLeft, topRight, bottomRight, bottomLeft],
};

const pixelToLngLat = (x, y) => {
  const { width, height } = FARM_OVERLAY.imageSize;
  const lngSpan = topRight[0] - topLeft[0];
  const latSpan = bottomLeft[1] - topLeft[1];
  const lng = topLeft[0] + (lngSpan * (x / width)) + COORDINATE_OFFSET.lng;
  const lat = topLeft[1] + (latSpan * (y / height)) + COORDINATE_OFFSET.lat;
  return [lng, lat];
};

module.exports = {
  FARM_OVERLAY,
  pixelToLngLat,
  COORDINATE_OFFSET,
};

