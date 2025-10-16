import React, { useState, useEffect } from 'react';
import { Plus, Search, Building, MapPin, Phone, Mail } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../../contexts/ApiContext';
import { indianStates } from '../../data/indianStatesData';
import ConfirmationDialog from '../common/ConfirmationDialog';
import Dialog from '../common/Dialog';

function OrganizationsList({ user, selectedState, showAddModal: showAddModalProp = false, showEditModal: showEditModalProp = false }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { organizations, loading, error, addOrganization, updateOrganization, deleteOrganization } = useApi();
  const [showAddModal, setShowAddModal] = useState(showAddModalProp);
  const [showEditModal, setShowEditModal] = useState(showEditModalProp);
  const [editingOrganization, setEditingOrganization] = useState(null);

  // Handle URL parameter changes
  useEffect(() => {
    setShowAddModal(showAddModalProp);
  }, [showAddModalProp]);

  useEffect(() => {
    setShowEditModal(showEditModalProp);
  }, [showEditModalProp]);

  // Handle edit modal when URL has organization ID
  useEffect(() => {
    if (id && showEditModalProp) {
      const orgToEdit = organizations.find(o => o._id === id);
      if (orgToEdit) {
        setEditingOrganization(orgToEdit);
        setShowEditModal(true);
      }
    }
  }, [id, showEditModalProp, organizations]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState(null);

  // Filter organizations based on search
  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleAddOrganization = async (newOrg) => {
    try {
      await addOrganization(newOrg);
      setShowAddModal(false);
      
      // Show success notification
      if (window.showNotification) {
        window.showNotification({
          type: 'success',
          message: 'Organization added successfully!',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Failed to add organization:', error);
      
      // Show error notification
      if (window.showNotification) {
        window.showNotification({
          type: 'error',
          message: 'Failed to add organization. Please try again.',
          duration: 5000
        });
      }
    }
  };

  const handleEditOrganization = async (updatedOrg) => {
    try {
      await updateOrganization(updatedOrg._id, updatedOrg);
      setShowEditModal(false);
      setEditingOrganization(null);
      
      // Show success notification
      if (window.showNotification) {
        window.showNotification({
          type: 'success',
          message: 'Organization updated successfully!',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Failed to update organization:', error);
      
      // Show error notification
      if (window.showNotification) {
        window.showNotification({
          type: 'error',
          message: 'Failed to update organization. Please try again.',
          duration: 5000
        });
      }
    }
  };

  const handleDeleteOrganization = async (orgId) => {
    try {
      await deleteOrganization(orgId);
      
      // Show success notification
      if (window.showNotification) {
        window.showNotification({
          type: 'success',
          message: 'Organization deleted successfully!',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Failed to delete organization:', error);
      
      // Show error notification
      if (window.showNotification) {
        window.showNotification({
          type: 'error',
          message: 'Failed to delete organization. Please try again.',
          duration: 5000
        });
      }
    }
  };

  const confirmDeleteOrganization = (org) => {
    setOrgToDelete(org);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (orgToDelete) {
      await handleDeleteOrganization(orgToDelete._id);
      setOrgToDelete(null);
    }
  };

  // Permission checking functions
  const canAddOrganization = () => {
    if (!user || !user.role) return false;
    return user.role === 'super_admin';
  };

  const canEditOrganization = (org) => {
    if (!user || !user.role) return false;
    
    // Super admin can edit all organizations
    if (user.role === 'super_admin') return true;
    
    // Org admin can edit their own organization
    if (user.role === 'org_admin') {
      const userOrgId = user.organizationId?._id || user.organizationId;
      const orgId = org._id;
      return String(userOrgId) === String(orgId);
    }
    
    return false;
  };

  const canDeleteOrganization = (org) => {
    if (!user || !user.role) return false;
    
    // Only super admin can delete organizations
    if (user.role === 'super_admin') return true;
    
    return false;
  };

  const openEditModal = (org) => {
    navigate(`/organizations/${org._id}/edit`);
  };

  const openAddModal = () => {
    navigate('/organizations/add');
  };

  const getCreatedByUser = (user) => {
    if (!user) return 'Unknown User';
    return `${user.firstName} ${user.lastName}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-plant-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading organizations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 dark:text-red-400 mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Error loading organizations</h3>
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Organizations</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage agricultural organizations and companies</p>
        </div>
        
        {canAddOrganization() && (
          <button
            onClick={openAddModal}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Organization</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Organizations Grid */}
      {filteredOrganizations.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏢</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No organizations found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm 
              ? 'Try adjusting your search criteria.'
              : 'Get started by adding your first organization!'
            }
          </p>
          {!searchTerm && user.role === 'super_admin' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              Add Your First Organization
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredOrganizations.map(org => (
            <div key={org._id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-plant-green-100 dark:bg-plant-green-900 rounded-lg">
                    <Building className="h-6 w-6 text-plant-green-600 dark:text-plant-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {org.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Created by {getCreatedByUser(org.createdBy)}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  org.isActive 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {org.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {org.description}
              </p>

              <div className="space-y-2 mb-4">
                {org.address && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin size={16} />
                    <span>{`${org.address.street || ''} ${org.address.city || ''} ${org.address.state || ''}`}</span>
                  </div>
                )}
                {org.contactInfo?.email && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Mail size={16} />
                    <span>{org.contactInfo.email}</span>
                  </div>
                )}
                {org.contactInfo?.phone && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Phone size={16} />
                    <span>{org.contactInfo.phone}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Created: {new Date(org.createdAt).toLocaleDateString()}</span>
                <div className="flex space-x-2">
                  {canEditOrganization(org) && (
                    <button 
                      onClick={() => openEditModal(org)}
                      className="text-plant-green-600 dark:text-plant-green-400 hover:underline"
                    >
                      Edit
                    </button>
                  )}
                  {canDeleteOrganization(org) && (
                    <button 
                      onClick={() => confirmDeleteOrganization(org)}
                      className="text-red-600 dark:text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Organization Modal */}
      {showAddModal && (
        <AddOrganizationModal
          onClose={() => {
            setShowAddModal(false);
            navigate('/organizations');
          }}
          onAdd={handleAddOrganization}
          organizations={organizations}
        />
      )}

      {/* Edit Organization Modal */}
      {showEditModal && editingOrganization && (
        <EditOrganizationModal
          organization={editingOrganization}
          onClose={() => {
            setShowEditModal(false);
            navigate('/organizations');
          }}
          onEdit={handleEditOrganization}
          organizations={organizations}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setOrgToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Organization"
        message="Are you sure you want to delete the organization"
        itemName={orgToDelete?.name}
        confirmText="Delete"
        cancelText="Cancel"
        type="delete"
      />
    </div>
  );
}

// Add Organization Modal Component
function AddOrganizationModal({ onClose, onAdd, organizations }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    },
    contactInfo: {
      email: '',
      phone: '',
      website: ''
    }
  });

  const [availableCities, setAvailableCities] = useState([]);

  // Update cities when state changes
  React.useEffect(() => {
    if (formData.address.state) {
      const stateData = indianStates.find(state => state.name === formData.address.state);
      setAvailableCities(stateData ? stateData.cities : []);
    } else {
      setAvailableCities([]);
    }
  }, [formData.address.state]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleStateChange = (e) => {
    const selectedState = e.target.value;
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        state: selectedState,
        city: '' // Reset city when state changes
      }
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Add New Organization
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Organization Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="Enter organization name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="input-field"
              placeholder="Enter organization description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Street Address
            </label>
            <input
              type="text"
              name="address.street"
              value={formData.address.street}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter street address"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                State *
              </label>
              <select
                name="state"
                value={formData.address.state}
                onChange={handleStateChange}
                required
                className="input-field"
              >
                <option key="select-state" value="">Select State</option>
                {indianStates.map(state => (
                  <option key={state.name} value={state.name}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                City *
              </label>
              <select
                name="address.city"
                value={formData.address.city}
                onChange={handleChange}
                required
                className="input-field"
                disabled={!formData.address.state}
              >
                <option key="select-city" value="">Select City</option>
                {availableCities.map(city => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              PIN Code
            </label>
            <input
              type="text"
              name="address.zipCode"
              value={formData.address.zipCode}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter PIN code"
              maxLength="6"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contact Email
            </label>
            <input
              type="email"
              name="contactInfo.email"
              value={formData.contactInfo.email}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter contact email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contact Phone
            </label>
            <input
              type="tel"
              name="contactInfo.phone"
              value={formData.contactInfo.phone}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter contact phone"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Website
            </label>
            <input
              type="url"
              name="contactInfo.website"
              value={formData.contactInfo.website}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter website URL"
            />
          </div>

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
              Add Organization
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Organization Modal Component
function EditOrganizationModal({ organization, onClose, onEdit, organizations }) {
  const [formData, setFormData] = useState({
    name: organization.name || '',
    description: organization.description || '',
    address: {
      street: organization.address?.street || '',
      city: organization.address?.city || '',
      state: organization.address?.state || '',
      zipCode: organization.address?.zipCode || '',
      country: organization.address?.country || 'India'
    },
    contactInfo: {
      email: organization.contactInfo?.email || '',
      phone: organization.contactInfo?.phone || '',
      website: organization.contactInfo?.website || ''
    }
  });

  const [availableCities, setAvailableCities] = useState([]);

  // Update cities when state changes
  React.useEffect(() => {
    if (formData.address.state) {
      const stateData = indianStates.find(state => state.name === formData.address.state);
      setAvailableCities(stateData ? stateData.cities : []);
    } else {
      setAvailableCities([]);
    }
  }, [formData.address.state]);

  // Initialize cities when component mounts
  React.useEffect(() => {
    if (organization.address?.state) {
      const stateData = indianStates.find(state => state.name === organization.address.state);
      setAvailableCities(stateData ? stateData.cities : []);
    }
  }, [organization.address?.state]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onEdit({ ...organization, ...formData });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleStateChange = (e) => {
    const selectedState = e.target.value;
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        state: selectedState,
        city: '' // Reset city when state changes
      }
    }));
  };

  return (
    <Dialog isOpen={true} onClose={onClose} title="Edit Organization" size="2xl" className="max-w-4xl">
      <div className="p-6">

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Organization Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="Enter organization name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="input-field"
              placeholder="Enter organization description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Street Address
            </label>
            <input
              type="text"
              name="address.street"
              value={formData.address.street}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter street address"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                State *
              </label>
              <select
                name="state"
                value={formData.address.state}
                onChange={handleStateChange}
                required
                className="input-field"
              >
                <option key="select-state" value="">Select State</option>
                {indianStates.map(state => (
                  <option key={state.name} value={state.name}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                City *
              </label>
              <select
                name="address.city"
                value={formData.address.city}
                onChange={handleChange}
                required
                className="input-field"
                disabled={!formData.address.state}
              >
                <option key="select-city" value="">Select City</option>
                {availableCities.map(city => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              PIN Code
            </label>
            <input
              type="text"
              name="address.zipCode"
              value={formData.address.zipCode}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter PIN code"
              maxLength="6"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contact Email
            </label>
            <input
              type="email"
              name="contactInfo.email"
              value={formData.contactInfo.email}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter contact email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contact Phone
            </label>
            <input
              type="tel"
              name="contactInfo.phone"
              value={formData.contactInfo.phone}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter contact phone"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Website
            </label>
            <input
              type="url"
              name="contactInfo.website"
              value={formData.contactInfo.website}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter website URL"
            />
          </div>

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
              Update Organization
            </button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}

export default OrganizationsList; 