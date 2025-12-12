import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Search, Filter, ChevronDown, ChevronUp, Leaf, Sprout } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../../contexts/ApiContext';
import ConfirmationDialog from '../common/ConfirmationDialog';

import AddPlantTypeModal from './AddPlantTypeModal';
import AddPlantVarietyModal from './AddPlantVarietyModal';
import EditPlantTypeModal from './EditPlantTypeModal';
import EditPlantVarietyModal from './EditPlantVarietyModal';
import AddCategoryModal from '../Categories/AddCategoryModal';

function PlantTypesList({ user, showAddModal = false, showEditModal = false, showVarieties = false, showAddVarietyModalProp = false, showEditVarietyModalProp = false, showAddCategoryModal: showAddCategoryModalProp = false }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { api } = useApi();
  const [plantTypes, setPlantTypes] = useState([]);
  const [plantVarieties, setPlantVarieties] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedPlantType, setSelectedPlantType] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [expandedTypes, setExpandedTypes] = useState(new Set());
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Modal states
  const [showAddTypeModal, setShowAddTypeModal] = useState(showAddModal);
  const [showAddVarietyModal, setShowAddVarietyModal] = useState(showAddVarietyModalProp);
  const [showEditTypeModal, setShowEditTypeModal] = useState(showEditModal);
  const [showEditVarietyModal, setShowEditVarietyModal] = useState(showEditVarietyModalProp);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(showAddCategoryModalProp);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ show: false, item: null, type: '' });

  // Debounce search term to prevent re-renders on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle URL parameter changes
  useEffect(() => {
    setShowAddTypeModal(showAddModal);
  }, [showAddModal]);

  useEffect(() => {
    setShowEditTypeModal(showEditModal);
  }, [showEditModal]);

  useEffect(() => {
    setShowAddVarietyModal(showAddVarietyModalProp);
  }, [showAddVarietyModalProp]);

  useEffect(() => {
    setShowEditVarietyModal(showEditVarietyModalProp);
  }, [showEditVarietyModalProp]);

  useEffect(() => {
    setShowAddCategoryModal(showAddCategoryModalProp);
  }, [showAddCategoryModalProp]);

  // Handle edit modal when URL has ID
  useEffect(() => {
    if (id && (showEditModal || showEditVarietyModalProp)) {
      if (showVarieties) {
        const varietyToEdit = plantVarieties.find(v => v._id === id);
        if (varietyToEdit) {
          setEditingItem(varietyToEdit);
          setShowEditVarietyModal(true);
        }
      } else {
        const typeToEdit = plantTypes.find(t => t._id === id);
        if (typeToEdit) {
          setEditingItem(typeToEdit);
          setShowEditTypeModal(true);
        }
      }
    }
  }, [id, showEditModal, showEditVarietyModalProp, showVarieties, plantTypes, plantVarieties]);

  // Create categories array from database categories
  const categories = [
    { value: 'all', label: 'All Categories' },
    ...dbCategories.map(category => ({
      value: category.name,
      label: category.displayName
    }))
  ];

  // Debug logging for categories dropdown
  console.log('Debug - categories dropdown:', categories);

  // Permission checking functions
  const canCreatePlantType = () => {
    if (!user || !user.role) return false;
    return ['super_admin', 'org_admin', 'domain_admin', 'application_user'].includes(user.role);
  };

  const canEditPlantType = (plantType) => {
    if (!user || !user.role) return false;
    
    // Super admin can edit any plant type
    if (user.role === 'super_admin') return true;
    
    // Org admin can edit any plant type in their organization
    if (user.role === 'org_admin') {
      const userOrgId = user.organizationId?._id || user.organizationId;
      const plantTypeOrgId = plantType.organizationId?._id || plantType.organizationId;
      return String(userOrgId) === String(plantTypeOrgId);
    }
    
    // Domain admin can edit any plant type within their domain
    if (user.role === 'domain_admin') {
      const userOrgId = user.organizationId?._id || user.organizationId;
      const plantTypeOrgId = plantType.organizationId?._id || plantType.organizationId;
      return String(userOrgId) === String(plantTypeOrgId);
    }
    
    // Application user can only edit plant types they created
    if (user.role === 'application_user') {
      const userOrgId = user.organizationId?._id || user.organizationId;
      const plantTypeOrgId = plantType.organizationId?._id || plantType.organizationId;
      const plantTypeCreatedBy = plantType.createdBy?._id || plantType.createdBy;
      return String(userOrgId) === String(plantTypeOrgId) &&
             String(plantTypeCreatedBy) === String(user._id);
    }
    
    return false;
  };

  const canDeletePlantType = (plantType) => {
    if (!user || !user.role) return false;
    
    // Super admin can delete any plant type
    if (user.role === 'super_admin') return true;
    
    // Org admin can delete any plant type in their organization
    if (user.role === 'org_admin') {
      const userOrgId = user.organizationId?._id || user.organizationId;
      const plantTypeOrgId = plantType.organizationId?._id || plantType.organizationId;
      return String(userOrgId) === String(plantTypeOrgId);
    }
    
    // Domain admin can delete any plant type within their domain
    if (user.role === 'domain_admin') {
      const userOrgId = user.organizationId?._id || user.organizationId;
      const plantTypeOrgId = plantType.organizationId?._id || plantType.organizationId;
      return String(userOrgId) === String(plantTypeOrgId);
    }
    
    // Application user can only delete plant types they created
    if (user.role === 'application_user') {
      const userOrgId = user.organizationId?._id || user.organizationId;
      const plantTypeOrgId = plantType.organizationId?._id || plantType.organizationId;
      const plantTypeCreatedBy = plantType.createdBy?._id || plantType.createdBy;
      return String(userOrgId) === String(plantTypeOrgId) &&
             String(plantTypeCreatedBy) === String(user._id);
    }
    
    return false;
  };

  const canCreatePlantVariety = () => {
    if (!user || !user.role) return false;
    return ['super_admin', 'org_admin', 'domain_admin', 'application_user'].includes(user.role);
  };

  const canEditPlantVariety = (plantVariety) => {
    if (!user || !user.role) return false;
    
    // Super admin can edit any plant variety
    if (user.role === 'super_admin') return true;
    
    // Org admin can edit any plant variety in their organization
    if (user.role === 'org_admin') {
      const userOrgId = user.organizationId?._id || user.organizationId;
      const plantVarietyOrgId = plantVariety.organizationId?._id || plantVariety.organizationId;
      return String(userOrgId) === String(plantVarietyOrgId);
    }
    
    // Domain admin can edit any plant variety within their domain
    if (user.role === 'domain_admin') {
      const userOrgId = user.organizationId?._id || user.organizationId;
      const plantVarietyOrgId = plantVariety.organizationId?._id || plantVariety.organizationId;
      return String(userOrgId) === String(plantVarietyOrgId);
    }
    
    // Application user can only edit plant varieties they created
    if (user.role === 'application_user') {
      const userOrgId = user.organizationId?._id || user.organizationId;
      const plantVarietyOrgId = plantVariety.organizationId?._id || plantVariety.organizationId;
      const plantVarietyCreatedBy = plantVariety.createdBy?._id || plantVariety.createdBy;
      return String(userOrgId) === String(plantVarietyOrgId) &&
             String(plantVarietyCreatedBy) === String(user._id);
    }
    
    return false;
  };

  const canDeletePlantVariety = (plantVariety) => {
    if (!user || !user.role) return false;
    
    // Super admin can delete any plant variety
    if (user.role === 'super_admin') return true;
    
    // Org admin can delete any plant variety in their organization
    if (user.role === 'org_admin') {
      const userOrgId = user.organizationId?._id || user.organizationId;
      const plantVarietyOrgId = plantVariety.organizationId?._id || plantVariety.organizationId;
      return String(userOrgId) === String(plantVarietyOrgId);
    }
    
    // Domain admin can delete any plant variety within their domain
    if (user.role === 'domain_admin') {
      const userOrgId = user.organizationId?._id || user.organizationId;
      const plantVarietyOrgId = plantVariety.organizationId?._id || plantVariety.organizationId;
      return String(userOrgId) === String(plantVarietyOrgId);
    }
    
    // Application user can only delete plant varieties they created
    if (user.role === 'application_user') {
      const userOrgId = user.organizationId?._id || user.organizationId;
      const plantVarietyOrgId = plantVariety.organizationId?._id || plantVariety.organizationId;
      const plantVarietyCreatedBy = plantVariety.createdBy?._id || plantVariety.createdBy;
      return String(userOrgId) === String(plantVarietyOrgId) &&
             String(plantVarietyCreatedBy) === String(user._id);
    }
    
    return false;
  };

  // Load plant types and varieties
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('=== loadData function called ===');
      console.log('Loading plant types and varieties...');
      console.log('API object:', api ? 'Present' : 'Missing');
      console.log('Auth token:', api?.getAuthToken() ? 'Present' : 'Missing');
      
      // Ensure API is available
      if (!api) {
        console.error('API not available');
        throw new Error('API service not available');
      }
      
      // Wait a bit for API context to be ready
      if (!api.getAuthToken()) {
        console.log('Waiting for API to be ready...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!api.getAuthToken()) {
          throw new Error('API service not ready - no auth token available');
        }
      }
      
      // Build parameters for plant types API
      const plantTypesParams = { search: debouncedSearchTerm };
      if (categoryFilter !== 'all') {
        plantTypesParams.category = categoryFilter;
      }
      
      // Add cache-busting parameter to force fresh data
      const cacheBuster = Date.now();
      const [typesRes, varietiesRes, categoriesRes] = await Promise.all([
        api.getAllPlantTypes({ ...plantTypesParams, _t: cacheBuster }), // Fetch all plant types
        api.getAllPlantVarieties({ search: debouncedSearchTerm, _t: cacheBuster }), // Fetch all varieties
        api.getAllCategories() // Fetch all categories
      ]);

      console.log('LoadData - Plant types response:', typesRes);
      console.log('LoadData - Plant varieties response:', varietiesRes);

      if (typesRes.success) {
        console.log('Setting plant types:', typesRes.data.length, 'types');
        setPlantTypes(typesRes.data);
      } else {
        console.error('Plant types API failed:', typesRes);
        throw new Error('Failed to load plant types');
      }

      if (varietiesRes.success) {
        console.log('Setting plant varieties:', varietiesRes.data.length, 'varieties');
        setPlantVarieties(varietiesRes.data);
      } else {
        console.error('Plant varieties API failed:', varietiesRes);
        throw new Error('Failed to load plant varieties');
      }

      if (categoriesRes.success) {
        console.log('Setting categories:', categoriesRes.data.length, 'categories');
        console.log('Categories data:', categoriesRes.data);
        setDbCategories(categoriesRes.data);
      } else {
        console.error('Categories API failed:', categoriesRes);
        throw new Error('Failed to load categories');
      }
    } catch (error) {
      console.error('Failed to load plant types and varieties:', error);
      const errorMessage = error.message || 'Failed to load plant types and varieties';
      window.showNotification({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  }, [api, debouncedSearchTerm, categoryFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Keep plant types collapsed by default - removed auto-expand

  // Handle search and filter changes
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryFilterChange = (e) => {
    setCategoryFilter(e.target.value);
  };

  // Toggle expanded state for categories
  const toggleCategoryExpanded = (category) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Toggle expanded state for plant types
  const toggleTypeExpanded = (plantTypeId) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(plantTypeId)) {
      newExpanded.delete(plantTypeId);
    } else {
      newExpanded.add(plantTypeId);
    }
    setExpandedTypes(newExpanded);
  };

  // Get varieties for a specific plant type
  const getVarietiesForType = (plantTypeId) => {
    const filteredVarieties = plantVarieties.filter(variety => {
      // Handle both object and string plantTypeId
      const varietyTypeId = typeof variety.plantTypeId === 'object' ? variety.plantTypeId._id : variety.plantTypeId;
      return varietyTypeId === plantTypeId;
    });
    
    return filteredVarieties;
  };

  // Handle add plant type
  const handleAddPlantType = async (plantTypeData) => {
    console.log('=== handleAddPlantType function called ===');
    console.log('Received plant type data from modal:', plantTypeData);
    
    // The modal already created the plant type, so we just need to update our state
    try {
      window.showNotification({
        type: 'success',
        message: 'Plant type created successfully'
      });
      setShowAddTypeModal(false);
      
      console.log('Reloading data after plant type creation...');
      
      // Call plant types API to get fresh data
      console.log('About to call api.getPlantTypes...');
      console.log('API object available:', !!api);
      console.log('API.getPlantTypes available:', typeof api.getPlantTypes);
      try {
        const typesResponse = await api.getAllPlantTypes();
        console.log('Plant types API response:', typesResponse);
        if (typesResponse.success) {
          console.log('Fresh plant types data:', typesResponse.data.length, 'types');
          setPlantTypes(typesResponse.data);
        } else {
          console.error('Failed to fetch fresh plant types data:', typesResponse);
        }
      } catch (apiError) {
        console.error('Error calling plant types API:', apiError);
      }
      
      // Call variety API to get fresh data
      console.log('About to call api.getAllPlantVarieties...');
      try {
        const varietiesResponse = await api.getAllPlantVarieties();
        console.log('Varieties API response:', varietiesResponse);
        if (varietiesResponse.success) {
          console.log('Fresh varieties data:', varietiesResponse.data.length, 'varieties');
          setPlantVarieties(varietiesResponse.data);
        } else {
          console.error('Failed to fetch fresh varieties data:', varietiesResponse);
        }
      } catch (apiError) {
        console.error('Error calling varieties API:', apiError);
      }
      
      // Force a re-render by updating a state variable
      setForceUpdate(prev => prev + 1);
      console.log('Force update triggered');
    } catch (error) {
      console.error('Error updating state after plant type creation:', error);
      window.showNotification({
        type: 'error',
        message: 'Failed to update plant type list'
      });
    }
  };

  // Handle add category
  const handleAddCategory = async (categoryData) => {
    console.log('=== handleAddCategory function called ===');
    console.log('Received category data from modal:', categoryData);
    
    try {
      window.showNotification({
        type: 'success',
        message: 'Category created successfully'
      });
      setShowAddCategoryModal(false);
      
      console.log('Reloading data after category creation...');
      
      // Call categories API to get fresh data
      try {
        const categoriesResponse = await api.getAllCategories();
        console.log('Categories API response:', categoriesResponse);
        if (categoriesResponse.success) {
          console.log('Fresh categories data:', categoriesResponse.data.length, 'categories');
          setDbCategories(categoriesResponse.data);
        } else {
          console.error('Failed to fetch fresh categories data:', categoriesResponse);
        }
      } catch (apiError) {
        console.error('Error calling categories API:', apiError);
      }
      
      // Force a re-render by updating a state variable
      setForceUpdate(prev => prev + 1);
      console.log('Force update triggered');
    } catch (error) {
      console.error('Error updating state after category creation:', error);
      window.showNotification({
        type: 'error',
        message: 'Failed to update category list'
      });
    }
  };

  // Handle add plant variety
  const handleAddPlantVariety = async (varietyData) => {
    console.log('=== handleAddPlantVariety function called ===');
    console.log('Received variety data from modal:', varietyData);
    
    // The modal already created the variety, so we just need to update our state
    try {
      window.showNotification({
        type: 'success',
        message: 'Plant variety created successfully'
      });
      setShowAddVarietyModal(false);
      
      console.log('Reloading data after variety creation...');
      
      // Call variety API to get fresh data
      console.log('About to call api.getPlantVarieties...');
      console.log('API object available:', !!api);
      console.log('API.getPlantVarieties available:', typeof api.getPlantVarieties);
      try {
        const varietiesResponse = await api.getPlantVarieties({ limit: 100 });
        console.log('Varieties API response:', varietiesResponse);
        if (varietiesResponse.success) {
          console.log('Fresh varieties data:', varietiesResponse.data.length, 'varieties');
          setPlantVarieties(varietiesResponse.data);
        } else {
          console.error('Failed to fetch fresh varieties data:', varietiesResponse);
        }
      } catch (apiError) {
        console.error('Error calling varieties API:', apiError);
      }
      
      // Force a re-render by updating a state variable
      setForceUpdate(prev => prev + 1);
      console.log('Force update triggered');
    } catch (error) {
      console.error('Error updating state after variety creation:', error);
      window.showNotification({
        type: 'error',
        message: 'Failed to update variety list'
      });
    }
  };

  // Handle edit plant type
  const handleEditPlantType = async (id, plantTypeData) => {
    try {
      const response = await api.updatePlantType(id, plantTypeData);
      if (response.success) {
        window.showNotification({
          type: 'success',
          message: 'Plant type updated successfully'
        });
        setShowEditTypeModal(false);
        setEditingItem(null);
        
        // Call variety API to get fresh data
        console.log('Reloading data after plant type update...');
        const varietiesResponse = await api.getPlantVarieties({ limit: 100 });
        if (varietiesResponse.success) {
          console.log('Fresh varieties data after type update:', varietiesResponse.data.length, 'varieties');
          setPlantVarieties(varietiesResponse.data);
        }
        
        loadData();
      }
    } catch (error) {
      window.showNotification({
        type: 'error',
        message: error.message || 'Failed to update plant type'
      });
    }
  };

  // Handle edit plant variety
  const handleEditPlantVariety = async (id, varietyData) => {
    try {
      const response = await api.updatePlantVariety(id, varietyData);
      if (response.success) {
        window.showNotification({
          type: 'success',
          message: 'Plant variety updated successfully'
        });
        setShowEditVarietyModal(false);
        setEditingItem(null);
        
        // Call variety API to get fresh data
        console.log('Reloading data after plant variety update...');
        const varietiesResponse = await api.getPlantVarieties({ limit: 100 });
        if (varietiesResponse.success) {
          console.log('Fresh varieties data after variety update:', varietiesResponse.data.length, 'varieties');
          setPlantVarieties(varietiesResponse.data);
        }
        
        loadData();
      }
    } catch (error) {
      window.showNotification({
        type: 'error',
        message: error.message || 'Failed to update plant variety'
      });
    }
  };

  // Handle delete
  const handleDelete = async () => {
    const { item, type } = deleteDialog;
    try {
      let response;
      if (type === 'type') {
        response = await api.deletePlantType(item._id);
      } else {
        response = await api.deletePlantVariety(item._id);
      }

      if (response.success) {
        window.showNotification({
          type: 'success',
          message: `${type === 'type' ? 'Plant type' : 'Plant variety'} deleted successfully`
        });
        setDeleteDialog({ show: false, item: null, type: '' });
        
        // Call variety API to get fresh data
        console.log('Reloading data after deletion...');
        const varietiesResponse = await api.getPlantVarieties({ limit: 100 });
        if (varietiesResponse.success) {
          console.log('Fresh varieties data after deletion:', varietiesResponse.data.length, 'varieties');
          setPlantVarieties(varietiesResponse.data);
        }
        
        loadData();
      }
    } catch (error) {
      window.showNotification({
        type: 'error',
        message: error.message || `Failed to delete ${type === 'type' ? 'plant type' : 'plant variety'}`
      });
    }
  };

  // Open edit modal
  const openEditModal = (item, type) => {
    if (type === 'type') {
      navigate(`/plant-types/${item._id}/edit`);
    } else {
      navigate(`/plant-varieties/${item._id}/edit`);
    }
  };

  // Open add modal
  const openAddModal = (type) => {
    if (type === 'variety') {
      navigate('/plant-varieties/add');
    } else {
      navigate('/plant-types/add');
    }
  };

  // Open delete dialog
  const openDeleteDialog = (item, type) => {
    setDeleteDialog({ show: true, item, type });
  };

  // Group plant types by category
  const groupedPlantTypes = plantTypes.reduce((acc, type) => {
    if (!acc[type.category]) {
      acc[type.category] = [];
    }
    acc[type.category].push(type);
    return acc;
  }, {});

  // Filter and group based on search and category filter
  const filteredGroupedPlantTypes = Object.keys(groupedPlantTypes).reduce((acc, category) => {
    const filteredTypes = groupedPlantTypes[category].filter(type => {
      const matchesSearch = type.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           type.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || category === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    if (filteredTypes.length > 0) {
      acc[category] = filteredTypes;
    }
    return acc;
  }, {});

  // Add categories that don't have any plant types yet
  dbCategories.forEach(dbCategory => {
    const categoryName = dbCategory.name;
    const matchesCategory = categoryFilter === 'all' || categoryName === categoryFilter;
    
    if (matchesCategory && !filteredGroupedPlantTypes[categoryName]) {
      filteredGroupedPlantTypes[categoryName] = [];
    }
  });

  // Debug logging
  console.log('Debug - dbCategories:', dbCategories.map(c => c.name));
  console.log('Debug - groupedPlantTypes keys:', Object.keys(groupedPlantTypes));
  console.log('Debug - filteredGroupedPlantTypes keys:', Object.keys(filteredGroupedPlantTypes));

  // Get category display info
  const getCategoryInfo = (category) => {
    // First try to find the category in the database categories
    const dbCategory = dbCategories.find(cat => cat.name === category);
    if (dbCategory) {
      return {
        label: dbCategory.displayName,
        icon: dbCategory.emoji,
        color: 'text-gray-900' // Use default color since we have custom colors in the database
      };
    }
    
    // Fallback to hardcoded categories for backward compatibility
    const categoryLabels = {
      'vegetable': { label: 'Vegetables', icon: '🥬', color: 'text-green-600' },
      'herb': { label: 'Herbs', icon: '🌿', color: 'text-green-500' },
      'fruit': { label: 'Fruits', icon: '🍓', color: 'text-red-500' },
      'tree': { label: 'Trees', icon: '🌳', color: 'text-green-700' },
      'grain': { label: 'Grains', icon: '🌾', color: 'text-yellow-600' },
      'legume': { label: 'Legumes', icon: '🫘', color: 'text-orange-500' }
    };
    return categoryLabels[category] || { label: category, icon: '🌱', color: 'text-gray-600' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Plant Types & Varieties</h1>
          <p className="text-gray-600 dark:text-gray-400">Hierarchical view: Categories → Types → Varieties</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/plant-categories/add')}
              className="btn-secondary flex-1 sm:flex-none"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Add Category</span>
              <span className="sm:hidden ml-2">Category</span>
            </button>
            <button
              onClick={() => openAddModal('variety')}
              className="btn-secondary flex-1 sm:flex-none"
            >
              <Sprout className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Add Variety</span>
              <span className="sm:hidden ml-2">Variety</span>
            </button>
          </div>
          <button
            onClick={() => openAddModal('type')}
            className="btn-primary"
          >
            <Leaf className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Add Type</span>
            <span className="sm:hidden ml-2">Add Type</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search plant types and varieties..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="input-field pl-10"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={categoryFilter}
            onChange={handleCategoryFilterChange}
            className="input-field pl-10"
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hierarchical Plant Types & Varieties List */}
      <div className="space-y-4">
        {Object.keys(filteredGroupedPlantTypes).length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No plant types found</p>
          </div>
        ) : (
          Object.entries(filteredGroupedPlantTypes).map(([category, types]) => {
            const categoryInfo = getCategoryInfo(category);
            const isCategoryExpanded = expandedCategories.has(category);
            const totalVarieties = types.reduce((sum, type) => sum + getVarietiesForType(type._id).length, 0);
            
            return (
              <div key={category} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                {/* Category Header */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleCategoryExpanded(category)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {isCategoryExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                      <span className="text-2xl">{categoryInfo.icon}</span>
                      <div>
                        <h3 className={`font-semibold text-lg ${categoryInfo.color} dark:text-white`}>
                          {categoryInfo.label}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {types.length} type{types.length !== 1 ? 's' : ''} • {totalVarieties} variety{totalVarieties !== 1 ? 'ies' : ''}
                          {types.length === 0 && ' • No types yet'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedPlantType(null);
                          openAddModal('type');
                        }}
                        className="btn-secondary btn-sm"
                      >
                        <Leaf className="h-3 w-3 mr-1" />
                        Add Type
                      </button>
                    </div>
                  </div>
                </div>

                {/* Plant Types List */}
                {isCategoryExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-600">
                    {types.length === 0 && (
                      <div className="p-4 text-center">
                        <p className="text-gray-500 dark:text-gray-400">No plant types in this category yet</p>
                        <button
                          onClick={() => {
                            setSelectedPlantType(null);
                            openAddModal('type');
                          }}
                          className="mt-2 btn-secondary btn-sm"
                        >
                          <Leaf className="h-3 w-3 mr-1" />
                          Add First Type
                        </button>
                      </div>
                    )}
                    {types.map(plantType => {
                      const varieties = getVarietiesForType(plantType._id);
                      const isTypeExpanded = expandedTypes.has(plantType._id);
                      
                      return (
                        <div key={plantType._id} className="border-b border-gray-100 dark:border-gray-600 last:border-b-0">
                          {/* Plant Type Header */}
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => toggleTypeExpanded(plantType._id)}
                                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                  {isTypeExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </button>
                                <span className="text-xl">{plantType.emoji}</span>
                                <div>
                                  <h4 className="font-medium text-gray-900 dark:text-white">{plantType.name}</h4>
                                  {plantType.description && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{plantType.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {varieties.length} variety{varieties.length !== 1 ? 'ies' : ''}
                                </span>
                                <button
                                  onClick={() => openEditModal(plantType, 'type')}
                                  className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => openDeleteDialog(plantType, 'type')}
                                  className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Varieties List */}
                          {isTypeExpanded && (
                            <div className="bg-gray-50 dark:bg-gray-700">
                              <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h5 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                    <Sprout className="h-4 w-4" />
                                    Varieties
                                  </h5>
                                  <button
                                    onClick={() => {
                                      setSelectedPlantType(plantType);
                                      openAddModal('variety');
                                    }}
                                    className="btn-secondary btn-sm"
                                  >
                                    <Plus className="h-3 w-3" />
                                    Add Variety
                                  </button>
                                </div>
                                
                                {varieties.length === 0 ? (
                                  <p className="text-sm text-gray-500 dark:text-gray-400">No varieties added yet</p>
                                ) : (
                                  <div className="space-y-2">
                                    {varieties.map(variety => (
                                      <div key={variety._id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                                        <div className="flex-1">
                                          <p className="font-medium text-gray-900 dark:text-white">{variety.name}</p>
                                          {variety.description && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{variety.description}</p>
                                          )}
                                          {variety.characteristics && (
                                            <div className="flex gap-2 mt-1">
                                              {variety.characteristics.color && (
                                                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                                  {variety.characteristics.color}
                                                </span>
                                              )}
                                              {variety.characteristics.size && (
                                                <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                                                  {variety.characteristics.size}
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={() => openEditModal(variety, 'variety')}
                                            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                          >
                                            <Edit className="h-3 w-3" />
                                          </button>
                                          <button
                                            onClick={() => openDeleteDialog(variety, 'variety')}
                                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      {showAddCategoryModal && (
        <AddCategoryModal
          onClose={() => {
            setShowAddCategoryModal(false);
            navigate('/plant-types');
          }}
          onSuccess={handleAddCategory}
        />
      )}

      {showAddTypeModal && (
        <AddPlantTypeModal
          onClose={() => {
            setShowAddTypeModal(false);
            navigate('/plant-types');
          }}
          onAdd={handleAddPlantType}
        />
      )}

      {showAddVarietyModal && (
        <AddPlantVarietyModal
          onClose={() => {
            setShowAddVarietyModal(false);
            navigate('/plant-varieties');
          }}
          onAdd={handleAddPlantVariety}
          selectedPlantType={selectedPlantType}
          plantTypes={plantTypes}
        />
      )}

      {showEditTypeModal && editingItem && (
        <EditPlantTypeModal
          onClose={() => {
            setShowEditTypeModal(false);
            navigate('/plant-types');
          }}
          onUpdate={handleEditPlantType}
          plantType={editingItem}
        />
      )}

      {showEditVarietyModal && editingItem && (
        <EditPlantVarietyModal
          onClose={() => {
            setShowEditVarietyModal(false);
            navigate('/plant-varieties');
          }}
          onUpdate={handleEditPlantVariety}
          plantVariety={editingItem}
          plantTypes={plantTypes}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialog.show && (
        <ConfirmationDialog
          isOpen={deleteDialog.show}
          onClose={() => setDeleteDialog({ show: false, item: null, type: '' })}
          onConfirm={handleDelete}
          title={`Delete ${deleteDialog.type === 'type' ? 'Plant Type' : 'Plant Variety'}`}
          message={`Are you sure you want to delete "${deleteDialog.item?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          confirmColor="red"
        />
      )}
    </div>
  );
}

export default PlantTypesList;
