import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, AlertTriangle } from 'lucide-react';
import { 
  PHASE_1_CENTER, 
  LOCATION_RULES, 
  validateDomainLocation, 
  validatePlotLocation, 
  validatePlantLocation,
  calculateDistance,
  formatDistance,
  getLocationErrorMessage
} from '../../utils/locationUtils';
import { MAPBOX_CONFIG, toMapboxCoordinates, fromMapboxCoordinates } from '../../config/mapbox';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set Mapbox access token
mapboxgl.accessToken = MAPBOX_CONFIG.accessToken;

function MapboxMapPicker({ 
  latitude, 
  longitude, 
  onLocationChange, 
  height = "300px",
  showCoordinates = true,
  placeholder = "Click on the map to select location",
  validationType = null, // 'domain', 'plot', or 'plant'
  validationCenter = null, // center point for validation (for plots and plants)
  onValidationError = null, // callback for validation errors
  domainBoundaries = null, // domain boundary coordinates for visualization
  plotBoundaries = null, // plot boundary coordinates for visualization
  showBoundaries = true // whether to show domain/plot boundaries
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const [position, setPosition] = useState(null);
  const [inputLat, setInputLat] = useState('');
  const [inputLng, setInputLng] = useState('');
  const [validationError, setValidationError] = useState('');
  const [domainPolygon, setDomainPolygon] = useState(null);
  const [plotPolygon, setPlotPolygon] = useState(null);
  const [validationZone, setValidationZone] = useState(null);
  const [isCreatingBoundaries, setIsCreatingBoundaries] = useState(false);
  const [lastBoundaryData, setLastBoundaryData] = useState(null);

  // Initialize position from props
  useEffect(() => {
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        setPosition([lat, lng]);
        setInputLat(lat.toString());
        setInputLng(lng.toString());
      }
    }
  }, [latitude, longitude]);

  // Initialize map
  useEffect(() => {
    if (map.current) return; // Initialize map only once

    const defaultCenter = position || [MAPBOX_CONFIG.defaultCenter[1], MAPBOX_CONFIG.defaultCenter[0]];

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_CONFIG.styles.streets,
      center: toMapboxCoordinates(defaultCenter[0], defaultCenter[1]),
      zoom: MAPBOX_CONFIG.defaultZoom
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-left');

          // Wait for map to load before adding event listeners
      map.current.on('load', () => {
        // Add click event listener
        map.current.on('click', (e) => {
          const { lng, lat } = e.lngLat;
          // Map clicked
          handleLocationSelect(lat, lng);
        });

        // Add marker if position exists
        if (position) {
          addMarker(position[0], position[1]);
        }

        // Create boundaries after map loads
        createBoundaries();
      });

    return () => {
      if (map.current) {
        // Clean up boundaries before removing map
        try {
          if (map.current.getLayer('domain-boundary')) map.current.removeLayer('domain-boundary');
          if (map.current.getLayer('domain-boundary-fill')) map.current.removeLayer('domain-boundary-fill');
          if (map.current.getSource('domain-boundary')) map.current.removeSource('domain-boundary');
          
          if (map.current.getLayer('plot-boundary')) map.current.removeLayer('plot-boundary');
          if (map.current.getLayer('plot-boundary-fill')) map.current.removeLayer('plot-boundary-fill');
          if (map.current.getSource('plot-boundary')) map.current.removeSource('plot-boundary');
          
          if (map.current.getLayer('validation-zone')) map.current.removeLayer('validation-zone');
          if (map.current.getLayer('validation-zone-fill')) map.current.removeLayer('validation-zone-fill');
          if (map.current.getSource('validation-zone')) map.current.removeSource('validation-zone');
        } catch (error) {
          // Error cleaning up boundaries (non-critical)
        }
        
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update marker when position changes
  useEffect(() => {
    if (map.current && position) {
      addMarker(position[0], position[1]);
    }
  }, [position]);

  // Update boundaries when boundary data changes
  useEffect(() => {
    // Boundary data changed - logs removed for cleaner console
    
    // Only proceed if we have a map and it's ready
    if (!map.current || !map.current.isStyleLoaded()) {
      // Map not ready or style not loaded
      return;
    }
    
    // Check if the data has actually changed meaningfully
    const hasDomainData = domainBoundaries && domainBoundaries.length > 0;
    const hasPlotData = plotBoundaries && plotBoundaries.length > 0;
    const hasValidationData = validationCenter && validationType === 'plant';
    
    // Only proceed if we have meaningful data
    if (!hasDomainData && !hasPlotData && !hasValidationData) {
      // No meaningful boundary data, skipping
      return;
    }
    
    // Check if the data has actually changed from last time
    const currentBoundaryData = JSON.stringify({
      domainBoundaries: hasDomainData ? domainBoundaries.map(p => `${p.lat},${p.lng}`).join('|') : null,
      plotBoundaries: hasPlotData ? plotBoundaries.map(p => `${p.lat},${p.lng}`).join('|') : null,
      validationCenter: hasValidationData ? `${validationCenter.lat},${validationCenter.lng}` : null,
      validationType
    });
    
    if (lastBoundaryData === currentBoundaryData) {
      // Boundary data unchanged, skipping
      return;
    }
    
    // Boundary data changed, proceeding
    setLastBoundaryData(currentBoundaryData);
    
    // Add a small delay to prevent rapid successive calls
    const timeoutId = setTimeout(() => {
      // Map style loaded, calling createBoundaries
      createBoundaries();
    }, 100);
    
    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      // Reset the flag if component unmounts or dependencies change
      setIsCreatingBoundaries(false);
    };
  }, [domainBoundaries, plotBoundaries, validationCenter, validationType]);

  const addMarker = (lat, lng) => {
    // Adding marker
    
    // Remove existing marker
    if (marker.current) {
      marker.current.remove();
    }

    // Create new marker
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.innerHTML = `
      <div style="
        background-color: #EF4444;
        border: 3px solid white;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        color: white;
      ">📍</div>
    `;

    if (map.current) {
      marker.current = new mapboxgl.Marker(el)
        .setLngLat(toMapboxCoordinates(lat, lng))
        .addTo(map.current);

      // Fly to marker
      map.current.flyTo({
        center: toMapboxCoordinates(lat, lng),
        duration: MAPBOX_CONFIG.flyToDuration
      });
      
      // Marker added successfully
    } else {
      // Map not ready, cannot add marker
    }
  };

  // Create boundary polygons and validation zones
  const createBoundaries = () => {
    // createBoundaries called - logs removed for cleaner console
    
    if (!map.current || !showBoundaries || isCreatingBoundaries) {
      // Skipping createBoundaries - map not ready, boundaries disabled, or already creating
      return;
    }
    
    setIsCreatingBoundaries(true);

    // Remove existing boundaries - check if they exist first
    try {
      if (map.current.getLayer('domain-boundary')) {
        map.current.removeLayer('domain-boundary');
      }
      if (map.current.getLayer('domain-boundary-fill')) {
        map.current.removeLayer('domain-boundary-fill');
      }
      if (map.current.getSource('domain-boundary')) {
        map.current.removeSource('domain-boundary');
      }
      
      if (map.current.getLayer('plot-boundary')) {
        map.current.removeLayer('plot-boundary');
      }
      if (map.current.getLayer('plot-boundary-fill')) {
        map.current.removeLayer('plot-boundary-fill');
      }
      if (map.current.getSource('plot-boundary')) {
        map.current.removeSource('plot-boundary');
      }
      
      if (map.current.getLayer('validation-zone')) {
        map.current.removeLayer('validation-zone');
      }
      if (map.current.getLayer('validation-zone-fill')) {
        map.current.removeLayer('validation-zone-fill');
      }
      if (map.current.getSource('validation-zone')) {
        map.current.removeSource('validation-zone');
      }
    } catch (error) {
      // Error removing existing boundaries (non-critical)
    }

    // Add domain boundary if available
    if (domainBoundaries && domainBoundaries.length > 0) {
      const domainSource = {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [domainBoundaries.map(coord => toMapboxCoordinates(coord.lat, coord.lng))]
          },
          properties: {
            name: 'Domain Boundary'
          }
        }
      };

      // Adding domain boundary source and layers
      try {
        map.current.addSource('domain-boundary', domainSource);
        map.current.addLayer({
          id: 'domain-boundary',
          type: 'line',
          source: 'domain-boundary',
          paint: {
            'line-color': '#3B82F6',
            'line-width': 3,
            'line-opacity': 0.8
          }
        });

        map.current.addLayer({
          id: 'domain-boundary-fill',
          type: 'fill',
          source: 'domain-boundary',
          paint: {
            'fill-color': '#3B82F6',
            'fill-opacity': 0.1
          }
        });

        setDomainPolygon('domain-boundary');
        // Domain boundary added successfully
      } catch (error) {
        console.error('MapboxMapPicker: Error adding domain boundary:', error);
      }
    }

    // Add plot boundary if available
    if (plotBoundaries && plotBoundaries.length > 0) {
      const plotSource = {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [plotBoundaries.map(coord => toMapboxCoordinates(coord.lat, coord.lng))]
          },
          properties: {
            name: 'Plot Boundary'
          }
        }
      };

      // Adding plot boundary source and layers
      try {
        map.current.addSource('plot-boundary', plotSource);
        map.current.addLayer({
          id: 'plot-boundary',
          type: 'line',
          source: 'plot-boundary',
          paint: {
            'line-color': '#10B981',
            'line-width': 2,
            'line-opacity': 0.9
          }
        });

        map.current.addLayer({
          id: 'plot-boundary-fill',
          type: 'fill',
          source: 'plot-boundary',
          paint: {
            'fill-color': '#10B981',
            'fill-opacity': 0.15
          }
        });

        setPlotPolygon('plot-boundary');
        // Plot boundary added successfully
      } catch (error) {
        console.error('MapboxMapPicker: Error adding plot boundary:', error);
      }
    }

    // Add validation zone (plot boundary area where plants can be placed)
    if (validationCenter && validationType === 'plant') {
      // Plant validation - plants can be placed anywhere within the plot boundaries
      // No need to show a separate validation zone since plants can be placed anywhere within the plot boundaries
      // The plot boundary itself (green area) shows where plants can be placed
    }
    
    // Reset the flag
    setIsCreatingBoundaries(false);
  };

  const validateLocation = (lat, lng) => {
    if (!validationType) return { isValid: true, errorMessage: '' };
    
    let isValid = false;
    let errorMessage = '';
    
    switch (validationType) {
      case 'domain':
        isValid = validateDomainLocation(lat, lng);
        if (!isValid) {
          const distance = calculateDistance(PHASE_1_CENTER.lat, PHASE_1_CENTER.lng, lat, lng);
          errorMessage = `Domain must be within ${LOCATION_RULES.domain.maxDistance}km of Phase 1 center. Current distance: ${formatDistance(distance)}`;
        }
        break;
      case 'plot':
        if (validationCenter) {
          isValid = validatePlotLocation(lat, lng, validationCenter.lat, validationCenter.lng);
          if (!isValid) {
            const distance = calculateDistance(validationCenter.lat, validationCenter.lng, lat, lng);
            errorMessage = `Plot must be within ${LOCATION_RULES.plot.maxDistance}km of domain center. Current distance: ${formatDistance(distance)}`;
          }
        } else {
          isValid = true; // No validation center, allow any location
        }
        break;
      case 'plant':
        // Plants can be placed anywhere within the plot boundaries
        // Validation is handled by the form validation in AddPlantModal
        isValid = true;
        break;
      default:
        isValid = true;
    }
    
    return { isValid, errorMessage };
  };

  const handleLocationSelect = (lat, lng) => {
    const validation = validateLocation(lat, lng);
    
    if (validation.isValid) {
      // Location is valid, updating state and calling onLocationChange
      setPosition([lat, lng]);
      setInputLat(lat.toString());
      setInputLng(lng.toString());
      setValidationError('');
      
      if (onLocationChange) {
        // Calling onLocationChange
        onLocationChange(lat, lng, true);
      } else {
        // onLocationChange is not provided
      }
    } else {
      // Location validation failed
      setValidationError(validation.errorMessage);
      if (onValidationError) {
        onValidationError(validation.errorMessage);
      }
    }
  };

  const handleInputChange = (type, value) => {
    const numValue = parseFloat(value);
    if (type === 'lat') {
      setInputLat(value);
    } else {
      setInputLng(value);
    }
    
    // Update position if both coordinates are valid
    const lat = type === 'lat' ? numValue : parseFloat(inputLat);
    const lng = type === 'lng' ? numValue : parseFloat(inputLng);
    
    if (!isNaN(lat) && !isNaN(lng)) {
      handleLocationSelect(lat, lng);
    }
  };

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          handleLocationSelect(latitude, longitude);
        },
        (error) => {
          console.error('Error getting current location:', error);
          setValidationError('Unable to get current location. Please select manually.');
        }
      );
    } else {
      setValidationError('Geolocation is not supported by this browser.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <MapPin className="h-4 w-4" />
        <span>{placeholder}</span>
      </div>

      {showCoordinates && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              value={inputLat}
              onChange={(e) => handleInputChange('lat', e.target.value)}
              placeholder="e.g., 20.5937"
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              value={inputLng}
              onChange={(e) => handleInputChange('lng', e.target.value)}
              placeholder="e.g., 78.9629"
              className="input-field text-sm"
            />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={useCurrentLocation}
        className="btn-secondary btn-sm flex items-center gap-2"
      >
        <Navigation className="h-4 w-4" />
        Use Current Location
      </button>

      <div 
        ref={mapContainer} 
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden"
        style={{ height }}
      />

      {validationError && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertTriangle className="h-4 w-4" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Map Legend */}
      {showBoundaries && (domainBoundaries || plotBoundaries || validationCenter) && (
        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-xs">
          <div className="font-medium text-gray-700 dark:text-gray-300 mb-2">Map Legend</div>
          <div className="space-y-1">
            {domainBoundaries && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">Domain Boundary</span>
              </div>
            )}
            {plotBoundaries && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">Plot Boundary</span>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

export default MapboxMapPicker;
