import React, { useState, useEffect } from 'react';
import { Plus, Search, MapPin, Building } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../../contexts/ApiContext';
import SearchableDropdown from '../common/SearchableDropdown';
import ConfirmationDialog from '../common/ConfirmationDialog';
import Dialog from '../common/Dialog';

function DomainsList({ user, selectedState, showAddModal: showAddModalProp = false, showEditModal: showEditModalProp = false }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { 
    domains, 
    organizations, 
    users,
    loading, 
    error,
    addDomain, 
    updateDomain, 
    deleteDomain 
  } = useApi();

  const [showAddModal, setShowAddModal] = useState(showAddModalProp);
  const [showEditModal, setShowEditModal] = useState(showEditModalProp);
  const [editingDomain, setEditingDomain] = useState(null);

  // Handle URL parameter changes
  useEffect(() => {
    setShowAddModal(showAddModalProp);
  }, [showAddModalProp]);

  useEffect(() => {
    setShowEditModal(showEditModalProp);
  }, [showEditModalProp]);

  // Handle edit modal when URL has domain ID
  useEffect(() => {
    if (id && showEditModalProp) {
      const domainToEdit = domains.find(d => d._id === id);
      if (domainToEdit) {
        setEditingDomain(domainToEdit);
        setShowEditModal(true);
      }
    }
  }, [id, showEditModalProp, domains]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState(null);

  // Filter domains based on selected state
  const filteredDomains = domains.filter(domain => {
    const matchesSearch = domain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         domain.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesState = selectedState === 'all' || 
      organizations.find(org => org._id === domain.organizationId)?.address?.state === selectedState;
    
    return matchesSearch && matchesState;
  });

  const handleAddDomain = async (newDomain) => {
    try {
      // Ensure organizationId is set if not provided
      const domainData = {
        ...newDomain,
        organizationId: newDomain.organizationId || user.organizationId
      };
      
      console.log('Adding domain with data:', domainData);
      await addDomain(domainData);
      setShowAddModal(false);
      
      // Show success notification
      if (window.showNotification) {
        window.showNotification({
          type: 'success',
          message: 'Domain added successfully!',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Failed to add domain:', error);
      
      // Show error notification
      if (window.showNotification) {
        window.showNotification({
          type: 'error',
          message: 'Failed to add domain. Please try again.',
          duration: 5000
        });
      }
    }
  };

  const handleUpdateDomain = async (updatedDomain) => {
    try {
      console.log('DomainsList - Updating domain with data:', updatedDomain);
      
      // Ensure we have the domain ID and required fields
      const domainToUpdate = {
        ...updatedDomain,
        _id: editingDomain._id // Ensure we have the correct ID
      };
      
      console.log('DomainsList - Final domain data to update:', domainToUpdate);
      
      await updateDomain(domainToUpdate._id, domainToUpdate);
      setShowEditModal(false);
      setEditingDomain(null);
      
      // Show success notification
      if (window.showNotification) {
        window.showNotification({
          type: 'success',
          message: 'Domain updated successfully!',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Failed to update domain:', error);
      
      // Show error notification
      if (window.showNotification) {
        window.showNotification({
          type: 'error',
          message: 'Failed to update domain. Please try again.',
          duration: 5000
        });
      }
    }
  };

  const handleDeleteDomain = async (domainId) => {
    try {
      await deleteDomain(domainId);
      
      // Show success notification
      if (window.showNotification) {
        window.showNotification({
          type: 'success',
          message: 'Domain deleted successfully!',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Failed to delete domain:', error);
      
      // Show error notification
      if (window.showNotification) {
        window.showNotification({
          type: 'error',
          message: 'Failed to delete domain. Please try again.',
          duration: 5000
        });
      }
    }
  };

  const confirmDeleteDomain = (domain) => {
    setDomainToDelete(domain);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (domainToDelete) {
      await handleDeleteDomain(domainToDelete._id);
      setDomainToDelete(null);
    }
  };

  // Permission checking functions
  const canAddDomain = () => {
    if (!user || !user.role) return false;
    return ['super_admin', 'org_admin'].includes(user.role);
  };

  const canEditDomain = (domain) => {
    if (!user || !user.role) return false;
    
    // Super admin can edit all domains
    if (user.role === 'super_admin') return true;
    
    // Org admin can edit domains in their organization
    if (user.role === 'org_admin') {
      const userOrgId = user.organizationId?._id || user.organizationId;
      const domainOrgId = domain.organizationId?._id || domain.organizationId;
      return String(userOrgId) === String(domainOrgId);
    }
    
    // Domain admin can edit their own domain
    if (user.role === 'domain_admin') {
      const userOrgId = user.organizationId?._id || user.organizationId;
      const userDomainId = user.domainId?._id || user.domainId;
      const domainOrgId = domain.organizationId?._id || domain.organizationId;
      const domainId = domain._id;
      return String(userOrgId) === String(domainOrgId) &&
             String(userDomainId) === String(domainId);
    }
    
    return false;
  };

  const canDeleteDomain = (domain) => {
    if (!user || !user.role) return false;
    
    // Super admin can delete all domains
    if (user.role === 'super_admin') return true;
    
    // Org admin can delete domains in their organization
    if (user.role === 'org_admin') {
      const userOrgId = user.organizationId?._id || user.organizationId;
      const domainOrgId = domain.organizationId?._id || domain.organizationId;
      return String(userOrgId) === String(domainOrgId);
    }
    
    return false;
  };

  const openEditModal = (domain) => {
    navigate(`/domains/${domain._id}/edit`);
  };

  const openAddModal = () => {
    navigate('/domains/add');
  };

  const getOrganizationName = (organizationId) => {
    // Handle both populated and unpopulated organizationId
    if (organizationId && typeof organizationId === 'object' && organizationId.name) {
      // organizationId is populated (has name property)
      return organizationId.name;
    } else if (organizationId) {
      // organizationId is a string (unpopulated), find in organizations array
      const org = organizations.find(org => org._id === organizationId);
      return org?.name || 'Unknown Organization';
    }
    return 'Unknown Organization';
  };

  const getCreatedByUser = (user) => {
    // Handle both populated and unpopulated createdBy
    if (user && typeof user === 'object' && user.firstName) {
      // user is populated (has firstName property)
      return `${user.firstName} ${user.lastName || ''}`.trim();
    } else if (user) {
      // user is a string (unpopulated), find in users array
      const foundUser = users.find(u => u._id === user);
      if (foundUser) {
        return `${foundUser.firstName} ${foundUser.lastName || ''}`.trim();
      }
    }
    return 'Unknown User';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-plant-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading domains...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 dark:text-red-400 mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Error loading domains</h3>
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Domains</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage cultivation domains and areas</p>
        </div>
        
        {canAddDomain() && (
          <button
            onClick={openAddModal}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Domain</span>
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
            placeholder="Search domains..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Domains Grid */}
      {filteredDomains.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No domains found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm 
              ? 'Try adjusting your search criteria.'
              : 'Get started by adding your first domain!'
            }
          </p>
          {!searchTerm && user.role === 'super_admin' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              Add Your First Domain
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredDomains.map(domain => (
            <div key={domain._id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-plant-green-100 dark:bg-plant-green-900 rounded-lg">
                    <MapPin className="h-6 w-6 text-plant-green-600 dark:text-plant-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {domain.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Created by {getCreatedByUser(domain.createdBy)}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  domain.isActive 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {domain.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {domain.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Building size={16} />
                  <span>{getOrganizationName(domain.organizationId)}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin size={16} />
                  <span>
                    {domain.latitude && domain.longitude 
                      ? `${domain.latitude.toFixed(6)}, ${domain.longitude.toFixed(6)}`
                      : 'No coordinates'
                    }
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>Size: {domain.size} sq ft</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Created: {new Date(domain.createdAt).toLocaleDateString()}</span>
                <div className="flex space-x-2">
                  {canEditDomain(domain) && (
                    <button 
                      onClick={() => openEditModal(domain)}
                      className="text-plant-green-600 dark:text-plant-green-400 hover:underline"
                    >
                      Edit
                    </button>
                  )}
                  {canDeleteDomain(domain) && (
                    <button 
                      onClick={() => confirmDeleteDomain(domain)}
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

      {/* Add Domain Modal */}
      {showAddModal && (
        <AddDomainModal
          onClose={() => {
            setShowAddModal(false);
            navigate('/domains');
          }}
          onAdd={handleAddDomain}
          organizations={organizations}
          user={user}
        />
      )}

      {/* Edit Domain Modal */}
      {showEditModal && editingDomain && (
        <EditDomainModal
          domain={editingDomain}
          onClose={() => {
            setShowEditModal(false);
            navigate('/domains');
          }}
          onUpdate={handleUpdateDomain}
          organizations={organizations}
          user={user}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDomainToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Domain"
        message="Are you sure you want to delete the domain"
        itemName={domainToDelete?.name}
        confirmText="Delete"
        cancelText="Cancel"
        type="delete"
      />
    </div>
  );
}

// Add Domain Modal Component
function AddDomainModal({ onClose, onAdd, organizations, user }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    latitude: '',
    longitude: '',
    size: '',
    soilType: '',
    climate: '',
    organizationId: user?.organizationId?._id || user?.organizationId || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.organizationId) {
      alert('Please fill in all required fields (Name and Organization)');
      return;
    }
    
    // Convert size to number if it's not empty and clean the data
    const submitData = {
      name: formData.name,
      description: formData.description,
      latitude: formData.latitude ? Number(formData.latitude) : null,
      longitude: formData.longitude ? Number(formData.longitude) : null,
      size: formData.size ? Number(formData.size) : 0,
      soilType: formData.soilType,
      climate: formData.climate,
      organizationId: formData.organizationId
    };
    
    console.log('AddDomainModal - Submitting domain data:', submitData);
    onAdd(submitData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Add New Domain
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
              Domain Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="Enter domain name"
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
              placeholder="Enter domain description"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Latitude
              </label>
              <input
                type="number"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                step="any"
                className="input-field"
                placeholder="Enter latitude"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Longitude
              </label>
              <input
                type="number"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                step="any"
                className="input-field"
                placeholder="Enter longitude"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Size (sq ft)
              </label>
              <input
                type="number"
                name="size"
                value={formData.size}
                onChange={handleChange}
                className="input-field"
                placeholder="Size"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Soil Type
              </label>
              <select
                name="soilType"
                value={formData.soilType}
                onChange={handleChange}
                className="input-field"
              >
                <option key="select-soil" value="">Select Soil Type</option>
                <option key="clay" value="clay">Clay</option>
                <option key="silt" value="silt">Silt</option>
                <option key="loam" value="loam">Loam</option>
                <option key="sandy" value="sandy">Sandy</option>
                <option key="chalky" value="chalky">Chalky</option>
                <option key="peaty" value="peaty">Peaty</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Climate
            </label>
            <select
              name="climate"
              value={formData.climate}
              onChange={handleChange}
              className="input-field"
            >
              <option key="select-climate" value="">Select Climate</option>
              <option key="tropical" value="tropical">Tropical</option>
              <option key="subtropical" value="subtropical">Subtropical</option>
              <option key="temperate" value="temperate">Temperate</option>
              <option key="continental" value="continental">Continental</option>
              <option key="polar" value="polar">Polar</option>
            </select>
          </div>

          {user?.role === 'super_admin' && (
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
                className="input-field"
              />
            </div>
          )}

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
              Add Domain
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Domain Modal Component
function EditDomainModal({ domain, onClose, onUpdate, organizations, user }) {
  const [formData, setFormData] = useState({
    name: domain.name || '',
    description: domain.description || '',
    latitude: domain.latitude || '',
    longitude: domain.longitude || '',
    size: domain.size || 0,
    soilType: domain.soilType || '',
    climate: domain.climate || '',
    organizationId: domain.organizationId?._id || domain.organizationId || '',
    isActive: domain.isActive !== undefined ? domain.isActive : true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.organizationId) {
      alert('Please fill in all required fields (Name and Organization)');
      return;
    }
    
    // Convert size to number if it's not empty and clean the data
    const submitData = {
      name: formData.name,
      description: formData.description,
      latitude: formData.latitude ? Number(formData.latitude) : null,
      longitude: formData.longitude ? Number(formData.longitude) : null,
      size: formData.size ? Number(formData.size) : 0,
      soilType: formData.soilType,
      climate: formData.climate,
      organizationId: formData.organizationId,
      isActive: formData.isActive
    };
    
    console.log('EditDomainModal - Submitting domain data:', submitData);
    onUpdate(submitData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Dialog isOpen={true} onClose={onClose} title={`Edit Domain: ${domain.name}`} size="2xl" className="max-w-4xl">
      <div className="p-6">

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Domain Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="Enter domain name"
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
              placeholder="Enter domain description"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Latitude
              </label>
              <input
                type="number"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                step="any"
                className="input-field"
                placeholder="Enter latitude"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Longitude
              </label>
              <input
                type="number"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                step="any"
                className="input-field"
                placeholder="Enter longitude"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Size (sq ft)
              </label>
              <input
                type="number"
                name="size"
                value={formData.size}
                onChange={handleChange}
                className="input-field"
                placeholder="Size"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Soil Type
              </label>
              <select
                name="soilType"
                value={formData.soilType}
                onChange={handleChange}
                className="input-field"
              >
                <option key="select-soil" value="">Select Soil Type</option>
                <option key="clay" value="clay">Clay</option>
                <option key="silt" value="silt">Silt</option>
                <option key="loam" value="loam">Loam</option>
                <option key="sandy" value="sandy">Sandy</option>
                <option key="chalky" value="chalky">Chalky</option>
                <option key="peaty" value="peaty">Peaty</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Climate
            </label>
            <select
              name="climate"
              value={formData.climate}
              onChange={handleChange}
              className="input-field"
            >
              <option key="select-climate" value="">Select Climate</option>
              <option key="tropical" value="tropical">Tropical</option>
              <option key="subtropical" value="subtropical">Subtropical</option>
              <option key="temperate" value="temperate">Temperate</option>
              <option key="continental" value="continental">Continental</option>
              <option key="polar" value="polar">Polar</option>
            </select>
          </div>

          {user?.role === 'super_admin' && (
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
                className="input-field"
              />
            </div>
          )}

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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}

export default DomainsList; 