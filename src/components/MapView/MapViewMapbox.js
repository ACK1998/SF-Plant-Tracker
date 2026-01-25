import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Map, NavigationControl, Source, Layer, GeolocateControl, Marker } from 'react-map-gl/mapbox';
import QRCode from 'qrcode';
import { Search, Filter, User, Map as MapIcon, Leaf, MapPin, Sprout, X, Navigation, Calendar, User as UserIcon, Ruler, Building, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { useApi } from '../../contexts/ApiContext';
import { useMapView } from '../../contexts/MapViewContext';
import SearchableDropdown from '../common/SearchableDropdown';
import api from '../../services/api';
import { useSearchParams } from 'react-router-dom';
import { 
  PHASE_1_CENTER, 
  calculateDistance,
  getCenterPoint
} from '../../utils/locationUtils';
import { findPlantEmoji } from '../../utils/emojiMapper';
import { 
  MAPBOX_CONFIG, 
  getMapStyle, 
  toMapboxCoordinates 
} from '../../config/mapbox';
import { FARM_OVERLAY } from '../../config/farmOverlay';
import farmLayout from '../../data/farmLayout';
import { sf4FarmLayout } from '../../data/sf4FarmLayout';
import * as turf from '@turf/turf';
import { 
  filterMarkersByBounds, 
  buildGeoJson, 
  debounce,
  getMarkerColor
} from '../../utils/mapboxUtils';
import { getHealthColorValue, HEALTH_COLORS, UI_COLORS } from '../../utils/colors';
import 'mapbox-gl/dist/mapbox-gl.css';

// Removed applyMarkerColors - using Mapbox layers instead

const PLOT_FOCUS_ZOOM = 18; // Zoom level equivalent to ~8x magnification for plots

// Zoom thresholds for progressive loading
const ZOOM_THRESHOLDS = {
  SHOW_PLOTS: 12,    // Show plots at zoom 12+
  SHOW_PLANTS: 14    // Show plants at zoom 14+
};

const normalizeIdentifier = (value) => {
  if (value === null || value === undefined) return '';
  return value.toString().trim().replace(/[^a-z0-9]/gi, '').toLowerCase();
};

const collectIdentifiers = (...rawValues) =>
  rawValues
    .map((value) => normalizeIdentifier(value))
    .filter((value, index, arr) => value && arr.indexOf(value) === index);

const matchFarmLayoutEntity = (item = {}, type, domain = null) => {
  if (type === 'plot') {
    const searchKeys = collectIdentifiers(
      item.code,
      item.plotNumber,
      item.name,
      item.externalId
    );

    if (!searchKeys.length) return null;

    // Determine which farm layout to search based on domain
    let plotsToSearch = farmLayout.plots;
    
    // If domain is SF4, search in SF4 plots first
    if (domain) {
      const domainName = (domain.name || '').toLowerCase();
      const domainKey = (domain.key || '').toLowerCase();
      if (domainName === 'sf4' || domainKey === 'sf4' || 
          domainName.includes('sf4') || domainKey.includes('sf4')) {
        plotsToSearch = sf4FarmLayout.plots;
      }
    }

    return plotsToSearch.find((candidate) => {
      const candidateKeys = collectIdentifiers(
        candidate.code,
        candidate.label,
        ...(candidate.aliases || [])
      );
      return candidateKeys.some((key) => searchKeys.includes(key));
    });
  }

  if (type === 'domain') {
    const searchKeys = collectIdentifiers(item.slug, item.key, item.name, item.label);
    if (!searchKeys.length) return null;

    return farmLayout.domains.find((candidate) => {
      const candidateKeys = collectIdentifiers(
        candidate.key,
        candidate.label,
        candidate.name,
        ...(candidate.aliases || [])
      );
      return candidateKeys.some((key) => searchKeys.includes(key));
    });
  }

  return null;
};

const findFallbackLocation = (item = {}, type) => {
  if (item.latitude && item.longitude) {
    return [item.longitude, item.latitude];
  }

  const match = matchFarmLayoutEntity(item, type);
  if (match?.centroid) {
    return match.centroid;
  }

  return null;
};

const getPolygonTopAnchor = (polygonLngLat) => {
  if (!polygonLngLat || polygonLngLat.length < 2) return null;
  const [topLeft, topRight] = polygonLngLat;
  const lng = (topLeft[0] + topRight[0]) / 2;
  const lat = (topLeft[1] + topRight[1]) / 2;
  return [lng, lat];
};

// CustomMarker component removed - using GeoJSON sources instead for better performance

const MapViewMapbox = React.memo(function MapViewMapbox({ user, selectedState }) {
  const { mapViewPlants, refreshMapViewData } = useMapView();
  const { 
    plots, 
    domains, 
    organizations,
    loading, 
    error 
  } = useApi();
  
  const [searchParams] = useSearchParams();

  const mapRef = useRef();
  const mapInstanceRef = useRef(null);
  const filteringInProgress = useRef(false);
  
  // Track user interaction to prevent auto-zoom interference
  const userInteractingRef = useRef(false);
  const lastFilterPlotRef = useRef('all');
  const lastFilterDomainRef = useRef('all');
  
  // Progressive loading state - track what data has been loaded
  const [loadedDataState, setLoadedDataState] = useState({
    plots: false,
    plants: false
  });
  const loadedBoundsRef = useRef(null);
  const lastZoomRef = useRef(0);
  
  // Viewport-based lazy loading state
  const [visibleMarkers, setVisibleMarkers] = useState({
    domains: [],
    plots: [],
    plants: []
  });
  
  // Map state
  const [viewState, setViewState] = useState({
    longitude: MAPBOX_CONFIG.defaultCenter[0],
    latitude: MAPBOX_CONFIG.defaultCenter[1],
    zoom: MAPBOX_CONFIG.defaultZoom
  });
  const [initialCenterSet, setInitialCenterSet] = useState(false);
  
  const [mapStyle, setMapStyle] = useState('streets');
  
  // Filter states - matching Plant page structure
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOrganization, setFilterOrganization] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterPlot, setFilterPlot] = useState('all');
  const [filterDomain, setFilterDomain] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterVariety, setFilterVariety] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [urlParamsInitialized, setUrlParamsInitialized] = useState(false);
  
  // Categories state
  const [categories, setCategories] = useState([]);
  
  // Plant types state - all types from database
  const [allPlantTypes, setAllPlantTypes] = useState([]);
  
  // Collapsible sections state
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [layersExpanded, setLayersExpanded] = useState(false);

  // Removed applyMarkerColors useEffect - using Mapbox layers

  // Initialize filters from URL parameters
  useEffect(() => {
    if (!urlParamsInitialized) {
      const healthParam = searchParams.get('health');
      const typeParam = searchParams.get('type');
      const domainParam = searchParams.get('domain');
      const plotParam = searchParams.get('plot');
      const categoryParam = searchParams.get('category');
      const varietyParam = searchParams.get('variety');
      
      if (healthParam) setFilterStatus(healthParam);
      if (typeParam) setFilterType(typeParam);
      if (domainParam) setFilterDomain(domainParam);
      if (plotParam) setFilterPlot(plotParam);
      if (categoryParam) setFilterCategory(categoryParam);
      if (varietyParam) setFilterVariety(varietyParam);
      
      setUrlParamsInitialized(true);
    }
  }, [searchParams, urlParamsInitialized]);

  // Load categories from database
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await api.getAllCategories();
        if (response.success) {
          setCategories(response.data);
        } else {
          console.error('Failed to load categories:', response.message);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };

    loadCategories();
  }, []);

  // Load all plant types from database
  useEffect(() => {
    const loadPlantTypes = async () => {
      try {
        const response = await api.getAllPlantTypes();
        if (response.success) {
          setAllPlantTypes(response.data || []);
        } else {
          console.error('Failed to load plant types:', response.message);
          setAllPlantTypes([]);
        }
      } catch (error) {
        console.error('Error loading plant types:', error);
        setAllPlantTypes([]);
      }
    };

    loadPlantTypes();
  }, []);
  
  // Layer visibility - MOVED TO TOP BEFORE ANY REFERENCES
  const [showDomains, setShowDomains] = useState(true);
  const [showPlots, setShowPlots] = useState(true);
  const [showPlants, setShowPlants] = useState(true);
  const [showBoundaries, setShowBoundaries] = useState(true);
  
  // Selected item state for popup
  const [selectedItem, setSelectedItem] = useState(null);
  const [popupLocation, setPopupLocation] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);

  // Generate QR code when plant is selected
  useEffect(() => {
    if (selectedItem?.type === 'plant' && selectedItem?.data?._id) {
      const plantUrl = `${window.location.origin}/plant/${selectedItem.data._id}`;
      QRCode.toDataURL(plantUrl, { width: 150, margin: 1 })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error('QR Code error:', err));
    } else {
      setQrCodeUrl(null);
    }
  }, [selectedItem]);

  // Map ready state for conditional rendering
  const [mapReady, setMapReady] = useState(false);

  // Check for missing coordinates (warnings only)
  useEffect(() => {
    if (!loading && !error) {
      domains?.forEach(domain => {
        if (!domain.latitude || !domain.longitude) {
          console.warn("Skipping domain, missing lat/lng:", domain);
        }
      });
      
      plots?.forEach(plot => {
        if (!plot.latitude || !plot.longitude) {
          console.warn("Skipping plot, missing lat/lng:", plot);
        }
      });
      
      mapViewPlants?.forEach(plant => {
        if (!plant.latitude || !plant.longitude) {
          console.warn("Skipping plant, missing lat/lng:", plant);
        }
      });
    }
  }, [domains, plots, mapViewPlants, loading, error]);

  // Calculate and set initial map center based on all domains
  useEffect(() => {
    if (!loading && !error && domains && domains.length > 0 && !initialCenterSet) {
      // Filter domains with valid coordinates
      const domainsWithCoords = domains.filter(d => 
        d.latitude != null && d.longitude != null && 
        !isNaN(d.latitude) && !isNaN(d.longitude)
      );
      
      if (domainsWithCoords.length > 0) {
        // Convert to format expected by getCenterPoint: {lat, lng}
        const domainCoords = domainsWithCoords.map(d => ({
          lat: d.latitude,
          lng: d.longitude
        }));
        
        // Calculate center point
        const center = getCenterPoint(domainCoords);
        
        // Convert to Mapbox coordinates format [lng, lat]
        const mapboxCenter = toMapboxCoordinates(center.lat, center.lng);
        
        // Update viewState with calculated center
        setViewState(prev => ({
          ...prev,
          longitude: mapboxCenter[0],
          latitude: mapboxCenter[1],
          zoom: MAPBOX_CONFIG.defaultZoom
        }));
        
        setInitialCenterSet(true);
        console.log('Map centered on all domains:', center, 'domains count:', domainsWithCoords.length);
      }
    }
  }, [domains, loading, error, initialCenterSet]);

  // Set map ready when data is loaded or after a timeout
  useEffect(() => {
    if (!loading && !error) {
      setMapReady(true);
    } else if (error) {
      // Still show map even if there's an error
      setMapReady(true);
    }
  }, [loading, error]);

  // Fallback: Set map ready after 3 seconds regardless of data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!mapReady) {
        setMapReady(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [mapReady]);




  // Helper function to check if plot is within domain boundary using rectangular boundaries
  // eslint-disable-next-line no-unused-vars
  const isPlotWithinDomain = (plot, domain) => {
    if (!plot.latitude || !plot.longitude || !domain.latitude || !domain.longitude) {
      return true; // Skip validation if coordinates missing
    }

    const domainData = generateDomainPolygon(domain);
    if (!domainData?.polygon) {
      return true; // Skip validation if domain boundary can't be generated
    }

    // Create a point for the plot center
    const plotPoint = turf.point([plot.longitude, plot.latitude]);
    
    // Check if plot center is within domain boundary
    const isWithin = turf.booleanPointInPolygon(plotPoint, domainData.polygon);
    
    return isWithin;
  };

  // Helper function to check if plant is within plot boundary
  // eslint-disable-next-line no-unused-vars
  const isPlantWithinPlot = (plant, plot) => {
    if (!plant.latitude || !plant.longitude || !plot.latitude || !plot.longitude) {
      return false;
    }
    
    const distance = calculateDistance(plot.latitude, plot.longitude, plant.latitude, plant.longitude);
    // Plot size is stored in sq ft
    if (!plot.size) return false;
    const areaSqFt = plot.size;
    // Calculate radius in feet, then convert to meters
    const radiusFt = Math.sqrt(areaSqFt / Math.PI);
    const radiusM = radiusFt * 0.3048; // Convert feet to meters (1 ft = 0.3048 m)
    const radiusKm = radiusM / 1000; // Convert to kilometers
    
    return radiusKm > 0 && distance <= radiusKm;
  };

  // Popup content renderer
  const renderPopupContent = (type, data) => {
    switch (type) {
      case 'plant':
        return (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', minWidth: '280px', padding: '0' }}>
            {/* Header */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '20px 16px 12px 16px',
              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
              borderBottom: '1px solid #a7f3d0',
              borderRadius: '16px 16px 0 0'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                backgroundColor: UI_COLORS.status.active,
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}>
                {findPlantEmoji(data.type, data.category)}
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: UI_COLORS.text.primary, margin: '0 0 2px 0' }}>{data.name}</h3>
                <p style={{ fontSize: '12px', color: HEALTH_COLORS.good.primary, margin: 0, fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Plant Details</p>
              </div>
            </div>
            
            {/* Content */}
            <div style={{ padding: '16px', backgroundColor: UI_COLORS.background.white, borderRadius: '0 0 16px 16px' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', padding: '8px 0' }}>
                  <Leaf style={{ width: '20px', height: '20px', color: HEALTH_COLORS.good.primary, flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: '11px', color: UI_COLORS.text.secondary, display: 'block', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Plant Type</span>
                    <span style={{ fontSize: '14px', color: UI_COLORS.text.primary, fontWeight: '600' }}>{data.type || 'N/A'}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', padding: '8px 0' }}>
                  <Sprout style={{ width: '20px', height: '20px', color: HEALTH_COLORS.good.primary, flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: '11px', color: UI_COLORS.text.secondary, display: 'block', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Variety</span>
                    <span style={{ fontSize: '14px', color: UI_COLORS.text.primary, fontWeight: '600' }}>{data.variety || 'N/A'}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', padding: '8px 0' }}>
                  <Heart style={{ width: '20px', height: '20px', color: getHealthColorValue(data.health, 'secondary'), flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: '11px', color: UI_COLORS.text.secondary, display: 'block', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Health Status</span>
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: '700',
                      color: getHealthColorValue(data.health, 'primary')
                    }}>{data.health || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              <div style={{ borderTop: `1px solid ${UI_COLORS.background.border}`, paddingTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', padding: '8px 0' }}>
                  <UserIcon style={{ width: '20px', height: '20px', color: UI_COLORS.primary.blue, flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: '11px', color: UI_COLORS.text.secondary, display: 'block', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Created By</span>
                    <span style={{ fontSize: '14px', color: UI_COLORS.text.primary, fontWeight: '600' }}>{data.createdBy?.name || data.planter || 'N/A'}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', padding: '8px 0' }}>
                  <Calendar style={{ width: '20px', height: '20px', color: UI_COLORS.primary.blue, flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: '11px', color: UI_COLORS.text.secondary, display: 'block', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Planted Date</span>
                    <span style={{ fontSize: '14px', color: UI_COLORS.text.primary, fontWeight: '600' }}>
                      {data.plantedDate ? new Date(data.plantedDate).toLocaleDateString() : 
                       data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '8px 0' }}>
                  <MapPin style={{ width: '20px', height: '20px', color: UI_COLORS.primary.blue, flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: '11px', color: UI_COLORS.text.secondary, display: 'block', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Plot Location</span>
                    <span style={{ fontSize: '14px', color: UI_COLORS.text.primary, fontWeight: '600' }}>{getPlotName(data.plotId) || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              {/* Additional Details */}
              {(data.category || data.growthStage || data.notes) && (
                <div style={{ borderTop: `1px solid ${UI_COLORS.background.border}`, paddingTop: '16px', marginTop: '8px' }}>
                  {data.category && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', padding: '8px 0' }}>
                      <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: UI_COLORS.primary.purple }}></div>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: UI_COLORS.text.secondary, display: 'block', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</span>
                        <span style={{ fontSize: '14px', color: UI_COLORS.text.primary, fontWeight: '600' }}>{data.category}</span>
                      </div>
                    </div>
                  )}
                  
                  {data.growthStage && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', padding: '8px 0' }}>
                      <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: UI_COLORS.primary.orange }}></div>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: UI_COLORS.text.secondary, display: 'block', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Growth Stage</span>
                        <span style={{ fontSize: '14px', color: UI_COLORS.text.primary, fontWeight: '600' }}>{data.growthStage}</span>
                      </div>
                    </div>
                  )}
                  
                  {data.notes && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '8px 0' }}>
                      <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: UI_COLORS.text.secondary }}></div>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: UI_COLORS.text.secondary, display: 'block', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notes</span>
                        <span style={{ fontSize: '13px', color: UI_COLORS.text.primary, fontWeight: '500' }}>{data.notes}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* QR Code Section */}
              {qrCodeUrl && (
                <div style={{ borderTop: `1px solid ${UI_COLORS.background.border}`, paddingTop: '16px', marginTop: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: UI_COLORS.text.secondary, display: 'block', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Scan QR Code</span>
                  <img src={qrCodeUrl} alt="Plant QR Code" style={{ width: '120px', height: '120px', margin: '0 auto', borderRadius: '8px', border: `1px solid ${UI_COLORS.background.border}` }} />
                </div>
              )}
            </div>
          </div>
        );

      case 'plot':
        return (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', minWidth: '280px', padding: '0' }}>
            {/* Header */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '16px',
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              borderBottom: '1px solid #93c5fd',
              borderRadius: '16px 16px 0 0'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                backgroundColor: '#3b82f6',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}>
                🏞️
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937', margin: '0 0 2px 0' }}>{data.name}</h3>
                <p style={{ fontSize: '12px', color: '#2563eb', margin: 0, fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Plot Details</p>
              </div>
            </div>
            
            {/* Content */}
            <div style={{ padding: '16px', backgroundColor: '#ffffff', borderRadius: '0 0 16px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', padding: '8px 0' }}>
                <Ruler style={{ width: '20px', height: '20px', color: '#2563eb', flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Plot Size</span>
                  <span style={{ fontSize: '14px', color: '#1f2937', fontWeight: '600' }}>{data.size ? `${data.size} sq ft` : 'N/A'}</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', padding: '8px 0' }}>
                <Building style={{ width: '20px', height: '20px', color: '#2563eb', flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Domain</span>
                  <span style={{ fontSize: '14px', color: '#1f2937', fontWeight: '600' }}>{getDomainName(data.domainId) || 'N/A'}</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', padding: '8px 0' }}>
                <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Soil Type</span>
                  <span style={{ fontSize: '14px', color: '#1f2937', fontWeight: '600' }}>{data.soilType || 'N/A'}</span>
                </div>
              </div>
              
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', marginTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', padding: '8px 0' }}>
                  <UserIcon style={{ width: '20px', height: '20px', color: '#2563eb', flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Created By</span>
                    <span style={{ fontSize: '14px', color: '#1f2937', fontWeight: '600' }}>{data.createdBy?.name || 'N/A'}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', padding: '8px 0' }}>
                  <Calendar style={{ width: '20px', height: '20px', color: '#2563eb', flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Created Date</span>
                    <span style={{ fontSize: '14px', color: '#1f2937', fontWeight: '600' }}>{data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '8px 0' }}>
                  <MapPin style={{ width: '20px', height: '20px', color: '#2563eb', flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Organization</span>
                    <span style={{ fontSize: '14px', color: '#1f2937', fontWeight: '600' }}>{getOrganizationName(data.organizationId) || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              {/* Additional Details */}
              {(data.description || data.cropType) && (
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', marginTop: '8px' }}>
                  {data.description && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', padding: '8px 0' }}>
                      <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#6b7280' }}></div>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</span>
                        <span style={{ fontSize: '13px', color: '#1f2937', fontWeight: '500' }}>{data.description}</span>
                      </div>
                    </div>
                  )}
                  
                  {data.cropType && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '8px 0' }}>
                      <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Crop Type</span>
                        <span style={{ fontSize: '14px', color: '#1f2937', fontWeight: '600' }}>{data.cropType}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 'domain':
        return (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', minWidth: '280px', padding: '0' }}>
            {/* Header */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '16px',
              background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
              borderBottom: '1px solid #c4b5fd',
              borderRadius: '16px 16px 0 0'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                backgroundColor: '#8b5cf6',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
              }}>
                🏢
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937', margin: '0 0 2px 0' }}>{data.name}</h3>
                <p style={{ fontSize: '12px', color: '#7c3aed', margin: 0, fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Domain Details</p>
              </div>
            </div>
            
            {/* Content */}
            <div style={{ padding: '16px', backgroundColor: '#ffffff', borderRadius: '0 0 16px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', padding: '8px 0' }}>
                <Ruler style={{ width: '20px', height: '20px', color: '#7c3aed', flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Domain Size</span>
                  <span style={{ fontSize: '14px', color: '#1f2937', fontWeight: '600' }}>{data.size ? `${data.size} sq ft` : 'N/A'}</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', padding: '8px 0' }}>
                <Building style={{ width: '20px', height: '20px', color: '#7c3aed', flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Organization</span>
                  <span style={{ fontSize: '14px', color: '#1f2937', fontWeight: '600' }}>{getOrganizationName(data.organizationId) || 'N/A'}</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', padding: '8px 0' }}>
                <MapPin style={{ width: '20px', height: '20px', color: '#7c3aed', flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location</span>
                  <span style={{ fontSize: '14px', color: '#1f2937', fontWeight: '600' }}>
                    {data.latitude && data.longitude 
                      ? `${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}` 
                      : (data.location || 'N/A')}
                  </span>
                </div>
              </div>
              
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', marginTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', padding: '8px 0' }}>
                  <UserIcon style={{ width: '20px', height: '20px', color: '#7c3aed', flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Created By</span>
                    <span style={{ fontSize: '14px', color: '#1f2937', fontWeight: '600' }}>{data.createdBy?.name || 'N/A'}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', padding: '8px 0' }}>
                  <Calendar style={{ width: '20px', height: '20px', color: '#7c3aed', flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Created Date</span>
                    <span style={{ fontSize: '14px', color: '#1f2937', fontWeight: '600' }}>{data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '8px 0' }}>
                  <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: data.isActive ? '#10b981' : '#ef4444' }}></div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</span>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: data.isActive ? '#059669' : '#dc2626' }}>{data.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </div>
              
              {/* Additional Details */}
              {data.description && (
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', marginTop: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '8px 0' }}>
                    <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#6b7280' }}></div>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</span>
                      <span style={{ fontSize: '13px', color: '#1f2937', fontWeight: '500' }}>{data.description}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Helper functions
  const getOrganizationName = (orgId) => {
    // If orgId is already a populated object with name, use it directly
    if (orgId && typeof orgId === 'object' && orgId.name) {
      return orgId.name;
    }
    
    // Handle both string and object orgId
    const orgIdStr = orgId?._id || orgId;
    if (!orgIdStr) return 'No Organization Assigned';
    
    const org = organizations.find(o => o._id === orgIdStr);
    return org ? org.name : 'Unknown Organization';
  };

  const getDomainName = (domainId) => {
    // If domainId is already a populated object with name, use it directly
    if (domainId && typeof domainId === 'object' && domainId.name) {
      return domainId.name;
    }
    
    // Handle both string and object domainId
    const domainIdStr = domainId?._id || domainId;
    if (!domainIdStr) return 'No Domain Assigned';
    
    // Look in both domains and filteredDomains arrays
    const domain = domains.find(d => d._id === domainIdStr) || filteredDomains.find(d => d._id === domainIdStr);
    return domain ? domain.name : 'Unknown Domain';
  };

  const getPlotName = (plotId) => {
    // Handle both string and object plotId
    const plotIdStr = plotId?._id || plotId;
    if (!plotIdStr) return 'No Plot Assigned';
    
    // Look in both plots and filteredPlots arrays
    const plot = plots.find(p => p._id === plotIdStr) || filteredPlots.find(p => p._id === plotIdStr);
    return plot ? plot.name : 'Unknown Plot';
  };

  // Get unique plant types from database (all types) instead of just from loaded plants
  // This ensures all types in the database are available in the filter dropdown
  const uniquePlantTypes = allPlantTypes.map(type => type.name).filter(Boolean);
  const uniquePlantVarieties = [...new Set(mapViewPlants.map(plant => plant.variety).filter(Boolean))];
  const uniquePlantStatuses = [...new Set(mapViewPlants.map(plant => plant.health).filter(Boolean))];

  // Get available domains and plots based on user role
  const getAvailableDomains = () => {
    if (!user || !user.role) return domains;
    
    // Super admin can see all domains
    if (user.role === 'super_admin') return domains;
    
    // Other roles can only see domains in their organization
    const userOrgId = user.organizationId?._id || user.organizationId;
    return domains.filter(domain => {
      const domainOrgId = domain.organizationId?._id || domain.organizationId;
      return String(domainOrgId) === String(userOrgId);
    });
  };

  const getAvailablePlots = (selectedDomainId = null) => {
    if (!user || !user.role) return plots;
    
    // Super admin can see all plots
    if (user.role === 'super_admin') {
      if (selectedDomainId && selectedDomainId !== 'all') {
        return plots.filter(plot => {
          const plotDomainId = plot.domainId?._id || plot.domainId;
          return String(plotDomainId) === String(selectedDomainId);
        });
      }
      return plots;
    }
    
    // Other roles can only see plots in their organization
    const userOrgId = user.organizationId?._id || user.organizationId;
    let filteredPlots = plots.filter(plot => {
      const plotOrgId = plot.organizationId?._id || plot.organizationId;
      return String(plotOrgId) === String(userOrgId);
    });
    
    // If a domain is selected, further filter plots by that domain
    if (selectedDomainId && selectedDomainId !== 'all') {
      filteredPlots = filteredPlots.filter(plot => {
        const plotDomainId = plot.domainId?._id || plot.domainId;
        return String(plotDomainId) === String(selectedDomainId);
      });
    }
    
    return filteredPlots;
  };

  // Get available domains and plots
  const availableDomains = getAvailableDomains();
  const availablePlots = getAvailablePlots(filterDomain);

  // Memoized filtered data - much more efficient than useEffect
  // This must be defined early as it's used in multiple places
  const { filteredDomains: filteredDomainsData, filteredPlots: filteredPlotsData, filteredPlants: filteredPlantsData } = useMemo(() => {
    // Early return if not ready
    if (loading || !urlParamsInitialized) {
      return { filteredDomains: [], filteredPlots: [], filteredPlants: [] };
    }

    // Only process data that should be visible based on zoom
    const shouldShowPlots = viewState.zoom >= ZOOM_THRESHOLDS.SHOW_PLOTS;
    const shouldShowPlants = viewState.zoom >= ZOOM_THRESHOLDS.SHOW_PLANTS;
    
    // Start with all domains (always visible), but limit plots/plants based on zoom
    // Also check if filters require data to be loaded regardless of zoom
    const hasActiveFilters = filterPlot !== 'all' || filterDomain !== 'all';
    const shouldLoadPlots = shouldShowPlots || hasActiveFilters;
    const shouldLoadPlants = shouldShowPlants || hasActiveFilters;
    
    let filteredDomainsData = domains;
    let filteredPlotsData = shouldLoadPlots ? plots : [];
    let filteredPlantsData = shouldLoadPlants ? mapViewPlants : [];
    

    // TEMPORARILY DISABLE ROLE-BASED FILTERING FOR TESTING
    // TODO: Re-enable after confirming markers render correctly
    // Apply role-based filtering
    /*
    if (user && user.role !== 'super_admin') {
      if (user.role === 'org_admin') {
        filteredDomainsData = domains.filter(d => d.organizationId === user.organizationId);
        filteredPlotsData = plots.filter(p => p.organizationId === user.organizationId);
        filteredPlantsData = mapViewPlants.filter(p => p.organizationId === user.organizationId);
      } else if (user.role === 'domain_admin') {
        filteredDomainsData = domains.filter(d => d._id === user.domainId);
        filteredPlotsData = plots.filter(p => p.domainId === user.domainId);
        filteredPlantsData = mapViewPlants.filter(p => {
          const plot = plots.find(pl => pl._id === p.plotId);
          return plot && plot.domainId === user.domainId;
        });
      } else if (user.role === 'application_user') {
        filteredPlotsData = plots.filter(p => p._id === user.plotId);
        filteredPlantsData = mapViewPlants.filter(p => p.plotId === user.plotId);
        filteredDomainsData = [];
      }
    }
    */

    // TEMPORARILY DISABLE LOCATION HIERARCHY RULES FOR TESTING
    // TODO: Re-enable after confirming markers render correctly
    // Apply location hierarchy rules
    /*
    filteredDomainsData = filteredDomainsData.filter(domain => {
      if (!domain.latitude || !domain.longitude) return false;
      const distance = calculateDistance(PHASE_1_CENTER.lat, PHASE_1_CENTER.lng, domain.latitude, domain.longitude);
      return distance <= LOCATION_RULES.DOMAIN_RADIUS;
    });

    filteredPlotsData = filteredPlotsData.filter(plot => {
      if (!plot.latitude || !plot.longitude) return false;
      const domain = filteredDomainsData.find(d => d._id === plot.domainId);
      if (domain && domain.latitude && domain.longitude) {
        const distance = calculateDistance(domain.latitude, domain.longitude, plot.latitude, plot.longitude);
        return distance <= LOCATION_RULES.PLOT_RADIUS;
      }
      return false;
    });

    filteredPlantsData = filteredPlantsData.filter(plant => {
      if (!plant.latitude || !plant.longitude) return false;
      const plot = filteredPlotsData.find(p => p._id === plant.plotId);
      if (plot && plot.latitude && plot.longitude) {
        const distance = calculateDistance(plot.latitude, plot.longitude, plant.latitude, plant.longitude);
        return distance <= LOCATION_RULES.PLANT_RADIUS;
      }
      return false;
    });
    */

    // Apply filters
    if (filterOrganization !== 'all') {
      filteredDomainsData = filteredDomainsData.filter(d => {
        const domainOrgId = d.organizationId?._id || d.organizationId;
        return String(domainOrgId) === String(filterOrganization);
      });
      filteredPlotsData = filteredPlotsData.filter(p => {
        const plotOrgId = p.organizationId?._id || p.organizationId;
        return String(plotOrgId) === String(filterOrganization);
      });
      filteredPlantsData = filteredPlantsData.filter(p => {
        const plantOrgId = p.organizationId?._id || p.organizationId;
        return String(plantOrgId) === String(filterOrganization);
      });
    }

    if (filterType !== 'all') {
      filteredPlantsData = filteredPlantsData.filter(p => p.type === filterType);
    }

    // Handle domain and plot filtering with proper hierarchy
    if (filterDomain !== 'all' && filterPlot !== 'all') {
      // Both domain and plot are selected - plot takes precedence
      
      // Show only the selected domain
      filteredDomainsData = filteredDomainsData.filter(d => {
        const domainId = d._id || d.id;
        return String(domainId) === String(filterDomain);
      });
      
      // Show only the selected plot (must be within the selected domain)
      filteredPlotsData = filteredPlotsData.filter(p => {
        const plotId = p._id || p.id;
        const plotDomainId = p.domainId?._id || p.domainId;
        return String(plotId) === String(filterPlot) && 
               String(plotDomainId) === String(filterDomain);
      });
      
      // Show only plants in the selected plot
      filteredPlantsData = filteredPlantsData.filter(p => {
        const plantPlotId = p.plotId?._id || p.plotId;
        return String(plantPlotId) === String(filterPlot);
      });
      
    } else if (filterPlot !== 'all') {
      // Only plot is selected
      
      // Show only the selected plot
      filteredPlotsData = filteredPlotsData.filter(p => {
        const plotId = p._id || p.id;
        return String(plotId) === String(filterPlot);
      });
      
      // Also show the domain that contains this plot
      if (filteredPlotsData.length > 0) {
        const selectedPlot = filteredPlotsData[0];
        const plotDomainId = selectedPlot.domainId?._id || selectedPlot.domainId;
        
        // Filter domains to only show the domain containing the selected plot
        filteredDomainsData = filteredDomainsData.filter(d => {
          const domainId = d._id || d.id;
          return String(domainId) === String(plotDomainId);
        });
      }
      
      // Show only plants in the selected plot
      filteredPlantsData = filteredPlantsData.filter(p => {
        const plantPlotId = p.plotId?._id || p.plotId;
        return String(plantPlotId) === String(filterPlot);
      });
      
    } else if (filterDomain !== 'all') {
      // Only domain is selected
      
      // Show only the selected domain
      filteredDomainsData = filteredDomainsData.filter(d => {
        const domainId = d._id || d.id;
        return String(domainId) === String(filterDomain);
      });
      
      // Show all plots within the selected domain
      filteredPlotsData = filteredPlotsData.filter(p => {
        const plotDomainId = p.domainId?._id || p.domainId;
        return String(plotDomainId) === String(filterDomain);
      });
      
      // Show only plants within plots of the selected domain
      const domainPlotIds = filteredPlotsData.map(plot => plot._id);
      
      filteredPlantsData = filteredPlantsData.filter(p => {
        const plantPlotId = p.plotId?._id || p.plotId;
        return domainPlotIds.includes(String(plantPlotId));
      });
      
    }

    if (filterCategory !== 'all') {
      filteredPlantsData = filteredPlantsData.filter(p => p.category === filterCategory);
    }

    if (filterVariety !== 'all') {
      filteredPlantsData = filteredPlantsData.filter(p => p.variety === filterVariety);
    }

    if (filterStatus !== 'all') {
      filteredPlantsData = filteredPlantsData.filter(p => p.health === filterStatus);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredDomainsData = filteredDomainsData.filter(d => 
        d.name.toLowerCase().includes(term) || 
        d.description?.toLowerCase().includes(term)
      );
      filteredPlotsData = filteredPlotsData.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.description?.toLowerCase().includes(term)
      );
      filteredPlantsData = filteredPlantsData.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.type?.toLowerCase().includes(term) ||
        p.variety?.toLowerCase().includes(term)
      );
    }

    // Log if no markers are returned
    if (filteredDomainsData.length === 0 && filteredPlotsData.length === 0 && filteredPlantsData.length === 0) {
      console.warn('MapViewMapbox - No markers found after filtering:', {
        totalDomains: domains.length,
        totalPlots: plots.length,
        totalPlants: mapViewPlants.length,
        userRole: user?.role,
        filters: {
          searchTerm,
          filterOrganization,
          filterType,
          filterPlot,
          filterDomain,
          filterCategory,
          filterVariety,
          filterStatus
        }
      });
    }

    return {
      filteredDomains: filteredDomainsData,
      filteredPlots: filteredPlotsData,
      filteredPlants: filteredPlantsData
    };
  }, [
    domains, 
    plots, 
    mapViewPlants, 
    loading, 
    urlParamsInitialized,
    viewState.zoom,
    searchTerm, 
    filterOrganization, 
    filterType, 
    filterPlot, 
    filterDomain, 
    filterCategory, 
    filterVariety, 
    filterStatus,
    user?.role
  ]);

  // Extract filtered data for use throughout component (aliases for convenience)
  const filteredDomains = filteredDomainsData;
  const filteredPlots = filteredPlotsData;
  const filteredPlants = filteredPlantsData;

  // Memoize plant markers with emoji for HTML rendering
  const plantMarkersWithEmoji = useMemo(() => {
    if (!showPlants || filteredPlants.length === 0) return [];
    
    return filteredPlants
      .map(plant => {
        const hasDirectCoordinates = plant.latitude && plant.longitude;
        let coords = null;
        
        if (hasDirectCoordinates) {
          coords = { longitude: plant.longitude, latitude: plant.latitude };
        } else {
          const plantPlotId = plant.plotId?._id || plant.plotId;
          const plot = plots.find(p => p._id === plantPlotId);
          if (plot && plot.latitude && plot.longitude) {
            coords = { longitude: plot.longitude, latitude: plot.latitude };
          }
        }
        
        if (!coords) return null;
        
        // Use emoji from DB first, then lookup by type/name
        const emoji = plant.emoji || findPlantEmoji(plant.type, plant.category) || findPlantEmoji(plant.name, plant.category) || '🌱';
        return {
          ...plant,
          ...coords,
          emoji: emoji,
          displayName: `${emoji} ${plant.name}`
        };
      })
      .filter(Boolean);
  }, [filteredPlants, plots, showPlants]);

  // Separate useEffect for map centering when filters change (non-blocking)
  // Only runs when filter values actually change, not when filtered data recomputes
  useEffect(() => {
    if (loading || !urlParamsInitialized || !mapReady) return;
    
    // Only auto-zoom if filters actually changed, not if user is manually interacting
    const filterPlotChanged = filterPlot !== lastFilterPlotRef.current;
    const filterDomainChanged = filterDomain !== lastFilterDomainRef.current;
    
    if (!filterPlotChanged && !filterDomainChanged) {
      return; // Filters haven't changed, don't interfere with user zoom
    }
    
    // Don't auto-zoom if user is currently interacting with the map
    if (userInteractingRef.current) {
      // Update refs but don't zoom
      lastFilterPlotRef.current = filterPlot;
      lastFilterDomainRef.current = filterDomain;
      return;
    }

    // Center map to selected plot when plot filter is applied
    if (filterPlot !== 'all' && filteredPlots.length > 0) {
        const selectedPlot = filteredPlots[0];
        // Try to find coordinates for the plot
        const plotDomainId = selectedPlot.domainId?._id || selectedPlot.domainId;
        const plotDomain = filteredDomains.find(d => d._id === plotDomainId);
        const layoutPlot = matchFarmLayoutEntity(selectedPlot, 'plot', plotDomain);
        const polygonCoords = layoutPlot?.polygonLngLat;
        const topAnchorCoords = polygonCoords ? getPolygonTopAnchor(polygonCoords) : null;
        const fallbackCoords = layoutPlot?.centroid || findFallbackLocation(selectedPlot, 'plot');
        const hasCoordinates = selectedPlot.latitude && selectedPlot.longitude;
        const plotCoords = topAnchorCoords || fallbackCoords || (hasCoordinates ? [selectedPlot.longitude, selectedPlot.latitude] : null);
        
        if (plotCoords) {
          // Zoom to plot with high zoom level to show markers and labels
          setViewState(prev => ({
            ...prev,
            longitude: plotCoords[0],
            latitude: plotCoords[1],
            zoom: 17, // High zoom to ensure markers and labels are visible
            transitionDuration: MAPBOX_CONFIG.flyToDuration
          }));
        }
      }
      // Center map to selected domain when domain filter is applied (but not if plot is also selected)
      else if (filterDomain !== 'all' && filteredDomains.length > 0) {
        const selectedDomain = filteredDomains[0];
        if (selectedDomain.latitude && selectedDomain.longitude) {
          // Calculate appropriate zoom level based on the number of plots in the domain
          let zoom = 14; // Default zoom for domain
          if (filteredPlots.length > 0) {
            // If there are plots, zoom in more to show them clearly
            zoom = 15;
            if (filteredPlots.length <= 3) {
              // For few plots, zoom in even more
              zoom = 16;
            }
          }
          
          setViewState(prev => ({
            ...prev,
            longitude: selectedDomain.longitude,
            latitude: selectedDomain.latitude,
            zoom: zoom,
            transitionDuration: MAPBOX_CONFIG.flyToDuration
          }));
        }
      }
      
      // Update refs to track filter changes
      lastFilterPlotRef.current = filterPlot;
      lastFilterDomainRef.current = filterDomain;
  }, [filterPlot, filterDomain, loading, urlParamsInitialized, mapReady, filteredPlots, filteredDomains]);

  // Viewport-based lazy loading handler
  const updateVisibleMarkers = useCallback((map) => {
    // Disable viewport filtering when filtering by a specific plot to ensure all markers show
    if (filterPlot !== 'all') {
      setVisibleMarkers({
        domains: filteredDomains,
        plots: filteredPlots,
        plants: filteredPlants
      });
      return;
    }

    if (!map) {
      // If no map, show all markers (fallback for initial render)
      setVisibleMarkers({
        domains: filteredDomains,
        plots: filteredPlots,
        plants: filteredPlants
      });
      return;
    }

    if (!map.isStyleLoaded()) {
      // If style not loaded, show all markers temporarily
      setVisibleMarkers({
        domains: filteredDomains,
        plots: filteredPlots,
        plants: filteredPlants
      });
      return;
    }
    
    try {
      const bounds = map.getBounds();
      if (!bounds) {
        // If no bounds, show all markers
        setVisibleMarkers({
          domains: filteredDomains,
          plots: filteredPlots,
          plants: filteredPlants
        });
        return;
      }

      // Use bounds directly - filterMarkersByBounds already adds a buffer
      const visibleDomains = filterMarkersByBounds(filteredDomains, bounds);
      const visiblePlots = filterMarkersByBounds(filteredPlots, bounds);
      const visiblePlants = filterMarkersByBounds(filteredPlants, bounds);

      setVisibleMarkers({
        domains: visibleDomains,
        plots: visiblePlots,
        plants: visiblePlants
      });
    } catch (error) {
      console.error('Error updating visible markers:', error);
      // Fallback to all markers on error
      setVisibleMarkers({
        domains: filteredDomains,
        plots: filteredPlots,
        plants: filteredPlants
      });
    }
  }, [filteredDomains, filteredPlots, filteredPlants, filterPlot]);

  // Update visible markers when filtered data changes
  useEffect(() => {
    if (!loading) {
      updateVisibleMarkers(mapInstanceRef.current);
    }
  }, [filteredDomains, filteredPlots, filteredPlants, loading, updateVisibleMarkers]);

  // Debug: Log data flow - ALWAYS log, not just when filtering
  useEffect(() => {
    console.log('=== DATA FLOW DEBUG ===', {
      loading,
      error,
      rawData: {
        plotsCount: plots.length,
        mapViewPlantsCount: mapViewPlants.length,
        domainsCount: domains.length
      },
      filteredData: {
        filteredPlotsCount: filteredPlots.length,
        filteredPlantsCount: filteredPlants.length,
        filteredDomainsCount: filteredDomains.length
      },
      visibility: {
        showPlots,
        showPlants,
        showDomains
      },
      filters: {
        filterPlot,
        filterDomain,
        filterOrganization,
        filterType,
        filterCategory,
        filterVariety,
        filterStatus,
        searchTerm
      },
      samplePlant: mapViewPlants[0],
      samplePlot: plots[0]
    });
    
    if (filterPlot !== 'all' && filteredPlots.length > 0) {
      console.log('Filtered plot details:', filteredPlots[0]);
    }
    
    if (filteredPlants.length > 0) {
      console.log('Filtered plants sample:', filteredPlants.slice(0, 3));
    } else if (mapViewPlants.length > 0) {
      console.warn('⚠️ Plants exist but none are in filteredPlants!', {
        totalPlants: mapViewPlants.length,
        samplePlant: mapViewPlants[0]
      });
    }
  }, [plots, mapViewPlants, filteredPlots, filteredPlants, filterPlot, showPlots, showPlants, loading, error, domains, filteredDomains, showDomains, filterDomain, filterOrganization, filterType, filterCategory, filterVariety, filterStatus, searchTerm]);


  // Helper function to get map bounds
  const getMapBounds = useCallback(() => {
    if (!mapInstanceRef.current || !mapInstanceRef.current.isStyleLoaded()) {
      return null;
    }
    try {
      const bounds = mapInstanceRef.current.getBounds();
      if (!bounds) return null;
      return {
        sw: [bounds.getWest(), bounds.getSouth()],
        ne: [bounds.getEast(), bounds.getNorth()]
      };
    } catch (error) {
      console.error('Error getting map bounds:', error);
      return null;
    }
  }, []);

  // Ensure data is loaded when filters are active (even at low zoom)
  useEffect(() => {
    if (!mapReady || loading || !mapInstanceRef.current) return;
    
    const hasActiveFilters = filterPlot !== 'all' || filterDomain !== 'all';
    const bounds = getMapBounds();
    
    // If filters are active, ensure we have the necessary data loaded
    if (hasActiveFilters) {
      // Mark plots as loaded if filter requires them
      if (filterPlot !== 'all' || filterDomain !== 'all') {
        setLoadedDataState(prev => ({ ...prev, plots: true }));
      }
      
      // Load plants if plot filter is active (need to show plants in that plot)
      if (filterPlot !== 'all' && !loadedDataState.plants && bounds) {
        refreshMapViewData(bounds);
        loadedBoundsRef.current = bounds;
        setLoadedDataState(prev => ({ ...prev, plants: true }));
      }
    }
  }, [filterPlot, filterDomain, mapReady, loading, loadedDataState, getMapBounds, refreshMapViewData]);

  // Progressive data loading based on zoom level
  useEffect(() => {
    if (!mapReady || loading || !mapInstanceRef.current) return;

    const currentZoom = viewState.zoom;
    const bounds = getMapBounds();
    
    // Check if we need to load plots (zoom >= 12)
    if (currentZoom >= ZOOM_THRESHOLDS.SHOW_PLOTS && !loadedDataState.plots) {
      // Plots are loaded from ApiContext, so we just mark as loaded
      // The plots are already available from useApi()
      setLoadedDataState(prev => ({ ...prev, plots: true }));
    }
    
    // Check if we need to load plants (zoom >= 15)
    if (currentZoom >= ZOOM_THRESHOLDS.SHOW_PLANTS && !loadedDataState.plants && bounds) {
      // Check if bounds have changed significantly
      const boundsChanged = !loadedBoundsRef.current || 
        Math.abs(loadedBoundsRef.current.sw[0] - bounds.sw[0]) > 0.01 ||
        Math.abs(loadedBoundsRef.current.sw[1] - bounds.sw[1]) > 0.01 ||
        Math.abs(loadedBoundsRef.current.ne[0] - bounds.ne[0]) > 0.01 ||
        Math.abs(loadedBoundsRef.current.ne[1] - bounds.ne[1]) > 0.01;
      
      if (boundsChanged) {
        // Load plants for current viewport
        refreshMapViewData(bounds);
        loadedBoundsRef.current = bounds;
        setLoadedDataState(prev => ({ ...prev, plants: true }));
      }
    }
    
    // Reset loaded state when zooming out below thresholds (only if no filters active)
    const hasActiveFilters = filterPlot !== 'all' || filterDomain !== 'all';
    if (!hasActiveFilters) {
      if (currentZoom < ZOOM_THRESHOLDS.SHOW_PLOTS) {
        setLoadedDataState(prev => ({ ...prev, plots: false }));
      }
      if (currentZoom < ZOOM_THRESHOLDS.SHOW_PLANTS) {
        setLoadedDataState(prev => ({ ...prev, plants: false }));
        loadedBoundsRef.current = null;
      }
    }
    
    lastZoomRef.current = currentZoom;
  }, [viewState.zoom, mapReady, loading, loadedDataState, getMapBounds, refreshMapViewData, filterPlot, filterDomain]);

  // Debounced viewport update handler
  const debouncedUpdateVisibleMarkers = useMemo(
    () => debounce((map) => updateVisibleMarkers(map), 250),
    [updateVisibleMarkers]
  );

  // Debounced handler for progressive loading on map move
  const debouncedProgressiveLoad = useMemo(
    () => debounce(() => {
      if (!mapInstanceRef.current || !mapReady) return;
      
      const currentZoom = viewState.zoom;
      const bounds = getMapBounds();
      
      // Load plants if zoomed in enough and bounds available
      if (currentZoom >= ZOOM_THRESHOLDS.SHOW_PLANTS && bounds) {
        const boundsChanged = !loadedBoundsRef.current || 
          Math.abs(loadedBoundsRef.current.sw[0] - bounds.sw[0]) > 0.01 ||
          Math.abs(loadedBoundsRef.current.sw[1] - bounds.sw[1]) > 0.01 ||
          Math.abs(loadedBoundsRef.current.ne[0] - bounds.ne[0]) > 0.01 ||
          Math.abs(loadedBoundsRef.current.ne[1] - bounds.ne[1]) > 0.01;
        
        if (boundsChanged) {
          refreshMapViewData(bounds);
          loadedBoundsRef.current = bounds;
        }
      }
    }, 500),
    [viewState.zoom, mapReady, getMapBounds, refreshMapViewData]
  );

  // Handle map moveend to update visible markers and trigger progressive loading
  const handleMapMoveEnd = useCallback((evt) => {
    setViewState(evt.viewState);
    // Mark that user is interacting
    userInteractingRef.current = true;
    // Reset after a delay to allow auto-zoom when filters change
    setTimeout(() => {
      userInteractingRef.current = false;
    }, 2000);
    
    if (mapInstanceRef.current) {
      debouncedUpdateVisibleMarkers(mapInstanceRef.current);
      debouncedProgressiveLoad();
    }
  }, [debouncedUpdateVisibleMarkers, debouncedProgressiveLoad]);
  
  // Handle map move to track user interaction
  const handleMapMove = useCallback((evt) => {
    setViewState(evt.viewState);
    userInteractingRef.current = true;
  }, []);

  // Event handlers
  const handleMarkerClick = useCallback((item, type) => {
    // Fly to marker location with appropriate zoom level
    let zoom = 16; // default zoom
    
    switch (type) {
      case 'domain':
        zoom = 13;
        break;
      case 'plot':
        zoom = Math.max(PLOT_FOCUS_ZOOM, 14);
        break;
      case 'plant':
        zoom = 22; // Increased zoom for better plant detail view
        break;
      default:
        zoom = 16;
    }
    
    setViewState(prev => ({
      ...prev,
      longitude: item.longitude,
      latitude: item.latitude,
      zoom: zoom,
      transitionDuration: MAPBOX_CONFIG.flyToDuration
    }));
    
    // Set selected item and popup location
    setSelectedItem({ type, data: item });
    setPopupLocation([item.longitude, item.latitude]);
  }, []);

  // Handle marker/point click (including cluster expansion)
  const handlePointClick = useCallback((event, map) => {
    const feature = event.features?.[0];
    if (!feature || !feature.properties) return;

    const properties = feature.properties;
    
    // Handle cluster click - zoom in to expand
    if (properties.cluster_id !== undefined) {
      const clusterId = properties.cluster_id;
      const source = map.getSource('plants-source');
      if (source && source.getClusterExpansionZoom) {
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          map.easeTo({
            center: feature.geometry.coordinates,
            zoom: Math.min(zoom, 20)
          });
        });
      }
      return;
    }
    
    // Get marker type - check for 'type' first (should be 'plant', 'plot', 'domain')
    const type = properties.type;
    const itemId = properties.id || properties._id;
    
    // For plots, look up the full plot data from the plots array to get populated domain/organization
    let item = {
      ...properties,
      _id: itemId,
      longitude: feature.geometry.coordinates[0],
      latitude: feature.geometry.coordinates[1]
    };
    
    // If it's a domain, get full domain data
    if (type === 'domain') {
      const fullDomain = domains.find(d => d._id === itemId) || filteredDomains.find(d => d._id === itemId);
      if (fullDomain) {
        item = {
          ...fullDomain,
          longitude: feature.geometry.coordinates[0],
          latitude: feature.geometry.coordinates[1]
        };
      }
    }
    
    // If it's a plot, try to get the full plot data with populated fields
    if (type === 'plot') {
      const fullPlot = plots.find(p => p._id === itemId) || filteredPlots.find(p => p._id === itemId);
      if (fullPlot) {
        item = {
          ...fullPlot,
          longitude: feature.geometry.coordinates[0],
          latitude: feature.geometry.coordinates[1]
        };
      }
    }
    
    // If it's a plant, get full plant data and show popup without zooming
    if (type === 'plant') {
      const fullPlant = filteredPlants.find(p => p._id === itemId) || mapViewPlants.find(p => p._id === itemId);
      if (fullPlant) {
        item = {
          ...fullPlant,
          longitude: feature.geometry.coordinates[0],
          latitude: feature.geometry.coordinates[1]
        };
      }
      // Just show popup at current zoom
      setSelectedItem({ type, data: item });
      setPopupLocation([item.longitude, item.latitude]);
      return;
    }

    handleMarkerClick(item, type);
  }, [handleMarkerClick, plots, filteredPlots, filteredPlants, domains, filteredDomains, mapViewPlants]);

  // Handle popup close
  const handlePopupClose = useCallback(() => {
    setSelectedItem(null);
    setPopupLocation(null);
  }, []);

  // Handle map click to close popup
  const handleMapClick = useCallback((event) => {
    // Only close popup if clicking on empty map area, not on markers
    if (selectedItem && !event.originalEvent?.target?.closest('.mapboxgl-marker')) {
      setSelectedItem(null);
      setPopupLocation(null);
    }
  }, [selectedItem]);

  const handleResetToScope = () => {
    if (user && user.role !== 'super_admin') {
      let center = MAPBOX_CONFIG.defaultCenter;
      let zoom = MAPBOX_CONFIG.defaultZoom;
      
      if (user.role === 'org_admin') {
        const orgDomains = domains.filter(d => d.organizationId === user.organizationId);
        if (orgDomains.length > 0) {
          // Filter domains with valid coordinates
          const orgDomainsWithCoords = orgDomains.filter(d => 
            d.latitude != null && d.longitude != null && 
            !isNaN(d.latitude) && !isNaN(d.longitude)
          );
          
          if (orgDomainsWithCoords.length > 0) {
            // Convert to format expected by getCenterPoint: {lat, lng}
            const domainCoords = orgDomainsWithCoords.map(d => ({
              lat: d.latitude,
              lng: d.longitude
            }));
            const centerPoint = getCenterPoint(domainCoords);
            center = toMapboxCoordinates(centerPoint.lat, centerPoint.lng);
          }
        }
      } else if (user.role === 'domain_admin') {
        const domain = domains.find(d => d._id === user.domainId);
        if (domain && domain.latitude && domain.longitude) {
          center = toMapboxCoordinates(domain.latitude, domain.longitude);
          zoom = 14;
        }
      } else if (user.role === 'application_user') {
        const plot = plots.find(p => p._id === user.plotId);
        if (plot && plot.latitude && plot.longitude) {
          center = toMapboxCoordinates(plot.latitude, plot.longitude);
          zoom = 16;
        }
      }
      
      setViewState(prev => ({
        ...prev,
        longitude: center[0],
        latitude: center[1],
        zoom: zoom,
        transitionDuration: MAPBOX_CONFIG.flyToDuration
      }));
    } else {
      // For super_admin, center on all domains
      const domainsWithCoords = domains?.filter(d => 
        d.latitude != null && d.longitude != null && 
        !isNaN(d.latitude) && !isNaN(d.longitude)
      ) || [];
      
      let center = MAPBOX_CONFIG.defaultCenter;
      if (domainsWithCoords.length > 0) {
        // Convert to format expected by getCenterPoint: {lat, lng}
        const domainCoords = domainsWithCoords.map(d => ({
          lat: d.latitude,
          lng: d.longitude
        }));
        const centerPoint = getCenterPoint(domainCoords);
        center = toMapboxCoordinates(centerPoint.lat, centerPoint.lng);
      }
      
      setViewState(prev => ({
        ...prev,
        longitude: center[0],
        latitude: center[1],
        zoom: MAPBOX_CONFIG.defaultZoom,
        transitionDuration: MAPBOX_CONFIG.flyToDuration
      }));
    }
  };

  const clearAllFilters = useCallback(() => {
    // Use a single state update to prevent multiple re-renders
    setSearchTerm('');
    setFilterOrganization('all');
    setFilterType('all');
    setFilterPlot('all');
    setFilterDomain('all');
    setFilterCategory('all');
    setFilterVariety('all');
    setFilterStatus('all');
    // Close filters when all are cleared
    setFiltersExpanded(false);
  }, []);

  // Debounced status filter handler to prevent rapid changes
  const handleStatusFilterChange = useCallback((value) => {
    // Clear any existing timeout
    if (filteringInProgress.current) {
      return; // Skip if filtering is already in progress
    }
    setFilterStatus(value);
  }, []);

  // Check if any filters are active
  const hasActiveFilters = searchTerm || 
    filterOrganization !== 'all' ||
    filterType !== 'all' || 
    filterPlot !== 'all' || 
    filterDomain !== 'all' || 
    filterCategory !== 'all' || 
    filterVariety !== 'all' ||
    filterStatus !== 'all';

  // Count active filters
  const activeFilterCount = [
    searchTerm ? 1 : 0,
    filterOrganization !== 'all' ? 1 : 0,
    filterType !== 'all' ? 1 : 0,
    filterPlot !== 'all' ? 1 : 0,
    filterDomain !== 'all' ? 1 : 0,
    filterCategory !== 'all' ? 1 : 0,
    filterVariety !== 'all' ? 1 : 0,
    filterStatus !== 'all' ? 1 : 0
  ].reduce((sum, count) => sum + count, 0);

  // Auto-expand filters when any filter is applied
  useEffect(() => {
    if (hasActiveFilters && !filtersExpanded) {
      setFiltersExpanded(true);
    }
  }, [hasActiveFilters, filtersExpanded]);

  // Generate domain polygons using actual domain size and rectangular boundaries
  const generateDomainPolygon = (domain) => {
    // Use the actual domain size from the domain data
    const domainSize = domain.size || 0;

    if (!domain.latitude || !domain.longitude) {
      console.warn(`Domain "${domain.name}" has no coordinates`);
      return null;
    }

    if (domainSize <= 0) {
      console.warn(`Domain "${domain.name}" has no size data`);
      return null;
    }

    // Domain size is stored in sq ft in DB
    // Calculate side length in feet, then convert to meters
    const sideLengthFt = Math.sqrt(domainSize);
    const sideLengthM = sideLengthFt * 0.3048; // Convert feet to meters (1 ft = 0.3048 m)
    
    // Convert to degrees (approximate: 1 degree ≈ 111,000 meters)
    const sideLengthDegrees = sideLengthM / 111000;
    
    // Create a square boundary centered on the domain
    const halfSide = sideLengthDegrees / 2;
    
    const squarePolygon = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [domain.longitude - halfSide, domain.latitude - halfSide],
          [domain.longitude + halfSide, domain.latitude - halfSide],
          [domain.longitude + halfSide, domain.latitude + halfSide],
          [domain.longitude - halfSide, domain.latitude + halfSide],
          [domain.longitude - halfSide, domain.latitude - halfSide] // Close the polygon
        ]]
      },
      properties: {
        name: domain.name,
        size: domainSize,
        sideLength: sideLengthM
      }
    };

    return { 
      polygon: squarePolygon, 
      radius: sideLengthM / 2, // Half the side length for compatibility
      sideLength: sideLengthM,
      sideLengthDegrees: sideLengthDegrees
    };
  };

  // Generate plot boundaries from plot size (fallback when not in farm layout)
  const generatePlotBoundaryFromSize = (plot) => {
    if (!plot.latitude || !plot.longitude || !plot.size) {
      return null;
    }
    
    // Plot size is stored in sq ft in DB
    const areaSqFt = plot.size;
    // Calculate side length in feet, then convert to meters
    const sideLengthFt = Math.sqrt(areaSqFt);
    const sideLengthM = sideLengthFt * 0.3048; // Convert feet to meters (1 ft = 0.3048 m)
    const sideLengthDegrees = sideLengthM / 111000;
    const halfSide = sideLengthDegrees / 2;
    
    // Adjust for longitude (longitude spacing varies with latitude)
    const latFactor = Math.cos(plot.latitude * Math.PI / 180);
    const halfSideLng = halfSide / latFactor;
    
    return [
      [plot.longitude - halfSideLng, plot.latitude - halfSide],
      [plot.longitude + halfSideLng, plot.latitude - halfSide],
      [plot.longitude + halfSideLng, plot.latitude + halfSide],
      [plot.longitude - halfSideLng, plot.latitude + halfSide],
      [plot.longitude - halfSideLng, plot.latitude - halfSide], // Close ring
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading map...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-red-600">Error loading map: {error}</div>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Map View</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleResetToScope}
            className="btn-secondary flex items-center space-x-2"
          >
            <Navigation className="h-4 w-4" />
            <span>Reset to My Scope</span>
          </button>
        </div>
      </div>

      {/* Search and Filters - Mobile Optimized */}
      <div className="card relative" style={{ zIndex: 1, overflow: 'visible' }}>
        <div className="flex flex-col gap-4">
          {/* Search and Filter Toggle in Same Row */}
          <div className="flex gap-4 items-center">
            {/* Search - 9/12 width */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className={`h-5 w-5 ${searchTerm ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'}`} />
                </div>
                <input
                  type="text"
                  placeholder="Search plants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`input-field pl-10 ${searchTerm ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}
                />
              </div>
            </div>

            {/* Filter Toggle Button - 3/12 width */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg transition-colors duration-200"
              >
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">Filters</span>
                {hasActiveFilters && (
                  <span className="px-2 py-1 text-xs bg-blue-500 text-white rounded-full">
                    {activeFilterCount}
                  </span>
                )}
                {filtersExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {/* Clear Filters Button - Only show when filters are active */}
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200"
                  title={`Clear ${activeFilterCount} active filter${activeFilterCount > 1 ? 's' : ''}`}
                >
                  <X size={16} />
                  <span className="text-sm font-medium">Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Collapsible Filters */}
          <div className={`transition-all duration-300 ease-in-out relative ${
            filtersExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          }`} style={{ zIndex: filtersExpanded ? 1 : 'auto', overflow: 'visible' }}>
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              {/* Row 1: Type, Domain, and Plot */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center space-x-2">
                  <Filter className={`h-4 w-4 flex-shrink-0 ${filterType !== 'all' ? 'text-blue-500' : 'text-gray-400'}`} />
                  <SearchableDropdown
                    options={[
                      { value: 'all', label: 'All Types' },
                      ...uniquePlantTypes.map(type => ({ value: type, label: type })).sort()
                    ]}
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    placeholder="All Types"
                    searchPlaceholder="Search types..."
                    className={`input-field text-sm w-full ${filterType !== 'all' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <MapPin className={`h-4 w-4 flex-shrink-0 ${filterDomain !== 'all' ? 'text-blue-500' : 'text-gray-400'}`} />
                  <SearchableDropdown
                    options={[
                      { value: 'all', label: 'All Domains' },
                      ...availableDomains.map(domain => ({ value: domain._id, label: domain.name }))
                    ]}
                    value={filterDomain}
                    onChange={(e) => setFilterDomain(e.target.value)}
                    placeholder="All Domains"
                    searchPlaceholder="Search domains..."
                    className={`input-field text-sm w-full ${filterDomain !== 'all' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <MapIcon className={`h-4 w-4 flex-shrink-0 ${filterPlot !== 'all' ? 'text-blue-500' : 'text-gray-400'}`} />
                  <SearchableDropdown
                    options={[
                      { value: 'all', label: 'All Plots' },
                      ...availablePlots.map(plot => ({ value: plot._id, label: plot.name }))
                    ]}
                    value={filterPlot}
                    onChange={(e) => setFilterPlot(e.target.value)}
                    placeholder="All Plots"
                    searchPlaceholder="Search plots..."
                    className={`input-field text-sm w-full ${filterPlot !== 'all' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  />
                </div>
              </div>

              {/* Row 2: Organization (Super Admin only) */}
              {user?.role === 'super_admin' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center space-x-2">
                    <User className={`h-4 w-4 flex-shrink-0 ${filterOrganization !== 'all' ? 'text-blue-500' : 'text-gray-400'}`} />
                    <SearchableDropdown
                      options={[
                        { value: 'all', label: 'All Organizations' },
                        ...organizations.map(org => ({ value: org._id, label: org.name }))
                      ]}
                      value={filterOrganization}
                      onChange={(e) => setFilterOrganization(e.target.value)}
                      placeholder="All Organizations"
                      searchPlaceholder="Search organizations..."
                      className={`input-field text-sm w-full ${filterOrganization !== 'all' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    />
                  </div>
                  {/* Empty divs to maintain grid structure */}
                  <div className="hidden sm:block"></div>
                  <div className="hidden sm:block"></div>
                </div>
              )}

              {/* Row 3: Category, Variety, and Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center space-x-2">
                  <Leaf className={`h-4 w-4 flex-shrink-0 ${filterCategory !== 'all' ? 'text-blue-500' : 'text-gray-400'}`} />
                  <SearchableDropdown
                    options={[
                      { value: 'all', label: 'All Categories' },
                      ...categories.map(cat => ({ value: cat.name, label: cat.displayName }))
                    ]}
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    placeholder="All Categories"
                    searchPlaceholder="Search categories..."
                    className={`input-field text-sm w-full ${filterCategory !== 'all' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Sprout className={`h-4 w-4 flex-shrink-0 ${filterVariety !== 'all' ? 'text-blue-500' : 'text-gray-400'}`} />
                  <SearchableDropdown
                    options={[
                      { value: 'all', label: 'All Varieties' },
                      ...uniquePlantVarieties.map(variety => ({ value: variety, label: variety }))
                    ]}
                    value={filterVariety}
                    onChange={(e) => setFilterVariety(e.target.value)}
                    placeholder="All Varieties"
                    searchPlaceholder="Search varieties..."
                    className={`input-field text-sm w-full ${filterVariety !== 'all' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Heart className={`h-4 w-4 flex-shrink-0 ${filterStatus !== 'all' ? 'text-blue-500' : 'text-gray-400'}`} />
                  <SearchableDropdown
                    options={[
                      { value: 'all', label: 'All Status' },
                      ...uniquePlantStatuses.map(status => ({ value: status, label: status }))
                    ]}
                    value={filterStatus}
                    onChange={(e) => handleStatusFilterChange(e.target.value)}
                    placeholder="All Status"
                    searchPlaceholder="Search status..."
                    className={`input-field text-sm w-full ${filterStatus !== 'all' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Layer Controls */}
      <div className="card relative" style={{ zIndex: 1, overflow: 'visible' }}>
        <div className="flex flex-col gap-4">
          {/* Layer Controls Toggle Button */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setLayersExpanded(!layersExpanded)}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg transition-colors duration-200"
            >
              <MapIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Map Layers & Style</span>
              {layersExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Collapsible Layer Controls */}
          <div className={`transition-all duration-300 ease-in-out relative ${
            layersExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
          }`} style={{ zIndex: layersExpanded ? 1 : 'auto' }}>
            <div className="space-y-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              {/* Layer Visibility Controls */}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2 mb-4">
                  <MapIcon className="h-5 w-5 text-blue-600" />
                  <span>Map Layers</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <label className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showDomains}
                      onChange={(e) => setShowDomains(e.target.checked)}
                      className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <div className="flex items-center space-x-2">
                      <div className="marker-legend-dot domain"></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Domains</span>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPlots}
                      onChange={(e) => setShowPlots(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <div className="flex items-center space-x-2">
                      <div className="marker-legend-dot plot"></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Plots</span>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPlants}
                      onChange={(e) => setShowPlants(e.target.checked)}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <div className="flex items-center space-x-2">
                      <div className="marker-legend-dot plant"></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Plants</span>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showBoundaries}
                      onChange={(e) => setShowBoundaries(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <div className="flex items-center space-x-2">
                      <div className="marker-legend-dot boundary"></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Boundaries</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Map Style Selector */}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2 mb-4">
                  <MapIcon className="h-5 w-5 text-blue-600" />
                  <span>Map Style</span>
                </h3>
                <div>
                  <select
                    value={mapStyle}
                    onChange={(e) => setMapStyle(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors duration-200"
                  >
                    <option value="streets">Streets</option>
                    <option value="light">Light</option>
                    <option value="satellite">Satellite</option>
                    <option value="outdoors">Outdoors</option>
                  </select>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Choose the visual style for the map display
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden" style={{ zIndex: 0 }}>
        <div className="h-96 md:h-[600px] lg:h-[700px] min-h-[384px] relative bg-gray-100 dark:bg-gray-700" style={{ zIndex: 0 }}>
          {mapReady ? (
            <Map
              ref={(ref) => {
                mapRef.current = ref;
                if (ref && ref.getMap) {
                  mapInstanceRef.current = ref.getMap();
                }
              }}
              {...viewState}
              onMove={handleMapMove}
              onMoveEnd={handleMapMoveEnd}
              minZoom={8}
              maxZoom={22}
              onClick={(event) => {
                handleMapClick(event);
                // Handle GeoJSON layer clicks
                if (event.features && event.features.length > 0 && mapInstanceRef.current) {
                  handlePointClick(event, mapInstanceRef.current);
                }
              }}
              interactiveLayerIds={['domains-layer', 'plots-layer', 'plants-layer', 'plants-icon', 'plants-clusters', 'domains-labels', 'plots-labels', 'plants-labels']}
              style={{ width: '100%', height: '100%', zIndex: 0 }}
              mapStyle={getMapStyle(mapStyle)}
              mapboxAccessToken={MAPBOX_CONFIG.accessToken}
              onLoad={() => {
                // Map is loaded, get the map instance from ref
                if (mapRef.current && mapRef.current.getMap) {
                  const map = mapRef.current.getMap();
                  mapInstanceRef.current = map;
                  
                  // Update visible markers on initial load
                  setTimeout(() => {
                    updateVisibleMarkers(map);
                  }, 500);
                  
                  // Removed manual source refresh - Source component handles updates
                }
              }}
              onError={(e) => {}}
            >
            <NavigationControl position="top-left" />
            <GeolocateControl position="top-left" />

            <Source
              id="farm-overlay"
              type="image"
              image={FARM_OVERLAY.imageUrl}
              coordinates={FARM_OVERLAY.coordinates}
            >
              <Layer
                id="farm-overlay-layer"
                type="raster"
                paint={{
                  'raster-opacity': 0.85,
                  'raster-fade-duration': 0,
                }}
              />
            </Source>
            
            {/* Centered Modal Popup for item details - rendered outside map */}
            
            {/* Phase 1 Center Circle (4km radius) */}
            <Source
              id="phase1-circle"
              type="geojson"
              data={{
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: toMapboxCoordinates(PHASE_1_CENTER.lat, PHASE_1_CENTER.lng)
                },
                properties: {}
              }}
            >
              <Layer
                id="phase1-circle-layer"
                type="circle"
                paint={{
                  'circle-radius': 4000,
                  'circle-color': '#7C3AED',
                  'circle-opacity': 0.1,
                  'circle-stroke-color': '#7C3AED',
                  'circle-stroke-width': 2
                }}
              />
            </Source>

            {/* Domain Polygons and Markers */}
            {showDomains && filteredDomains.map(domain => {
              const domainData = domain.latitude && domain.longitude ? generateDomainPolygon(domain) : null;
              const coords = findFallbackLocation(domain, 'domain');

              if (!coords) {
                return null;
              }
              
              return (
                <React.Fragment key={`domain-${domain._id}`}>
                  {showBoundaries && domainData?.polygon && (
                    <Source
                      id={`domain-polygon-${domain._id}`}
                      type="geojson"
                      data={domainData.polygon}
                    >
                      <Layer
                        id={`domain-polygon-layer-${domain._id}`}
                        type="fill"
                        paint={{
                          'fill-color': '#7C3AED',
                          'fill-opacity': 0.1,
                          'fill-outline-color': '#7C3AED',
                          'fill-outline-width': 2
                        }}
                      />
                    </Source>
                  )}
                </React.Fragment>
              );
            })}

            {/* Domain Markers - GeoJSON Source with Symbol Layer */}
            {(() => {
              if (!showDomains) return null;
              
              // Use filteredDomains when filtering by plot to ensure domain shows
              const domainsToUse = filterPlot !== 'all' ? filteredDomains : visibleMarkers.domains;
              
              const domainMarkers = domainsToUse.map(domain => {
                const coords = findFallbackLocation(domain, 'domain');
                if (!coords) return null;
                return {
                  ...domain,
                  longitude: domain.longitude || coords[0],
                  latitude: domain.latitude || coords[1],
                };
              }).filter(Boolean);

              // Add emojis to domain markers for display
              const domainMarkersWithEmoji = domainMarkers.map(domain => ({
                ...domain,
                displayName: `🏛️ ${domain.name}`
              }));

              const domainGeoJson = buildGeoJson(domainMarkersWithEmoji, 'domain');
              
              if (domainGeoJson.features.length === 0) return null;
              
              // Use key to force source update when filtering
              const domainSourceKey = `domains-source-${filterPlot}-${filterDomain}-${domainMarkers.length}`;
              
              return (
                <Source
                  key={domainSourceKey}
                  id="domains-source"
                  type="geojson"
                  data={domainGeoJson}
                >
                  <Layer
                    id="domains-layer"
                    type="circle"
                    paint={{
                      'circle-radius': 20,
                      'circle-color': getMarkerColor('domain'),
                      'circle-stroke-width': 3,
                      'circle-stroke-color': '#ffffff',
                    }}
                  />
                  <Layer
                    id="domains-labels"
                    type="symbol"
                    minzoom={11}
                    layout={{
                      'text-field': ['get', 'displayName'],
                      'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
                      'text-size': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        11, 14,
                        13, 16,
                        15, 18
                      ],
                      'text-offset': [0, 1.8],
                      'text-anchor': 'top',
                      'text-allow-overlap': true,
                      'text-ignore-placement': false
                    }}
                    paint={{
                      'text-color': '#000000',
                      'text-halo-color': '#ffffff',
                      'text-halo-width': 4,
                      'text-halo-blur': 0
                    }}
                  />
                </Source>
              );
            })()}

            {/* Plot Boundaries - Combined into single GeoJSON source for performance */}
            {(() => {
              if (!showPlots || !showBoundaries || viewState.zoom < ZOOM_THRESHOLDS.SHOW_PLOTS) return null;
              
              const plotsWithCoords = filteredPlots.filter(plot => plot.latitude && plot.longitude);
              
              const boundaryFeatures = plotsWithCoords
                .map(plot => {
                  const polygonCoords = generatePlotBoundaryFromSize(plot);
                  if (!polygonCoords) {
                    return null;
                  }
                  return {
                    type: 'Feature',
                    geometry: {
                      type: 'Polygon',
                      coordinates: [polygonCoords],
                    },
                    properties: { plotId: plot._id, plotName: plot.name },
                  };
                })
                .filter(Boolean);
              
              if (boundaryFeatures.length === 0) return null;
              
              const boundariesGeoJson = {
                type: 'FeatureCollection',
                features: boundaryFeatures,
              };
              
              return (
                <Source
                  id="plot-boundaries-source"
                  type="geojson"
                  data={boundariesGeoJson}
                >
                  <Layer
                    id="plot-boundaries-fill"
                    type="fill"
                    paint={{
                      'fill-color': '#ddecff',
                      'fill-opacity': 0.18,
                    }}
                  />
                  <Layer
                    id="plot-boundaries-line"
                    type="line"
                    paint={{
                      'line-color': '#1e40af',
                      'line-width': 2.5,
                    }}
                  />
                </Source>
              );
            })()}

            {/* Plot Markers - Separate GeoJSON Source (like Domains) */}
            {(() => {
              if (!showPlots || viewState.zoom < ZOOM_THRESHOLDS.SHOW_PLOTS || filteredPlots.length === 0) return null;
              
              // Use filteredPlots to respect filtering
              const plotMarkers = filteredPlots
                .filter(plot => {
                  // Don't filter plots by domain boundary for markers - show all plots with coordinates
                  // Domain boundary filtering is only for boundary visualization
                  return true;
                })
                .map(plot => {
                  // Try multiple methods to find plot coordinates
                  const plotDomainId = plot.domainId?._id || plot.domainId;
                  const domain = filteredDomains.find(d => d._id === plotDomainId);
                  const layoutPlot = matchFarmLayoutEntity(plot, 'plot', domain);
                  const polygonCoords = layoutPlot?.polygonLngLat;
                  const topAnchorCoords = polygonCoords ? getPolygonTopAnchor(polygonCoords) : null;
                  const layoutCentroid = layoutPlot?.centroid;
                  const fallbackCoords = findFallbackLocation(plot, 'plot');
                  const hasDirectCoordinates = plot.latitude && plot.longitude;
                  
                  // Priority: direct coordinates > fallback > layoutCentroid > topAnchor
                  const displayCoords =
                    (hasDirectCoordinates ? [plot.longitude, plot.latitude] : null) ||
                    fallbackCoords ||
                    layoutCentroid ||
                    topAnchorCoords;

                  if (!displayCoords) {
                    // If plot is in filtered list but has no coordinates, try to use domain center as fallback
                    if (filterPlot !== 'all') {
                      const plotDomainId = plot.domainId?._id || plot.domainId;
                      const domain = filteredDomains.find(d => d._id === plotDomainId);
                      if (domain) {
                        const domainCoords = findFallbackLocation(domain, 'domain');
                        if (domainCoords) {
                          console.warn(`Plot "${plot.name}" has no coordinates, using domain center as fallback`);
                          return {
                            ...plot,
                            longitude: domainCoords[0],
                            latitude: domainCoords[1],
                          };
                        }
                      }
                    }
                    console.warn(`Plot "${plot.name}" has no coordinates or fallback`, {
                      plotId: plot._id,
                      plotName: plot.name,
                      hasLayoutPlot: !!layoutPlot,
                      hasPolygonCoords: !!polygonCoords,
                      hasDirectCoordinates
                    });
                    return null;
                  }

                  return {
                    ...plot,
                    longitude: displayCoords[0],
                    latitude: displayCoords[1],
                  };
                })
                .filter(Boolean);

              // Add emojis to plot markers for display
              const plotMarkersWithEmoji = plotMarkers.map(plot => ({
                ...plot,
                displayName: `📍 ${plot.name}`
              }));

              const plotGeoJson = buildGeoJson(plotMarkersWithEmoji, 'plot');
              
              if (plotGeoJson.features.length === 0) return null;
              
              // Use key to force source update when filtering
              const plotSourceKey = `plots-source-${filterPlot}-${filterDomain}-${plotMarkers.length}`;
              
              return (
                <Source
                  key={plotSourceKey}
                  id="plots-source"
                  type="geojson"
                  data={plotGeoJson}
                >
                  <Layer
                    id="plots-layer"
                    type="circle"
                    beforeId="domains-layer"
                    paint={{
                      'circle-radius': 15,
                      'circle-color': getMarkerColor('plot'),
                      'circle-stroke-width': 3,
                      'circle-stroke-color': '#ffffff',
                    }}
                  />
                  <Layer
                    id="plots-labels"
                    type="symbol"
                    beforeId="domains-layer"
                    minzoom={8}
                    layout={{
                      'text-field': ['get', 'displayName'],
                      'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
                      'text-size': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        8, 10,
                        10, 11,
                        11, 12,
                        13, 13,
                        15, 14,
                        17, 16
                      ],
                      'text-offset': [0, 1.8],
                      'text-anchor': 'top',
                      'text-allow-overlap': true,
                      'text-ignore-placement': false
                    }}
                    paint={{
                      'text-color': '#000000',
                      'text-halo-color': '#ffffff',
                      'text-halo-width': 4,
                      'text-halo-blur': 0
                    }}
                  />
                </Source>
              );
            })()}

            {/* Plant Markers - GeoJSON Source with Clustering */}
            {(() => {
              if (!showPlants || viewState.zoom < ZOOM_THRESHOLDS.SHOW_PLANTS || filteredPlants.length === 0) return null;
              
              const plantMarkers = filteredPlants
                .map(plant => {
                  const hasDirectCoordinates = plant.latitude && plant.longitude;
                  
                  if (hasDirectCoordinates) {
                    return {
                      ...plant,
                      longitude: plant.longitude,
                      latitude: plant.latitude
                    };
                  } else {
                    // Plant has no coordinates, try to use plot center as fallback
                    const plantPlotId = plant.plotId?._id || plant.plotId;
                    // Search ALL plots for fallback
                    const plot = plots.find(p => p._id === plantPlotId) || filteredPlots.find(p => p._id === plantPlotId);
                    
                    if (plot && plot.latitude && plot.longitude) {
                      return {
                        ...plant,
                        longitude: plot.longitude,
                        latitude: plot.latitude
                      };
                    }
                    return null;
                  }
                })
                .filter(Boolean);


              // Add emojis to plant markers for display
              const plantMarkersWithEmoji = plantMarkers.map(plant => {
                // Use emoji from DB if available, otherwise use findPlantEmoji
                const emoji = plant.emoji || findPlantEmoji(plant.type || plant.variety || plant.name, plant.category);
                return {
                  ...plant,
                  emoji: emoji,
                  displayName: `${emoji} ${plant.name}`
                };
              });

              if (plantMarkersWithEmoji.length === 0) return null;
              
              
              // Build GeoJSON for clustered rendering
              const plantGeoJson = {
                type: 'FeatureCollection',
                features: plantMarkersWithEmoji.map(plant => ({
                  type: 'Feature',
                  properties: {
                    id: plant._id,
                    name: plant.name,
                    displayName: plant.displayName,
                    emoji: plant.emoji || '🌱',
                    plantType: plant.type,
                    category: plant.category,
                    variety: plant.variety,
                    health: plant.health,
                    type: 'plant'  // This is the marker type for click handling
                  },
                  geometry: {
                    type: 'Point',
                    coordinates: [plant.longitude, plant.latitude]
                  }
                }))
              };
              
              const plantSourceKey = `plants-source-${filterPlot}-${filterDomain}-${plantMarkers.length}`;
              
              return (
                <Source
                  key={plantSourceKey}
                  id="plants-source"
                  type="geojson"
                  data={plantGeoJson}
                  cluster={true}
                  clusterMaxZoom={17}
                  clusterRadius={40}
                >
                  {/* Clustered circles */}
                  <Layer
                    id="plants-clusters"
                    type="circle"
                    filter={['has', 'point_count']}
                    paint={{
                      'circle-color': [
                        'step',
                        ['get', 'point_count'],
                        UI_COLORS.cluster.small,
                        10, UI_COLORS.cluster.medium,
                        50, UI_COLORS.cluster.large
                      ],
                      'circle-radius': [
                        'step',
                        ['get', 'point_count'],
                        18,
                        10, 24,
                        50, 32
                      ],
                      'circle-stroke-width': 3,
                      'circle-stroke-color': '#ffffff'
                    }}
                  />
                  {/* Cluster count labels */}
                  <Layer
                    id="plants-cluster-count"
                    type="symbol"
                    filter={['has', 'point_count']}
                    layout={{
                      'text-field': ['get', 'point_count_abbreviated'],
                      'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
                      'text-size': 16,
                      'text-allow-overlap': true
                    }}
                    paint={{
                      'text-color': '#ffffff'
                    }}
                  />
                  {/* Individual plant markers hidden - using HTML markers instead */}
                  <Layer
                    id="plants-layer"
                    type="circle"
                    filter={['!', ['has', 'point_count']]}
                    paint={{
                      'circle-radius': 0,
                      'circle-color': 'transparent'
                    }}
                  />
                  {/* Plant labels at high zoom */}
                  <Layer
                    id="plants-labels"
                    type="symbol"
                    filter={['!', ['has', 'point_count']]}
                    minzoom={17}
                    layout={{
                      'text-field': ['get', 'name'],
                      'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
                      'text-size': 13,
                      'text-offset': [0, 2],
                      'text-anchor': 'top',
                      'text-allow-overlap': false
                    }}
                    paint={{
                      'text-color': '#000000',
                      'text-halo-color': '#ffffff',
                      'text-halo-width': 2.5
                    }}
                  />
                </Source>
              );
            })()}

            {/* HTML Markers for individual plants with emojis - only at high zoom, limited for performance */}
            {showPlants && viewState.zoom >= 18 && (() => {
              // Only render markers in current viewport, max 100 for performance
              const bounds = mapInstanceRef.current?.getBounds();
              let visiblePlants = plantMarkersWithEmoji;
              if (bounds) {
                visiblePlants = plantMarkersWithEmoji.filter(p => 
                  p.longitude >= bounds.getWest() && p.longitude <= bounds.getEast() &&
                  p.latitude >= bounds.getSouth() && p.latitude <= bounds.getNorth()
                );
              }
              return visiblePlants.slice(0, 100).map(plant => (
                <Marker
                  key={plant._id}
                  longitude={plant.longitude}
                  latitude={plant.latitude}
                  anchor="bottom"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    setSelectedItem({ type: 'plant', data: plant });
                    setPopupLocation([plant.longitude, plant.latitude]);
                  }}
                >
                  <div className="flex flex-col items-center cursor-pointer">
                    <span style={{ fontSize: '24px' }}>{plant.emoji || '🌱'}</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full border border-white shadow-sm"></div>
                  </div>
                </Marker>
              ));
            })()}

          </Map>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-700">
              <div className="text-center">
                <div className="text-lg text-gray-600 dark:text-gray-400 mb-2">Initializing map...</div>
                <div className="text-sm text-gray-500 dark:text-gray-500">
                  Loading: {loading ? 'Yes' : 'No'}, Error: {error ? 'Yes' : 'No'}, MapReady: {mapReady ? 'Yes' : 'No'}
                </div>
                {error && (
                  <div className="text-sm text-red-600 dark:text-red-400 mt-2">
                    Error: {error.message || error}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* No Data Message */}
      {filteredDomains.length === 0 && filteredPlots.length === 0 && filteredPlants.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No markers found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {hasActiveFilters
              ? 'No markers found for the selected filters. Try adjusting your search criteria or filters.'
              : 'No location data available. Add coordinates to your domains, plots, and plants to see them on the map.'
            }
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="btn-secondary"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Legend</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs" style={{ backgroundColor: '#7C3AED' }}>🏢</div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Domains (rectangular boundaries)</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs" style={{ backgroundColor: '#2563EB' }}>🏞️</div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Plots (rectangular boundaries)</span>
          </div> 
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 flex items-center justify-center text-lg">🌱</div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Plants (shown with plant-specific emojis)</span>
          </div>
        </div>
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <strong>Boundary Types:</strong> Purple = domains, Blue = plots with size, Gray dashed = default plots (10,000 sq ft placeholder)
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            <strong>Area Units:</strong> All areas displayed in square feet (sq ft)
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{filteredDomains.filter(d => d.latitude && d.longitude).length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Domains with Location</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{filteredPlots.filter(p => p.latitude && p.longitude).length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Plots with Location</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{filteredPlants.filter(p => p.latitude && p.longitude).length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Plants with Location</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{filteredDomains.length + filteredPlots.length + filteredPlants.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Items</div>
          </div>
        </div>
        
        {/* Boundary Information */}
        {/* <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Boundary Information</h4>
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <p><strong>Domains:</strong> Purple rectangular boundaries show actual domain size from database</p>
            <p><strong>Plots:</strong> Blue rectangular boundaries show actual plot size, gray dashed for default 10,000 sq ft placeholders</p>
            <p><strong>Plants:</strong> Must be placed within plot boundaries</p>
          </div>
        </div> */}
      </div>

    </div>

      {/* Centered Modal Popup for item details - outside map container */}
      {selectedItem && popupLocation && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 9999
          }}
          onClick={handlePopupClose}
        >
          <div 
            style={{
              width: '320px',
              height: '450px',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative',
              backgroundColor: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handlePopupClose}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'rgba(0,0,0,0.5)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100
              }}
            >
              <X style={{ width: '18px', height: '18px', color: '#fff' }} />
            </button>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {renderPopupContent(selectedItem.type, selectedItem.data)}
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default MapViewMapbox;
