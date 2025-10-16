import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Map, NavigationControl, Source, Layer, Marker, Popup, GeolocateControl } from 'react-map-gl/mapbox';
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
import * as turf from '@turf/turf';
import 'mapbox-gl/dist/mapbox-gl.css';

// Utility function to ensure marker colors are applied correctly
const applyMarkerColors = () => {
  // Apply colors to legend dots
  const legendDots = document.querySelectorAll('.marker-legend-dot');
  legendDots.forEach(dot => {
    if (dot.classList.contains('domain')) {
      dot.style.backgroundColor = '#7C3AED';
    } else if (dot.classList.contains('plot')) {
      dot.style.backgroundColor = '#2563EB';
    } else if (dot.classList.contains('plant')) {
      dot.style.backgroundColor = '#059669';
    } else if (dot.classList.contains('boundary')) {
      dot.style.backgroundColor = '#9333EA';
    }
  });

  // Apply colors to map markers
  const mapMarkers = document.querySelectorAll('.marker-circle');
  mapMarkers.forEach(marker => {
    const markerType = marker.getAttribute('data-marker-type');
    const markerColor = marker.getAttribute('data-marker-color');
    
    if (markerType === 'domain') {
      marker.style.backgroundColor = '#7C3AED';
    } else if (markerType === 'plot') {
      marker.style.backgroundColor = '#2563EB';
    } else if (markerType === 'plant') {
      marker.style.backgroundColor = '#059669';
    }
    
    // Also update the label below the marker
    const markerContainer = marker.closest('.flex.flex-col.items-center');
    if (markerContainer) {
      const label = markerContainer.querySelector('.marker-label');
      if (label && markerColor) {
        label.style.backgroundColor = markerColor;
        label.style.color = 'white';
        label.style.opacity = '0.9';
        label.style.setProperty('--marker-color', markerColor);
        
        // Add the specific marker type class
        label.className = label.className.replace(/marker-label-\w+/g, `marker-label-${markerType}`);
      }
    }
  });
};

