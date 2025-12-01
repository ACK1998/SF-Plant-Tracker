/**
 * Mapbox utility functions for optimized marker rendering
 */

/**
 * Filters markers by map bounds (viewport-based lazy loading)
 * @param {Array} markers - Array of marker objects with latitude/longitude
 * @param {Object} bounds - Map bounds object with getNorth(), getSouth(), getEast(), getWest()
 * @returns {Array} Filtered markers within bounds
 */
export const filterMarkersByBounds = (markers, bounds) => {
  if (!bounds || !markers || markers.length === 0) {
    return markers || [];
  }

  const north = bounds.getNorth();
  const south = bounds.getSouth();
  const east = bounds.getEast();
  const west = bounds.getWest();

  // Add a small buffer (0.01 degrees ≈ 1km) to ensure markers near edges are included
  const buffer = 0.01;
  const bufferedNorth = north + buffer;
  const bufferedSouth = south - buffer;
  const bufferedEast = east + buffer;
  const bufferedWest = west - buffer;

  return markers.filter(marker => {
    if (!marker.latitude || !marker.longitude) {
      return false;
    }

    const lat = marker.latitude;
    const lng = marker.longitude;

    // Handle longitude wrapping (crossing the 180/-180 meridian)
    if (bufferedWest > bufferedEast) {
      return lat >= bufferedSouth && lat <= bufferedNorth && (lng >= bufferedWest || lng <= bufferedEast);
    }

    return lat >= bufferedSouth && lat <= bufferedNorth && lng >= bufferedWest && lng <= bufferedEast;
  });
};

/**
 * Builds a GeoJSON FeatureCollection from marker data
 * @param {Array} markers - Array of marker objects
 * @param {string} type - Type of marker ('domain', 'plot', 'plant')
 * @returns {Object} GeoJSON FeatureCollection
 */
export const buildGeoJson = (markers, type = 'plant') => {
  if (!markers || markers.length === 0) {
    return {
      type: 'FeatureCollection',
      features: []
    };
  }

  const features = markers
    .filter(marker => marker.latitude && marker.longitude)
    .map(marker => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [marker.longitude, marker.latitude]
      },
      properties: {
        id: marker._id || marker.id,
        name: marker.name || '',
        ...marker, // Include all marker properties for popup/click handling
        type: type, // Set marker type AFTER spreading to prevent override
        displayName: marker.displayName || marker.name || '' // Ensure displayName is available for labels
      }
    }));

  return {
    type: 'FeatureCollection',
    features
  };
};

/**
 * Debounce function to limit function calls
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Merges multiple GeoJSON FeatureCollections into one
 * @param {...Object} geojsonCollections - Multiple GeoJSON FeatureCollections
 * @returns {Object} Merged GeoJSON FeatureCollection
 */
export const mergeGeoJson = (...geojsonCollections) => {
  const allFeatures = geojsonCollections.reduce((acc, collection) => {
    if (collection && collection.features) {
      return [...acc, ...collection.features];
    }
    return acc;
  }, []);

  return {
    type: 'FeatureCollection',
    features: allFeatures
  };
};

/**
 * Gets marker color based on type
 * @param {string} type - Marker type ('domain', 'plot', 'plant')
 * @returns {string} Hex color code
 */
export const getMarkerColor = (type) => {
  const colorMap = {
    domain: '#7C3AED',
    plot: '#2563EB',
    plant: '#059669'
  };
  return colorMap[type] || '#666666';
};

