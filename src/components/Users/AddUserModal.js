import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock, Phone, Building, MapPin, TreePine } from 'lucide-react';
import { userRoles, getAvailableRoles } from '../../data/userData';
import SearchableDropdown from '../common/SearchableDropdown';

function AddUserModal({ currentUser, onClose, onAdd, organizations, domains, plots }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'application_user',
    phone: '',
    organizationId: '',
    domainId: '',
    plotIds: []
  });

  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    // Validate required fields based on role
    const newErrors = {};
    
    // Basic validation
    if (!formData.username) newErrors.username = 'Username is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.role) newErrors.role = 'Role is required';
    
    // Role-based validation
    if (formData.role === 'org_admin' && !formData.organizationId) {
      newErrors.organizationId = 'Organization is required for Organization Admin';
    }
    
    if ((formData.role === 'domain_admin' || formData.role === 'application_user') && !formData.organizationId) {
      newErrors.organizationId = 'Organization is required';
    }
    
    if ((formData.role === 'domain_admin' || formData.role === 'application_user') && !formData.domainId) {
      newErrors.domainId = 'Domain is required';
    }
    
    if (formData.role === 'application_user' && (!formData.plotIds || formData.plotIds.length === 0)) {
      newErrors.plotIds = 'At least one plot is required for Application User';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Clean up data before submitting
    const submitData = { ...formData };
    
    // Remove empty optional fields
    if (!submitData.phone) delete submitData.phone;
    if (submitData.role === 'org_admin') {
      delete submitData.domainId;
      delete submitData.plotIds;
    } else if (submitData.role === 'domain_admin') {
      delete submitData.plotIds;
    }
    
    onAdd(submitData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear related field errors when role changes
    if (name === 'role') {
      setErrors(prev => ({
        ...prev,
        organizationId: undefined,
        domainId: undefined,
        plotIds: undefined
      }));
      
      // Reset related fields when role changes
      setFormData(prev => ({
        ...prev,
        [name]: value,
        domainId: '',
        plotIds: []
      }));
    }
    
    // Clear error when field is filled
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handlePlotChange = (plotId, isSelected) => {
    setFormData(prev => {
      const currentPlotIds = prev.plotIds || [];
      let newPlotIds;
      
      if (isSelected) {
        // Add plot if not already selected
        newPlotIds = currentPlotIds.includes(plotId) ? currentPlotIds : [...currentPlotIds, plotId];
      } else {
        // Remove plot
        newPlotIds = currentPlotIds.filter(id => id !== plotId);
      }
      
      return {
        ...prev,
        plotIds: newPlotIds
      };
    });
    
    // Clear plot error when plots are selected
    if (errors.plotIds) {
      setErrors(prev => ({
        ...prev,
        plotIds: undefined
      }));
    }
  };

  // Filter domains based on selected organization
  const availableDomains = domains.filter(domain => 
    !formData.organizationId || domain.organizationId === formData.organizationId
  );

  // Filter plots based on selected domain
  const availablePlots = plots.filter(plot => 
    !formData.domainId || plot.domainId === formData.domainId
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Add New User
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`input-field pl-10 ${errors.username ? 'border-red-500' : ''}`}
                  placeholder="Enter username"
                />
              </div>
              {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`input-field pl-10 ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="Enter email"
                />
              </div>
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`input-field pl-10 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="Enter password"
                />
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`input-field ${errors.firstName ? 'border-red-500' : ''}`}
                  placeholder="First name"
                />
                {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`input-field ${errors.lastName ? 'border-red-500' : ''}`}
                  placeholder="Last name"
                />
                {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          </div>

          {/* Role and Organization */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`input-field ${errors.role ? 'border-red-500' : ''}`}
              >
                <option key="select-role" value="">Select Role</option>
                {getAvailableRoles(currentUser?.role).map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
            </div>

            {currentUser?.role === 'super_admin' && (formData.role === 'org_admin' || formData.role === 'domain_admin' || formData.role === 'application_user') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Organization *
                </label>
                <SearchableDropdown
                  options={organizations.map(org => ({ value: org._id, label: org.name }))}
                  value={formData.organizationId}
                  onChange={handleChange}
                  name="organizationId"
                  placeholder="Select Organization"
                  required={true}
                  searchPlaceholder="Search organizations..."
                  className={`input-field ${errors.organizationId ? 'border-red-500' : ''}`}
                />
                {errors.organizationId && <p className="text-red-500 text-sm mt-1">{errors.organizationId}</p>}
              </div>
            )}

            {(formData.role === 'domain_admin' || formData.role === 'application_user') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Domain *
                </label>
                <SearchableDropdown
                  options={availableDomains.map(domain => ({ value: domain._id, label: domain.name }))}
                  value={formData.domainId}
                  onChange={handleChange}
                  name="domainId"
                  placeholder="Select Domain"
                  required={true}
                  searchPlaceholder="Search domains..."
                  className={`input-field ${errors.domainId ? 'border-red-500' : ''}`}
                />
                {errors.domainId && <p className="text-red-500 text-sm mt-1">{errors.domainId}</p>}
              </div>
            )}

            {formData.role === 'application_user' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Plots * (Select one or more)
                </label>
                <div className={`max-h-48 overflow-y-auto border rounded-lg p-3 ${errors.plotIds ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}>
                  {availablePlots.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      {!formData.domainId ? 'Please select a domain first' : 'No plots available for this domain'}
                    </p>
                  ) : (
                    availablePlots.map(plot => (
                      <label key={plot._id} className="flex items-center space-x-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded px-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.plotIds?.includes(plot._id) || false}
                          onChange={(e) => handlePlotChange(plot._id, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          disabled={!formData.domainId}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{plot.name}</span>
                      </label>
                    ))
                  )}
                </div>
                {errors.plotIds && <p className="text-red-500 text-sm mt-1">{errors.plotIds}</p>}
                {formData.plotIds && formData.plotIds.length > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formData.plotIds.length} plot{formData.plotIds.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
            >
              Add User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddUserModal; 