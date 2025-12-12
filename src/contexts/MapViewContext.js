import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';

const MapViewContext = createContext();

export const useMapView = () => {
  const context = useContext(MapViewContext);
  if (!context) {
    throw new Error('useMapView must be used within a MapViewProvider');
  }
  return context;
};

export const MapViewProvider = ({ children }) => {
  const [mapViewPlants, setMapViewPlants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Refs to prevent concurrent calls and track loaded data
  const loadingRef = useRef(false);
  const loadedBoundsRef = useRef(null);
  const loadedZoomRef = useRef(0);

  // Load plants for map view with optional bounds filtering
  const loadMapViewData = React.useCallback(async (bounds = null, forceReload = false) => {
    // Check if we already have data for these bounds
    if (!forceReload && bounds && loadedBoundsRef.current) {
      const prevBounds = loadedBoundsRef.current;
      // Check if new bounds are within previously loaded bounds
      if (
        bounds.sw[0] >= prevBounds.sw[0] &&
        bounds.sw[1] >= prevBounds.sw[1] &&
        bounds.ne[0] <= prevBounds.ne[0] &&
        bounds.ne[1] <= prevBounds.ne[1]
      ) {
        // Already have data for this area, skip loading
        return;
      }
    }
    
    if (loadingRef.current) return;
    
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.getMapViewPlants(bounds);
      const newPlants = response.data || [];
      
      if (bounds) {
        // Merge with existing plants, avoiding duplicates
        setMapViewPlants(prev => {
          const existingIds = new Set(prev.map(p => p._id));
          const uniqueNew = newPlants.filter(p => !existingIds.has(p._id));
          return [...prev, ...uniqueNew];
        });
        loadedBoundsRef.current = bounds;
      } else {
        // No bounds means load all
        setMapViewPlants(newPlants);
        loadedBoundsRef.current = null;
      }
    } catch (error) {
      console.error('Failed to load mapview data:', error);
      setError('Failed to load mapview data');
      // Don't clear existing data on error
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  // Clear loaded data (useful for reset)
  const clearMapViewData = React.useCallback(() => {
    setMapViewPlants([]);
    loadedBoundsRef.current = null;
    loadedZoomRef.current = 0;
  }, []);

  const value = {
    mapViewPlants,
    loading,
    error,
    refreshMapViewData: loadMapViewData,
    clearMapViewData
  };

  return (
    <MapViewContext.Provider value={value}>
      {children}
    </MapViewContext.Provider>
  );
};