// Custom marker component
const CustomMarker = ({ item, type, onClick, children }) => {
  // Define colors directly to ensure they work
  const colorMap = {
    domain: '#7C3AED',    // Rich purple shade
    plot: '#2563EB',      // Deep blue shade
    plant: '#059669'      // Rich green shade
  };
  const color = colorMap[type] || '#666';
  
  const sizes = {
    small: { width: 30, height: 30, fontSize: 12 },
    medium: { width: 40, height: 40, fontSize: 16 },
    large: { width: 50, height: 50, fontSize: 20 }
  };
  
  const size = type === 'domain' ? 'large' : type === 'plot' ? 'medium' : 'small';
  const { width, height, fontSize } = sizes[size];
  
  const emojis = {
    domain: '🏢',
    plot: '🏞️',
    plant: '🌱'
  };
  
  return (
    <Marker
      longitude={item.longitude}
      latitude={item.latitude}
      anchor="bottom"
      onClick={onClick}
    >
      <div className="flex flex-col items-center">
        <div
          style={{
            '--marker-color': color,
            backgroundColor: color,
            border: '3px solid white',
            borderRadius: '50%',
            width: `${width}px`,
            height: `${height}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${fontSize}px`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
          className={`marker-circle marker-${type} mapbox-marker-${type}`}
          data-marker-type={type}
          data-marker-color={color}
        >
          {type === 'plant' 
            ? findPlantEmoji(item.type, item.category) 
            : (item.image || emojis[type])
          }
        </div>
        {/* Name label below marker */}
        <div 
          className={`mt-1 px-2 py-1 text-xs rounded shadow-lg whitespace-nowrap max-w-32 marker-label marker-label-${type}`}
          style={{
            fontSize: type === 'domain' ? '11px' : type === 'plot' ? '10px' : '9px',
            fontWeight: '500',
            backgroundColor: color,
            color: 'white',
            opacity: 0.9,
            '--marker-color': color
          }}
        >
          {item.name || `${type.charAt(0).toUpperCase() + type.slice(1)} ${item._id?.slice(-4) || ''}`}
        </div>
      </div>
      {children}
    </Marker>
  );
};

function MapViewMapbox({ user, selectedState }) {
  const { mapViewPlants } = useMapView();
  const { 
    plots, 
    domains, 
    organizations,
    loading, 
    error 
  } = useApi();
  
  const [searchParams] = useSearchParams();

  const mapRef = useRef();
  const filteringInProgress = useRef(false);
  
  // Map state
  const [viewState, setViewState] = useState({
    longitude: MAPBOX_CONFIG.defaultCenter[0],
    latitude: MAPBOX_CONFIG.defaultCenter[1],
    zoom: MAPBOX_CONFIG.defaultZoom
  });
  
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
  
  // Collapsible sections state
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [layersExpanded, setLayersExpanded] = useState(false);

  // Apply marker colors when component mounts and updates
  useEffect(() => {
    const timer = setTimeout(() => {
      applyMarkerColors();
    }, 100); // Small delay to ensure DOM is ready
    
    return () => clearTimeout(timer);
  }, [mapViewPlants, plots, domains]);

  // Initialize filters from URL parameters
  useEffect(() => {
    if (!urlParamsInitialized) {
      const healthParam = searchParams.get('health');
      const typeParam = searchParams.get('type');
      const domainParam = searchParams.get('domain');
      const plotParam = searchParams.get('plot');
      const categoryParam = searchParams.get('category');
      const varietyParam = searchParams.get('variety');
      
      console.log('MapView: URL params:', { healthParam, typeParam, domainParam, plotParam, categoryParam, varietyParam });
      
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
  
  // Layer visibility - MOVED TO TOP BEFORE ANY REFERENCES
  const [showDomains, setShowDomains] = useState(true);
  const [showPlots, setShowPlots] = useState(true);
  const [showPlants, setShowPlants] = useState(true);
  const [showBoundaries, setShowBoundaries] = useState(true);
  
  // Filtered data
  const [filteredDomains, setFilteredDomains] = useState([]);
  const [filteredPlots, setFilteredPlots] = useState([]);
  const [filteredPlants, setFilteredPlants] = useState([]);
  
  // Selected item state for popup
  const [selectedItem, setSelectedItem] = useState(null);
  const [popupLocation, setPopupLocation] = useState(null);

  // Map ready state for conditional rendering
  const [mapReady, setMapReady] = useState(false);

  // Component mount logging
  useEffect(() => {
    console.log('MapViewMapbox - Component mounted');
  }, []);

  // Debug logging for raw data
  useEffect(() => {
    if (!loading && !error) {
      console.log("Domains Raw:", domains);
      console.log("Plots Raw:", plots);
      console.log("Plants Raw:", mapViewPlants);
      
      // Check for missing coordinates and plot sizes
      domains?.forEach(domain => {
        if (!domain.latitude || !domain.longitude) {
          console.warn("Skipping domain, missing lat/lng:", domain);
        }
      });
      
      plots?.forEach(plot => {
        if (!plot.latitude || !plot.longitude) {
          console.warn("Skipping plot, missing lat/lng:", plot);
        } else {
          console.log(`Plot "${plot.name}": lat=${plot.latitude}, lng=${plot.longitude}, size=${plot.size || 'undefined'}`);
        }
      });
      
      mapViewPlants?.forEach(plant => {
        if (!plant.latitude || !plant.longitude) {
          console.warn("Skipping plant, missing lat/lng:", plant);
        }
      });
    }
  }, [domains, plots, mapViewPlants, loading, error]);

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

  // Check marker rendering
  useEffect(() => {
    if (mapReady && !loading) {
      const totalMarkers = filteredDomains.length + filteredPlots.length + filteredPlants.length;
      if (totalMarkers === 0) {
        console.warn("No markers rendered, check API data or filters");
      } else {
        console.log(`Rendering ${totalMarkers} markers:`, {
          domains: filteredDomains.length,
          plots: filteredPlots.length,
          plants: filteredPlants.length
        });
      }
    }
  }, [filteredDomains, filteredPlots, filteredPlants, mapReady, loading]);




  // Helper function to check if plot is within domain boundary using rectangular boundaries
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
    
    console.log(`Plot "${plot.name}" within domain "${domain.name}": ${isWithin}`);
    return isWithin;
  };

  // Helper function to check if plant is within plot boundary
  const isPlantWithinPlot = (plant, plot) => {
    if (!plant.latitude || !plant.longitude || !plot.latitude || !plot.longitude) {
      return false;
    }
    
    const distance = calculateDistance(plot.latitude, plot.longitude, plant.latitude, plant.longitude);
    const plotRadius = plot.size ? Math.sqrt(plot.size / Math.PI) : 0;
    
    console.log(`Plant "${plant.name}" distance from plot "${plot.name}": ${distance.toFixed(1)}m, Plot radius: ${plotRadius.toFixed(1)}m`);
    
    return plotRadius > 0 && distance <= plotRadius;
  };

  // Popup content renderer
  const renderPopupContent = (type, data) => {
    switch (type) {
      case 'plant':
        return (
          <div className="popup-content-wrapper">
            <div className="popup-content">
            {/* Header */}
            <div className="popup-header">
              <div className="popup-icon bg-green-500">
                {findPlantEmoji(data.type, data.category)}
              </div>
              <div className="popup-title-section">
                <h3 className="popup-title">{data.name}</h3>
                <p className="popup-subtitle">Plant Details</p>
              </div>
            </div>
            
            {/* Content */}
            <div className="popup-body">
              <div className="popup-section">
                <div className="popup-item">
                  <Leaf className="popup-item-icon text-green-600" />
                  <div className="popup-item-content">
                    <span className="popup-item-label">Plant Type</span>
                    <span className="popup-item-value">{data.type || 'N/A'}</span>
                  </div>
                </div>
                
                <div className="popup-item">
                  <Sprout className="popup-item-icon text-green-600" />
                  <div className="popup-item-content">
                    <span className="popup-item-label">Variety</span>
                    <span className="popup-item-value">{data.variety || 'N/A'}</span>
                  </div>
                </div>
                
                <div className="popup-item">
                  <div className="popup-item-icon">
                    <div className={`w-3 h-3 rounded-full ${
                      data.health === 'Good' ? 'bg-green-500' :
                      data.health === 'Fair' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></div>
                  </div>
                  <div className="popup-item-content">
                    <span className="popup-item-label">Health Status</span>
                    <span className={`popup-item-value font-medium ${
                      data.health === 'Good' ? 'text-green-600' :
                      data.health === 'Fair' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>{data.health || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              <div className="popup-section">
                <div className="popup-item">
                  <UserIcon className="popup-item-icon text-blue-600" />
                  <div className="popup-item-content">
                    <span className="popup-item-label">Created By</span>
                    <span className="popup-item-value">{data.createdBy?.name || data.planter || 'N/A'}</span>
                  </div>
                </div>
                
                <div className="popup-item">
                  <Calendar className="popup-item-icon text-blue-600" />
                  <div className="popup-item-content">
                    <span className="popup-item-label">Planted Date</span>
                    <span className="popup-item-value">
                      {data.plantedDate ? new Date(data.plantedDate).toLocaleDateString() : 
                       data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
                
                <div className="popup-item">
                  <MapPin className="popup-item-icon text-blue-600" />
                  <div className="popup-item-content">
                    <span className="popup-item-label">Plot Location</span>
                    <span className="popup-item-value">{getPlotName(data.plotId) || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              {/* Additional Details */}
              {(data.category || data.growthStage || data.notes) && (
                <div className="popup-section">
                  {data.category && (
                    <div className="popup-item">
                      <div className="popup-item-icon">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      </div>
                      <div className="popup-item-content">
                        <span className="popup-item-label">Category</span>
                        <span className="popup-item-value">{data.category}</span>
                      </div>
                    </div>
                  )}
                  
                  {data.growthStage && (
                    <div className="popup-item">
                      <div className="popup-item-icon">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      </div>
                      <div className="popup-item-content">
                        <span className="popup-item-label">Growth Stage</span>
                        <span className="popup-item-value">{data.growthStage}</span>
                      </div>
                    </div>
                  )}
                  
                  {data.notes && (
                    <div className="popup-item">
                      <div className="popup-item-icon">
                        <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                      </div>
                      <div className="popup-item-content">
                        <span className="popup-item-label">Notes</span>
                        <span className="popup-item-value text-xs">{data.notes}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            </div>
          </div>
        );

      case 'plot':
        return (
          <div className="popup-content-wrapper">
            <div className="popup-content">
            {/* Header */}
            <div className="popup-header">
              <div className="popup-icon bg-blue-500">🏞️</div>
              <div className="popup-title-section">
                <h3 className="popup-title">{data.name}</h3>
                <p className="popup-subtitle">Plot Details</p>
              </div>
            </div>
            
            {/* Content */}
            <div className="popup-body">
              <div className="popup-section">
                <div className="popup-item">
                  <Ruler className="popup-item-icon text-blue-600" />
                  <div className="popup-item-content">
                    <span className="popup-item-label">Plot Size</span>
                    <span className="popup-item-value">{data.size ? `${data.size} sq ft` : 'N/A'}</span>
                  </div>
                </div>
                
                <div className="popup-item">
                  <Building className="popup-item-icon text-blue-600" />
                  <div className="popup-item-content">
                    <span className="popup-item-label">Domain</span>
                    <span className="popup-item-value">{getDomainName(data.domainId) || 'N/A'}</span>
                  </div>
                </div>
                
                <div className="popup-item">
                  <div className="popup-item-icon">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  </div>
                  <div className="popup-item-content">
                    <span className="popup-item-label">Soil Type</span>
                    <span className="popup-item-value">{data.soilType || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              <div className="popup-section">
                <div className="popup-item">
                  <UserIcon className="popup-item-icon text-blue-600" />
                  <div className="popup-item-content">
                    <span className="popup-item-label">Created By</span>
                    <span className="popup-item-value">{data.createdBy?.name || 'N/A'}</span>
                  </div>
                </div>
                
                <div className="popup-item">
                  <Calendar className="popup-item-icon text-blue-600" />
                  <div className="popup-item-content">
                    <span className="popup-item-label">Created Date</span>
                    <span className="popup-item-value">
                      {data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
                
                <div className="popup-item">
                  <MapPin className="popup-item-icon text-blue-600" />
                  <div className="popup-item-content">
                    <span className="popup-item-label">Organization</span>
                    <span className="popup-item-value">{getOrganizationName(data.organizationId) || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              {/* Additional Details */}
              {(data.description || data.cropType) && (
                <div className="popup-section">
                  {data.description && (
                    <div className="popup-item">
                      <div className="popup-item-icon">
                        <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                      </div>
                      <div className="popup-item-content">
                        <span className="popup-item-label">Description</span>
                        <span className="popup-item-value text-xs">{data.description}</span>
                      </div>
                    </div>
                  )}
                  
                  {data.cropType && (
                    <div className="popup-item">
                      <div className="popup-item-icon">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      </div>
                      <div className="popup-item-content">
                        <span className="popup-item-label">Crop Type</span>
                        <span className="popup-item-value">{data.cropType}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            </div>
          </div>
        );

      case 'domain':
        return (
          <div className="popup-content-wrapper">
            <div className="popup-content">
            {/* Header */}
            <div className="popup-header">
              <div className="popup-icon bg-purple-500">🏢</div>
              <div className="popup-title-section">
                <h3 className="popup-title">{data.name}</h3>
                <p className="popup-subtitle">Domain Details</p>
              </div>
            </div>
            
            {/* Content */}
            <div className="popup-body">
              <div className="popup-section">
                <div className="popup-item">
                  <Ruler className="popup-item-icon text-purple-600" />
                  <div className="popup-item-content">
                    <span className="popup-item-label">Domain Size</span>
                    <span className="popup-item-value">{data.size ? `${data.size} sq ft` : 'N/A'}</span>
                  </div>
                </div>
                
                <div className="popup-item">
                  <Building className="popup-item-icon text-purple-600" />
                  <div className="popup-item-content">
                    <span className="popup-item-label">Organization</span>
                    <span className="popup-item-value">{getOrganizationName(data.organizationId) || 'N/A'}</span>
                  </div>
                </div>
                
                <div className="popup-item">
                  <MapPin className="popup-item-icon text-purple-600" />
                  <div className="popup-item-content">
                    <span className="popup-item-label">Location</span>
                    <span className="popup-item-value">{data.location || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              <div className="popup-section">
                <div className="popup-item">
                  <UserIcon className="popup-item-icon text-purple-600" />
                  <div className="popup-item-content">
                    <span className="popup-item-label">Created By</span>
                    <span className="popup-item-value">{data.createdBy?.name || 'N/A'}</span>
                  </div>
                </div>
                
                <div className="popup-item">
                  <Calendar className="popup-item-icon text-purple-600" />
                  <div className="popup-item-content">
                    <span className="popup-item-label">Created Date</span>
                    <span className="popup-item-value">
                      {data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
                
                <div className="popup-item">
                  <div className="popup-item-icon">
                    <div className={`w-3 h-3 rounded-full ${data.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  </div>
                  <div className="popup-item-content">
                    <span className="popup-item-label">Status</span>
                    <span className={`popup-item-value font-medium ${data.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {data.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Additional Details */}
              {data.description && (
                <div className="popup-section">
                  <div className="popup-item">
                    <div className="popup-item-icon">
                      <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                    </div>
                    <div className="popup-item-content">
                      <span className="popup-item-label">Description</span>
                      <span className="popup-item-value text-xs">{data.description}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Helper functions
  const getOrganizationName = (orgId) => {
    // Handle both string and object orgId
    const orgIdStr = orgId?._id || orgId;
    if (!orgIdStr) return 'No Organization Assigned';
    
    const org = organizations.find(o => o._id === orgIdStr);
    return org ? org.name : 'Unknown Organization';
  };

  const getDomainName = (domainId) => {
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

  // Get unique plant types, varieties, and statuses from actual plant data
  const uniquePlantTypes = [...new Set(mapViewPlants.map(plant => plant.type).filter(Boolean))];
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

  // Filter data based on selections and location hierarchy rules
  useEffect(() => {
    if (loading || !urlParamsInitialized || filteringInProgress.current) {
      return;
    }

    // Prevent multiple simultaneous filtering operations
    filteringInProgress.current = true;
    const filterTimeout = setTimeout(() => {
      let filteredDomainsData = domains;
      let filteredPlotsData = plots;
      let filteredPlantsData = mapViewPlants;

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
      console.log('Both domain and plot filters active - plot takes precedence');
      
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
      console.log('Only plot filter active');
      
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
      console.log('Only domain filter active');
      
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
      
      console.log('Domain filtering debug:', {
        selectedDomain: filterDomain,
        domainPlotIds: domainPlotIds,
        totalPlantsBeforeFilter: filteredPlantsData.length
      });
      
      filteredPlantsData = filteredPlantsData.filter(p => {
        const plantPlotId = p.plotId?._id || p.plotId;
        const isIncluded = domainPlotIds.includes(String(plantPlotId));
        
        if (!isIncluded) {
          console.log(`Plant "${p.name}" excluded: plotId=${plantPlotId}, not in domain plots`);
        }
        
        return isIncluded;
      });
      
      console.log('Domain filtering result:', {
        plantsAfterFilter: filteredPlantsData.length
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

    // Calculate hasActiveFilters inside the useEffect to avoid dependency issues
    const currentHasActiveFilters = searchTerm || 
      filterOrganization !== 'all' ||
      filterType !== 'all' || 
      filterPlot !== 'all' || 
      filterDomain !== 'all' || 
      filterCategory !== 'all' || 
      filterVariety !== 'all' ||
      filterStatus !== 'all';

    console.log('MapViewMapbox - Filtered Data:', {
      filteredDomains: filteredDomainsData.length,
      filteredPlots: filteredPlotsData.length,
      filteredPlants: filteredPlantsData.length,
      userRole: user?.role,
      hasActiveFilters: currentHasActiveFilters,
      activeFilters: {
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

    // Additional debugging for domain and plot filtering
    if (filterDomain !== 'all' || filterPlot !== 'all') {
      console.log('Domain/Plot filtering summary:', {
        selectedDomain: filterDomain,
        selectedPlot: filterPlot,
        domainsInFilter: filteredDomainsData.length,
        plotsInFilter: filteredPlotsData.length,
        plantsInFilter: filteredPlantsData.length,
        plotIds: filteredPlotsData.map(p => p._id),
        plantPlotIds: filteredPlantsData.map(p => p.plotId?._id || p.plotId),
        domainNames: filteredDomainsData.map(d => d.name),
        plotNames: filteredPlotsData.map(p => p.name)
      });
    }

      setFilteredDomains(filteredDomainsData);
      setFilteredPlots(filteredPlotsData);
      setFilteredPlants(filteredPlantsData);

      // Center map to selected domain when domain filter is applied
      if (filterDomain !== 'all' && filteredDomainsData.length > 0) {
        const selectedDomain = filteredDomainsData[0];
        if (selectedDomain.latitude && selectedDomain.longitude) {
          // Calculate appropriate zoom level based on the number of plots in the domain
          let zoom = 14; // Default zoom for domain
          if (filteredPlotsData.length > 0) {
            // If there are plots, zoom in more to show them clearly
            zoom = 15;
            if (filteredPlotsData.length <= 3) {
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
      
      // Reset the filtering flag
      filteringInProgress.current = false;
    }, 100); // Small delay to prevent rapid successive calls

    // Cleanup function to cancel timeout if component unmounts or dependencies change
    return () => {
      clearTimeout(filterTimeout);
      filteringInProgress.current = false;
    };
  }, [
    domains, plots, mapViewPlants, organizations, loading, user,
    searchTerm, filterOrganization, filterType, filterPlot, filterDomain, filterCategory, filterVariety, filterStatus, urlParamsInitialized
  ]);

  // Event handlers
  const handleMarkerClick = useCallback((item, type) => {
    // Fly to marker location with appropriate zoom level
    let zoom = 16; // default zoom
    
    switch (type) {
      case 'domain':
        zoom = 13;
        break;
      case 'plot':
        zoom = 15;
        break;
      case 'plant':
        zoom = 17;
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
          center = getCenterPoint(orgDomains.map(d => [d.latitude, d.longitude]));
          center = toMapboxCoordinates(center[0], center[1]);
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
      setViewState(prev => ({
        ...prev,
        longitude: MAPBOX_CONFIG.defaultCenter[0],
        latitude: MAPBOX_CONFIG.defaultCenter[1],
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
    
    console.log(`Generating polygon for domain "${domain.name}":`, {
      domainId: domain._id,
      domainSize: domainSize,
      domainSizeSqFt: domainSize,
      hasSize: domainSize > 0
    });

    if (!domain.latitude || !domain.longitude) {
      console.warn(`Domain "${domain.name}" has no coordinates`);
      return null;
    }

    if (domainSize <= 0) {
      console.warn(`Domain "${domain.name}" has no size data`);
      return null;
    }

    // Convert square meters to square feet if needed (domain.size is in sq ft from the UI)
    const sizeInSqMeters = domainSize * 0.092903; // Convert sq ft to sq m
    
    // Calculate the side length of a square with the given area
    const sideLength = Math.sqrt(sizeInSqMeters);
    
    // Convert to degrees (approximate: 1 degree ≈ 111,000 meters)
    const sideLengthDegrees = sideLength / 111000;
    
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
        sideLength: sideLength
      }
    };

    console.log(`Successfully generated square polygon for domain "${domain.name}" with side length ${sideLength.toFixed(1)}m (${sideLengthDegrees.toFixed(6)}°)`);
    return { 
      polygon: squarePolygon, 
      radius: sideLength / 2, // Half the side length for compatibility
      sideLength: sideLength,
      sideLengthDegrees: sideLengthDegrees
    };
  };

  // Generate plot boundaries as rectangles
  const generatePlotBoundary = (plot) => {
    const plotSize = plot.size || 0;
    
    if (!plot.latitude || !plot.longitude) {
      return null;
    }

    if (plotSize <= 0) {
      // Default 50m x 50m square for plots without size
      const defaultSideLength = 50 / 111000; // 50 meters in degrees
      const halfSide = defaultSideLength / 2;
      
      return {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [plot.longitude - halfSide, plot.latitude - halfSide],
            [plot.longitude + halfSide, plot.latitude - halfSide],
            [plot.longitude + halfSide, plot.latitude + halfSide],
            [plot.longitude - halfSide, plot.latitude + halfSide],
            [plot.longitude - halfSide, plot.latitude - halfSide]
          ]]
        },
        properties: {
          name: plot.name,
          size: 2500, // 50m x 50m = 2500 sq m
          isDefault: true
        }
      };
    }

    // Convert square meters to degrees
    const sideLength = Math.sqrt(plotSize);
    const sideLengthDegrees = sideLength / 111000;
    const halfSide = sideLengthDegrees / 2;

    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [plot.longitude - halfSide, plot.latitude - halfSide],
          [plot.longitude + halfSide, plot.latitude - halfSide],
          [plot.longitude + halfSide, plot.latitude + halfSide],
          [plot.longitude - halfSide, plot.latitude + halfSide],
          [plot.longitude - halfSide, plot.latitude - halfSide]
        ]]
      },
      properties: {
        name: plot.name,
        size: plotSize,
        isDefault: false
      }
    };
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
                      ...uniquePlantTypes.map(type => ({ value: type, label: type }))
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
              ref={mapRef}
              {...viewState}
              onMove={evt => setViewState(evt.viewState)}
              onClick={handleMapClick}
              style={{ width: '100%', height: '100%', zIndex: 0 }}
              mapStyle={getMapStyle(mapStyle)}
              mapboxAccessToken={MAPBOX_CONFIG.accessToken}
              onLoad={() => {
                // Apply marker colors after map loads
                setTimeout(() => {
                  applyMarkerColors();
                }, 200);
              }}
              onError={(e) => {}}
            >
            <NavigationControl position="top-left" />
            <GeolocateControl position="top-left" />
            
            {/* Popup for item details */}
            {selectedItem && popupLocation && (
              <Popup
                longitude={popupLocation[0]}
                latitude={popupLocation[1]}
                onClose={handlePopupClose}
                closeButton={true}
                closeOnClick={false}
                anchor="center"
                offset={[0, 0]}
                className="mapbox-popup"
                maxWidth="320px"
                minWidth="280px"
              >
                {renderPopupContent(selectedItem.type, selectedItem.data)}
              </Popup>
            )}
            
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

            {/* Domain Polygons with Total Plot Area Radius */}
            {showDomains && filteredDomains
              .filter(domain => domain.latitude && domain.longitude)
              .map(domain => {
                const domainData = generateDomainPolygon(domain);
                
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
                    <CustomMarker
                      item={domain}
                      type="domain"
                      onClick={() => handleMarkerClick(domain, 'domain')}
                    />
                  </React.Fragment>
                );
              })}

            {/* Plot Markers with actual plot area radius - only within domain boundaries */}
            {showPlots && filteredPlots
              .filter(plot => plot.latitude && plot.longitude)
              .map(plot => {
                // Find the domain this plot belongs to
                const plotDomainId = plot.domainId?._id || plot.domainId;
                const domain = filteredDomains.find(d => d._id === plotDomainId);
                
                // Check if plot is within domain boundary
                const withinDomain = domain ? isPlotWithinDomain(plot, domain) : true;
                
                if (!withinDomain) {
                  console.warn(`Plot "${plot.name}" is outside domain "${domain?.name}" boundary - skipping`);
                  return null;
                }
                
                // Generate plot boundary as rectangle
                const plotBoundary = generatePlotBoundary(plot);
                
                // Debug logging for plot boundary calculation
                console.log(`Plot "${plot.name}": Area=${plot.size || 0} sq ft, HasBoundary=${!!plotBoundary}, WithinDomain=${withinDomain}`);
                
                return (
                  <React.Fragment key={`plot-${plot._id}`}>
                    {showBoundaries && plotBoundary && (
                      <Source
                        id={`plot-boundary-${plot._id}`}
                        type="geojson"
                        data={plotBoundary}
                      >
                        <Layer
                          id={`plot-boundary-layer-${plot._id}`}
                          type="fill"
                          paint={{
                            'fill-color': plotBoundary.properties.isDefault ? '#6B7280' : '#2563EB',
                            'fill-opacity': plotBoundary.properties.isDefault ? 0.05 : 0.08,
                            'fill-outline-color': plotBoundary.properties.isDefault ? '#6B7280' : '#2563EB',
                            'fill-outline-width': plotBoundary.properties.isDefault ? 1 : 2,
                            'fill-outline-dasharray': plotBoundary.properties.isDefault ? [5, 5] : [0]
                          }}
                        />
                      </Source>
                    )}
                    <CustomMarker
                      item={plot}
                      type="plot"
                      onClick={() => handleMarkerClick(plot, 'plot')}
                    />
                  </React.Fragment>
                );
              })}

            {/* Plant Markers - only within plot boundaries */}
            {showPlants && filteredPlants
              .filter(plant => plant.latitude && plant.longitude)
              .map(plant => {
                // Find the plot this plant belongs to
                const plantPlotId = plant.plotId?._id || plant.plotId;
                const plot = filteredPlots.find(p => p._id === plantPlotId);
                
                // If no plot found in filtered plots, skip this plant
                if (!plot) {
                  console.warn(`Plant "${plant.name}" has plotId ${plantPlotId} but plot not found in filtered plots`);
                  return null;
                }
                
                // Check if plant is within plot boundary
                const withinPlot = isPlantWithinPlot(plant, plot);
                
                if (!withinPlot) {
                  console.warn(`Plant "${plant.name}" is outside plot "${plot.name}" boundary - skipping`);
                  return null;
                }
                
                console.log(`Plant "${plant.name}": WithinPlot=${withinPlot}`);
                
                return (
                  <CustomMarker
                    key={`plant-${plant._id}`}
                    item={plant}
                    type="plant"
                    onClick={() => handleMarkerClick(plant, 'plant')}
                  />
                );
              })}


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
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs" style={{ backgroundColor: '#059669' }}>🌱</div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Plants (markers)</span>
          </div>
        </div>
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <strong>Boundary Types:</strong> Purple = domains, Blue = plots with size, Gray dashed = default plots (50m×50m)
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
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Boundary Information</h4>
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <p><strong>Domains:</strong> Purple rectangular boundaries show actual domain size from database</p>
            <p><strong>Plots:</strong> Blue rectangular boundaries show actual plot size, gray dashed for default 50m×50m</p>
            <p><strong>Plants:</strong> Must be placed within plot boundaries</p>
          </div>
        </div>
      </div>

    </div>
  );
}

export default MapViewMapbox;
