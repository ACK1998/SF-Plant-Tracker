import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';

const ApiContext = createContext();

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};

export const ApiProvider = ({ children }) => {
  const [plants, setPlants] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [domains, setDomains] = useState([]);
  const [plots, setPlots] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Refs to prevent concurrent calls
  const loadingRef = useRef(false);
  const initialLoadCalledRef = useRef(false);
  
  // Infinite scroll state for plants
  const [plantsInfiniteScroll, setPlantsInfiniteScroll] = useState({
    currentPage: 1,
    hasMore: true,
    loadingMore: false,
    allPlants: []
  });
  
  // Pagination state
  const [pagination, setPagination] = useState({
    plants: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 },
    domains: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 },
    plots: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 },
    users: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 }
  });

  // Load initial data when component mounts - SIMPLE useEffect with no dependencies
  useEffect(() => {
    console.log('ApiContext: useEffect triggered - calling loadInitialData');
    loadInitialData();
  }, []); // Empty dependency array - runs only once on mount

  // Reset all plants data - useful for clearing filters
  const resetPlantsData = React.useCallback(() => {
    console.log('ApiContext: resetPlantsData called - clearing all plants');
    setPlants([]);
    setPlantsInfiniteScroll({
      currentPage: 1,
      hasMore: true,
      loadingMore: false,
      allPlants: []
    });
    // Load fresh data with no filters
    loadInitialPlants({});
  }, []);

  const loadInitialData = React.useCallback(async () => {
    console.log('ApiContext: loadInitialData called');
    console.log('ApiContext: loadingRef.current =', loadingRef.current, 'initialLoadCalledRef.current =', initialLoadCalledRef.current);
    
    // Prevent multiple simultaneous calls
    if (loadingRef.current || initialLoadCalledRef.current) {
      console.log('ApiContext: Skipping loadInitialData - already loading or complete');
      return;
    }

    console.log('ApiContext: Starting to load data...');
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      // Check server health first
      console.log('ApiContext: Checking server health...');
      const isServerRunning = await api.checkServerHealth();
      console.log('ApiContext: Server health check result:', isServerRunning);
      
      if (!isServerRunning) {
        console.log('Backend server is not running');
        setError('Backend server is not running. Please start the server to connect to the database.');
        setInitialLoadComplete(true);
        initialLoadCalledRef.current = true;
        return;
      }

      // Load data in parallel - API will automatically fallback to dummy data if MongoDB is empty
      console.log('ApiContext: Making API calls...');
      const [plantsRes, orgsRes, domainsRes, plotsRes, usersRes] = await Promise.allSettled([
        api.getPlants(),
        api.getOrganizations(),
        api.getDomains(),
        api.getPlots(),
        api.getUsers()
      ]);
      console.log('ApiContext: API calls completed:', {
        plants: plantsRes.status,
        orgs: orgsRes.status,
        domains: domainsRes.status,
        plots: plotsRes.status,
        users: usersRes.status
      });

      // Handle responses with proper error handling
      if (plantsRes.status === 'fulfilled') {
        const plantsData = plantsRes.value.data || [];
        setPlants(plantsData);
        // Initialize infinite scroll state
        setPlantsInfiniteScroll({
          currentPage: 2, // Next page will be 2
          hasMore: plantsData.length === 50, // If we got 50 items, there might be more
          loadingMore: false,
          allPlants: plantsData
        });
        if (plantsRes.value.pagination) {
          setPagination(prev => ({ ...prev, plants: plantsRes.value.pagination }));
        }
      } else {
        console.error('Plants API failed:', plantsRes.reason);
        setError('Failed to load plants from database');
        setPlants([]);
        setPlantsInfiniteScroll({
          currentPage: 1,
          hasMore: false,
          loadingMore: false,
          allPlants: []
        });
      }

      if (orgsRes.status === 'fulfilled') {
        setOrganizations(orgsRes.value.data || []);
      } else {
        console.error('Organizations API failed:', orgsRes.reason);
        setError('Failed to load organizations from database');
        setOrganizations([]);
      }

      if (domainsRes.status === 'fulfilled') {
        console.log('ApiContext - Domains loaded successfully:', domainsRes.value.data);
        console.log('ApiContext - Domains data structure:', domainsRes.value.data?.map(d => ({
          _id: d._id,
          name: d.name,
          organizationId: d.organizationId?._id || d.organizationId
        })));
        setDomains(domainsRes.value.data || []);
        if (domainsRes.value.pagination) {
          setPagination(prev => ({ ...prev, domains: domainsRes.value.pagination }));
        }
      } else {
        console.error('Domains API failed:', domainsRes.reason);
        setError('Failed to load domains from database');
        setDomains([]);
      }

      if (plotsRes.status === 'fulfilled') {
        console.log('ApiContext - Plots loaded successfully:', plotsRes.value.data);
        console.log('ApiContext - Plots data structure:', plotsRes.value.data?.map(p => ({
          _id: p._id,
          name: p.name,
          domainId: p.domainId?._id || p.domainId
        })));
        setPlots(plotsRes.value.data || []);
        if (plotsRes.value.pagination) {
          setPagination(prev => ({ ...prev, plots: plotsRes.value.pagination }));
        }
      } else {
        console.error('Plots API failed:', plotsRes.reason);
        setError('Failed to load plots from database');
        setPlots([]);
      }

      if (usersRes.status === 'fulfilled') {
        console.log('ApiContext - Users loaded successfully:', usersRes.value.data);
        console.log('ApiContext - Users data structure:', usersRes.value.data?.map(u => ({
          _id: u._id,
          username: u.username,
          organizationId: u.organizationId,
          domainId: u.domainId,
          plotId: u.plotId
        })));
        setUsers(usersRes.value.data || []);
        if (usersRes.value.pagination) {
          setPagination(prev => ({ ...prev, users: usersRes.value.pagination }));
        }
      } else {
        console.error('Users API failed:', usersRes.reason);
        setError('Failed to load users from database');
        setUsers([]);
      }

      // Check if all APIs failed
      const failedApis = [plantsRes, orgsRes, domainsRes, plotsRes, usersRes]
        .filter(res => res.status === 'rejected').length;
      
      if (failedApis === 5) {
        setError('Unable to connect to the server. Please check your connection and try again.');
      }
      
      setInitialLoadComplete(true);
      initialLoadCalledRef.current = true;
    } catch (error) {
      console.error('LoadInitialData error:', error);
      setError('Failed to load data. Please refresh the page.');
      // Set empty arrays to prevent undefined errors
      setPlants([]);
      setOrganizations([]);
      setDomains([]);
      setPlots([]);
      setUsers([]);
      setInitialLoadComplete(true);
      initialLoadCalledRef.current = true;
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []); // Remove loading dependency to prevent infinite loops

  // Plants CRUD operations
  const addPlant = async (plantData) => {
    try {
      const response = await api.createPlant(plantData);
      setPlants(prev => [...prev, response.data]);
      return response.data;
    } catch (error) {
      // Don't set main error state for CRUD failures - let the UI handle it with notifications
      // setError('Failed to add plant');
      throw error;
    }
  };

  const updatePlant = async (id, plantData) => {
    try {
      const response = await api.updatePlant(id, plantData);
      setPlants(prev => prev.map(plant => 
        plant._id === id ? response.data : plant
      ));
      return response.data;
    } catch (error) {
      // Don't set main error state for CRUD failures - let the UI handle it with notifications
      // setError('Failed to update plant');
      throw error;
    }
  };

  const deletePlant = async (id) => {
    try {
      await api.deletePlant(id);
      setPlants(prev => prev.filter(plant => plant._id !== id));
    } catch (error) {
      console.error('Delete plant error:', error);
      const errorMessage = error.message || 'Failed to delete plant';
      // Don't set main error state for CRUD failures - let the UI handle it with notifications
      // setError(errorMessage);
      throw error;
    }
  };

  const addPlantStatus = async (id, statusData) => {
    try {
      const response = await api.addPlantStatus(id, statusData);
      setPlants(prev => prev.map(plant => 
        plant._id === id ? response.data : plant
      ));
      return response.data;
    } catch (error) {
      // Don't set main error state for CRUD failures - let the UI handle it with notifications
      // setError('Failed to add plant status');
      throw error;
    }
  };

  // CSV Export/Import functions
  const exportPlantsToCSV = async (filters = {}) => {
    try {
      await api.exportPlantsToCSV(filters);
    } catch (error) {
      console.error('Failed to export plants to CSV:', error);
      // Don't set main error state for CRUD failures - let the UI handle it with notifications
      // setError('Failed to export plants to CSV');
      throw error;
    }
  };

  // Get plants not updated monthly
  const getPlantsNotUpdatedMonthly = async () => {
    try {
      const response = await api.getPlantsNotUpdatedMonthly();
      return response.data || [];
    } catch (error) {
      console.error('Failed to get plants not updated monthly:', error);
      throw error;
    }
  };

  // Get plants with recent images
  const getPlantsWithRecentImages = async () => {
    try {
      const response = await api.getPlantsWithRecentImages();
      return response.data || [];
    } catch (error) {
      console.error('Failed to get plants with recent images:', error);
      throw error;
    }
  };

  const importPlantsFromCSV = async (csvData, updateExisting = false) => {
    try {
      const response = await api.importPlantsFromCSV(csvData, updateExisting);
      // Refresh plants data after import
      await loadInitialData();
      return response;
    } catch (error) {
      console.error('Failed to import plants from CSV:', error);
      // Don't set main error state for CRUD failures - let the UI handle it with notifications
      // setError('Failed to import plants from CSV');
      throw error;
    }
  };

  // Organizations CRUD operations
  const addOrganization = async (orgData) => {
    try {
      const response = await api.createOrganization(orgData);
      setOrganizations(prev => [...prev, response.data]);
      return response.data;
    } catch (error) {
      // Don't set main error state for CRUD failures - let the UI handle it with notifications
      // setError('Failed to add organization');
      throw error;
    }
  };

  const updateOrganization = async (id, orgData) => {
    try {
      const response = await api.updateOrganization(id, orgData);
      setOrganizations(prev => prev.map(org => 
        org._id === id ? response.data : org
      ));
      return response.data;
    } catch (error) {
      // Don't set main error state for CRUD failures - let the UI handle it with notifications
      // setError('Failed to update organization');
      throw error;
    }
  };

  const deleteOrganization = async (id) => {
    try {
      await api.deleteOrganization(id);
      setOrganizations(prev => prev.filter(org => org._id !== id));
    } catch (error) {
      console.error('Delete organization error:', error);
      // Don't set main error state for CRUD failures - let the UI handle it with notifications
      // setError('Failed to delete organization');
      throw error;
    }
  };

  // Domains CRUD operations
  const addDomain = async (domainData) => {
    try {
      const response = await api.createDomain(domainData);
      setDomains(prev => [...prev, response.data]);
      return response.data;
    } catch (error) {
      // Don't set main error state for CRUD failures - let the UI handle it with notifications
      // setError('Failed to add domain');
      throw error;
    }
  };

  const updateDomain = async (id, domainData) => {
    try {
      const response = await api.updateDomain(id, domainData);
      setDomains(prev => prev.map(domain => 
        domain._id === id ? response.data : domain
      ));
      return response.data;
    } catch (error) {
      // Don't set main error state for CRUD failures - let the UI handle it with notifications
      // setError('Failed to update domain');
      throw error;
    }
  };

  const deleteDomain = async (id) => {
    try {
      await api.deleteDomain(id);
      setDomains(prev => prev.filter(domain => domain._id !== id));
    } catch (error) {
      console.error('Delete domain error:', error);
      // Don't set main error state for CRUD failures - let the UI handle it with notifications
      // setError('Failed to delete domain');
      throw error;
    }
  };

  // Plots CRUD operations
  const addPlot = async (plotData) => {
    try {
      const response = await api.createPlot(plotData);
      setPlots(prev => [...prev, response.data]);
      return response.data;
    } catch (error) {
      // Don't set main error state for CRUD failures - let the UI handle it with notifications
      // setError('Failed to add plot');
      throw error;
    }
  };

  const updatePlot = async (id, plotData) => {
    try {
      const response = await api.updatePlot(id, plotData);
      setPlots(prev => prev.map(plot => 
        plot._id === id ? response.data : plot
      ));
      return response.data;
    } catch (error) {
      // Don't set main error state for CRUD failures - let the UI handle it with notifications
      // setError('Failed to update plot');
      throw error;
    }
  };

  const deletePlot = async (id) => {
    try {
      await api.deletePlot(id);
      setPlots(prev => prev.filter(plot => plot._id !== id));
    } catch (error) {
      console.error('Delete plot error:', error);
      // Don't set main error state for CRUD failures - let the UI handle it with notifications
      // setError('Failed to delete plot');
      throw error;
    }
  };

  // Users CRUD operations
  const addUser = async (userData) => {
    try {
      const response = await api.createUser(userData);
      setUsers(prev => [...prev, response.data]);
      return response.data;
    } catch (error) {
      // Don't set main error state for CRUD failures - let the UI handle it with notifications
      // setError('Failed to add user');
      throw error;
    }
  };

  const updateUser = async (id, userData) => {
    try {
      const response = await api.updateUser(id, userData);
      setUsers(prev => prev.map(user => 
        user._id === id ? response.data : user
      ));
      return response.data;
    } catch (error) {
      // Don't set main error state for CRUD failures - let the UI handle it with notifications
      // setError('Failed to update user');
      throw error;
    }
  };

  const deleteUser = async (id) => {
    try {
      await api.deleteUser(id);
      setUsers(prev => prev.filter(user => user._id !== id));
    } catch (error) {
      console.error('Delete user error:', error);
      // Don't set main error state for CRUD failures - let the UI handle it with notifications
      // setError('Failed to delete user');
      throw error;
    }
  };

  // Infinite scroll function for plants
  const loadMorePlants = React.useCallback(async (filters = {}) => {
    setPlantsInfiniteScroll(prev => {
      const { currentPage, hasMore, loadingMore } = prev;
      
      if (!hasMore || loadingMore) return prev;
      
      // Start loading
      const updatedState = { ...prev, loadingMore: true };
      
      // Make API call
      const params = { page: currentPage, limit: 50, ...filters };
      api.getPlants(params)
        .then(response => {
          const newPlants = response.data || [];
          
          if (newPlants.length === 0) {
            // No more plants to load
            setPlantsInfiniteScroll(prevState => ({ 
              ...prevState, 
              hasMore: false, 
              loadingMore: false 
            }));
            return;
          }
          
          // Deduplicate new plants by _id to prevent duplicates
          setPlantsInfiniteScroll(prevState => {
            const existingPlantIds = new Set(prevState.allPlants.map(p => p._id?.toString()));
            const uniqueNewPlants = newPlants.filter(p => p._id && !existingPlantIds.has(p._id.toString()));
            
            return {
              ...prevState,
              currentPage: prevState.currentPage + 1,
              loadingMore: false,
              allPlants: [...prevState.allPlants, ...uniqueNewPlants]
            };
          });
          
          // Update the main plants state (deduplicated)
          setPlants(prevPlants => {
            const existingIds = new Set(prevPlants.map(p => p._id?.toString()));
            const uniqueNewPlants = newPlants.filter(p => p._id && !existingIds.has(p._id.toString()));
            return [...prevPlants, ...uniqueNewPlants];
          });
        })
        .catch(error => {
          console.error('Failed to load more plants:', error);
          setPlantsInfiniteScroll(prevState => ({ ...prevState, loadingMore: false }));
          setError('Failed to load more plants');
        });
      
      return updatedState;
    });
  }, []); // Remove plantsInfiniteScroll dependency to prevent infinite loops

  // Load initial plants for infinite scroll
  const loadInitialPlants = React.useCallback(async (filters = {}, skipIfLoaded = false) => {
    console.log('ApiContext: loadInitialPlants called with filters:', filters);
    
    setPlantsInfiniteScroll(prev => {
      // Skip if plants are already loaded and skipIfLoaded is true
      if (skipIfLoaded && prev.allPlants.length > 0) {
        console.log('ApiContext: Skipping loadInitialPlants - plants already loaded');
        return prev;
      }
      
      return { ...prev, loadingMore: true };
    });
    
    try {
      const params = { page: 1, limit: 50, ...filters };
      console.log('ApiContext: Making API call with params:', params);
      const response = await api.getPlants(params);
      const plantsData = response.data || [];
      
      // Deduplicate plants by _id (in case API returns duplicates)
      const uniquePlants = [];
      const seenIds = new Set();
      for (const plant of plantsData) {
        if (plant._id && !seenIds.has(plant._id.toString())) {
          seenIds.add(plant._id.toString());
          uniquePlants.push(plant);
        }
      }
      
      setPlants(uniquePlants);
      setPlantsInfiniteScroll({
        currentPage: 2, // Next page will be 2
        hasMore: uniquePlants.length === 50, // If we got 50 items, there might be more
        loadingMore: false,
        allPlants: uniquePlants
      });
      
    } catch (error) {
      console.error('Failed to load initial plants:', error);
      setPlantsInfiniteScroll(prev => ({ ...prev, loadingMore: false }));
      setError('Failed to load plants');
    }
  }, []); // Remove plants.length dependency to stabilize callback

  // Reset infinite scroll state
  const resetPlantsInfiniteScroll = React.useCallback((filters = {}, clearPlants = true) => {
    console.log('ApiContext: resetPlantsInfiniteScroll called with filters:', filters, 'clearPlants:', clearPlants);
    setPlantsInfiniteScroll({
      currentPage: 1,
      hasMore: true,
      loadingMore: false,
      allPlants: []
    });
    // Always clear plants to ensure fresh data load
    setPlants([]);
    // Load first page using the initial loader
    loadInitialPlants(filters);
  }, [loadInitialPlants]);

  // Pagination functions
  const loadPlantsPage = async (page = 1, filters = {}) => {
    try {
      const params = { page, limit: 50, ...filters };
      const response = await api.getPlants(params);
      setPlants(response.data || []);
      if (response.pagination) {
        setPagination(prev => ({ ...prev, plants: response.pagination }));
      }
    } catch (error) {
      console.error('Failed to load plants page:', error);
      setError('Failed to load plants');
    }
  };

  const loadDomainsPage = async (page = 1, filters = {}) => {
    try {
      const params = { page, limit: 10, ...filters };
      const response = await api.getDomains(params);
      setDomains(response.data || []);
      if (response.pagination) {
        setPagination(prev => ({ ...prev, domains: response.pagination }));
      }
    } catch (error) {
      console.error('Failed to load domains page:', error);
      setError('Failed to load domains');
    }
  };

  const loadPlotsPage = async (page = 1, filters = {}) => {
    try {
      const params = { page, limit: 10, ...filters };
      const response = await api.getPlots(params);
      setPlots(response.data || []);
      if (response.pagination) {
        setPagination(prev => ({ ...prev, plots: response.pagination }));
      }
    } catch (error) {
      console.error('Failed to load plots page:', error);
      setError('Failed to load plots');
    }
  };

  const loadUsersPage = async (page = 1, filters = {}) => {
    try {
      const params = { page, limit: 10, ...filters };
      const response = await api.getUsers(params);
      setUsers(response.data || []);
      if (response.pagination) {
        setPagination(prev => ({ ...prev, users: response.pagination }));
      }
    } catch (error) {
      console.error('Failed to load users page:', error);
      setError('Failed to load users');
    }
  };

  const value = {
    // API Service
    api,
    
    // State
    plants,
    organizations,
    domains,
    plots,
    users,
    loading,
    error,
    pagination,
    plantsInfiniteScroll,
    
    // Actions
    loadInitialData,
    refreshData: React.useCallback(() => {
      loadInitialData();
    }, []),
    addPlant,
    updatePlant,
    deletePlant,
    addPlantStatus,
    exportPlantsToCSV,
    importPlantsFromCSV,
    getPlantsNotUpdatedMonthly,
    getPlantsWithRecentImages,
    addOrganization,
    updateOrganization,
    deleteOrganization,
    addDomain,
    updateDomain,
    deleteDomain,
    addPlot,
    updatePlot,
    deletePlot,
    addUser,
    updateUser,
    deleteUser,
    loadPlantsPage,
    loadDomainsPage,
    loadPlotsPage,
    loadUsersPage,
    loadMorePlants,
    loadInitialPlants,
    resetPlantsInfiniteScroll,
    resetPlantsData,
    
    // Utility functions
    getPlantById: (id) => plants.find(plant => plant._id === id),
    getOrganizationById: (id) => organizations.find(org => org._id === id),
    getDomainById: (id) => domains.find(domain => domain._id === id),
    getPlotById: (id) => plots.find(plot => plot._id === id),
    getUserById: (id) => users.find(user => user._id === id),
  };

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  );
}; 