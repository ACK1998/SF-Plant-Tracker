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
  
  // Ref to prevent concurrent calls
  const loadingRef = useRef(false);

  const loadMapViewData = React.useCallback(async () => {
    if (loadingRef.current) return;
    
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.getMapViewPlants();
      setMapViewPlants(response.data || []);
    } catch (error) {
      console.error('Failed to load mapview data:', error);
      setError('Failed to load mapview data');
      setMapViewPlants([]);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []); // Remove loading dependency to prevent infinite loops

  useEffect(() => {
    loadMapViewData();
  }, []);

  const value = {
    mapViewPlants,
    loading,
    error,
    refreshMapViewData: loadMapViewData
  };

  return (
    <MapViewContext.Provider value={value}>
      {children}
    </MapViewContext.Provider>
  );
};
