import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter, RefreshCw } from 'lucide-react';
import { useApi } from '../../contexts/ApiContext';
import AddCategoryModal from './AddCategoryModal';
import EditCategoryModal from './EditCategoryModal';
import Dialog from '../common/Dialog';
import Pagination from '../common/Pagination';

function CategoriesList({ user, showAddModal = false, showEditModal = false }) {
  const { api } = useApi();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(showAddModal);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(showEditModal);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ show: false, category: null });

  // Permission checking functions
  const canCreateCategory = () => {
    if (!user || !user.role) return false;
    return ['super_admin', 'org_admin', 'domain_admin', 'application_user'].includes(user.role);
  };

  const canEditCategory = (category) => {
    if (!user || !user.role) return false;
    
    // Super admin can edit any category
    if (user.role === 'super_admin') return true;
    
    // Org admin can edit any category in their organization
    if (user.role === 'org_admin') {
      const userOrgId = user.organizationId?._id || user.organizationId;
      const categoryOrgId = category.organizationId?._id || category.organizationId;
      return String(userOrgId) === String(categoryOrgId);
    }
    
    // Domain admin can edit any category within their domain
    if (user.role === 'domain_admin') {
      const userOrgId = user.organizationId?._id || user.organizationId;
      const categoryOrgId = category.organizationId?._id || category.organizationId;
      return String(userOrgId) === String(categoryOrgId);
    }
    
    // Application user can only edit categories they created
    if (user.role === 'application_user') {
      const userOrgId = user.organizationId?._id || user.organizationId;
      const categoryOrgId = category.organizationId?._id || category.organizationId;
      const categoryCreatedBy = category.createdBy?._id || category.createdBy;
      return String(userOrgId) === String(categoryOrgId) &&
             String(categoryCreatedBy) === String(user._id);
    }
    
    return false;
  };

  const canDeleteCategory = (category) => {
    if (!user || !user.role) return false;
    
    // Super admin can delete any category
    if (user.role === 'super_admin') return true;
    
    // Org admin can delete any category in their organization
    if (user.role === 'org_admin') {
      const userOrgId = user.organizationId?._id || user.organizationId;
      const categoryOrgId = category.organizationId?._id || category.organizationId;
      return String(userOrgId) === String(categoryOrgId);
    }
    
    // Domain admin can delete any category within their domain
    if (user.role === 'domain_admin') {
      const userOrgId = user.organizationId?._id || user.organizationId;
      const categoryOrgId = category.organizationId?._id || category.organizationId;
      return String(userOrgId) === String(categoryOrgId);
    }
    
    // Application user can only delete categories they created
    if (user.role === 'application_user') {
      const userOrgId = user.organizationId?._id || user.organizationId;
      const categoryOrgId = category.organizationId?._id || category.organizationId;
      const categoryCreatedBy = category.createdBy?._id || category.createdBy;
      return String(userOrgId) === String(categoryOrgId) &&
             String(categoryCreatedBy) === String(user._id);
    }
    
    return false;
  };

  const loadCategories = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        ...(search && { search })
      };

      const response = await api.getCategories(params);
      
      if (response.success) {
        setCategories(response.data);
        setTotalPages(response.pagination.pages);
        setTotalItems(response.pagination.total);
      } else {
        console.error('Failed to load categories:', response.message);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories(currentPage, searchTerm);
  }, [currentPage, searchTerm]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleRefresh = () => {
    loadCategories(currentPage, searchTerm);
  };

  const handleAddCategory = () => {
    setShowAddCategoryModal(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setShowEditCategoryModal(true);
  };

  const handleDeleteCategory = (category) => {
    setDeleteDialog({ show: true, category });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.category) return;

    try {
      const response = await api.deleteCategory(deleteDialog.category._id);
      
      if (response.success) {
        // Show success notification
        if (window.showNotification) {
          window.showNotification({
            type: 'success',
            message: 'Category deleted successfully!',
            duration: 3000
          });
        }
        
        // Reload categories
        loadCategories(currentPage, searchTerm);
      } else {
        // Show error notification
        if (window.showNotification) {
          window.showNotification({
            type: 'error',
            message: response.message || 'Failed to delete category',
            duration: 5000
          });
        }
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      // Show error notification
      if (window.showNotification) {
        window.showNotification({
          type: 'error',
          message: 'Failed to delete category',
          duration: 5000
        });
      }
    } finally {
      setDeleteDialog({ show: false, category: null });
    }
  };

  const handleCategoryCreated = async (newCategory) => {
    // Reload categories to include the new one
    await loadCategories(currentPage, searchTerm);
    setShowAddCategoryModal(false);
    
    // Show success notification
    if (window.showNotification) {
      window.showNotification({
        type: 'success',
        message: 'Category created successfully!',
        duration: 3000
      });
    }
  };

  const handleCategoryUpdated = async (updatedCategory) => {
    // Reload categories to reflect the changes
    await loadCategories(currentPage, searchTerm);
    setShowEditCategoryModal(false);
    setEditingCategory(null);
    
    // Show success notification
    if (window.showNotification) {
      window.showNotification({
        type: 'success',
        message: 'Category updated successfully!',
        duration: 3000
      });
    }
  };

  const getRoleInfo = () => {
    const roleInfo = {
      super_admin: { label: 'Super Admin', color: 'text-red-600', bgColor: 'bg-red-100', description: 'Can manage all categories across all organizations' },
      org_admin: { label: 'Organization Admin', color: 'text-blue-600', bgColor: 'bg-blue-100', description: 'Can manage categories within their organization' },
      domain_admin: { label: 'Domain Admin', color: 'text-green-600', bgColor: 'bg-green-100', description: 'Can manage categories within their domain' },
      application_user: { label: 'Application User', color: 'text-gray-600', bgColor: 'bg-gray-100', description: 'Can manage categories they created' }
    };
    return roleInfo[user?.role] || roleInfo.application_user;
  };

  const roleInfo = getRoleInfo();

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600">Manage plant categories for your organization</p>
        </div>
        
        {/* Role Info */}
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${roleInfo.bgColor} ${roleInfo.color}`}>
          <span>{roleInfo.label}</span>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-green-500 focus:border-transparent flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          
          {canCreateCategory() && (
            <button
              onClick={handleAddCategory}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:border-transparent flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </button>
          )}
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first category.'}
            </p>
            {canCreateCategory() && !searchTerm && (
              <button
                onClick={handleAddCategory}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                Create Category
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{category.emoji}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {category.displayName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {category.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {category.description || 'No description'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {category.createdBy?.firstName} {category.createdBy?.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {category.organizationId?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {canEditCategory(category) && (
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="text-indigo-600 hover:text-indigo-900 p-1"
                            title="Edit category"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        {canDeleteCategory(category) && !category.isDefault && (
                          <button
                            onClick={() => handleDeleteCategory(category)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Delete category"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={handlePageChange}
        />
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <AddCategoryModal
          onClose={() => setShowAddCategoryModal(false)}
          onSuccess={handleCategoryCreated}
        />
      )}

      {/* Edit Category Modal */}
      {showEditCategoryModal && editingCategory && (
        <EditCategoryModal
          category={editingCategory}
          onClose={() => {
            setShowEditCategoryModal(false);
            setEditingCategory(null);
          }}
          onSuccess={handleCategoryUpdated}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialog.show && (
        <Dialog
          isOpen={deleteDialog.show}
          onClose={() => setDeleteDialog({ show: false, category: null })}
          title="Delete Category"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete the category "{deleteDialog.category?.displayName}"? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteDialog({ show: false, category: null })}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                Delete
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

export default CategoriesList;
