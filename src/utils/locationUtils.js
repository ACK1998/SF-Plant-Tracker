// Utility functions for location calculations and validation

// Calculate distance between two points using Haversine formula (in kilometers)
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

// Calculate distance in meters
export function calculateDistanceInMeters(lat1, lon1, lat2, lon2) {
  return calculateDistance(lat1, lon1, lat2, lon2) * 1000;
}

// Validate if a location is within a specified radius of a center point
export function isWithinRadius(lat1, lon1, lat2, lon2, radiusKm) {
  const distance = calculateDistance(lat1, lon1, lat2, lon2);
  return distance <= radiusKm;
}

// Phase 1 domain center coordinates (updated to match actual data)
export const PHASE_1_CENTER = {
  lat: 12.684582467948083,
  lng: 78.0549622542717
};

// Validation rules
export const LOCATION_RULES = {
  DOMAIN_RADIUS: 4,   // km - domains must be within 4km of Phase 1
  PLOT_RADIUS: 1.0,   // km (1km) - plots must be within 1km of their domain
  PLANT_RADIUS: 0.5   // km (500m) - plants must be within 500m of their plot
};

// Validate domain location (must be within 20km of Phase 1)
export function validateDomainLocation(lat, lng) {
  return isWithinRadius(PHASE_1_CENTER.lat, PHASE_1_CENTER.lng, lat, lng, LOCATION_RULES.DOMAIN_RADIUS);
}

// Validate plot location (must be within domain boundary)
export function validatePlotLocation(plotLat, plotLng, domainLat, domainLng, domainPlots = []) {
  // If no domain plots provided, fall back to fixed radius validation
  if (!domainPlots || domainPlots.length === 0) {
    return isWithinRadius(domainLat, domainLng, plotLat, plotLng, LOCATION_RULES.PLOT_RADIUS);
  }
  
  // Calculate total plot area for this domain
  const totalPlotArea = domainPlots.reduce((total, plot) => total + (plot.size || 0), 0);
  
  // If no plots have size information, fall back to fixed radius
  if (totalPlotArea <= 0) {
    return isWithinRadius(domainLat, domainLng, plotLat, plotLng, LOCATION_RULES.PLOT_RADIUS);
  }
  
  // Calculate domain radius based on total plot area
  // Area = π * r², so r = √(Area / π)
  const domainRadius = Math.sqrt(totalPlotArea / Math.PI);
  
  // Convert to kilometers for the distance calculation
  const domainRadiusKm = domainRadius / 1000;
  
  return isWithinRadius(domainLat, domainLng, plotLat, plotLng, domainRadiusKm);
}

// Validate plant location (must be within 100m of plot center)
export function validatePlantLocation(plantLat, plantLng, plotLat, plotLng) {
  return isWithinRadius(plotLat, plotLng, plantLat, plantLng, LOCATION_RULES.PLANT_RADIUS);
}

// Get domain center coordinates (for now, all domains use Phase 1 center)
export function getDomainCenter(domainId) {
  // In the future, this could be extended to store domain-specific centers
  return PHASE_1_CENTER;
}

// Format distance for display
export function formatDistance(distanceKm) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(2)}km`;
}

// Get error message for location validation
export function getLocationErrorMessage(type, distance, maxDistance, domainPlots = []) {
  const formattedDistance = formatDistance(distance);
  
  switch (type) {
    case 'domain':
      return `Domain must be within ${formatDistance(maxDistance)} of Phase 1 center. Current distance: ${formattedDistance}`;
    case 'plot':
      // Calculate domain radius based on plot area if available
      let maxDistanceFormatted;
      if (domainPlots && domainPlots.length > 0) {
        const totalPlotArea = domainPlots.reduce((total, plot) => total + (plot.size || 0), 0);
        if (totalPlotArea > 0) {
          const domainRadius = Math.sqrt(totalPlotArea / Math.PI);
          maxDistanceFormatted = formatDistance(domainRadius / 1000);
        } else {
          maxDistanceFormatted = formatDistance(maxDistance);
        }
      } else {
        maxDistanceFormatted = formatDistance(maxDistance);
      }
      return `Plot must be within domain boundary (${maxDistanceFormatted} radius). Current distance: ${formattedDistance}`;
    case 'plant':
      return `Plant must be within ${formatDistance(maxDistance)} of plot center. Current distance: ${formattedDistance}`;
    default:
      return `Location must be within ${formatDistance(maxDistance)}. Current distance: ${formattedDistance}`;
  }
}

// Calculate bounds for a set of coordinates
export function calculateBounds(coordinates) {
  if (!coordinates || coordinates.length === 0) {
    return null;
  }
  
  let minLat = coordinates[0].lat;
  let maxLat = coordinates[0].lat;
  let minLng = coordinates[0].lng;
  let maxLng = coordinates[0].lng;
  
  coordinates.forEach(coord => {
    minLat = Math.min(minLat, coord.lat);
    maxLat = Math.max(maxLat, coord.lat);
    minLng = Math.min(minLng, coord.lng);
    maxLng = Math.max(maxLng, coord.lng);
  });
  
  return {
    southWest: [minLat, minLng],
    northEast: [maxLat, maxLng]
  };
}

// Get center point for a set of coordinates
export function getCenterPoint(coordinates) {
  if (!coordinates || coordinates.length === 0) {
    return PHASE_1_CENTER;
  }
  
  const totalLat = coordinates.reduce((sum, coord) => sum + coord.lat, 0);
  const totalLng = coordinates.reduce((sum, coord) => sum + coord.lng, 0);
  
  return {
    lat: totalLat / coordinates.length,
    lng: totalLng / coordinates.length
  };
}

// Filter coordinates by distance from a center point
export function filterByDistance(coordinates, centerLat, centerLng, maxDistanceKm) {
  return coordinates.filter(coord => 
    isWithinRadius(centerLat, centerLng, coord.lat, coord.lng, maxDistanceKm)
  );
}
