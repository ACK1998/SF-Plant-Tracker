import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';

const DashboardContext = createContext();

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

export const DashboardProvider = ({ children }) => {
  const [dashboardPlants, setDashboardPlants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Ref to prevent concurrent calls
  const loadingRef = useRef(false);

  const loadDashboardData = React.useCallback(async () => {
    if (loadingRef.current) return;
    
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.getDashboardPlants();
      setDashboardPlants(response.data || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError('Failed to load dashboard data');
      setDashboardPlants([]);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []); // Remove loading dependency to prevent infinite loops

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run only once on mount
  }, []);

  const value = {
    dashboardPlants,
    loading,
    error,
    refreshDashboardData: loadDashboardData
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};
