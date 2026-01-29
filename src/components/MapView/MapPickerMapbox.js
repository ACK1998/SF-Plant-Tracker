import React, { useState, useEffect } from 'react';
import { Map, NavigationControl, Source, Layer, Marker } from 'react-map-gl/mapbox';
import { AlertTriangle } from 'lucide-react';
import { 
  MAPBOX_CONFIG, 
  getMapStyle, 
  toMapboxCoordinates 
} from '../../config/mapbox';
import { 
  PHASE_1_CENTER, 
  LOCATION_RULES, 
  validateDomainLocation, 
  validatePlotLocation, 
  validatePlantLocation,
  calculateDistance,
  getLocationErrorMessage
} from '../../utils/locationUtils';
import 'mapbox-gl/dist/mapbox-gl.css';

function MapPickerMapbox({ 
  latitude, 
  longitude, 
  onLocationChange, 
  validationType = null, 
  validationCenter = null,
  onValidationError = null,
  domainPlots = [] // New prop for domain plots to calculate boundary
}) {
  const [viewState, setViewState] = useState({
    longitude: longitude || MAPBOX_CONFIG.defaultCenter[0],
    latitude: latitude || MAPBOX_CONFIG.defaultCenter[1],
    zoom: 14
  });
  
  const [validationError, setValidationError] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(() => {
    if (latitude && longitude) {
      const lat = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
      const lng = typeof longitude === 'string' ? parseFloat(longitude) : longitude;
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    return null;
  });

  // Validate location based on type
  const validateLocation = (lat, lng) => {
    if (!validationType) return { isValid: true, error: '' };

    let isValid = true;
    let error = '';

    switch (validationType) {
      case 'domain':
        isValid = validateDomainLocation(lat, lng);
        if (!isValid) {
          const distance = calculateDistance(PHASE_1_CENTER.lat, PHASE_1_CENTER.lng, lat, lng);
          error = getLocationErrorMessage('domain', distance, LOCATION_RULES.DOMAIN_RADIUS);
        }
        break;
      case 'plot':
        if (validationCenter) {
          isValid = validatePlotLocation(lat, lng, validationCenter.lat, validationCenter.lng, domainPlots);
          if (!isValid) {
            const distance = calculateDistance(validationCenter.lat, validationCenter.lng, lat, lng);
            error = getLocationErrorMessage('plot', distance, LOCATION_RULES.PLOT_RADIUS, domainPlots);
          }
        }
        break;
      case 'plant':
        if (validationCenter) {
          isValid = validatePlantLocation(lat, lng, validationCenter.lat, validationCenter.lng);
          if (!isValid) {
            const distance = calculateDistance(validationCenter.lat, validationCenter.lng, lat, lng);
            error = getLocationErrorMessage('plant', distance, LOCATION_RULES.PLANT_RADIUS);
          }
        }
        break;
      default:
        break;
    }

    return { isValid, error };
  };

  // Handle map click
  const handleMapClick = (event) => {
    const { lng, lat } = event.lngLat;
    setSelectedLocation({ lat, lng });
    
    const validation = validateLocation(lat, lng);
    setValidationError(validation.error);
    
    if (onLocationChange) {
      onLocationChange(lat, lng, validation.isValid);
    }
    
    if (onValidationError) {
      onValidationError(validation.error);
    }
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    let newLat = selectedLocation?.lat || latitude || MAPBOX_CONFIG.defaultCenter[1];
    let newLng = selectedLocation?.lng || longitude || MAPBOX_CONFIG.defaultCenter[0];

    if (field === 'latitude') {
      newLat = numValue;
    } else if (field === 'longitude') {
      newLng = numValue;
    }

    setSelectedLocation({ lat: newLat, lng: newLng });
    
    const validation = validateLocation(newLat, newLng);
    setValidationError(validation.error);
    
    if (onLocationChange) {
      onLocationChange(newLat, newLng, validation.isValid);
    }
    
    if (onValidationError) {
      onValidationError(validation.error);
    }
  };

  // Update selectedLocation when props change
  useEffect(() => {
    if (latitude && longitude) {
      const lat = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
      const lng = typeof longitude === 'string' ? parseFloat(longitude) : longitude;
      if (!isNaN(lat) && !isNaN(lng)) {
        setSelectedLocation(prev => {
          // Only update if the location actually changed to avoid unnecessary re-renders
          if (!prev || 
              Math.abs(prev.lat - lat) > 0.000001 || 
              Math.abs(prev.lng - lng) > 0.000001) {
            return { lat, lng };
          }
          return prev;
        });
      }
    } else {
      // Clear location if props are cleared
      setSelectedLocation(null);
    }
  }, [latitude, longitude]);

  // Update view state when selected location changes
  useEffect(() => {
    if (selectedLocation) {
      setViewState(prev => ({
        ...prev,
        longitude: selectedLocation.lng,
        latitude: selectedLocation.lat,
        transitionDuration: 500
      }));
    }
  }, [selectedLocation]);

  // Get validation radius based on type
  const getValidationRadius = () => {
    switch (validationType) {
      case 'domain':
        return LOCATION_RULES.DOMAIN_RADIUS * 1000; // Convert to meters
      case 'plot':
        // Calculate domain radius based on plot area if available
        if (domainPlots && domainPlots.length > 0) {
          // Plot size is stored in sq ft
          const totalPlotAreaSqFt = domainPlots.reduce((total, plot) => total + (plot.size || 0), 0);
          if (totalPlotAreaSqFt > 0) {
            // Calculate domain radius in feet, then convert to meters
            const domainRadiusFt = Math.sqrt(totalPlotAreaSqFt / Math.PI);
            const domainRadiusM = domainRadiusFt * 0.3048; // Convert feet to meters (1 ft = 0.3048 m)
            return domainRadiusM; // Already in meters
          }
        }
        return LOCATION_RULES.PLOT_RADIUS * 1000; // Fallback to fixed radius
      case 'plant':
        return LOCATION_RULES.PLANT_RADIUS * 1000;
      default:
        return 0;
    }
  };

  // Get validation center
  const getValidationCenter = () => {
    if (validationCenter) {
      return toMapboxCoordinates(validationCenter.lat, validationCenter.lng);
    }
    return toMapboxCoordinates(PHASE_1_CENTER.lat, PHASE_1_CENTER.lng);
  };

  // Get validation color
  const getValidationColor = () => {
    switch (validationType) {
      case 'domain':
        return '#8B5CF6'; // Purple
      case 'plot':
        return '#3B82F6'; // Blue
      case 'plant':
        return '#10B981'; // Green
      default:
        return '#666666';
    }
  };

  return (
    <div className="space-y-4">
      {/* Coordinate Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Latitude
          </label>
          <input
            type="number"
            step="any"
            value={selectedLocation?.lat?.toFixed(6) || ''}
            onChange={(e) => handleInputChange('latitude', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Enter latitude"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Longitude
          </label>
          <input
            type="number"
            step="any"
            value={selectedLocation?.lng?.toFixed(6) || ''}
            onChange={(e) => handleInputChange('longitude', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Enter longitude"
          />
        </div>
      </div>

      {/* Map Container */}
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
        <div className="h-64 md:h-80">
          <Map
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            onClick={handleMapClick}
            style={{ width: '100%', height: '100%' }}
            mapStyle={getMapStyle('streets')}
            mapboxAccessToken={MAPBOX_CONFIG.accessToken}
            cursor="crosshair"
          >
            <NavigationControl position="top-left" />
            
            {/* Validation Circle */}
            {validationType && (
              <Source
                id="validation-circle"
                type="geojson"
                data={{
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: getValidationCenter()
                  },
                  properties: {}
                }}
              >
                <Layer
                  id="validation-circle-layer"
                  type="circle"
                  paint={{
                    'circle-radius': getValidationRadius(),
                    'circle-color': getValidationColor(),
                    'circle-opacity': 0.1,
                    'circle-stroke-color': getValidationColor(),
                    'circle-stroke-width': 2
                  }}
                />
              </Source>
            )}

            {/* Selected Location Marker */}
            {selectedLocation && (
              <Marker
                longitude={selectedLocation.lng}
                latitude={selectedLocation.lat}
                anchor="bottom"
              >
                <div
                  style={{
                    backgroundColor: validationError ? '#EF4444' : '#10B981',
                    border: '3px solid white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    cursor: 'pointer'
                  }}
                />
              </Marker>
            )}
          </Map>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        <p>Click on the map to select a location, or enter coordinates manually.</p>
        {validationType && (
          <p className="mt-1">
            <span className="font-medium">Validation:</span> {validationType === 'domain' && 'Domain must be within 4km of Phase 1 center.'}
            {validationType === 'plot' && 'Plot must be within the domain boundary.'}
            {validationType === 'plant' && 'Plant must be within 100m of plot center.'}
          </p>
        )}
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-700 dark:text-red-400">{validationError}</span>
        </div>
      )}


    </div>
  );
}

export default MapPickerMapbox;
