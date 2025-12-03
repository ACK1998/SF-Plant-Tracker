import React, { useState, useEffect } from 'react';
import { Plus, Search, User, Mail, Phone, Building, Info, MapPin, TreePine } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../../contexts/ApiContext';
import { getAvailableRoles } from '../../data/userData';
import ConfirmationDialog from '../common/ConfirmationDialog'; 

function UsersList({ user, selectedState, showAddModal: showAddModalProp = false, showEditModal: showEditModalProp = false }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { 
    users, 
    organizations, 
    domains,
    plots,
    loading, 
    error,
    addUser, 
    updateUser, 
    deleteUser,
    refreshData
  } = useApi();





  const [showAddModal, setShowAddModal] = useState(showAddModalProp);
  const [showEditModal, setShowEditModal] = useState(showEditModalProp);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Handle URL parameter changes
  useEffect(() => {
    setShowAddModal(showAddModalProp);
  }, [showAddModalProp]);

  useEffect(() => {
    setShowEditModal(showEditModalProp);
  }, [showEditModalProp]);

  // Handle edit modal when URL has user ID
  useEffect(() => {
    if (id && showEditModalProp) {
      const userToEdit = users.find(u => u._id === id);
      if (userToEdit) {
        setEditingUser(userToEdit);
        setShowEditModal(true);
      }
    }
  }, [id, showEditModalProp, users]);

  // Get available users based on current user's role and permissions
  const getAvailableUsers = () => {
    if (!user || !user.role) return [];
    
    return users.filter(userItem => {
      // Super admin can see all users
      if (user.role === 'super_admin') return true;
      
      // Org admin can see users in their organization
      if (user.role === 'org_admin') {
        const currentUserOrgId = user.organizationId?._id || user.organizationId;
        const userItemOrgId = userItem.organizationId?._id || userItem.organizationId;
        return String(currentUserOrgId) === String(userItemOrgId);
      }
      
      // Domain admin can see users in their domain
      if (user.role === 'domain_admin') {
        const currentUserOrgId = user.organizationId?._id || user.organizationId;
        const currentUserDomainId = user.domainId?._id || user.domainId;
        const userItemOrgId = userItem.organizationId?._id || userItem.organizationId;
        const userItemDomainId = userItem.domainId?._id || userItem.domainId;
        
        return String(currentUserOrgId) === String(userItemOrgId) &&
               String(currentUserDomainId) === String(userItemDomainId);
      }
      
      // Application users cannot see other users
      return false;
    });
  };

  // Filter users based on search, state, and role-based permissions
  const filteredUsers = getAvailableUsers().filter(userItem => {
    const matchesSearch = userItem.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userItem.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userItem.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userItem.username?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Handle both populated and unpopulated organizationId
    const userOrgId = userItem.organizationId?._id || userItem.organizationId;
    const matchesState = selectedState === 'all' || 
      organizations.find(org => org._id === userOrgId)?.address?.state === selectedState;
    
    return matchesSearch && matchesState;
  });

  const handleAddUser = async (newUser) => {
    try {
      await addUser(newUser);
      setShowAddModal(false);
      navigate('/users'); // Navigate back to users list
      
      // Show success notification
      if (window.showNotification) {
        window.showNotification({
          type: 'success',
          message: 'User added successfully!',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Failed to add user:', error);
      
      // Show error notification
      if (window.showNotification) {
        window.showNotification({
          type: 'error',
          message: 'Failed to add user. Please try again.',
          duration: 5000
        });
      }
    }
  };

  const handleUpdateUser = async (updatedUser) => {
    try {
      // Ensure we have the correct _id for the update
      const userId = editingUser._id;
      await updateUser(userId, updatedUser);
      setShowEditModal(false);
      setEditingUser(null);
      navigate('/users'); // Navigate back to users list
      
      // Show success notification
      if (window.showNotification) {
        window.showNotification({
          type: 'success',
          message: 'User updated successfully!',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      
      // Show error notification
      if (window.showNotification) {
        window.showNotification({
          type: 'error',
          message: 'Failed to update user. Please try again.',
          duration: 5000
        });
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await deleteUser(userId);
      
      // Show success notification
      if (window.showNotification) {
        window.showNotification({
          type: 'success',
          message: 'User deleted successfully!',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      
      // Show error notification
      if (window.showNotification) {
        window.showNotification({
          type: 'error',
          message: 'Failed to delete user. Please try again.',
          duration: 5000
        });
      }
    }
  };

  const confirmDeleteUser = (userItem) => {
    setUserToDelete(userItem);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      await handleDeleteUser(userToDelete._id);
      setUserToDelete(null);
    }
  };

  // Permission checking functions
  const canAddUser = () => {
    if (!user || !user.role) return false;
    return ['super_admin', 'org_admin', 'domain_admin'].includes(user.role);
  };

  const canEditUser = (userItem) => {
    if (!user || !user.role) return false;
    
    // Prevent non-super-admin users from editing super admin users
    if (userItem.role === 'super_admin' && user.role !== 'super_admin') {
      return false;
    }
    
    // Super admin can edit all users
    if (user.role === 'super_admin') return true;
    
    // Org admin can edit users in their organization
    if (user.role === 'org_admin') {
      const currentUserOrgId = user.organizationId?._id || user.organizationId;
      const userItemOrgId = userItem.organizationId?._id || userItem.organizationId;
      return String(currentUserOrgId) === String(userItemOrgId);
    }
    
    // Domain admin can edit users in their domain
    if (user.role === 'domain_admin') {
      const currentUserOrgId = user.organizationId?._id || user.organizationId;
      const currentUserDomainId = user.domainId?._id || user.domainId;
      const userItemOrgId = userItem.organizationId?._id || userItem.organizationId;
      const userItemDomainId = userItem.domainId?._id || userItem.domainId;
      return String(currentUserOrgId) === String(userItemOrgId) &&
             String(currentUserDomainId) === String(userItemDomainId);
    }
    
    return false;
  };

  const canDeleteUser = (userItem) => {
    if (!user || !user.role) return false;
    
    // Cannot delete yourself
    if (userItem._id === user._id) return false;
    
    // Prevent non-super-admin users from deleting super admin users
    if (userItem.role === 'super_admin' && user.role !== 'super_admin') {
      return false;
    }
    
    // Super admin can delete all users except themselves
    if (user.role === 'super_admin') return true;
    
    // Org admin can delete users in their organization
    if (user.role === 'org_admin') {
      const currentUserOrgId = user.organizationId?._id || user.organizationId;
      const userItemOrgId = userItem.organizationId?._id || userItem.organizationId;
      return String(currentUserOrgId) === String(userItemOrgId);
    }
    
    // Domain admin can delete application users in their domain
    if (user.role === 'domain_admin') {
      const currentUserOrgId = user.organizationId?._id || user.organizationId;
      const currentUserDomainId = user.domainId?._id || user.domainId;
      const userItemOrgId = userItem.organizationId?._id || userItem.organizationId;
      const userItemDomainId = userItem.domainId?._id || userItem.domainId;
      return String(currentUserOrgId) === String(userItemOrgId) &&
             String(currentUserDomainId) === String(userItemDomainId) &&
             userItem.role === 'application_user';
    }
    
    return false;
  };

  const openEditModal = (userItem) => {
    setEditingUser(userItem);
    navigate(`/users/${userItem._id}/edit`);
  };

  const getOrganizationName = (organizationId) => {
    // Handle different organizationId formats
    if (!organizationId) {
      return 'No Organization';
    }
    
    // Case 1: organizationId is a populated object with name
    if (typeof organizationId === 'object' && organizationId.name) {
      return organizationId.name;
    }
    
    // Case 2: organizationId is a string ID, find in organizations array
    if (typeof organizationId === 'string') {
      const org = organizations.find(org => org._id === organizationId);
      if (org) {
        return org.name;
      }
    }
    
    // Case 3: organizationId might be an object with _id
    if (typeof organizationId === 'object' && organizationId._id) {
      const org = organizations.find(org => org._id === organizationId._id);
      if (org) {
        return org.name;
      }
    }
    
    return 'Unknown Organization';
  };

  const getDomainName = (domainId) => {
    // Handle different domainId formats
    if (!domainId) {
      return 'No Domain';
    }
    
    // Case 1: domainId is a populated object with name
    if (typeof domainId === 'object' && domainId.name) {
      return domainId.name;
    }
    
    // Case 2: domainId is a string ID, find in domains array
    if (typeof domainId === 'string') {
      const domain = domains.find(domain => domain._id === domainId);
      if (domain) {
        return domain.name;
      }
    }
    
    // Case 3: domainId might be an object with _id
    if (typeof domainId === 'object' && domainId._id) {
      const domain = domains.find(domain => domain._id === domainId._id);
      if (domain) {
        return domain.name;
      }
    }
    
    return 'Unknown Domain';
  };

  const getPlotName = (plotId) => {
    // Handle different plotId formats
    if (!plotId) {
      return 'No Plot';
    }
    
    // Case 1: plotId is a populated object with name
    if (typeof plotId === 'object' && plotId.name) {
      return plotId.name;
    }
    
    // Case 2: plotId is a string ID, find in plots array
    if (typeof plotId === 'string') {
      const plot = plots.find(plot => plot._id === plotId);
      if (plot) {
        return plot.name;
      }
    }
    
    // Case 3: plotId might be an object with _id
    if (typeof plotId === 'object' && plotId._id) {
      const plot = plots.find(plot => plot._id === plotId._id);
      if (plot) {
        return plot.name;
      }
    }
    
    return 'Unknown Plot';
  };

  const getRoleDisplayName = (role) => {
    const roleMap = {
      'super_admin': 'Super Admin',
      'org_admin': 'Organization Admin',
      'domain_admin': 'Domain Admin',
      'application_user': 'Application User'
    };
    return roleMap[role] || role;
  };
  
  const getRoleColor = (role) => {
    const colors = {
      'super_admin': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'org_admin': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'domain_admin': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'application_user': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    };
    return colors[role] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  // Debug logging
  console.log('UsersList - users data:', users);
  console.log('UsersList - organizations data:', organizations);
  console.log('UsersList - loading:', loading);
  console.log('UsersList - error:', error);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-plant-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 dark:text-red-400 mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Error loading users</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={refreshData}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Users</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage system users and permissions</p>
        </div>
        
        {canAddUser() && (
          <button
            onClick={() => navigate('/users/add')}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add User</span>
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
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No users found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm 
              ? 'Try adjusting your search criteria.'
              : 'Get started by adding your first user!'
            }
          </p>
          {!searchTerm && user.role === 'super_admin' && (
            <button
              onClick={() => navigate('/users/add')}
              className="btn-primary"
            >
              Add Your First User
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredUsers.map(userItem => (
            <div key={userItem._id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-plant-green-100 dark:bg-plant-green-900 rounded-lg">
                    <User className="h-6 w-6 text-plant-green-600 dark:text-plant-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {userItem.firstName} {userItem.lastName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      @{userItem.username}
                    </p>
                  </div>
                </div>
                <span className={`px-6 py-1 text-xs font-medium rounded-full ${getRoleColor(userItem.role)}`}>
                  {getRoleDisplayName(userItem.role)}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Mail size={16} />
                  <span>{userItem.email}</span>
                </div>
                {userItem.phone && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Phone size={16} />
                    <span>{userItem.phone}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Building size={16} />
                  <span>{getOrganizationName(userItem.organizationId)}</span>
                </div>
                {userItem.domainId && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin size={16} />
                    <span>{getDomainName(userItem.domainId)}</span>
                  </div>
                )}
                {(userItem.plotIds && userItem.plotIds.length > 0) || userItem.plotId ? (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <TreePine size={16} />
                    <span>
                      {userItem.plotIds && userItem.plotIds.length > 0 
                        ? userItem.plotIds.map(plot => getPlotName(plot)).join(', ')
                        : getPlotName(userItem.plotId)
                      }
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Joined: {new Date(userItem.createdAt).toLocaleDateString()}</span>
                <div className="flex space-x-2">
                  {canEditUser(userItem) && (
                    <button 
                      onClick={() => openEditModal(userItem)}
                      className="text-plant-green-600 dark:text-plant-green-400 hover:underline"
                    >
                      Edit
                    </button>
                  )}
                  {canDeleteUser(userItem) && (
                    <button 
                      onClick={() => confirmDeleteUser(userItem)}
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

      {/* Add User Modal */}
      {showAddModal && (
        <AddUserModal
          currentUser={user}
                        onClose={() => {
                setShowAddModal(false);
                navigate('/users');
              }}
          onAdd={handleAddUser}
          organizations={organizations}
          domains={domains}
          plots={plots}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <EditUserModal
          currentUser={user}
          user={editingUser}
                        onClose={() => {
                setShowEditModal(false);
                navigate('/users');
              }}
          onUpdate={handleUpdateUser}
          organizations={organizations}
          domains={domains}
          plots={plots}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setUserToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete User"
        message="Are you sure you want to delete the user"
        itemName={userToDelete?.firstName + ' ' + userToDelete?.lastName}
        confirmText="Delete"
        cancelText="Cancel"
        type="delete"
      />
    </div>
  );
}

// Add User Modal Component
function AddUserModal({ currentUser, onClose, onAdd, organizations, domains, plots }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: '', // Don't auto-select role
    organizationId: '',
    domainId: '',
    plotIds: []
  });

  const [availableDomains, setAvailableDomains] = useState([]);
  const [availablePlots, setAvailablePlots] = useState([]);
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [loadingPlots, setLoadingPlots] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize form data based on current user's role
  useEffect(() => {
    if (currentUser && currentUser.role) {
      const initialData = {
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: '', // Don't auto-select role
        organizationId: '',
        domainId: '',
        plotIds: []
      };

      // Auto-select based on role
      if (currentUser.role === 'org_admin' || currentUser.role === 'domain_admin') {
        const orgId = currentUser.organizationId?._id || currentUser.organizationId;
        initialData.organizationId = orgId ? String(orgId) : '';
      }
      
      if (currentUser.role === 'domain_admin') {
        initialData.domainId = currentUser.domainId?._id || currentUser.domainId;
      }

      console.log('Initializing form data:', {
        currentUser,
        initialData
      });

      setFormData(initialData);
    }
  }, [currentUser]);

  // Get domains for selected organization
  const getDomainsForOrganization = React.useCallback((organizationId) => {
    if (!organizationId) return [];
    
    console.log('getDomainsForOrganization called:', {
      organizationId,
      domains,
      domainsLength: domains.length
    });
    
    const filteredDomains = domains.filter(domain => {
      const domainOrgId = domain.organizationId?._id || domain.organizationId;
      const match = String(domainOrgId) === String(organizationId);
      console.log('Domain check:', {
        domainName: domain.name,
        domainOrgId,
        organizationId,
        match
      });
      return match;
    });
    
    console.log('Filtered domains:', filteredDomains);
    return filteredDomains;
  }, [domains]);

  // Get plots for selected domain
  const getPlotsForDomain = React.useCallback((domainId) => {
    if (!domainId) return [];
    
    console.log('getPlotsForDomain called:', {
      domainId,
      plots,
      plotsLength: plots.length
    });
    
    const filteredPlots = plots.filter(plot => {
      const plotDomainId = plot.domainId?._id || plot.domainId;
      const match = String(plotDomainId) === String(domainId);
      console.log('Plot check:', {
        plotName: plot.name,
        plotDomainId,
        domainId,
        match
      });
      return match;
    });
    
    console.log('Filtered plots:', filteredPlots);
    return filteredPlots;
  }, [plots]);

  // Load domains when organization changes
  useEffect(() => {
    if (formData.organizationId) {
      setLoadingDomains(true);
      const domainsForOrg = getDomainsForOrganization(formData.organizationId);
      console.log('Loading domains for org:', {
        organizationId: formData.organizationId,
        allDomains: domains,
        filteredDomains: domainsForOrg,
        domainsLength: domains.length
      });
      setAvailableDomains(domainsForOrg);
      setLoadingDomains(false);
    } else {
      setAvailableDomains([]);
    }
  }, [formData.organizationId, getDomainsForOrganization, domains]);

  // Load plots when domain changes
  useEffect(() => {
    if (formData.domainId) {
      setLoadingPlots(true);
      const plotsForDomain = getPlotsForDomain(formData.domainId);
      console.log('Loading plots for domain:', {
        domainId: formData.domainId,
        allPlots: plots,
        filteredPlots: plotsForDomain,
        plotsLength: plots.length
      });
      setAvailablePlots(plotsForDomain);
      setLoadingPlots(false);
    } else {
      setAvailablePlots([]);
    }
  }, [formData.domainId, getPlotsForDomain, plots]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields based on role
    // For super_admin, organizationId is required
    // For org_admin and domain_admin, it will be auto-set by backend if not provided
    if (currentUser?.role === 'super_admin' && !formData.organizationId) {
      alert('Please select an organization');
      return;
    }
    
    if ((formData.role === 'domain_admin' || formData.role === 'application_user') && !formData.domainId) {
      alert('Please select a domain');
      return;
    }
    
    if (formData.role === 'application_user' && (!formData.plotIds || formData.plotIds.length === 0)) {
      alert('Please select at least one plot');
      return;
    }
    
    // Prepare data for submission - remove plotIds and domainId for roles that don't need them
    const submitData = { ...formData };
    if (formData.role !== 'application_user') {
      delete submitData.plotIds;
    }
    if (formData.role === 'org_admin') {
      delete submitData.domainId;
    }
    
    onAdd(submitData);
  };

  // Get available organizations based on current user's role
  const getAvailableOrganizations = () => {
    if (!currentUser || !currentUser.role) return organizations;
    
    if (currentUser.role === 'super_admin') return organizations;
    
    if (currentUser.role === 'org_admin' || currentUser.role === 'domain_admin') {
      const currentUserOrgId = currentUser.organizationId?._id || currentUser.organizationId;
      return organizations.filter(org => String(org._id) === String(currentUserOrgId));
    }
    
    return [];
  };





  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Reset related fields when role changes
    if (name === 'role') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        domainId: '',
        plotIds: []
        // Keep organizationId - don't reset it
      }));
    }
    
    // Reset plot when domain changes
    if (name === 'domainId') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        plotIds: []
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
  };

  const isFieldDisabled = (fieldName) => {
    if (!currentUser || !currentUser.role) return false;
    
    if (fieldName === 'organizationId') {
      return currentUser.role === 'org_admin' || currentUser.role === 'domain_admin';
    }
    
    if (fieldName === 'domainId') {
      return currentUser.role === 'domain_admin';
    }
    
    return false;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Add New User
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Last name"
                />
              </div>
            </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username *
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="Username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="Email address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="Password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input-field"
              placeholder="Phone number"
            />
          </div>

          {/* Role and Organization - Show organization field for super_admin and org_admin */}
          {currentUser?.role === 'super_admin' || currentUser?.role === 'org_admin' ? (
            // Two column layout for super_admin and org_admin
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="">Select Role</option>
                  {getAvailableRoles(currentUser?.role).map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Organization *
                </label>
                <select
                  name="organizationId"
                  value={formData.organizationId}
                  onChange={handleChange}
                  required
                  disabled={isFieldDisabled('organizationId')}
                  className={`input-field ${isFieldDisabled('organizationId') ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`}
                >
                  <option value="">Select Organization</option>
                  {getAvailableOrganizations().map(org => (
                    <option key={org._id} value={org._id}>
                      {org.name}
                    </option>
                  ))}
                </select>
                {isFieldDisabled('organizationId') && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Auto-selected based on your role
                  </p>
                )}
              </div>
            </div>
          ) : (
            // Single column layout for domain_admin users (no organization field)
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="input-field"
              >
                <option value="">Select Role</option>
                {getAvailableRoles(currentUser?.role).map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Domain Selection - Only show for domain_admin and application_user roles */}
          {(formData.role === 'domain_admin' || formData.role === 'application_user') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Domain *
              </label>
              <select
                name="domainId"
                value={formData.domainId}
                onChange={handleChange}
                required
                disabled={isFieldDisabled('domainId') || !formData.organizationId || loadingDomains}
                className={`input-field ${(isFieldDisabled('domainId') || !formData.organizationId || loadingDomains) ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`}
              >
                <option value="">Select Domain</option>
                {loadingDomains && <option disabled>Loading domains...</option>}
                {availableDomains.map(domain => (
                  <option key={domain._id} value={domain._id}>
                    {domain.name}
                  </option>
                ))}
              </select>
              {isFieldDisabled('domainId') && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Auto-selected based on your role
                </p>
              )}
              {!formData.organizationId && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Please select an organization first
                </p>
              )}
            </div>
          )}
          
          {/* Info message for org_admin */}
          {formData.role === 'org_admin' && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center">
                <Info className="h-4 w-4 text-blue-500 mr-2" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Organization Admin users have access to all domains in their organization and don't need to be assigned to a specific domain.
                </p>
              </div>
            </div>
          )}

          {/* Plot Selection - Only show for application_user role */}
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
          
          {/* Info message for domain_admin */}
          {formData.role === 'domain_admin' && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center">
                <Info className="h-4 w-4 text-blue-500 mr-2" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Domain Admin users have access to all plots in their domain and don't need to be assigned to a specific plot.
                </p>
              </div>
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
              Add User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit User Modal Component
function EditUserModal({ currentUser, user, onClose, onUpdate, organizations, domains, plots }) {
  const [formData, setFormData] = useState({
    username: user.username || '',
    email: user.email || '',
    password: '', // Password is not editable in this modal, but kept for consistency
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phone: user.phone || '',
    role: user.role || '',
    organizationId: user.organizationId?._id || user.organizationId || '',
    domainId: user.domainId?._id || user.domainId || '',
    plotIds: (() => {
      // Handle new plotIds array structure
      if (user.plotIds && Array.isArray(user.plotIds) && user.plotIds.length > 0) {
        return user.plotIds.map(p => p._id || p);
      }
      // Handle old plotId single value structure
      if (user.plotId) {
        return [user.plotId._id || user.plotId];
      }
      // Default to empty array
      return [];
    })()
  });

  const [availableDomains, setAvailableDomains] = useState([]);
  const [availablePlots, setAvailablePlots] = useState([]);

  const [errors, setErrors] = useState({});

  // Fetch fresh user data if domainId or plotIds are null
  const fetchUserData = React.useCallback(async () => {
    if (!user.domainId && (!user.plotIds || user.plotIds.length === 0) && !user.plotId) {

      try {
        const response = await fetch(`http://localhost:5001/api/users/${user._id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('sanctityFermeToken')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          console.log('EditUserModal - Fetched fresh user data:', userData);
          
          if (userData.success && userData.data) {
            const freshUser = userData.data;
            setFormData(prev => ({
              ...prev,
              organizationId: freshUser.organizationId?._id || freshUser.organizationId || '',
              domainId: freshUser.domainId?._id || freshUser.domainId || '',
              plotIds: (() => {
                // Handle new plotIds array structure
                if (freshUser.plotIds && Array.isArray(freshUser.plotIds) && freshUser.plotIds.length > 0) {
                  return freshUser.plotIds.map(p => p._id || p);
                }
                // Handle old plotId single value structure
                if (freshUser.plotId) {
                  return [freshUser.plotId._id || freshUser.plotId];
                }
                // Default to empty array
                return [];
              })()
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        // Loading complete
      }
    }
  }, [user._id, user.domainId, user.plotIds, user.plotId]);

  // Fetch user data on component mount if needed
  React.useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  console.log('EditUserModal - Received user data:', {
    user,
    userOrgId: user.organizationId?._id || user.organizationId,
    userDomainId: user.domainId?._id || user.domainId,
    userPlotIds: (() => {
      // Handle new plotIds array structure
      if (user.plotIds && Array.isArray(user.plotIds) && user.plotIds.length > 0) {
        return user.plotIds.map(p => p._id || p);
      }
      // Handle old plotId single value structure
      if (user.plotId) {
        return [user.plotId._id || user.plotId];
      }
      // Default to empty array
      return [];
    })(),
    availableDomains: domains.length,
    availablePlots: plots.length,
    domains: domains,
    plots: plots,
    rawUserData: {
      organizationId: user.organizationId,
      domainId: user.domainId,
      plotIds: user.plotIds,
      plotId: user.plotId
    },
    formData,
    debug: {
      hasPlotIds: !!user.plotIds,
      plotIdsLength: user.plotIds?.length || 0,
      hasPlotId: !!user.plotId,
      plotIdsType: typeof user.plotIds,
      plotIdType: typeof user.plotId,
      plotIdsValue: user.plotIds,
      plotIdValue: user.plotId
    }
  });

  // Filter domains based on organization
  const getDomainsForOrganization = React.useCallback((organizationId) => {
    if (!organizationId) return [];
    console.log('EditUserModal - getDomainsForOrganization called:', {
      organizationId,
      totalDomains: domains.length,
      domains: domains.map(d => ({ id: d._id, name: d.name, orgId: d.organizationId?._id || d.organizationId }))
    });
    
    const filteredDomains = domains.filter(domain => {
      const domainOrgId = domain.organizationId?._id || domain.organizationId;
      const match = String(domainOrgId) === String(organizationId);
      console.log('Domain filter check:', {
        domainName: domain.name,
        domainOrgId,
        organizationId,
        match
      });
      return match;
    });
    
    console.log('EditUserModal - Filtered domains result:', filteredDomains);
    return filteredDomains;
  }, [domains]);

  // Filter plots based on domain
  const getPlotsForDomain = React.useCallback((domainId) => {
    if (!domainId) return [];
    console.log('EditUserModal - getPlotsForDomain called:', {
      domainId,
      totalPlots: plots.length,
      plots: plots.map(p => ({ id: p._id, name: p.name, domainId: p.domainId?._id || p.domainId }))
    });
    
    const filteredPlots = plots.filter(plot => {
      const plotDomainId = plot.domainId?._id || plot.domainId;
      const match = String(plotDomainId) === String(domainId);
      console.log('Plot filter check:', {
        plotName: plot.name,
        plotDomainId,
        domainId,
        match
      });
      return match;
    });
    
    console.log('EditUserModal - Filtered plots result:', filteredPlots);
    return filteredPlots;
  }, [plots]);

  // Initialize available options on component mount and when user data changes
  React.useEffect(() => {
    // Initialize domains and plots based on current form data
    if (formData.organizationId) {
      const domainsForOrg = getDomainsForOrganization(formData.organizationId);
      setAvailableDomains(domainsForOrg);
      console.log('EditUserModal - Initialized domains:', {
        organizationId: formData.organizationId,
        availableDomains: domainsForOrg
      });
    }
    
    if (formData.domainId) {
      const plotsForDomain = getPlotsForDomain(formData.domainId);
      setAvailablePlots(plotsForDomain);
      console.log('EditUserModal - Initialized plots:', {
        domainId: formData.domainId,
        availablePlots: plotsForDomain
      });
    }
  }, [formData.organizationId, formData.domainId, getDomainsForOrganization, getPlotsForDomain, user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    // Validate required fields
    const newErrors = {};
    
    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.username?.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password validation - only if password is provided
    if (formData.password && formData.password.trim() !== '') {
      if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters long';
      }
    }
    
    if (!formData.role) {
      newErrors.role = 'Role is required';
    }
    
    // Organization validation - only for non-org_admin users
    if (currentUser?.role !== 'org_admin' && !formData.organizationId) {
      newErrors.organizationId = 'Organization is required';
    }
    
    // Domain validation - only for domain_admin and application_user roles
    if ((formData.role === 'domain_admin' || formData.role === 'application_user') && !formData.domainId) {
      newErrors.domainId = 'Domain is required';
    }
    
    // Plot validation - only for application_user role
    if (formData.role === 'application_user' && (!formData.plotIds || formData.plotIds.length === 0)) {
      newErrors.plotIds = 'At least one plot is required';
    }
    
    // If there are errors, display them and stop submission
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Remove password if it's empty to avoid validation errors
    const submitData = { ...formData };
    if (!submitData.password || submitData.password.trim() === '') {
      delete submitData.password;
    }
    
    onUpdate(submitData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }

    // Update available options when organization or domain changes
    if (name === 'organizationId') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        domainId: '',
        plotIds: []
      }));
      setAvailableDomains(getDomainsForOrganization(value));
      setAvailablePlots([]);
    }

    if (name === 'domainId') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        plotIds: []
      }));
      setAvailablePlots(getPlotsForDomain(value));
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

  // Check if current user is editing their own profile
  const isEditingOwnProfile = currentUser?._id === user?._id;

  // Check if field should be disabled based on current user's role and whether they're editing their own profile
  const isFieldDisabled = (fieldName) => {
    if (!currentUser || !currentUser.role) return false;
    
    // If editing own profile, apply restrictions based on role
    if (isEditingOwnProfile) {
      if (fieldName === 'role') {
        // No one can change their own role
        return true;
      }
      
      if (fieldName === 'organizationId') {
        // Domain admins and org admins cannot change their own organization
        return currentUser.role === 'domain_admin' || currentUser.role === 'org_admin';
      }
      
      if (fieldName === 'domainId') {
        // Domain admins cannot change their own domain
        return currentUser.role === 'domain_admin';
      }
    }
    
    return false;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Edit User
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className={`input-field ${errors.firstName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="First name"
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.firstName}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="input-field"
                placeholder="Last name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username *
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="Username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="Email address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`input-field ${errors.password ? 'border-red-500' : ''}`}
              placeholder="Password"
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input-field"
              placeholder="Phone number"
            />
          </div>

          {/* Role and Organization - Use grid only when both fields are shown */}
          {currentUser?.role !== 'super_admin' ? (
            // Single column layout for non-super-admin users (no organization field)
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                disabled={isFieldDisabled('role')}
                className={`input-field ${isFieldDisabled('role') ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`}
              >
                <option key="select-role" value="">Select Role</option>
                {getAvailableRoles(currentUser?.role).map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              {isFieldDisabled('role') && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Cannot change your own role
                </p>
              )}
            </div>
          ) : (
            // Two column layout for super_admin
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  disabled={isFieldDisabled('role')}
                  className={`input-field ${isFieldDisabled('role') ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`}
                >
                  <option key="select-role" value="">Select Role</option>
                  {getAvailableRoles(currentUser?.role).map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                {isFieldDisabled('role') && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Cannot change your own role
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Organization *
                </label>
                <select
                  name="organizationId"
                  value={formData.organizationId}
                  onChange={handleChange}
                  required
                  disabled={isFieldDisabled('organizationId')}
                  className={`input-field ${isFieldDisabled('organizationId') ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`}
                >
                  <option key="select-org" value="">Select Organization</option>
                  {organizations.map(org => (
                    <option key={org._id} value={org._id}>
                      {org.name}
                    </option>
                  ))}
                </select>
                {isFieldDisabled('organizationId') && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Cannot change your own organization
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Domain Selection - Only show for domain_admin and application_user roles */}
          {(formData.role === 'domain_admin' || formData.role === 'application_user') && (
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
                <option value="">Select Domain</option>
                {availableDomains.map(domain => (
                  <option key={domain._id} value={domain._id}>
                    {domain.name}
                  </option>
                ))}
              </select>
              {isFieldDisabled('domainId') && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Cannot change your own domain
                </p>
              )}
            </div>
          )}

          {/* Plot Selection - Only show for application_user role */}
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
              Update User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UsersList; 