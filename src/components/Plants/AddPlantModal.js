import React, { useState, useEffect, useCallback } from 'react';
import { Leaf, Calendar, Building, Loader2, User, Grid, Navigation, Upload, X, Image as ImageIcon } from 'lucide-react';
import { healthOptions, growthStages } from '../../data/plantsData';
import SearchableDropdown from '../common/SearchableDropdown';
import Dialog from '../common/Dialog';
import { formatErrorMessage } from '../../utils';
import api from '../../services/api';
import AddPlantTypeModal from '../PlantTypes/AddPlantTypeModal';
import AddPlantVarietyModal from '../PlantTypes/AddPlantVarietyModal';
import AddCategoryModal from '../Categories/AddCategoryModal';
import MapboxMapPicker from '../MapView/MapboxMapPicker';
import { calculateDistance, formatDistance } from '../../utils/locationUtils';

function AddPlantModal({ onClose, onAdd, organizations = [], domains = [], plots = [], user, getDomainName, plant = null, isEdit = false }) {
  console.log('AddPlantModal: Component mounted/rendered, isEdit:', isEdit, 'plant:', plant);
  
  // For testing different roles - change this value to test different roles
  const currentUser = {
    ...user,
    role: user?.role || 'super_admin' // Change this to test: 'super_admin', 'org_admin', 'domain_admin', 'application_user'
  };

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    variety: '',
    description: '', // Description field not in plant schema
    category: '', // No default category selected
    organizationId: '',
    domainId: '',
    plotId: '',
    plantedDate: new Date().toISOString().split('T')[0],
    health: 'excellent',
    growthStage: 'seedling',
    image: '🌱',
    planter: '',
    latitude: '',
    longitude: '',
  });
  
  // Update form data when plant data becomes available
  useEffect(() => {
    console.log('AddPlantModal: useEffect triggered, isEdit:', isEdit, 'plant:', plant);
    console.log('AddPlantModal: plant data structure:', plant ? {
      name: plant.name,
      type: plant.type,
      variety: plant.variety,
      category: plant.category,
      organizationId: plant.organizationId,
      domainId: plant.domainId,
      plotId: plant.plotId,
      planter: plant.planter,
      plantedDate: plant.plantedDate
    } : 'No plant data');
    
    if (isEdit && plant) {
      console.log('AddPlantModal: Updating form data with plant data:', plant);
      const newFormData = {
        name: plant.name || '',
        type: plant.type || '',
        variety: plant.variety || '',
        description: '', // Description field not in plant schema
        category: plant.category || '',
        organizationId: plant.organizationId?._id || plant.organizationId || '',
        domainId: plant.domainId?._id || plant.domainId || '',
        plotId: plant.plotId?._id || plant.plotId || '',
        plantedDate: plant.plantedDate ? plant.plantedDate.split('T')[0] : new Date().toISOString().split('T')[0],
        health: plant.health || 'excellent',
        growthStage: plant.growthStage || 'seedling',
        image: plant.image || '🌱',
        planter: plant.planter || '',
        latitude: plant.latitude || '',
        longitude: plant.longitude || '',
      };
      
      console.log('AddPlantModal: Setting form data to:', newFormData);
      setFormData(newFormData);
      
      console.log('AddPlantModal: Form data updated:', {
        name: newFormData.name,
        type: newFormData.type,
        variety: newFormData.variety,
        category: newFormData.category,
        organizationId: newFormData.organizationId,
        domainId: newFormData.domainId,
        plotId: newFormData.plotId,
        planter: newFormData.planter,
      });
    }
  }, [isEdit, plant]);

  const [errors, setErrors] = useState({});

  const [availableDomains, setAvailableDomains] = useState([]);
  const [availablePlots, setAvailablePlots] = useState([]);
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [loadingPlots, setLoadingPlots] = useState(false);
  const [plantTypes, setPlantTypes] = useState([]);
  const [plantVarieties, setPlantVarieties] = useState([]);
  const [categories, setCategories] = useState([]);
  const [, setLoadingTypes] = useState(false);

  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [showAddVarietyModal, setShowAddVarietyModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);

  // Image upload state
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageInputType, setImageInputType] = useState('file'); // 'file' or 'url'
  const [imageUrl, setImageUrl] = useState('');

  // Load plant types, varieties, and categories
  useEffect(() => {
    const loadPlantData = async () => {
      setLoadingTypes(true);
      try {
        const [typesRes, varietiesRes, categoriesRes] = await Promise.all([
          api.getAllPlantTypes(),
          api.getAllPlantVarieties(),
          api.getAllCategories()
        ]);

        if (typesRes.success) {
          console.log('Loaded plant types:', typesRes.data);
          setPlantTypes(typesRes.data);
        } else {
          console.error('Plant types API failed:', typesRes);
        }

        if (varietiesRes.success) {
          console.log('Loaded plant varieties:', varietiesRes.data);
          setPlantVarieties(varietiesRes.data);
        } else {
          console.error('Plant varieties API failed:', varietiesRes);
        }

        if (categoriesRes.success) {
          console.log('Loaded categories:', categoriesRes.data);
          setCategories(categoriesRes.data);
        } else {
          console.error('Categories API failed:', categoriesRes);
        }
      } catch (error) {
        console.error('Failed to load plant data:', error);
      } finally {
        setLoadingTypes(false);
      }
    };

    loadPlantData();
  }, []);

  // Get available varieties based on selected type
  const getAvailableVarieties = () => {
    if (!formData.type) return [];
    const selectedType = plantTypes.find(type => type.name === formData.type);
    if (!selectedType) return [];
    
    const filteredVarieties = plantVarieties.filter(variety => {
      // Handle both ObjectId and string comparisons
      const varietyTypeId = typeof variety.plantTypeId === 'object' ? variety.plantTypeId._id : variety.plantTypeId;
      const selectedTypeId = selectedType._id;
      
      return varietyTypeId === selectedTypeId || variety.plantTypeName === selectedType.name;
    });
    
    return filteredVarieties.map(variety => variety.name);
  };



  // Handle successful type creation
  const handleTypeCreated = async (newType) => {
    // Reload plant types to include the new one
    try {
      const typesRes = await api.getAllPlantTypes();
      if (typesRes.success) {
        setPlantTypes(typesRes.data);
        // Auto-select the new type if it matches the current category
        if (newType.category === formData.category) {
          setFormData(prev => ({ ...prev, type: newType.name }));
        }
      }
    } catch (error) {
      console.error('Failed to reload plant types:', error);
    }
    setShowAddTypeModal(false);
  };

  // Handle successful variety creation
  const handleVarietyCreated = async (newVariety) => {
    // Add the new variety to the existing list
    setPlantVarieties(prev => [...prev, newVariety]);
    
    // Auto-select the new variety if it matches the current type
    const selectedType = plantTypes.find(type => type.name === formData.type);
    if (selectedType && newVariety.plantTypeId === selectedType._id) {
      setFormData(prev => ({ ...prev, variety: newVariety.name }));
    }
    
    setShowAddVarietyModal(false);
  };

  // Handle successful category creation
  const handleCategoryCreated = async (newCategory) => {
    // Add the new category to the existing list
    setCategories(prev => [...prev, newCategory]);
    
    // Auto-select the new category
    setFormData(prev => ({ ...prev, category: newCategory.name }));
    
    setShowAddCategoryModal(false);
  };

  // Load domains for a specific organization
  const loadDomainsForOrganization = useCallback(async (organizationId) => {
    setLoadingDomains(true);
    try {
      const response = await api.getDomains({ organizationId });
      if (response.success && response.data) {
        let filteredDomains = response.data;
        
        // Apply role-based filtering
        if (currentUser.role === 'domain_admin' || currentUser.role === 'application_user') {
          filteredDomains = filteredDomains.filter(domain => 
            domain._id === (currentUser.domainId?._id || currentUser.domainId)
          );
        }
        
        setAvailableDomains(filteredDomains);
      } else {
        setAvailableDomains([]);
      }
    } catch (error) {
      console.error('Failed to load domains:', error);
      setAvailableDomains([]);
      
      // Show error notification
      if (window.showNotification) {
        window.showNotification({
          type: 'error',
          message: 'Failed to load domains. Please try again.',
          duration: 3000
        });
      }
    } finally {
      setLoadingDomains(false);
    }
  }, [currentUser.role, currentUser.domainId]);

  // Load plots for a specific domain
  const loadPlotsForDomain = useCallback(async (domainId) => {
    console.log('Loading plots for domain:', domainId);
    setLoadingPlots(true);
    try {
      const response = await api.getPlots({ domainId });
      console.log('Plots API response:', response);
      if (response.success && response.data) {
        let filteredPlots = response.data;
        console.log('All plots for domain:', filteredPlots);
        
        // Apply role-based filtering
        if (currentUser.role === 'application_user') {
          filteredPlots = filteredPlots.filter(plot => 
            plot._id === (currentUser.plotId?._id || currentUser.plotId)
          );
          console.log('Filtered plots for application user:', filteredPlots);
        }
        
        setAvailablePlots(filteredPlots);
        console.log('Set available plots:', filteredPlots);
      } else {
        console.log('No plots found or API failed');
        setAvailablePlots([]);
      }
    } catch (error) {
      console.error('Failed to load plots:', error);
      setAvailablePlots([]);
    } finally {
      setLoadingPlots(false);
    }
  }, [currentUser.role, currentUser.plotId]);

  // Initialize form data based on user role
  useEffect(() => {
    const initializeFormData = () => {
      let initialData = {
        name: '',
        type: '',
        variety: '',
        description: '',
        category: '',
        organizationId: '',
        domainId: '',
        plotId: '',
        plantedDate: new Date().toISOString().split('T')[0],
        health: 'excellent',
        growthStage: 'seedling',
        image: '🌱',
        planter: '',
        latitude: '',
        longitude: '',
      };

      // Auto-select organization for non-super_admin roles
      if (currentUser.role !== 'super_admin' && currentUser.organizationId) {
        initialData.organizationId = currentUser.organizationId._id || currentUser.organizationId;
      }

      // Auto-select domain for domain_admin and application_user roles
      if ((currentUser.role === 'domain_admin' || currentUser.role === 'application_user') && currentUser.domainId) {
        initialData.domainId = currentUser.domainId._id || currentUser.domainId;
      }

      // Auto-select plot for application_user role only
      if (currentUser.role === 'application_user' && currentUser.plotId) {
        initialData.plotId = currentUser.plotId._id || currentUser.plotId;
      }
      // For domain_admin, don't auto-select plot - they have access to all plots in their domain

      setFormData(initialData);
      
      // Load initial data based on auto-selected values
      if (initialData.organizationId) {
        loadDomainsForOrganization(initialData.organizationId);
      }
      if (initialData.domainId) {
        loadPlotsForDomain(initialData.domainId);
      }
    };

    initializeFormData();
  }, [currentUser.role, currentUser.organizationId, currentUser.domainId, currentUser.plotId, loadDomainsForOrganization, loadPlotsForDomain]);

  // Load related data when form data changes (for edit mode)
  useEffect(() => {
    if (isEdit && formData.organizationId && formData.organizationId !== '') {
      console.log('AddPlantModal: Loading domains for organization (edit mode):', formData.organizationId);
      loadDomainsForOrganization(formData.organizationId);
    }
  }, [isEdit, formData.organizationId, loadDomainsForOrganization]);

  useEffect(() => {
    if (isEdit && formData.domainId && formData.domainId !== '') {
      console.log('AddPlantModal: Loading plots for domain (edit mode):', formData.domainId);
      loadPlotsForDomain(formData.domainId);
    }
  }, [isEdit, formData.domainId, loadPlotsForDomain]);

  const handleChange = async (e) => {
    const { name, value } = e.target;
    
    // Clear error for this field
    setErrors(prev => ({ ...prev, [name]: '' }));
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Reset dependent fields when parent selection changes
    if (name === 'organizationId') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        domainId: '',
        plotId: ''
      }));
      
      // Load domains for the selected organization
      if (value) {
        await loadDomainsForOrganization(value);
      } else {
        setAvailableDomains([]);
        setAvailablePlots([]);
      }
    }

    if (name === 'domainId') {
      console.log('Domain changed to:', value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        plotId: ''
      }));
      
      // Load plots for the selected domain
      if (value) {
        console.log('Calling loadPlotsForDomain with:', value);
        await loadPlotsForDomain(value);
      } else {
        console.log('No domain selected, clearing plots');
        setAvailablePlots([]);
      }
    }

    // Reset type and image when category changes
    if (name === 'category') {
      setFormData(prev => ({
        ...prev,
        category: value,
        type: '',
        image: '🌱',
      }));
    }

    // Update emoji and reset variety when plant type changes
    if (name === 'type') {
      const selectedType = plantTypes.find(type => type.name === value);
      if (selectedType) {
        setFormData(prev => ({
          ...prev,
          type: value,
          variety: '', // Reset variety when type changes
          image: selectedType.emoji,
        }));
      }
    }
  };

  // Image handling functions
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, image: 'Please select a valid image file' }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'Image size must be less than 5MB' }));
        return;
      }

      setSelectedImage(file);
      setErrors(prev => ({ ...prev, image: '' }));

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageUrl('');
    setErrors(prev => ({ ...prev, image: '' }));
  };

  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setImageUrl(url);
    setErrors(prev => ({ ...prev, image: '' }));

    // Validate URL format
    if (url && !isValidImageUrl(url)) {
      setErrors(prev => ({ ...prev, image: 'Please enter a valid image URL' }));
      setImagePreview(null);
      return;
    }

    // Set preview if URL is valid
    if (url && isValidImageUrl(url)) {
      setImagePreview(url);
    } else if (!url) {
      setImagePreview(null);
    }
  };

  const isValidImageUrl = (url) => {
    try {
      const urlObj = new URL(url);
      const validProtocols = ['http:', 'https:'];
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      
      if (!validProtocols.includes(urlObj.protocol)) {
        return false;
      }

      // Check if URL ends with image extension or contains image-related paths
      const pathname = urlObj.pathname.toLowerCase();
      const hasImageExtension = validExtensions.some(ext => pathname.endsWith(ext));
      const hasImagePath = pathname.includes('/image') || pathname.includes('/img') || pathname.includes('/photo');
      
      // Check for common image hosting and sharing services
      const hostname = urlObj.hostname.toLowerCase();
      const isImageHostingService = [
        'unsplash.com',
        'imgur.com', 
        'cloudinary.com',
        'photos.app.goo.gl', // Google Photos sharing links
        'share.google.com', // Google Share links
        'drive.google.com', // Google Drive images
        'dropbox.com',
        'flickr.com',
        'instagram.com',
        'facebook.com',
        'twitter.com',
        'pinterest.com',
        'i.redd.it', // Reddit images
        'i.imgur.com' // Direct Imgur images
      ].some(service => hostname.includes(service));
      
      return hasImageExtension || hasImagePath || isImageHostingService;
    } catch {
      return false;
    }
  };

  const handleImageInputTypeChange = (type) => {
    setImageInputType(type);
    handleRemoveImage(); // Clear any existing image data
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Plant name is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.type) {
      newErrors.type = 'Plant type is required';
    }

    if (!formData.variety) {
      newErrors.variety = 'Variety is required';
    }

    if (!formData.organizationId) {
      newErrors.organizationId = 'Organization is required';
    }

    if (!formData.domainId) {
      newErrors.domainId = 'Domain is required';
    }

    // Plot is required for all roles except application_user (who have auto-assigned plots)
    if (!formData.plotId && currentUser.role !== 'application_user') {
      newErrors.plotId = 'Plot is required';
    }

    if (!formData.planter.trim()) {
      newErrors.planter = 'Planter name is required';
    }

    // Validate coordinates if provided
    if (formData.latitude && (parseFloat(formData.latitude) < -90 || parseFloat(formData.latitude) > 90)) {
      newErrors.latitude = 'Latitude must be between -90 and 90';
    }
    if (formData.longitude && (parseFloat(formData.longitude) < -180 || parseFloat(formData.longitude) > 180)) {
      newErrors.longitude = 'Longitude must be between -180 and 180';
    }

    // Validate plant location is within plot boundaries
    if (formData.latitude && formData.longitude && formData.plotId) {
      const plot = plots.find(p => p._id === formData.plotId);
      if (plot && plot.latitude && plot.longitude) {
        // Calculate plot dimensions based on size
        const plotSideLength = Math.sqrt(plot.size || 10000); // Default to 100m x 100m if no size
        const maxDistanceKm = (plotSideLength / 2) / 1000; // Convert to km
        
        const distance = calculateDistance(plot.latitude, plot.longitude, formData.latitude, formData.longitude);
        if (distance > maxDistanceKm) {
          newErrors.location = `Plant must be placed within the plot boundaries. Plot size: ${plot.size || 10000}m², maximum distance from center: ${formatDistance(maxDistanceKm)}. Current distance: ${formatDistance(distance)}`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    console.log('AddPlantModal: handleSubmit called');
    e.preventDefault();
    
    if (!validateForm()) {
      console.log('AddPlantModal: Form validation failed');
      return;
    }

    try {
      setIsUploadingImage(selectedImage ? true : false);
      
      let plantData = {
        ...formData,
        lastWatered: new Date().toISOString().split('T')[0],
      };
      
      // Remove description field as it's not in the plant schema
      delete plantData.description;
      
      // Add plant ID for edit mode
      if (isEdit && plant) {
        plantData._id = plant._id;
      }
      
      // Ensure domainId is included for domain_admin users
      if (currentUser.role === 'domain_admin' && formData.domainId) {
        plantData.domainId = formData.domainId;
      }
      
      // Debug logging
      console.log('AddPlantModal: Sending plant data:', {
        role: currentUser.role,
        organizationId: plantData.organizationId,
        domainId: plantData.domainId,
        plotId: plantData.plotId,
        fullData: plantData
      });
      
      // Handle image based on input type
      if (imageInputType === 'url' && imageUrl) {
        // For URLs, save directly in the plant's image field
        plantData.image = imageUrl;
      } else if (imageInputType === 'file' && selectedImage) {
        // For file uploads, we'll handle this after plant creation
        // Don't set plantData.image here, let the file upload handle it
      }

      const newPlant = plantData;
      const createdPlant = await onAdd(newPlant);
      
      // Upload file image if one was selected
      if (imageInputType === 'file' && selectedImage && createdPlant && createdPlant._id) {
        try {
          const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
          await api.uploadPlantImage(
            createdPlant._id,
            currentMonth,
            selectedImage,
            `Initial plant photo for ${formData.name}`
          );
          console.log('Image uploaded successfully for plant:', createdPlant._id);
        } catch (imageError) {
          console.error('Failed to upload image:', imageError);
          // Don't fail the entire operation if image upload fails
          if (window.showNotification) {
            window.showNotification({
              type: 'warning',
              message: 'Plant added successfully, but image upload failed. You can add the image later.',
              duration: 5000
            });
          }
        }
      }
      
      // Success notification is handled by the parent component
      // Close modal on success
      console.log('AddPlantModal: Calling onClose after successful plant creation');
      onClose();
    } catch (error) {
      console.error('AddPlantModal: Failed to add plant:', error);
      
      // Show error notification
      if (window.showNotification) {
        window.showNotification({
          type: 'error',
          message: formatErrorMessage(error),
          duration: 5000
        });
      }
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Get available options based on user role and current selections
  const getAvailableOrganizations = () => {
    if (currentUser.role === 'super_admin') {
      return organizations;
    }
    return organizations.filter(org => org._id === (currentUser.organizationId?._id || currentUser.organizationId));
  };

  // Check if fields should be disabled based on role
  const isOrganizationDisabled = () => {
    return currentUser.role !== 'super_admin';
  };

  const isDomainDisabled = () => {
    return currentUser.role === 'domain_admin' || currentUser.role === 'application_user';
  };

  const isPlotDisabled = () => {
    // Only application users have their plot auto-assigned and disabled
    return currentUser.role === 'application_user';
  };


  return (
    <>
      <Dialog
        isOpen={true}
        onClose={onClose}
        title={isEdit ? "Edit Plant" : "Add New Plant"}
        size="2xl"
        className="max-h-[95vh] overflow-y-auto mx-2 sm:mx-4"
      >
        <form onSubmit={handleSubmit} className="space-y-6" id="addPlantForm">
            {/* Plant Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Leaf className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`input-field pl-10 ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="e.g., Tomato Plant #1"
                  />
                </div>
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddCategoryModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                  >
                    + Add New Category
                  </button>
                </div>
                <SearchableDropdown
                  options={[
                    { value: '', label: 'Select a category' },
                    ...categories.map(category => ({ 
                      value: category.name, 
                      label: `${category.emoji} ${category.displayName}` 
                    }))
                  ]}
                  value={formData.category}
                  onChange={handleChange}
                  name="category"
                  placeholder="Select a category"
                  searchPlaceholder="Search categories..."
                  className={`input-field ${errors.category ? 'border-red-500' : ''}`}
                />
                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Type *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddTypeModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                  >
                    + Add New Type
                  </button>
                </div>
                <SearchableDropdown
                  options={[
                    { value: '', label: formData.category ? 'Select a type' : 'Select category first' },
                    ...(formData.category ? plantTypes
                      .filter(type => type.category === formData.category)
                      .map(type => ({ value: type.name, label: `${type.emoji} ${type.name}` })) : [])
                  ]}
                  value={formData.type}
                  onChange={handleChange}
                  name="type"
                  placeholder={formData.category ? "Select a type" : "Select category first"}
                  searchPlaceholder={formData.category ? "Search types..." : "Select category first"}
                  disabled={!formData.category}
                  className={`input-field ${errors.type ? 'border-red-500' : ''}`}
                />
                {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Variety *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddVarietyModal(true)}
                    disabled={!formData.type}
                    className={`text-xs ${formData.type ? 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300' : 'text-gray-400 cursor-not-allowed'}`}
                  >
                    + Add New Variety
                  </button>
                </div>
                <SearchableDropdown
                  options={getAvailableVarieties().map(variety => ({ value: variety, label: variety }))}
                  value={formData.variety}
                  onChange={handleChange}
                  name="variety"
                  placeholder={formData.type ? "Select variety..." : "Select plant type first"}
                  searchPlaceholder="Search varieties..."
                  disabled={!formData.type}
                  className="w-full"
                />
                {errors.variety && <p className="text-red-500 text-xs mt-1">{errors.variety}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="input-field"
                placeholder="Additional details about the plant..."
              />
            </div>

            {/* Hierarchy Selection */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Location Hierarchy</h3>
              
              {/* Organization Selection - Only for Super Admin */}
              {!isOrganizationDisabled() && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Organization *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                      <Building className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <select
                      name="organizationId"
                      value={formData.organizationId}
                      onChange={handleChange}
                      className={`input-field pl-10 ${errors.organizationId ? 'border-red-500' : ''}`}
                    >
                      <option value="">Select Organization</option>
                      {getAvailableOrganizations().map(org => (
                        <option key={org._id} value={org._id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.organizationId && <p className="text-red-500 text-xs mt-1">{errors.organizationId}</p>}
                </div>
              )}

              {/* Domain Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Domain *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <Navigation className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="relative">
                    <select
                      name="domainId"
                      value={formData.domainId}
                      onChange={handleChange}
                      disabled={isDomainDisabled() || !formData.organizationId || loadingDomains}
                      className={`input-field pl-10 ${(isDomainDisabled() || !formData.organizationId || loadingDomains) ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' : ''} ${errors.domainId ? 'border-red-500' : ''}`}
                    >
                      <option value="">
                        {loadingDomains ? 'Loading domains...' : 'Select Domain'}
                      </option>
                      {availableDomains.map(domain => (
                        <option key={domain._id} value={domain._id}>
                          {getDomainName(domain._id)}
                        </option>
                      ))}
                    </select>
                    {loadingDomains && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
                {isDomainDisabled() && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Domain is auto-selected based on your role
                  </p>
                )}
                {!formData.organizationId && !isDomainDisabled() && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Please select an organization first
                  </p>
                )}
                {errors.domainId && <p className="text-red-500 text-xs mt-1">{errors.domainId}</p>}
              </div>

              {/* Plot Selection - Show for all roles when domain is selected */}
              {formData.domainId && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Plot *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                      <Grid className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="relative">
                      <select
                        name="plotId"
                        value={formData.plotId}
                        onChange={handleChange}
                        disabled={isPlotDisabled() || loadingPlots}
                        className={`input-field pl-10 ${(isPlotDisabled() || loadingPlots) ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' : ''} ${errors.plotId ? 'border-red-500' : ''}`}
                      >
                        <option value="">
                          {loadingPlots ? 'Loading plots...' : 'Select Plot'}
                        </option>
                        {availablePlots.map(plot => (
                          <option key={plot._id} value={plot._id}>
                            {plot.name || `Plot ${plot.plotNumber || plot._id}`}
                          </option>
                        ))}
                        {availablePlots.length === 0 && !loadingPlots && (
                          <option value="" disabled>
                            No plots available
                          </option>
                        )}
                      </select>
                      {loadingPlots && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>
                  {isPlotDisabled() && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Plot is auto-selected based on your role
                    </p>
                  )}
                  {availablePlots.length === 0 && !loadingPlots && !isPlotDisabled() && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      No plots available for this domain
                    </p>
                  )}
                  {errors.plotId && <p className="text-red-500 text-xs mt-1">{errors.plotId}</p>}
                </div>
              )}
              

            </div>

            {/* Additional Details */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Plant Details</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Planted Date
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      type="date"
                      name="plantedDate"
                      value={formData.plantedDate}
                      onChange={handleChange}
                      className="input-field pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Health
                  </label>
                  <select
                    name="health"
                    value={formData.health}
                    onChange={handleChange}
                    className="input-field"
                  >
                    {healthOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Planter/Who Planted
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      type="text"
                      name="planter"
                      value={formData.planter}
                      onChange={handleChange}
                      className={`input-field pl-10 ${errors.planter ? 'border-red-500' : ''}`}
                      placeholder="e.g., John Doe, Gardener"
                    />
                  </div>
                  {errors.planter && (
                    <p className="text-red-500 text-sm mt-1">{errors.planter}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Growth Stage
                  </label>
                  <select
                    name="growthStage"
                    value={formData.growthStage}
                    onChange={handleChange}
                    className="input-field"
                  >
                    {growthStages.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Plant Image (Optional)
                </label>
                
                {/* Input Type Toggle */}
                <div className="flex space-x-1 mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => handleImageInputTypeChange('file')}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                      imageInputType === 'file'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Upload className="h-4 w-4 inline mr-2" />
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => handleImageInputTypeChange('url')}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                      imageInputType === 'url'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <ImageIcon className="h-4 w-4 inline mr-2" />
                    Image URL
                  </button>
                </div>

                <div className="space-y-3">
                  {imageInputType === 'file' ? (
                    // File Upload
                    !imagePreview ? (
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-green-400 dark:hover:border-green-500 transition-all duration-200 hover:bg-green-50 dark:hover:bg-green-900/10 group">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                          id="plant-image-upload"
                        />
                        <label
                          htmlFor="plant-image-upload"
                          className="cursor-pointer flex flex-col items-center space-y-3"
                        >
                          <div className="relative">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                              <Upload className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">+</span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium text-green-600 dark:text-green-400 group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors">
                              Click to upload
                            </span>
                            {' '}or drag and drop
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                            PNG, JPG, GIF up to 5MB
                          </div>
                        </label>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="h-16 w-16 rounded-lg overflow-hidden bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 flex items-center justify-center">
                                <img
                                  src={imagePreview}
                                  alt="Plant preview"
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {selectedImage?.name}
                                </p>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  <Upload className="h-3 w-3 mr-1" />
                                  File
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {(selectedImage?.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                ✓ Ready to upload with plant data
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  ) : (
                    // URL Input
                    <div className="space-y-3">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <ImageIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        </div>
                        <input
                          type="url"
                          value={imageUrl}
                          onChange={handleImageUrlChange}
                          className="input-field pl-10"
                          placeholder="https://share.google.com/... or https://example.com/image.jpg"
                        />
                      </div>
                      
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Supports: Direct image URLs, Google Share, Google Photos, Google Drive, Imgur, Unsplash, and other image hosting services
                      </div>
                      
                      {imagePreview && (
                        <div className="relative">
                          <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                            <div className="flex items-center space-x-4">
                              <div className="flex-shrink-0">
                                <div className="h-16 w-16 rounded-lg overflow-hidden bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 flex items-center justify-center relative">
                                  <img
                                    src={imagePreview}
                                    alt="Plant preview"
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      // Show a fallback icon for sharing links
                                      const fallbackIcon = e.target.parentElement.querySelector('.fallback-icon');
                                      if (fallbackIcon) {
                                        fallbackIcon.style.display = 'flex';
                                      }
                                    }}
                                  />
                                  {/* Fallback icon for sharing links */}
                                  <div className="fallback-icon absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center" style={{display: 'none'}}>
                                    <div className="text-center">
                                      <ImageIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                                      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Link</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                    {imageUrl.includes('photos.app.goo.gl') || imageUrl.includes('share.google.com') ? 'Google Photos Link' : 'Image URL'}
                                  </p>
                                  {(imageUrl.includes('photos.app.goo.gl') || imageUrl.includes('share.google.com')) && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                      <ImageIcon className="h-3 w-3 mr-1" />
                                      Shared
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {imageUrl}
                                </p>
                                {(imageUrl.includes('photos.app.goo.gl') || imageUrl.includes('share.google.com')) && (
                                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                    ✓ Link will be saved and accessible when viewing plant
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {errors.image && (
                    <p className="text-red-500 text-xs mt-1">{errors.image}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Location Selection */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Location Coordinates</h3>
              

                              <MapboxMapPicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                onLocationChange={(lat, lng, isValid) => {
                  setFormData(prev => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng
                  }));
                  // Clear validation error if location is valid
                  if (isValid) {
                    setErrors(prev => ({ ...prev, location: '' }));
                  }
                }}
                height="300px"
                placeholder="Click on the map to select the plant location"
                validationType="plant"
                validationCenter={(() => {
                  // Get the plot center for validation
                  if (formData.plotId) {
                    const plot = plots.find(p => p._id === formData.plotId);
                    if (plot && plot.latitude && plot.longitude) {
                      return { lat: plot.latitude, lng: plot.longitude };
                    }
                  }
                  return null;
                })()}
                domainBoundaries={(() => {
                  // Create domain boundary based on selected domain center
                  if (formData.domainId) {
                    const domain = domains.find(d => d._id === formData.domainId);
                    if (domain && domain.latitude && domain.longitude) {
                      console.log('Creating domain boundary for:', domain.name, 'at:', domain.latitude, domain.longitude);
                      // Create a circular boundary around domain center (1km radius)
                      const radius = 1; // 1km radius
                      const points = [];
                      const numPoints = 32;
                      
                      for (let i = 0; i < numPoints; i++) {
                        const angle = (i / numPoints) * 2 * Math.PI;
                        const lat = domain.latitude + (radius / 111.32) * Math.cos(angle);
                        const lng = domain.longitude + (radius / (111.32 * Math.cos(domain.latitude * Math.PI / 180))) * Math.sin(angle);
                        points.push({ lat, lng });
                      }
                      console.log('Domain boundary points:', points);
                      return points;
                    }
                  }
                  return null;
                })()}
                plotBoundaries={(() => {
                  // Create plot boundary based on selected plot center and size
                  if (formData.plotId) {
                    const plot = plots.find(p => p._id === formData.plotId);
                    if (plot && plot.latitude && plot.longitude) {
                      console.log('Creating plot boundary for:', plot.name, 'at:', plot.latitude, plot.longitude, 'size:', plot.size);
                      
                      // Calculate plot dimensions based on size (square meters)
                      // For a square plot, side length = sqrt(size)
                      const plotSideLength = Math.sqrt(plot.size || 10000); // Default to 100m x 100m if no size
                      const radiusKm = (plotSideLength / 2) / 1000; // Convert to km
                      
                      console.log('Plot side length:', plotSideLength, 'm, radius:', radiusKm, 'km');
                      
                      // Create a square boundary around plot center
                      const points = [];
                      const numPoints = 4; // Square has 4 corners
                      
                      for (let i = 0; i < numPoints; i++) {
                        const angle = (i / numPoints) * 2 * Math.PI;
                        const lat = plot.latitude + (radiusKm / 111.32) * Math.cos(angle);
                        const lng = plot.longitude + (radiusKm / (111.32 * Math.cos(plot.latitude * Math.PI / 180))) * Math.sin(angle);
                        points.push({ lat, lng });
                      }
                      
                      console.log('Plot boundary points:', points);
                      return points;
                    }
                  }
                  return null;
                })()}
                onValidationError={(error) => {
                  setErrors(prev => ({ ...prev, location: error }));
                }}
              />
              {errors.location && (
                <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="text-red-600 dark:text-red-400 mt-0.5">⚠️</div>
                    <div className="text-sm text-red-800 dark:text-red-200">
                      <p className="font-medium mb-1">Location Validation Error:</p>
                      <p>{errors.location}</p>
                      <p className="mt-2 text-xs">Please click inside the green plot boundary area to place your plant.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isUploadingImage}
              >
                {isUploadingImage ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {isEdit ? 'Updating Plant...' : (imageInputType === 'file' && selectedImage ? 'Adding Plant & Uploading Image...' : 'Adding Plant...')}
                  </>
                ) : (
                  isEdit ? `Update ${formData.category === 'tree' ? 'Tree' : 'Plant'}` : `Add ${formData.category === 'tree' ? 'Tree' : 'Plant'}`
                )}
              </button>
            </div>
          </form>
        </Dialog>

        {/* Add Plant Type Modal */}
        {showAddTypeModal && (
          <AddPlantTypeModal
            onClose={() => setShowAddTypeModal(false)}
            onSuccess={handleTypeCreated}
            defaultCategory={formData.category}
          />
        )}

        {/* Add Plant Variety Modal */}
        {showAddVarietyModal && (
          <AddPlantVarietyModal
            onClose={() => setShowAddVarietyModal(false)}
            onSuccess={handleVarietyCreated}
            selectedPlantType={plantTypes.find(type => type.name === formData.type)}
            plantTypes={plantTypes}
          />
        )}

        {/* Add Category Modal */}
        {showAddCategoryModal && (
          <AddCategoryModal
            onClose={() => setShowAddCategoryModal(false)}
            onSuccess={handleCategoryCreated}
          />
        )}
      </>
    );
  }

export default AddPlantModal; 