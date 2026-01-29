import React, { useState, useEffect } from 'react';
import { Sprout, Palette, Ruler, Clock, Droplets } from 'lucide-react';
import Dialog from '../common/Dialog';
import SearchableDropdown from '../common/SearchableDropdown';
import api from '../../services/api';

function AddPlantVarietyModal({ onClose, onAdd, onSuccess, selectedPlantType, plantTypes = [] }) {
  const [formData, setFormData] = useState({
    name: '',
    category: selectedPlantType?.category || '',
    plantTypeId: selectedPlantType?._id || '',
    description: '',
    characteristics: {
      color: '',
      size: 'medium',
      taste: '',
      texture: ''
    },
    growingInfo: {
      daysToMaturity: '',
      height: '',
      spacing: '',
      harvestTime: ''
    }
  });

  const [errors, setErrors] = useState({});
  const [dbCategories, setDbCategories] = useState([]);
  const [, setLoadingCategories] = useState(true);

  // Load categories from database
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await api.getAllCategories();
        if (response.success) {
          setDbCategories(response.data);
        } else {
          console.error('Failed to load categories:', response.message);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  // Create categories array from database categories
  const categories = [
    { value: '', label: 'Select category' },
    ...dbCategories.map(category => ({
      value: category.name,
      label: category.displayName
    }))
  ];

  const sizeOptions = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Reset plantTypeId when category changes
      if (name === 'category') {
        setFormData(prev => ({
          ...prev,
          plantTypeId: ''
        }));
      }
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Variety name is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.plantTypeId) {
      newErrors.plantTypeId = 'Plant type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('=== AddPlantVarietyModal handleSubmit called ===');
    
    if (!validateForm()) {
      return;
    }

    try {
      // Prepare the data for API call
      const apiData = {
        name: formData.name,
        plantTypeId: formData.plantTypeId,
        description: formData.description,
        characteristics: formData.characteristics,
        growingInfo: formData.growingInfo
      };
      
      // Make the API call to create the plant variety
      const response = await api.createPlantVariety(apiData);
      
      if (response.success) {
        // Show success notification
        if (window.showNotification) {
          window.showNotification({
            type: 'success',
            message: 'Plant variety added successfully!',
            duration: 3000
          });
        }
        
        // Call the success callback with the created variety
        if (onSuccess) {
          console.log('Calling onSuccess callback');
          await onSuccess(response.data);
        }
        
        // Call the onAdd callback with the created variety data
        if (onAdd) {
          console.log('Calling onAdd callback with data:', response.data);
          await onAdd(response.data);
        }
        
        // Close the modal
        onClose();
      } else {
        throw new Error(response.message || 'Failed to create plant variety');
      }
    } catch (error) {
      console.error('Failed to add plant variety:', error);
      
      // Show error notification
      if (window.showNotification) {
        window.showNotification({
          type: 'error',
          message: error.message || 'Failed to add plant variety. Please try again.',
          duration: 5000
        });
      }
    }
  };

  const getPlantTypeOptions = () => {
    if (!plantTypes || !Array.isArray(plantTypes)) {
      return [];
    }
    
    const filteredTypes = formData.category 
      ? plantTypes.filter(type => type.category === formData.category)
      : plantTypes;
      
    return filteredTypes.map(type => ({
      value: type._id,
      label: `${type.emoji} ${type.name}`
    }));
  };

  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      title="Add New Plant Variety"
      size="2xl"
      className="max-w-3xl"
    >
      <div className="p-6">

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder="e.g., Roma, Sweet Basil"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <div className="relative">
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="input-field appearance-none pr-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Plant Type *
              </label>
              <SearchableDropdown
                options={[
                  { value: '', label: formData.category ? 'Select a type' : 'Select category first' },
                  ...getPlantTypeOptions()
                ]}
                value={formData.plantTypeId}
                onChange={handleChange}
                name="plantTypeId"
                placeholder={formData.category ? "Select a type" : "Select category first"}
                searchPlaceholder={formData.category ? "Search types..." : "Select category first"}
                disabled={!formData.category}
                className="w-full"
              />
              {errors.plantTypeId && <p className="text-red-500 text-xs mt-1">{errors.plantTypeId}</p>}
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
                className="input-field bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none"
                placeholder="Brief description of this variety..."
              />
            </div>
          </div>

          {/* Characteristics */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Characteristics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Palette className="inline h-4 w-4 mr-1" />
                  Color
                </label>
                <input
                  type="text"
                  name="characteristics.color"
                  value={formData.characteristics.color}
                  onChange={handleChange}
                  className="input-field bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder="e.g., Red, Green, Purple"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Ruler className="inline h-4 w-4 mr-1" />
                  Size
                </label>
                <div className="relative">
                  <select
                    name="characteristics.size"
                    value={formData.characteristics.size}
                    onChange={handleChange}
                    className="input-field appearance-none pr-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                  >
                    {sizeOptions.map(size => (
                      <option key={size.value} value={size.value}>
                        {size.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Taste
                </label>
                <input
                  type="text"
                  name="characteristics.taste"
                  value={formData.characteristics.taste}
                  onChange={handleChange}
                  className="input-field bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder="e.g., Sweet, Tangy, Mild"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Texture
                </label>
                <input
                  type="text"
                  name="characteristics.texture"
                  value={formData.characteristics.texture}
                  onChange={handleChange}
                  className="input-field bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder="e.g., Crisp, Soft, Firm"
                />
              </div>
            </div>
          </div>

          {/* Growing Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Growing Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Days to Maturity
                </label>
                <input
                  type="number"
                  name="growingInfo.daysToMaturity"
                  value={formData.growingInfo.daysToMaturity}
                  onChange={handleChange}
                  className="input-field bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder="e.g., 70"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Ruler className="inline h-4 w-4 mr-1" />
                  Height
                </label>
                <input
                  type="text"
                  name="growingInfo.height"
                  value={formData.growingInfo.height}
                  onChange={handleChange}
                  className="input-field bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder="e.g., 2-3 feet"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Droplets className="inline h-4 w-4 mr-1" />
                  Spacing
                </label>
                <input
                  type="text"
                  name="growingInfo.spacing"
                  value={formData.growingInfo.spacing}
                  onChange={handleChange}
                  className="input-field bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder="e.g., 12-18 inches"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Harvest Time
                </label>
                <input
                  type="text"
                  name="growingInfo.harvestTime"
                  value={formData.growingInfo.harvestTime}
                  onChange={handleChange}
                  className="input-field bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder="e.g., Summer, Fall"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center"
            >
              <Sprout className="h-4 w-4 mr-2" />
              Add Variety
            </button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}

export default AddPlantVarietyModal;
