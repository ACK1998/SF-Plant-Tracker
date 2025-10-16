import React, { useState, useEffect } from 'react';
import { Leaf, Sun, Droplets, Calendar } from 'lucide-react';
import Dialog from '../common/Dialog';
import api from '../../services/api';
import { findPlantEmoji, getEmojisByCategory } from '../../utils/emojiMapper';

function AddPlantTypeModal({ onClose, onAdd, onSuccess, defaultCategory = 'vegetable' }) {
  const [formData, setFormData] = useState({
    name: '',
    category: defaultCategory,
    emoji: '🌱',
    description: '',
    growingSeason: 'spring',
    sunRequirement: 'full-sun',
    waterRequirement: 'medium'
  });

  const [errors, setErrors] = useState({});
  const [dbCategories, setDbCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

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
    ...dbCategories.map(category => ({
      value: category.name,
      label: `${category.emoji} ${category.displayName}`
    }))
  ];

  const growingSeasons = [
    { value: 'spring', label: 'Spring' },
    { value: 'summer', label: 'Summer' },
    { value: 'fall', label: 'Fall' },
    { value: 'winter', label: 'Winter' },
    { value: 'year-round', label: 'Year Round' }
  ];

  const sunRequirements = [
    { value: 'full-sun', label: 'Full Sun' },
    { value: 'partial-sun', label: 'Partial Sun' },
    { value: 'shade', label: 'Shade' }
  ];

  const waterRequirements = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }
  ];

  const [commonEmojis, setCommonEmojis] = useState(getEmojisByCategory(defaultCategory));

  // Update emojis when category changes
  useEffect(() => {
    setCommonEmojis(getEmojisByCategory(formData.category));
  }, [formData.category]);

  // Auto-suggest emoji when name changes
  useEffect(() => {
    if (formData.name.trim()) {
      const suggestedEmoji = findPlantEmoji(formData.name, formData.category);
      setFormData(prev => ({ ...prev, emoji: suggestedEmoji }));
    }
  }, [formData.name, formData.category]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Plant type name is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Add the plant type using the API service
      const result = await api.createPlantType(formData);
      
      if (result.success) {
        if (onSuccess) {
          onSuccess(result.data);
        }
        if (onAdd) {
          onAdd(result.data);
        }
        if (window.showNotification) {
          window.showNotification({
            type: 'success',
            message: 'Plant type created successfully'
          });
        }
        // Close the modal after successful creation
        onClose();
      } else {
        throw new Error(result.message || 'Failed to create plant type');
      }
    } catch (error) {
      console.error('Failed to add plant type:', error);
      if (window.showNotification) {
        window.showNotification({
          type: 'error',
          message: error.message || 'Failed to create plant type'
        });
      }
    }
  };

  return (
    <Dialog isOpen={true} onClose={onClose} title="Add New Plant Type" size="2xl" className="max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  placeholder="e.g., Tomato, Basil"
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
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="input-field bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none"
                placeholder="Brief description of the plant type..."
              />
            </div>
          </div>

          {/* Emoji Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Emoji {formData.name.trim() && (
                <span className="text-xs text-gray-500 ml-2">
                  (Auto-suggested based on "{formData.name}")
                </span>
              )}
            </label>
            <div className="grid grid-cols-7 gap-x-6 gap-y-3 py-1 pl-2 pr-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              {commonEmojis.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, emoji }))}
                  className={`w-8 h-8 text-lg rounded-lg border-2 transition-all duration-200 flex items-center justify-center hover:scale-110 ${
                    formData.emoji === emoji
                      ? 'border-green-500 bg-green-100 dark:bg-green-900/30 shadow-md ring-2 ring-green-200 dark:ring-green-800'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            {formData.name.trim() && (
              <p className="text-xs text-gray-500 mt-2">
                💡 Tip: The emoji is automatically selected based on the plant name. You can change it manually if needed.
              </p>
            )}
          </div>

          {/* Growing Requirements */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Growing Requirements</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  Growing Season
                </label>
                <div className="relative">
                  <select
                    name="growingSeason"
                    value={formData.growingSeason}
                    onChange={handleChange}
                    className="input-field appearance-none pr-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                  >
                    {growingSeasons.map(season => (
                      <option key={season.value} value={season.value}>
                        {season.label}
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <Sun className="h-4 w-4 mr-2 text-yellow-500" />
                  Sun Requirement
                </label>
                <div className="relative">
                  <select
                    name="sunRequirement"
                    value={formData.sunRequirement}
                    onChange={handleChange}
                    className="input-field appearance-none pr-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                  >
                    {sunRequirements.map(sun => (
                      <option key={sun.value} value={sun.value}>
                        {sun.label}
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <Droplets className="h-4 w-4 mr-2 text-blue-500" />
                  Water Requirement
                </label>
                <div className="relative">
                  <select
                    name="waterRequirement"
                    value={formData.waterRequirement}
                    onChange={handleChange}
                    className="input-field appearance-none pr-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                  >
                    {waterRequirements.map(water => (
                      <option key={water.value} value={water.value}>
                        {water.label}
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
              <Leaf className="h-4 w-4 mr-2" />
              Add Plant Type
            </button>
          </div>
        </form>
    </Dialog>
  );
}

export default AddPlantTypeModal;
