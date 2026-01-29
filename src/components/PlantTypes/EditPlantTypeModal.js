import React, { useState, useEffect } from 'react';
import { Leaf, Sun, Droplets, Calendar } from 'lucide-react';
import Dialog from '../common/Dialog';
import api from '../../services/api';
import { findPlantEmoji, getEmojisByCategory } from '../../utils/emojiMapper';

function EditPlantTypeModal({ onClose, onUpdate, plantType }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'vegetable',
    emoji: '🌱',
    description: '',
    growingSeason: 'spring',
    sunRequirement: 'full-sun',
    waterRequirement: 'medium'
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

  const [commonEmojis, setCommonEmojis] = useState(getEmojisByCategory('vegetable'));

  // Initialize form data when plantType changes
  useEffect(() => {
    if (plantType) {
      setFormData({
        name: plantType.name || '',
        category: plantType.category || 'vegetable',
        emoji: plantType.emoji || '🌱',
        description: plantType.description || '',
        growingSeason: plantType.growingSeason || 'spring',
        sunRequirement: plantType.sunRequirement || 'full-sun',
        waterRequirement: plantType.waterRequirement || 'medium'
      });
      setCommonEmojis(getEmojisByCategory(plantType.category || 'vegetable'));
    }
  }, [plantType]);

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
      await onUpdate(plantType._id, formData);
    } catch (error) {
      console.error('Failed to update plant type:', error);
    }
  };

    return (
    <Dialog isOpen={true} onClose={onClose} title="Edit Plant Type" size="2xl" className="max-w-4xl">
      <div className="p-6">

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Basic Information</h3>
            
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
                  className="input-field"
                  placeholder="e.g., Tomato, Basil"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="input-field"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
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
                className="input-field"
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
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Growing Requirements</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Growing Season
                </label>
                <select
                  name="growingSeason"
                  value={formData.growingSeason}
                  onChange={handleChange}
                  className="input-field"
                >
                  {growingSeasons.map(season => (
                    <option key={season.value} value={season.value}>
                      {season.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Sun className="inline h-4 w-4 mr-1" />
                  Sun Requirement
                </label>
                <select
                  name="sunRequirement"
                  value={formData.sunRequirement}
                  onChange={handleChange}
                  className="input-field"
                >
                  {sunRequirements.map(sun => (
                    <option key={sun.value} value={sun.value}>
                      {sun.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Droplets className="inline h-4 w-4 mr-1" />
                  Water Requirement
                </label>
                <select
                  name="waterRequirement"
                  value={formData.waterRequirement}
                  onChange={handleChange}
                  className="input-field"
                >
                  {waterRequirements.map(water => (
                    <option key={water.value} value={water.value}>
                      {water.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
            >
              <Leaf className="h-4 w-4 mr-2" />
              Update Plant Type
            </button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}

export default EditPlantTypeModal;
