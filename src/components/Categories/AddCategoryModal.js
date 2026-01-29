import React, { useState } from 'react';
import { Leaf } from 'lucide-react';
import Dialog from '../common/Dialog';
import api from '../../services/api';

function AddCategoryModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    emoji: '🌱',
    description: '',
    color: '#4ade80'
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const commonEmojis = [
    '🌱', '🌿', '🌳', '🌲', '🌴', '🌵', '🌾', '🌷', '🌸', '🌹', '🌺', '🌻', '🌼', '🌽', '🌾', '🌿',
    '🍀', '🍁', '🍂', '🍃', '🍄', '🍅', '🍆', '🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍', '🍎', '🍏',
    '🍐', '🍑', '🍒', '🍓', '🥭', '🥥', '🥝', '🥑', '🥦', '🥬', '🥭', '🥝', '🥑', '🥦', '🥬', '🥒',
    '🥕', '🥔', '🥜', '🥑', '🥦', '🥬', '🥒', '🥕', '🥔', '🥜', '🥑', '🥦', '🥬', '🥒', '🥕', '🥔'
  ];

  const predefinedColors = [
    '#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534', // Greens
    '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a', // Blues
    '#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f', // Oranges
    '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', // Reds
    '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95', // Purples
    '#ec4899', '#db2777', '#be185d', '#9d174d', '#831843', // Pinks
    '#6b7280', '#4b5563', '#374151', '#1f2937', '#111827'  // Grays
  ];

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

  const handleEmojiSelect = (emoji) => {
    setFormData(prev => ({ ...prev, emoji }));
  };

  const handleColorSelect = (color) => {
    setFormData(prev => ({ ...prev, color }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Category name must be at least 2 characters';
    } else if (!/^[a-zA-Z0-9\s-]+$/.test(formData.name)) {
      newErrors.name = 'Category name can only contain letters, numbers, spaces, and hyphens';
    }

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (formData.displayName.length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters';
    }

    if (!formData.emoji) {
      newErrors.emoji = 'Emoji is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.createCategory(formData);
      
      if (response.success) {
        onSuccess(response.data);
        onClose();
      } else {
        setErrors({ submit: response.message || 'Failed to create category' });
      }
    } catch (error) {
      console.error('Error creating category:', error);
      setErrors({ submit: error.message || 'Failed to create category' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      title="Add New Category"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name and Display Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., vegetables, fruits, herbs"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Used internally (lowercase, no special characters)
            </p>
          </div>

          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Display Name *
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              placeholder="e.g., Vegetables, Fruits, Herbs"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                errors.displayName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.displayName && (
              <p className="mt-1 text-sm text-red-600">{errors.displayName}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Shown to users (can contain spaces and special characters)
            </p>
          </div>
        </div>

        {/* Emoji Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Emoji *
          </label>
          <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3">
            {commonEmojis.map((emoji, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleEmojiSelect(emoji)}
                className={`text-2xl p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  formData.emoji === emoji ? 'bg-green-100 dark:bg-green-900 border-2 border-green-500 dark:border-green-400' : ''
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
          {errors.emoji && (
            <p className="mt-1 text-sm text-red-600">{errors.emoji}</p>
          )}
        </div>

        {/* Color Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Color
          </label>
          <div className="flex items-center gap-4">
            <div className="grid grid-cols-7 gap-2">
              {predefinedColors.map((color, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleColorSelect(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === color ? 'border-gray-800 dark:border-gray-200 scale-110' : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="w-12 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">{formData.color}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            placeholder="Optional description for this category..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-transparent"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating...
              </>
            ) : (
              <>
                <Leaf className="h-4 w-4" />
                Create Category
              </>
            )}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

export default AddCategoryModal;
