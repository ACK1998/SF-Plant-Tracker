import React, { useState, useEffect } from 'react';
import { Sprout, Palette, Ruler, Clock, Droplets } from 'lucide-react';
import Dialog from '../common/Dialog';
import SearchableDropdown from '../common/SearchableDropdown';

function EditPlantVarietyModal({ onClose, onUpdate, plantVariety, plantTypes }) {
  const [formData, setFormData] = useState({
    name: '',
    plantTypeId: '',
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

  const sizeOptions = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' }
  ];

  // Initialize form data when plantVariety changes
  useEffect(() => {
    if (plantVariety) {
      setFormData({
        name: plantVariety.name || '',
        plantTypeId: plantVariety.plantTypeId || '',
        description: plantVariety.description || '',
        characteristics: {
          color: plantVariety.characteristics?.color || '',
          size: plantVariety.characteristics?.size || 'medium',
          taste: plantVariety.characteristics?.taste || '',
          texture: plantVariety.characteristics?.texture || ''
        },
        growingInfo: {
          daysToMaturity: plantVariety.growingInfo?.daysToMaturity || '',
          height: plantVariety.growingInfo?.height || '',
          spacing: plantVariety.growingInfo?.spacing || '',
          harvestTime: plantVariety.growingInfo?.harvestTime || ''
        }
      });
    }
  }, [plantVariety]);

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

    if (!formData.plantTypeId) {
      newErrors.plantTypeId = 'Plant type is required';
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
      await onUpdate(plantVariety._id, formData);
    } catch (error) {
      console.error('Failed to update plant variety:', error);
    }
  };

  const getPlantTypeOptions = () => {
    return plantTypes.map(type => ({
      value: type._id,
      label: `${type.emoji} ${type.name}`
    }));
  };

  return (
    <Dialog isOpen={true} onClose={onClose} title="Edit Plant Variety" size="2xl" className="max-w-4xl">
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
                  placeholder="e.g., Roma, Sweet Basil"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Plant Type *
                </label>
                <SearchableDropdown
                  options={getPlantTypeOptions()}
                  value={formData.plantTypeId}
                  onChange={handleChange}
                  name="plantTypeId"
                  placeholder="Select plant type..."
                  searchPlaceholder="Search plant types..."
                  className="w-full"
                />
                {errors.plantTypeId && <p className="text-red-500 text-xs mt-1">{errors.plantTypeId}</p>}
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
                placeholder="Brief description of this variety..."
              />
            </div>
          </div>

          {/* Characteristics */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Characteristics</h3>
            
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
                  className="input-field"
                  placeholder="e.g., Red, Green, Purple"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Ruler className="inline h-4 w-4 mr-1" />
                  Size
                </label>
                <select
                  name="characteristics.size"
                  value={formData.characteristics.size}
                  onChange={handleChange}
                  className="input-field"
                >
                  {sizeOptions.map(size => (
                    <option key={size.value} value={size.value}>
                      {size.label}
                    </option>
                  ))}
                </select>
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
                  className="input-field"
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
                  className="input-field"
                  placeholder="e.g., Crisp, Soft, Firm"
                />
              </div>
            </div>
          </div>

          {/* Growing Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Growing Information</h3>
            
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
                  className="input-field"
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
                  className="input-field"
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
                  className="input-field"
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
                  className="input-field"
                  placeholder="e.g., Summer, Fall"
                />
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
              <Sprout className="h-4 w-4 mr-2" />
              Update Variety
            </button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}

export default EditPlantVarietyModal;
