import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, Filter, Map, Leaf, MapPin, Sprout, X, Download, Upload, Heart, User, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import PlantCard from './PlantCard';
import CSVImportModal from './CSVImportModal';
import ConfirmationDialog from '../common/ConfirmationDialog';
import InfiniteScroll from '../common/InfiniteScroll';
import { useApi } from '../../contexts/ApiContext';
import SearchableDropdown from '../common/SearchableDropdown';
import api from '../../services/api';
import { useNavigate, useSearchParams } from 'react-router-dom';

function PlantsList({ user, selectedState }) {
  const navigate = useNavigate();
  const { 
    plants, 
    plots, 
    domains, 
    organizations,
    users,
    loading, 
    error,
    plantsInfiniteScroll,
    updatePlant, 
    deletePlant, 
    addPlantStatus,
    exportPlantsToCSV,
    importPlantsFromCSV,
    loadMorePlants,
    resetPlantsInfiniteScroll,
    resetPlantsData
  } = useApi();

  const [showCSVImportModal, setShowCSVImportModal] = useState(false);
  const [csvImportLoading, setCsvImportLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOrganization, setFilterOrganization] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterPlot, setFilterPlot] = useState('all');
  const [filterDomain, setFilterDomain] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterVariety, setFilterVariety] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [notUpdatedMonthly, setNotUpdatedMonthly] = useState(false);
  const [hasRecentImages, setHasRecentImages] = useState(false);
  const [urlParamsInitialized, setUrlParamsInitialized] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [plantToDelete, setPlantToDelete] = useState(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  
  
  // Categories state
  const [categories, setCategories] = useState([]);
  
  const [searchParams] = useSearchParams();
  const filteringInProgress = useRef(false);
  const initialFilterApplied = useRef(false);
  const lastAppliedFilters = useRef(null);

  // Simple reset function - called manually when needed
  const resetAllFilters = useCallback(() => {
    console.log('PlantsList: resetAllFilters called - resetting all filters');
    setFilterOrganization('all');
    setFilterType('all');
    setFilterPlot('all');
    setFilterDomain('all');
    setFilterCategory('all');
    setFilterVariety('all');
    setFilterStatus('all');
    setNotUpdatedMonthly(false);
    setHasRecentImages(false);
    setSearchTerm('');
    setDebouncedSearchTerm('');
    
    // Reset tracking refs
    lastAppliedFilters.current = null;
    initialFilterApplied.current = false;
    
    // Reset and reload plants data with no filters
    resetPlantsData();
  }, [resetPlantsData]);

  // Initialize filters from URL parameters - SINGLE useEffect to prevent loops
  useEffect(() => {
    if (!urlParamsInitialized) {
      const healthParam = searchParams.get('health');
      const notUpdatedMonthlyParam = searchParams.get('notUpdatedMonthly');
      const hasRecentImagesParam = searchParams.get('hasRecentImages');
      const statusParam = searchParams.get('status');
      const organizationParam = searchParams.get('organizationId');
      const plotParam = searchParams.get('plotId');
      const domainParam = searchParams.get('domainId');
      const typeParam = searchParams.get('type');
      const categoryParam = searchParams.get('category');
      const varietyParam = searchParams.get('variety');
      const searchParam = searchParams.get('search');
      
      console.log('PlantsList: URL params detected:', {
        health: healthParam,
        notUpdatedMonthly: notUpdatedMonthlyParam,
        hasRecentImages: hasRecentImagesParam,
        status: statusParam,
        organization: organizationParam,
        plot: plotParam,
        domain: domainParam,
        type: typeParam,
        category: categoryParam,
        variety: varietyParam,
        search: searchParam
      });
      
      // Apply any URL parameters as filters
      let hasUrlParams = false;
      
      if (healthParam) {
        setFilterStatus(healthParam);
        hasUrlParams = true;
      }
      if (notUpdatedMonthlyParam === 'true') {
        setNotUpdatedMonthly(true);
        hasUrlParams = true;
      }
      if (hasRecentImagesParam === 'true') {
        setHasRecentImages(true);
        hasUrlParams = true;
      }
      if (statusParam) {
        setFilterStatus(statusParam);
        hasUrlParams = true;
      }
      if (organizationParam) {
        setFilterOrganization(organizationParam);
        hasUrlParams = true;
      }
      if (plotParam) {
        setFilterPlot(plotParam);
        hasUrlParams = true;
      }
      if (domainParam) {
        setFilterDomain(domainParam);
        hasUrlParams = true;
      }
      if (typeParam) {
        setFilterType(typeParam);
        hasUrlParams = true;
      }
      if (categoryParam) {
        setFilterCategory(categoryParam);
        hasUrlParams = true;
      }
      if (varietyParam) {
        setFilterVariety(varietyParam);
        hasUrlParams = true;
      }
      if (searchParam) {
        setSearchTerm(searchParam);
        hasUrlParams = true;
      }
      
      // Clear URL parameters after applying them
      if (hasUrlParams) {
        setTimeout(() => {
          const currentUrl = new URL(window.location);
          const paramsToRemove = ['health', 'notUpdatedMonthly', 'hasRecentImages', 'status', 'organizationId', 'plotId', 'domainId', 'type', 'category', 'variety', 'search'];
          paramsToRemove.forEach(param => {
            if (currentUrl.searchParams.has(param)) {
              currentUrl.searchParams.delete(param);
            }
          });
          window.history.replaceState({}, '', currentUrl.toString());
        }, 100);
      } else {
        console.log('PlantsList: No URL params - resetting all filters');
        resetAllFilters();
      }
      
      setUrlParamsInitialized(true);
    }
  }, [searchParams, urlParamsInitialized, resetAllFilters]);

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

  // Cleanup URL parameters when component unmounts
  useEffect(() => {
    return () => {
      // Clear URL parameters when leaving the plants page
      const currentUrl = new URL(window.location);
      if (currentUrl.searchParams.has('health')) {
        currentUrl.searchParams.delete('health');
        window.history.replaceState({}, '', currentUrl.toString());
      }
    };
  }, []);


  // Get domains from plant data (fallback if API domains are empty) - moved before getAvailablePlots
  const domainsFromPlants = plants.reduce((acc, plant) => {
    let domainId, domainName;
    
    // Handle both populated objects and simple IDs
    if (plant.domainId) {
      if (typeof plant.domainId === 'object' && plant.domainId._id) {
        // Populated object
        domainId = plant.domainId._id;
        domainName = plant.domainId.name || `Domain ${domainId}`;
      } else if (typeof plant.domainId === 'string') {
        // Simple ID string
        domainId = plant.domainId;
        domainName = `Domain ${domainId}`;
      }
      
      if (domainId && !acc.find(d => d._id === domainId)) {
        acc.push({ _id: domainId, name: domainName });
      }
    }
    return acc;
  }, []);

  // Get plots from plant data (fallback if API plots are empty) - moved before getAvailablePlots
  const plotsFromPlants = plants.reduce((acc, plant) => {
    let plotId, plotName;
    
    // Handle both populated objects and simple IDs
    if (plant.plotId) {
      if (typeof plant.plotId === 'object' && plant.plotId._id) {
        // Populated object
        plotId = plant.plotId._id;
        plotName = plant.plotId.name || `Plot ${plotId}`;
      } else if (typeof plant.plotId === 'string') {
        // Simple ID string
        plotId = plant.plotId;
        plotName = `Plot ${plotId}`;
      }
      
      if (plotId && !acc.find(p => p._id === plotId)) {
        acc.push({ _id: plotId, name: plotName });
      }
    }
    return acc;
  }, []);

  // Get available plots function - shows ALL plots from API, not just ones from current page
  const getAvailablePlots = useCallback((selectedDomainId = null) => {
    console.log('getAvailablePlots called with selectedDomainId:', selectedDomainId);
    console.log('Total plots from API:', plots.length);
    
    // Always use ALL plots from API (up to 500 plots loaded on initial page load)
    // This ensures the dropdown shows all available plots, not just ones from current page
    let allPlots = plots;
    
    if (!user || !user.role) {
      // If domain is selected, filter by domain
      if (selectedDomainId && selectedDomainId !== 'all') {
        allPlots = allPlots.filter(plot => {
          const plotDomainId = plot.domainId?._id || plot.domainId;
          return String(plotDomainId) === String(selectedDomainId);
        });
      }
      console.log('Returning plots (no user):', allPlots.length);
      return allPlots;
    }
    
    // Super admin can see all plots
    if (user.role === 'super_admin') {
      // If a domain is selected, filter plots by that domain
      if (selectedDomainId && selectedDomainId !== 'all') {
        allPlots = allPlots.filter(plot => {
          const plotDomainId = plot.domainId?._id || plot.domainId;
          return String(plotDomainId) === String(selectedDomainId);
        });
      }
      console.log('Returning plots (super admin):', allPlots.length);
      return allPlots;
    }
    
    // Filter by organization for non-super admins
    const userOrgId = user.organizationId?._id || user.organizationId;
    let filteredPlots = allPlots.filter(plot => {
      if (!plot.organizationId) {
        return true; // Show plots without organizationId
      }
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
    
    console.log('Returning plots (filtered by org/domain):', filteredPlots.length);
    return filteredPlots;
  }, [plots, user]);

  // Reset plot filter when domain filter changes (only if current plot is not in selected domain)
  useEffect(() => {
    if (filterDomain !== 'all' && filterPlot !== 'all') {
      // Get the current plots for the selected domain
      const currentPlots = getAvailablePlots(filterDomain);
      // Check if the currently selected plot belongs to the selected domain
      const currentPlot = currentPlots.find(plot => plot._id === filterPlot);
      if (!currentPlot) {
        // If the current plot is not in the selected domain, reset to 'all'
        setFilterPlot('all');
      }
    }
  }, [filterDomain, filterPlot, getAvailablePlots]);

  // Check if any filters are active
  const hasActiveFilters = searchTerm || 
    filterOrganization !== 'all' ||
    filterType !== 'all' || 
    filterPlot !== 'all' || 
    filterDomain !== 'all' || 
    filterCategory !== 'all' || 
    filterVariety !== 'all' ||
    filterStatus !== 'all' ||
    notUpdatedMonthly ||
    hasRecentImages;

  // Auto-expand filters when any filter is applied
  useEffect(() => {
    if (hasActiveFilters && !filtersExpanded) {
      setFiltersExpanded(true);
    }
  }, [hasActiveFilters, filtersExpanded]);

  // Function to clear all filters - optimized to prevent multiple re-renders
  const clearAllFilters = useCallback(() => {
    setSearchTerm('');
    setFilterOrganization('all');
    setFilterType('all');
    setFilterPlot('all');
    setFilterDomain('all');
    setFilterCategory('all');
    setFilterVariety('all');
    setFilterStatus('all');
    setNotUpdatedMonthly(false);
    setHasRecentImages(false);
    // Close filters when all are cleared
    setFiltersExpanded(false);
  }, []);

  // Count active filters
  const activeFilterCount = [
    searchTerm ? 1 : 0,
    filterOrganization !== 'all' ? 1 : 0,
    filterType !== 'all' ? 1 : 0,
    filterPlot !== 'all' ? 1 : 0,
    filterDomain !== 'all' ? 1 : 0,
    filterCategory !== 'all' ? 1 : 0,
    filterVariety !== 'all' ? 1 : 0,
    filterStatus !== 'all' ? 1 : 0,
    notUpdatedMonthly ? 1 : 0,
    hasRecentImages ? 1 : 0
  ].reduce((sum, count) => sum + count, 0);




  // Get unique plant types from actual plant data
  const uniquePlantTypes = [...new Set(plants.map(plant => plant.type).filter(Boolean))];
  
  // Get unique plant varieties from actual plant data
  const uniquePlantVarieties = [...new Set(plants.map(plant => plant.variety).filter(Boolean))];

  // Get unique plant statuses from actual plant data
  const uniquePlantStatuses = [...new Set(plants.map(plant => plant.health).filter(Boolean))];





  // Filter domains and plots based on user role
  const getAvailableDomains = () => {
    // Use all domains from API to show all available domains in the filter
    // This ensures users can see and filter by all domains, not just those with plants
    let allDomains = domains;
    
    // If API domains are empty, fall back to domains from plants data
    if (allDomains.length === 0) {
      allDomains = domainsFromPlants;
    }
    
    // Return all domains for the filter dropdown
    // The actual plant filtering by organization will happen when filtering plants
    return allDomains;
  };



  // Get filtered domains and plots
  const availableDomains = getAvailableDomains();
  const availablePlots = getAvailablePlots(filterDomain);







  const handleUpdatePlant = async (updatedPlant) => {
    try {
      await updatePlant(updatedPlant._id, updatedPlant);
      navigate('/plants');
      
      // Show success notification
      if (window.showNotification) {
        window.showNotification({
          type: 'success',
          message: 'Plant updated successfully!',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Failed to update plant:', error);
      
      // Show error notification
      if (window.showNotification) {
        window.showNotification({
          type: 'error',
          message: 'Failed to update plant. Please try again.',
          duration: 5000
        });
      }
    }
  };

  const openAddModal = () => {
    navigate('/plants/add');
  };

  const openEditModal = (plant) => {
    // Preserve current filter state in URL when navigating to edit
    const currentParams = new URLSearchParams();
    if (notUpdatedMonthly) currentParams.set('notUpdatedMonthly', 'true');
    if (hasRecentImages) currentParams.set('hasRecentImages', 'true');
    if (filterStatus) currentParams.set('health', filterStatus);
    if (filterOrganization) currentParams.set('organizationId', filterOrganization);
    if (filterPlot) currentParams.set('plotId', filterPlot);
    if (filterDomain) currentParams.set('domainId', filterDomain);
    if (filterType) currentParams.set('type', filterType);
    if (filterCategory) currentParams.set('category', filterCategory);
    if (filterVariety) currentParams.set('variety', filterVariety);
    if (debouncedSearchTerm) currentParams.set('search', debouncedSearchTerm);
    
    const queryString = currentParams.toString();
    navigate(`/plants/${plant._id}/edit${queryString ? `?${queryString}` : ''}`);
  };

  const openStatusModal = (plant) => {
    // Preserve current filter state in URL when navigating to status
    const currentParams = new URLSearchParams();
    if (notUpdatedMonthly) currentParams.set('notUpdatedMonthly', 'true');
    if (hasRecentImages) currentParams.set('hasRecentImages', 'true');
    if (filterStatus) currentParams.set('health', filterStatus);
    if (filterOrganization) currentParams.set('organizationId', filterOrganization);
    if (filterPlot) currentParams.set('plotId', filterPlot);
    if (filterDomain) currentParams.set('domainId', filterDomain);
    if (filterType) currentParams.set('type', filterType);
    if (filterCategory) currentParams.set('category', filterCategory);
    if (filterVariety) currentParams.set('variety', filterVariety);
    if (debouncedSearchTerm) currentParams.set('search', debouncedSearchTerm);
    
    const queryString = currentParams.toString();
    navigate(`/plants/${plant._id}/status${queryString ? `?${queryString}` : ''}`);
  };

  const openPhotosModal = (plant) => {
    // Preserve current filter state in URL when navigating to photos
    const currentParams = new URLSearchParams();
    if (notUpdatedMonthly) currentParams.set('notUpdatedMonthly', 'true');
    if (hasRecentImages) currentParams.set('hasRecentImages', 'true');
    if (filterStatus) currentParams.set('health', filterStatus);
    if (filterOrganization) currentParams.set('organizationId', filterOrganization);
    if (filterPlot) currentParams.set('plotId', filterPlot);
    if (filterDomain) currentParams.set('domainId', filterDomain);
    if (filterType) currentParams.set('type', filterType);
    if (filterCategory) currentParams.set('category', filterCategory);
    if (filterVariety) currentParams.set('variety', filterVariety);
    if (debouncedSearchTerm) currentParams.set('search', debouncedSearchTerm);
    
    const queryString = currentParams.toString();
    navigate(`/plants/${plant._id}/photos${queryString ? `?${queryString}` : ''}`);
  };

  const openHistoryModal = (plant) => {
    // Preserve current filter state in URL when navigating to history
    const currentParams = new URLSearchParams();
    if (notUpdatedMonthly) currentParams.set('notUpdatedMonthly', 'true');
    if (hasRecentImages) currentParams.set('hasRecentImages', 'true');
    if (filterStatus) currentParams.set('health', filterStatus);
    if (filterOrganization) currentParams.set('organizationId', filterOrganization);
    if (filterPlot) currentParams.set('plotId', filterPlot);
    if (filterDomain) currentParams.set('domainId', filterDomain);
    if (filterType) currentParams.set('type', filterType);
    if (filterCategory) currentParams.set('category', filterCategory);
    if (filterVariety) currentParams.set('variety', filterVariety);
    if (debouncedSearchTerm) currentParams.set('search', debouncedSearchTerm);
    
    const queryString = currentParams.toString();
    navigate(`/plants/${plant._id}/history${queryString ? `?${queryString}` : ''}`);
  };

  const handleAddPlantStatusUpdate = async (plantId, statusUpdate) => {
    try {
      const statusData = {
        ...statusUpdate,
        updatedBy: user._id,
        date: new Date()
      };
      
      await addPlantStatus(plantId, statusData);
      
      // Show success notification
      if (window.showNotification) {
        window.showNotification({
          type: 'success',
          message: 'Plant status updated successfully!',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Failed to add plant status:', error);
      
      // Show error notification
      if (window.showNotification) {
        window.showNotification({
          type: 'error',
          message: 'Failed to update plant status. Please try again.',
          duration: 5000
        });
      }
    }
  };

  const handleDeletePlant = async (plantId) => {
    try {
      // Validate plantId
      if (!plantId) {
        throw new Error('Plant ID is required for deletion');
      }
      
      console.log('Deleting plant with ID:', plantId);
      await deletePlant(plantId);
      
      // Show success notification
      if (window.showNotification) {
        window.showNotification({
          type: 'success',
          message: 'Plant deleted successfully!',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Failed to delete plant:', error);
      
      // Show error notification with more specific message
      const errorMessage = error.message || 'Failed to delete plant. Please try again.';
      if (window.showNotification) {
        window.showNotification({
          type: 'error',
          message: errorMessage,
          duration: 5000
        });
      }
    }
  };

  const confirmDeletePlant = (plant) => {
    console.log('confirmDeletePlant called with:', plant);
    if (!plant || !plant._id) {
      console.error('Invalid plant object passed to confirmDeletePlant:', plant);
      if (window.showNotification) {
        window.showNotification({
          type: 'error',
          message: 'Cannot delete plant: Invalid plant data',
          duration: 5000
        });
      }
      return;
    }
    setPlantToDelete(plant);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (plantToDelete && plantToDelete._id) {
      console.log('Confirming delete for plant:', plantToDelete);
      try {
        await handleDeletePlant(plantToDelete._id);
        setPlantToDelete(null);
        setShowDeleteConfirm(false);
      } catch (error) {
        console.error('Failed to delete plant:', error);
        // Error notification is handled in handleDeletePlant
      }
    } else {
      console.error('Cannot delete plant: plantToDelete or plantToDelete._id is undefined');
      if (window.showNotification) {
        window.showNotification({
          type: 'error',
          message: 'Cannot delete plant: Invalid plant data',
          duration: 5000
        });
      }
      setShowDeleteConfirm(false);
    }
  };

  // CSV Export handler
  const handleExportCSV = async () => {
    try {
      const filters = {};
      if (filterOrganization !== 'all') filters.organizationId = filterOrganization;
      if (filterType !== 'all') filters.type = filterType;
      if (filterPlot !== 'all') filters.plotId = filterPlot;
      if (filterDomain !== 'all') filters.domainId = filterDomain;
      if (filterCategory !== 'all') filters.category = filterCategory;
      if (filterVariety !== 'all') filters.variety = filterVariety;
      if (filterStatus !== 'all') filters.health = filterStatus;
      if (notUpdatedMonthly) filters.notUpdatedMonthly = 'true';
      if (hasRecentImages) filters.hasRecentImages = 'true';
      if (debouncedSearchTerm) filters.search = debouncedSearchTerm;

      await exportPlantsToCSV(filters);
      
      if (window.showNotification) {
        window.showNotification({
          type: 'success',
          message: 'Plants exported to CSV successfully!',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Failed to export plants:', error);
      if (window.showNotification) {
        window.showNotification({
          type: 'error',
          message: 'Failed to export plants to CSV. Please try again.',
          duration: 5000
        });
      }
    }
  };

  // CSV Import handler
  const handleImportCSV = async (csvData, updateExisting) => {
    setCsvImportLoading(true);
    try {
      const result = await importPlantsFromCSV(csvData, updateExisting);
      
      if (window.showNotification) {
        window.showNotification({
          type: 'success',
          message: result.message || 'Plants imported successfully!',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Failed to import plants:', error);
      if (window.showNotification) {
        window.showNotification({
          type: 'error',
          message: 'Failed to import plants from CSV. Please try again.',
          duration: 5000
        });
      }
      throw error;
    } finally {
      setCsvImportLoading(false);
    }
  };

  const getPlotName = (plotId) => {
    if (!plotId || !plots || !Array.isArray(plots)) return 'Unknown Plot';
    
    // Handle different plotId formats
    const plot = plots.find(plot => {
      return plot && (String(plot._id) === String(plotId) || 
             String(plot.id) === String(plotId) ||
             (typeof plotId === 'object' && plotId && String(plot._id) === String(plotId._id)));
    });
    
    return plot?.name || plot?.plotNumber || 'Unknown Plot';
  };

  const getDomainName = (domainId) => {
    if (!domainId || !domains || !Array.isArray(domains)) return 'Unknown Domain';
    
    // Handle different domainId formats
    const domain = domains.find(domain => {
      return domain && (String(domain._id) === String(domainId) || 
             String(domain.id) === String(domainId) ||
             (typeof domainId === 'object' && domainId && String(domain._id) === String(domainId._id)));
    });
    
    return domain?.name || 'Unknown Domain';
  };

  const getPlantedByUser = (plantedBy) => {
    if (!plantedBy) return 'Unknown User';
    
    // Handle both object and string formats
    if (typeof plantedBy === 'object' && plantedBy && plantedBy.firstName && plantedBy.lastName) {
      return `${plantedBy.firstName} ${plantedBy.lastName}`;
    }
    
    // If it's a user ID, try to find the user in the users array
    if (users && Array.isArray(users)) {
      const user = users.find(u => u && u._id === plantedBy);
      if (user && user.firstName && user.lastName) {
        return `${user.firstName} ${user.lastName}`;
      }
    }
    
    return 'Unknown User';
  };

  // Permission checking functions
  const canAddPlant = () => {
    if (!user || !user.role) return false;
    // All authenticated users can add plants (but they can only add to their assigned areas)
    return ['super_admin', 'org_admin', 'domain_admin', 'application_user'].includes(user.role);
  };

  const canEditPlant = (plant) => {
    // Safety checks
    if (!user || !user.role || !plant) return false;
    
    // Super admin can edit all plants
    if (user.role === 'super_admin') return true;
    
    // Get user's organization, domain, and plot IDs safely
    const userOrgId = user.organizationId?._id || user.organizationId;
    const userDomainId = user.domainId?._id || user.domainId;
    const userPlotId = user.plotId?._id || user.plotId;
    
    // Get plant's organization, domain, and plot IDs safely
    const plantOrgId = plant.organizationId?._id || plant.organizationId;
    const plantDomainId = plant.domainId?._id || plant.domainId;
    const plantPlotId = typeof plant.plotId === 'object' ? plant.plotId._id : plant.plotId;
    
    // Additional safety checks for null values
    if (!userOrgId || !plantOrgId) return false;
    
    // Additional safety check - if plant has no organization, only super admin can edit
    if (!plantOrgId) {
      return user.role === 'super_admin';
    }
    
    // Org admin can edit plants in their organization
    if (user.role === 'org_admin') {
      return userOrgId && plantOrgId && String(userOrgId) === String(plantOrgId);
    }
    
    // Domain admin can edit plants in their domain
    if (user.role === 'domain_admin') {
      if (!userDomainId || !plantDomainId) return false;
      return String(userOrgId) === String(plantOrgId) && 
             String(userDomainId) === String(plantDomainId);
    }
    
    // Application user can edit plants in their assigned plot
    if (user.role === 'application_user') {
      if (!userDomainId || !plantDomainId || !userPlotId || !plantPlotId) return false;
      return String(userOrgId) === String(plantOrgId) && 
             String(userDomainId) === String(plantDomainId) &&
             String(userPlotId) === String(plantPlotId);
    }
    
    return false;
  };

  const canDeletePlant = (plant) => {
    if (!user || !user.role || !plant) return false;
    return canEditPlant(plant); // Same permissions as edit
  };



  // Debounce search term to prevent rapid API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Update URL when health filter changes (but only if it's a user-initiated change)
  useEffect(() => {
    // Only update URL if this is not the initial load from URL params
    if (urlParamsInitialized) {
      const currentHealth = searchParams.get('health');
      if (filterStatus !== currentHealth) {
        const newSearchParams = new URLSearchParams(searchParams);
        if (filterStatus === 'all') {
          newSearchParams.delete('health');
        } else {
          newSearchParams.set('health', filterStatus);
        }
        navigate(`/plants?${newSearchParams.toString()}`, { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, navigate, urlParamsInitialized]); // Removed searchParams from dependencies to prevent loops


  // Reset infinite scroll when filters change - with debouncing to prevent loops
  useEffect(() => {
    // Only apply filters after URL parameters have been initialized
    if (!urlParamsInitialized || filteringInProgress.current) {
      return;
    }

    // Prevent concurrent filtering operations
    filteringInProgress.current = true;

    // Debounce filter changes to prevent rapid API calls
    const filterTimeout = setTimeout(() => {
      const filters = {};
      if (filterOrganization !== 'all') filters.organizationId = filterOrganization;
      if (filterType !== 'all') filters.type = filterType;
      if (filterPlot !== 'all') filters.plotId = filterPlot;
      if (filterDomain !== 'all') filters.domainId = filterDomain;
      if (filterCategory !== 'all') filters.category = filterCategory;
      if (filterVariety !== 'all') filters.variety = filterVariety;
      if (filterStatus !== 'all') filters.health = filterStatus;
      if (notUpdatedMonthly) filters.notUpdatedMonthly = 'true';
      if (hasRecentImages) filters.hasRecentImages = 'true';
      if (debouncedSearchTerm) filters.search = debouncedSearchTerm;

      console.log('PlantsList: Applying filters:', filters);
      console.log('PlantsList: filterStatus value:', filterStatus);
      console.log('PlantsList: urlParamsInitialized:', urlParamsInitialized);
      
      // Create a stable filter key to compare
      const filterKey = JSON.stringify(filters);
      
      // Check if filters have actually changed
      if (lastAppliedFilters.current === filterKey) {
        console.log('PlantsList: Filters unchanged, skipping reload');
        filteringInProgress.current = false;
        return;
      }
      
      // Check if filters are actually applied (not all default)
      const hasFilters = Object.keys(filters).length > 0;
      
      // On first run, only reload if there are actual filters from URL params
      // Otherwise, use the plants already loaded by ApiContext to prevent flicker
      if (!initialFilterApplied.current) {
        console.log('PlantsList: Initial filter application - hasFilters:', hasFilters);
        initialFilterApplied.current = true;
        if (!hasFilters) {
          console.log('PlantsList: No filters on initial load - using plants from ApiContext');
          lastAppliedFilters.current = filterKey;
          filteringInProgress.current = false;
          return;
        }
      }
      
      // Store the current filters
      lastAppliedFilters.current = filterKey;
      
      // Reset infinite scroll and load first page
      // Only clear existing plants if filters are being applied
      resetPlantsInfiniteScroll(filters, hasFilters);
      
      // Reset the filtering flag
      filteringInProgress.current = false;
    }, 300); // 300ms debounce

    // Cleanup function to cancel timeout if dependencies change
    return () => {
      clearTimeout(filterTimeout);
      filteringInProgress.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterOrganization, filterType, filterPlot, filterDomain, filterCategory, filterVariety, filterStatus, notUpdatedMonthly, hasRecentImages, debouncedSearchTerm, urlParamsInitialized]);
  // Note: resetPlantsInfiniteScroll and resetAllFilters are intentionally omitted from deps to prevent infinite loops

  // Handle loading more plants
  const handleLoadMore = useCallback(() => {
    const filters = {};
    if (filterOrganization !== 'all') filters.organizationId = filterOrganization;
    if (filterType !== 'all') filters.type = filterType;
    if (filterPlot !== 'all') filters.plotId = filterPlot;
    if (filterDomain !== 'all') filters.domainId = filterDomain;
    if (filterCategory !== 'all') filters.category = filterCategory;
    if (filterVariety !== 'all') filters.variety = filterVariety;
    if (filterStatus !== 'all') filters.health = filterStatus;
    if (notUpdatedMonthly) filters.notUpdatedMonthly = 'true';
    if (hasRecentImages) filters.hasRecentImages = 'true';
    if (debouncedSearchTerm) filters.search = debouncedSearchTerm;
    
    loadMorePlants(filters);
  }, [filterOrganization, filterType, filterPlot, filterDomain, filterCategory, filterVariety, filterStatus, notUpdatedMonthly, hasRecentImages, debouncedSearchTerm, loadMorePlants]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-plant-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading plants...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 dark:text-red-400 mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Error loading plants</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Plants</h1>
          {notUpdatedMonthly && (
            <p className="text-sm text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              Showing plants not updated in the last month
            </p>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="btn-secondary flex items-center space-x-1 sm:space-x-2 flex-1 sm:flex-none"
              disabled={plants.length === 0}
            >
              <Download size={16} className="sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Export</span>
            </button>
            
            <button
              onClick={() => setShowCSVImportModal(true)}
              className="btn-secondary flex items-center space-x-1 sm:space-x-2 flex-1 sm:flex-none"
            >
              <Upload size={16} className="sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Import</span>
            </button>
          </div>
          
          {canAddPlant() && (
            <button
              onClick={openAddModal}
              className="btn-primary flex items-center justify-center space-x-1 sm:space-x-2"
            >
              <Plus size={16} className="sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Add Plant</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card relative">
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

          {/* Plant Count Display */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Showing <span className="font-semibold text-plant-green-600 dark:text-plant-green-400">{plants.length}</span> {plants.length === 1 ? 'plant' : 'plants'}
              </span>
            </div>
          </div>

          {/* Collapsible Filters */}
          <div className={`transition-all duration-300 ease-in-out relative ${
            filtersExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
          }`}>
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
                  <Map className={`h-4 w-4 flex-shrink-0 ${filterPlot !== 'all' ? 'text-blue-500' : 'text-gray-400'}`} />
                  <SearchableDropdown
                    options={[
                      { value: 'all', label: 'All Plots' },
                      ...availablePlots.map(plot => ({ value: plot._id, label: plot.name }))
                    ]}
                    value={filterPlot}
                    onChange={(e) => {
                      setFilterPlot(e.target.value);
                    }}
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
                      ...categories.map(category => ({ value: category.name, label: category.displayName }))
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
                    onChange={(e) => setFilterStatus(e.target.value)}
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

      {/* Plants Grid */}
      {plants.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4 bg-emoji">🌱</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No plants found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm || filterOrganization !== 'all' || filterType !== 'all' || filterPlot !== 'all' || filterDomain !== 'all' || filterCategory !== 'all' || filterVariety !== 'all' || filterStatus !== 'all' || notUpdatedMonthly
              ? 'Try adjusting your search criteria or filters.'
              : 'Get started by adding your first plant!'
            }
          </p>
          {!searchTerm && filterOrganization === 'all' && filterType === 'all' && filterPlot === 'all' && filterDomain === 'all' && filterCategory === 'all' && filterVariety === 'all' && filterStatus === 'all' && !notUpdatedMonthly && (
            <button
              onClick={() => navigate('/plants/add')}
              className="btn-primary"
            >
              Add Your First Plant
            </button>
          )}
        </div>
      ) : (
        <InfiniteScroll
          onLoadMore={handleLoadMore}
          hasMore={plantsInfiniteScroll.hasMore}
          loading={plantsInfiniteScroll.loadingMore}
          threshold={200}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
            {plants.map(plant => {
              try {
                // Safety check to prevent null reference errors
                if (!plant || !plant._id) {
                  console.warn('Skipping plant with missing data:', plant);
                  return null;
                }
                
                return (
                  <PlantCard
                    key={plant._id}
                    plant={plant}
                    onUpdate={handleUpdatePlant}
                    onDelete={confirmDeletePlant}
                    onAddStatus={handleAddPlantStatusUpdate}
                    onEdit={openEditModal}
                    onStatus={openStatusModal}
                    onPhotos={openPhotosModal}
                    onHistory={openHistoryModal}
                    plotName={plant.plotId?.name || getPlotName(plant.plotId)}
                    domainName={plant.domainId?.name || getDomainName(plant.domainId)}
                    plantedByUser={plant.planter || (plant.plantedBy?.firstName && plant.plantedBy?.lastName ? `${plant.plantedBy.firstName} ${plant.plantedBy.lastName}` : getPlantedByUser(plant.plantedBy))}
                    user={user}
                    canEdit={plant.editable !== undefined ? plant.editable : canEditPlant(plant)}
                    canDelete={plant.editable !== undefined ? plant.editable : canDeletePlant(plant)}
                  />
                );
              } catch (error) {
                console.error('Error rendering plant card:', error, plant);
                return null;
              }
            })}
          </div>
        </InfiniteScroll>
      )}


      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={showCSVImportModal}
        onClose={() => setShowCSVImportModal(false)}
        onImport={handleImportCSV}
        loading={csvImportLoading}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setPlantToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Plant"
        message="Are you sure you want to delete the plant"
        itemName={plantToDelete?.name}
        confirmText="Delete"
        cancelText="Cancel"
        type="delete"
      />
    </div>
  );
}

export default PlantsList; 