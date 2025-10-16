// Mapbox configuration
export const MAPBOX_CONFIG = {
  // Mapbox access token - replace with your actual token
  // Get one for free at https://account.mapbox.com/access-tokens/
  accessToken: process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiYWNrMTk5ODMwIiwiYSI6ImNtZXIydW4xcTAyNzcya29uMDk0dWZkcWgifQ.y741WAV4fH0ezaPdEYdQrg',
  
  // Map styles
  styles: {
    // Light style - good for general use
    light: 'mapbox://styles/mapbox/light-v11',
    
    // Satellite style - great for agriculture/farming
    satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
    
    // Outdoors style - good for terrain and natural features
    outdoors: 'mapbox://styles/mapbox/outdoors-v12',
    
    // Streets style - detailed street information
    streets: 'mapbox://styles/mapbox/streets-v12'
  },
  
  // Default map settings
  defaultCenter: [78.060365, 12.682750], // [lng, lat] for Mapbox - centered on actual data
  defaultZoom: 13,
  
  // Animation settings
  flyToDuration: 1500, // milliseconds
  
  // Marker settings
  markerColors: {
    domain: '#7C3AED',    // Rich purple shade
    plot: '#2563EB',      // Deep blue shade
    plant: '#059669'      // Rich green shade
  }
};

// Helper function to get map style by name
export const getMapStyle = (styleName = 'streets') => {
  return MAPBOX_CONFIG.styles[styleName] || MAPBOX_CONFIG.styles.streets;
};

// Helper function to convert coordinates for Mapbox (lng, lat)
export const toMapboxCoordinates = (lat, lng) => [lng, lat];

// Helper function to convert coordinates from Mapbox (lng, lat) to (lat, lng)
export const fromMapboxCoordinates = (coordinates) => [coordinates[1], coordinates[0]];
