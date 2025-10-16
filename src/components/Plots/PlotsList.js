import React, { useState, useEffect } from 'react';
import { Plus, Search, MapPin, Building, Droplets, Sun } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../../contexts/ApiContext';
import ConfirmationDialog from '../common/ConfirmationDialog';
import MapPickerMapbox from '../MapView/MapPickerMapbox';

function PlotsList({ user, selectedState, showAddModal: showAddModalProp = false, showEditModal: showEditModalProp = false }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { 
    plots, 
    domains, 
    organizations, 
    users,
    loading, 
    error,
    addPlot, 
    updatePlot, 
    deletePlot 
  } = useApi();

  const [showAddModal, setShowAddModal] = useState(showAddModalProp);
  const [showEditModal, setShowEditModal] = useState(showEditModalProp);
  const [editingPlot, setEditingPlot] = useState(null);

  // Handle URL parameter changes
  useEffect(() => {
    setShowAddModal(showAddModalProp);
  }, [showAddModalProp]);

  useEffect(() => {
    setShowEditModal(showEditModalProp);
  }, [showEditModalProp]);

  // Handle edit modal when URL has plot ID
  useEffect(() => {
    if (id && showEditModalProp) {
      const plotToEdit = plots.find(p => p._id === id);
      if (plotToEdit) {
        setEditingPlot(plotToEdit);
        setShowEditModal(true);
      }
    }
  }, [id, showEditModalProp, plots]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [plotToDelete, setPlotToDelete] = useState(null);

  // Filter plots based on selected state
  const filteredPlots = plots.filter(plot => {
    const matchesSearch = plot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plot.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Handle both populated and unpopulated organizationId
    const plotOrgId = plot.organizationId?._id || plot.organizationId;
    const matchesState = selectedState === 'all' || 
      organizations.find(org => org._id === plotOrgId)?.address?.state === selectedState;
    
    return matchesSearch && matchesState;
  });

  const handleAddPlot = async (newPlot) => {
    try {
      await addPlot(newPlot);
      setShowAddModal(false);
      
      // Show success notification
      if (window.showNotification) {
        window.showNotification({
          type: 'success',
          message: 'Plot added successfully!',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Failed to add plot:', error);
      
      // Show error notification
      if (window.showNotification) {
        window.showNotification({
          type: 'error',
          message: 'Failed to add plot. Please try again.',
          duration: 5000
        });
      }
    }
  };

  const handleUpdatePlot = async (updatedPlot) => {
    try {
      await updatePlot(updatedPlot._id, updatedPlot);
      setShowEditModal(false);
      setEditingPlot(null);
      
      // Show success notification
      if (window.showNotification) {
        window.showNotification({
          type: 'success',
          message: 'Plot updated successfully!',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Failed to update plot:', error);
      
      // Show error notification
      if (window.showNotification) {
        window.showNotification({
          type: 'error',
          message: 'Failed to update plot. Please try again.',
          duration: 5000
        });
      }
    }
  };

  const handleDeletePlot = async (plotId) => {
    try {
      await deletePlot(plotId);
      
      // Show success notification
      if (window.showNotification) {
        window.showNotification({
          type: 'success',
          message: 'Plot deleted successfully!',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Failed to delete plot:', error);
      
      // Show error notification
      if (window.showNotification) {
        window.showNotification({
          type: 'error',
          message: 'Failed to delete plot. Please try again.',
          duration: 5000
        });
      }
    }
  };

  const confirmDeletePlot = (plot) => {
    setPlotToDelete(plot);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (plotToDelete) {
      await handleDeletePlot(plotToDelete._id);
      setPlotToDelete(null);
    }
  };

  // Permission checking functions
  const canAddPlot = () => {
    if (!user || !user.role) return false;
    return ['super_admin', 'org_admin', 'domain_admin'].includes(user.role);
  };

  const canEditPlot = (plot) => {
    if (!user || !user.role) return false;
    
    // Super admin can edit all plots
    if (user.role === 'super_admin') return true;
    
    // Org admin can edit plots in their organization
    if (user.role === 'org_admin') {
      const userOrgId = user.organizationId?._id || user.organizationId;
      const plotOrgId = plot.organizationId?._id || plot.organizationId;
      return String(userOrgId) === String(plotOrgId);
    }
    
    // Domain admin can edit plots in their domain
    if (user.role === 'domain_admin') {
      const userOrgId = user.organizationId?._id || user.organizationId;
      const userDomainId = user.domainId?._id || user.domainId;
      const plotOrgId = plot.organizationId?._id || plot.organizationId;
      const plotDomainId = plot.domainId?._id || plot.domainId;
      return String(userOrgId) === String(plotOrgId) &&
             String(userDomainId) === String(plotDomainId);
    }
    
    return false;
  };

  const canDeletePlot = (plot) => {
    if (!user || !user.role) return false;
    
    // Super admin can delete all plots
    if (user.role === 'super_admin') return true;
    
    // Org admin can delete plots in their organization
    if (user.role === 'org_admin') {
      const userOrgId = user.organizationId?._id || user.organizationId;
      const plotOrgId = plot.organizationId?._id || plot.organizationId;
      return String(userOrgId) === String(plotOrgId);
    }
    
    // Domain admin can delete plots in their domain
    if (user.role === 'domain_admin') {
      const userOrgId = user.organizationId?._id || user.organizationId;
      const userDomainId = user.domainId?._id || user.domainId;
      const plotOrgId = plot.organizationId?._id || plot.organizationId;
      const plotDomainId = plot.domainId?._id || plot.domainId;
      return String(userOrgId) === String(plotOrgId) &&
             String(userDomainId) === String(plotDomainId);
    }
    
    return false;
  };

  const openEditModal = (plot) => {
    navigate(`/plots/${plot._id}/edit`);
  };

  const openAddModal = () => {
    navigate('/plots/add');
  };

  const getDomainName = (domainId) => {
    // Handle both populated and unpopulated domainId
    if (domainId && typeof domainId === 'object' && domainId.name) {
      // domainId is populated (has name property)
      return domainId.name;
    } else if (domainId) {
      // domainId is a string (unpopulated), find in domains array
      const domain = domains.find(domain => domain._id === domainId);
      return domain?.name || 'Unknown Domain';
    }
    return 'Unknown Domain';
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
          <p className="text-gray-600 dark:text-gray-400">Loading plots...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 dark:text-red-400 mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Error loading plots</h3>
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Plots</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage growing plots and cultivation areas</p>
        </div>
        
        {canAddPlot() && (
          <button
            onClick={openAddModal}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Plot</span>
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
            placeholder="Search plots..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Plots Grid */}
      {filteredPlots.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🌱</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No plots found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm 
              ? 'Try adjusting your search criteria.'
              : 'Get started by adding your first plot!'
            }
          </p>
          {!searchTerm && user.role === 'super_admin' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              Add Your First Plot
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredPlots.map(plot => (
            <div key={plot._id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-plant-green-100 dark:bg-plant-green-900 rounded-lg">
                    <MapPin className="h-6 w-6 text-plant-green-600 dark:text-plant-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {plot.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Created by {getCreatedByUser(plot.createdBy)}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  plot.isActive 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {plot.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {plot.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Building size={16} />
                  <span>{getOrganizationName(plot.organizationId)}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin size={16} />
                  <span>{getDomainName(plot.domainId)}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>Size: {plot.size} sq ft</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Droplets size={16} />
                  <span>{plot.irrigationType}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Sun size={16} />
                  <span>{plot.sunExposure}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Created: {new Date(plot.createdAt).toLocaleDateString()}</span>
                <div className="flex space-x-2">
                  {canEditPlot(plot) && (
                    <button 
                      onClick={() => openEditModal(plot)}
                      className="text-plant-green-600 dark:text-plant-green-400 hover:underline"
                    >
                      Edit
                    </button>
                  )}
                  {canDeletePlot(plot) && (
                    <button 
                      onClick={() => confirmDeletePlot(plot)}
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

      {/* Add Plot Modal */}
      {showAddModal && (
        <AddPlotModal
          onClose={() => {
            setShowAddModal(false);
            navigate('/plots');
          }}
          onAdd={handleAddPlot}
          domains={domains}
          organizations={organizations}
          user={user}
          plots={plots}
        />
      )}

      {/* Edit Plot Modal */}
      {showEditModal && editingPlot && (
        <EditPlotModal
          plot={editingPlot}
          onClose={() => {
            setShowEditModal(false);
            navigate('/plots');
          }}
          onUpdate={handleUpdatePlot}
          domains={domains}
          organizations={organizations}
          user={user}
          plots={plots}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setPlotToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Plot"
        message="Are you sure you want to delete the plot"
        itemName={plotToDelete?.name}
        confirmText="Delete"
        cancelText="Cancel"
        type="delete"
      />
    </div>
  );
}

// Add Plot Modal Component
function AddPlotModal({ onClose, onAdd, domains, organizations, user, plots }) {
  // Auto-select user's organization for non-super-admin users
  const userOrgId = user?.organizationId?._id || user?.organizationId;
  const isSuperAdmin = user?.role === 'super_admin';
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    size: '',
    soilType: '',
    irrigationType: '',
    sunExposure: '',
    domainId: '',
    organizationId: isSuperAdmin ? '' : userOrgId || '',
    latitude: '',
    longitude: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Get domain plots for validation
  const getDomainPlots = (domainId) => {
    if (!domainId || !plots) return [];
    return plots.filter(plot => {
      const plotDomainId = plot.domainId?._id || plot.domainId;
      return String(plotDomainId) === String(domainId);
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Add New Plot
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
              Plot Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="Enter plot name"
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
              placeholder="Enter plot description"
            />
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

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Irrigation Type
              </label>
              <select
                name="irrigationType"
                value={formData.irrigationType}
                onChange={handleChange}
                className="input-field"
              >
                <option key="select-type" value="">Select Type</option>
                <option key="drip" value="drip">Drip</option>
                <option key="sprinkler" value="sprinkler">Sprinkler</option>
                <option key="flood" value="flood">Flood</option>
                <option key="manual" value="manual">Manual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sun Exposure
              </label>
              <select
                name="sunExposure"
                value={formData.sunExposure}
                onChange={handleChange}
                className="input-field"
              >
                <option key="select-exposure" value="">Select Exposure</option>
                <option key="full" value="full">Full Sun</option>
                <option key="partial" value="partial">Partial Sun</option>
                <option key="shade" value="shade">Shade</option>
              </select>
            </div>
          </div>

          {isSuperAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Organization *
              </label>
              <select
                name="organizationId"
                value={formData.organizationId}
                onChange={handleChange}
                required
                className="input-field"
              >
                <option key="select-org" value="">Select Organization</option>
                {organizations.map(org => (
                  <option key={org._id} value={org._id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Domain *
            </label>
            <select
              name="domainId"
              value={formData.domainId}
              onChange={handleChange}
              required
              className="input-field"
            >
              <option key="select-domain" value="">Select Domain</option>
              {domains.map(domain => (
                <option key={domain._id} value={domain._id}>
                  {domain.name}
                </option>
              ))}
            </select>
          </div>

          {/* Location Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location Coordinates
            </label>
            <MapPickerMapbox
              latitude={formData.latitude}
              longitude={formData.longitude}
              onLocationChange={(lat, lng, isValid) => {
                setFormData(prev => ({
                  ...prev,
                  latitude: lat,
                  longitude: lng
                }));
              }}
              validationType="plot"
              validationCenter={{ lat: 12.697541550243653, lng: 78.06162609693409 }} // Phase 1 center
              domainPlots={getDomainPlots(formData.domainId)}
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
              Add Plot
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Plot Modal Component
function EditPlotModal({ plot, onClose, onUpdate, domains, organizations, user, plots }) {
  const [formData, setFormData] = useState({
    name: plot.name || '',
    description: plot.description || '',
    size: plot.size || 0,
    soilType: plot.soilType || '',
    irrigationType: plot.irrigationType || '',
    sunExposure: plot.sunExposure || '',
    domainId: plot.domainId?._id || plot.domainId || '',
    organizationId: plot.organizationId?._id || plot.organizationId || '',
    latitude: plot.latitude || '',
    longitude: plot.longitude || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({ ...plot, ...formData });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Get available domains for the selected organization
  const getAvailableDomains = () => {
    if (!formData.organizationId) return [];
    return domains.filter(domain => 
      domain.organizationId?._id === formData.organizationId || 
      domain.organizationId === formData.organizationId
    );
  };

  // Check if field should be disabled based on user role
  const isFieldDisabled = (fieldName) => {
    if (!user || !user.role) return false;
    
    if (fieldName === 'organizationId') {
      return user.role === 'org_admin' || user.role === 'domain_admin' || user.role === 'application_user';
    }
    
    if (fieldName === 'domainId') {
      return user.role === 'domain_admin' || user.role === 'application_user';
    }
    
    return false;
  };

  // Get domain plots for validation
  const getDomainPlots = (domainId) => {
    if (!domainId || !plots) return [];
    return plots.filter(plot => {
      const plotDomainId = plot.domainId?._id || plot.domainId;
      return String(plotDomainId) === String(domainId);
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Edit Plot: {plot.name}
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
              Plot Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="Enter plot name"
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
              placeholder="Enter plot description"
            />
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

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Irrigation Type
              </label>
              <select
                name="irrigationType"
                value={formData.irrigationType}
                onChange={handleChange}
                className="input-field"
              >
                <option key="select-type" value="">Select Type</option>
                <option key="drip" value="drip">Drip</option>
                <option key="sprinkler" value="sprinkler">Sprinkler</option>
                <option key="flood" value="flood">Flood</option>
                <option key="manual" value="manual">Manual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sun Exposure
              </label>
              <select
                name="sunExposure"
                value={formData.sunExposure}
                onChange={handleChange}
                className="input-field"
              >
                <option key="select-exposure" value="">Select Exposure</option>
                <option key="full" value="full">Full Sun</option>
                <option key="partial" value="partial">Partial Sun</option>
                <option key="shade" value="shade">Shade</option>
              </select>
            </div>
          </div>

          {user?.role === 'super_admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Organization *
              </label>
              <select
                name="organizationId"
                value={formData.organizationId}
                onChange={handleChange}
                required
                className="input-field"
              >
                <option key="select-org" value="">Select Organization</option>
                {organizations.map(org => (
                  <option key={org._id} value={org._id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Domain *
            </label>
            <select
              name="domainId"
              value={formData.domainId}
              onChange={handleChange}
              required
              disabled={isFieldDisabled('domainId')}
              className={`input-field ${isFieldDisabled('domainId') ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`}
            >
              <option key="select-domain" value="">Select Domain</option>
              {getAvailableDomains().map(domain => (
                <option key={domain._id} value={domain._id}>
                  {domain.name}
                </option>
              ))}
            </select>
            {isFieldDisabled('domainId') && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Cannot be changed - locked to your domain
              </p>
            )}
            {!formData.organizationId && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Please select an organization first
              </p>
            )}
          </div>

          {/* Location Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location Coordinates
            </label>
            <MapPickerMapbox
              latitude={formData.latitude}
              longitude={formData.longitude}
              onLocationChange={(lat, lng, isValid) => {
                setFormData(prev => ({
                  ...prev,
                  latitude: lat,
                  longitude: lng
                }));
              }}
              validationType="plot"
              validationCenter={{ lat: 12.697541550243653, lng: 78.06162609693409 }} // Phase 1 center
              domainPlots={getDomainPlots(formData.domainId)}
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PlotsList; 