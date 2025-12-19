import logger from './logger';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth token from localStorage
  getAuthToken() {
    return localStorage.getItem('sanctityFermeToken');
  }

  // Check if backend server is running
  async checkServerHealth() {
    try {
      console.log('API Service: Checking server health at:', `${this.baseURL}/health`);
      const response = await fetch(`${this.baseURL}/health`);
      console.log('API Service: Health check response:', response.status, response.ok);
      return response.ok;
    } catch (error) {
      console.log('Server health check failed:', error);
      return false;
    }
  }



  // Set auth token in localStorage
  setAuthToken(token) {
    localStorage.setItem('sanctityFermeToken', token);
  }

  // Remove auth token from localStorage
  removeAuthToken() {
    localStorage.removeItem('sanctityFermeToken');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();
    const startTime = performance.now();
    
    // Don't set Content-Type for FormData (let browser set it with boundary)
    const isFormData = options.body instanceof FormData;
    
    const config = {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(!isFormData && { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          this.removeAuthToken();
          logger.logApiRequest(options.method || 'GET', url, config, { status: response.status, responseTime }, new Error('Authentication failed'));
          throw new Error('Authentication failed');
        }
        
        // Try to extract error message from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          // If we can't parse the error response, use the default message
        }
        
        const error = new Error(errorMessage);
        logger.logApiRequest(options.method || 'GET', url, config, { status: response.status, responseTime }, error);
        throw error;
      }
      
      const data = await response.json();
      logger.logApiRequest(options.method || 'GET', url, config, { status: response.status, responseTime }, null);
      
      return data;
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      logger.logApiRequest(options.method || 'GET', url, config, { responseTime }, error);
      throw error;
    }
  }




  // Authentication
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.success && response.token) {
      this.setAuthToken(response.token);
    }
    
    return response;
  }

  async getCurrentUser() {
    const response = await this.request('/auth/me');
    return response;
  }

  logout() {
    this.removeAuthToken();
  }

  async changePassword(passwordData) {
    const response = await this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
    return response;
  }

  // Plants API
  async getPlants(params = {}) {
    try {
      console.log('API Service: getPlants called with params:', params);
      // Add default pagination if not provided
      // Increase default limit to show more plants initially
      const defaultParams = { page: 1, limit: 50, ...params };
      const queryString = new URLSearchParams(defaultParams).toString();
      const endpoint = `/plants?${queryString}`;
      
      console.log('API Service: Making request to:', endpoint);
      const result = await this.request(endpoint);
      console.log('API Service: getPlants result:', result);
      return result;
    } catch (error) {
      console.error('Failed to get plants:', error);
      throw error;
    }
  }

  async getDashboardPlants() {
    try {
      const result = await this.request('/plants/dashboard');
      console.log('API Service: getDashboardPlants result:', result);
      return result;
    } catch (error) {
      console.error('Failed to get dashboard plants:', error);
      throw error;
    }
  }

  async getMapViewPlants(bounds = null) {
    try {
      let endpoint = '/plants/mapview';
      if (bounds) {
        // bounds format: { sw: [lng, lat], ne: [lng, lat] }
        const params = new URLSearchParams({
          swLng: bounds.sw[0],
          swLat: bounds.sw[1],
          neLng: bounds.ne[0],
          neLat: bounds.ne[1]
        });
        endpoint = `${endpoint}?${params.toString()}`;
      }
      const result = await this.request(endpoint);
      console.log('API Service: getMapViewPlants result:', result);
      return result;
    } catch (error) {
      console.error('Failed to get mapview plants:', error);
      throw error;
    }
  }

  async getPlantsNotUpdatedMonthly() {
    try {
      const result = await this.request('/plants/not-updated-monthly');
      console.log('API Service: getPlantsNotUpdatedMonthly result:', result);
      return result;
    } catch (error) {
      console.error('Failed to get plants not updated monthly:', error);
      throw error;
    }
  }

  async getPlantsWithRecentImages() {
    try {
      const result = await this.request('/plants/with-recent-images');
      console.log('API Service: getPlantsWithRecentImages result:', result);
      return result;
    } catch (error) {
      console.error('Failed to get plants with recent images:', error);
      throw error;
    }
  }

  async getPlant(id) {
    try {
      return await this.request(`/plants/${id}`);
    } catch (error) {
      console.error('Failed to get plant:', error);
      throw error;
    }
  }

  async createPlant(plantData) {
    try {
      return await this.request('/plants', {
        method: 'POST',
        body: JSON.stringify(plantData),
      });
    } catch (error) {
      console.error('API Service: createPlant error:', error);
      throw error;
    }
    }

  async updatePlant(id, plantData) {
    try {
      console.log('API Service - Updating plant:', id, 'with data:', plantData);
      return await this.request(`/plants/${id}`, {
        method: 'PUT',
        body: JSON.stringify(plantData),
      });
    } catch (error) {
      console.error('Failed to update plant:', error);
      throw error;
    }
  }

  async deletePlant(id) {
    try {
      return await this.request(`/plants/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete plant:', error);
      throw error;
    }
  }

  async addPlantStatus(id, statusData) {
    try {
      return await this.request(`/plants/${id}/status`, {
        method: 'POST',
        body: JSON.stringify(statusData),
      });
    } catch (error) {
      console.error('Failed to add plant status:', error);
      throw error;
    }
  }

  // CSV Export/Import
  async exportPlantsToCSV(filters = {}) {
    try {
      const queryString = new URLSearchParams(filters).toString();
      const endpoint = `/plants/export/csv?${queryString}`;
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `plants_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { success: true };
    } catch (error) {
      console.error('Failed to export plants to CSV:', error);
      throw error;
    }
  }

  async importPlantsFromCSV(csvData, updateExisting = false) {
    try {
      return await this.request('/plants/import/csv', {
        method: 'POST',
        body: JSON.stringify({ csvData, updateExisting }),
      });
    } catch (error) {
      console.error('Failed to import plants from CSV:', error);
      throw error;
    }
  }

  // Organizations
  async getOrganizations() {
    try {
      return await this.request('/organizations');
    } catch (error) {
      console.error('Failed to get organizations:', error);
      throw error;
    }
  }

  async getOrganization(id) {
    return await this.request(`/organizations/${id}`);
  }

  async createOrganization(orgData) {
    try {
      return await this.request('/organizations', {
        method: 'POST',
        body: JSON.stringify(orgData),
      });
    } catch (error) {
      console.error('Failed to create organization:', error);
      throw error;
    }
  }

  async updateOrganization(id, orgData) {
    try {
      return await this.request(`/organizations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(orgData),
      });
    } catch (error) {
      console.error('Failed to update organization:', error);
      throw error;
    }
  }

  async deleteOrganization(id) {
    try {
      return await this.request(`/organizations/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete organization:', error);
      throw error;
    }
  }

  // Domains
  async getDomains(params = {}) {
    try {
      // Add default pagination if not provided
      const defaultParams = { page: 1, limit: 10, ...params };
      
      // Handle bounds if provided
      if (params.bounds) {
        const { bounds, ...otherParams } = params;
        defaultParams.swLng = bounds.sw[0];
        defaultParams.swLat = bounds.sw[1];
        defaultParams.neLng = bounds.ne[0];
        defaultParams.neLat = bounds.ne[1];
        Object.assign(defaultParams, otherParams);
      }
      
      const queryString = new URLSearchParams(defaultParams).toString();
      const endpoint = `/domains?${queryString}`;
      return await this.request(endpoint);
    } catch (error) {
      console.error('Failed to get domains:', error);
      throw error;
    }
  }

  async getDomain(id) {
    return await this.request(`/domains/${id}`);
  }

  async createDomain(domainData) {
    try {
      const response = await this.request('/domains', {
        method: 'POST',
        body: JSON.stringify(domainData),
      });
      return response;
    } catch (error) {
      console.error('API Service - Failed to create domain:', error);
      throw error;
    }
  }

  async updateDomain(id, domainData) {
    try {
      const response = await this.request(`/domains/${id}`, {
        method: 'PUT',
        body: JSON.stringify(domainData),
      });
      return response;
    } catch (error) {
      console.error('API Service - Failed to update domain:', error);
      throw error;
    }
  }

  async deleteDomain(id) {
    try {
      return await this.request(`/domains/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete domain:', error);
      throw error;
    }
  }

  // Plots
  async getPlots(params = {}) {
    try {
      // Fetch enough plots for full-map rendering unless caller overrides
      const defaultParams = { page: 1, limit: 1000, ...params };
      
      // Handle bounds if provided
      if (params.bounds) {
        const { bounds, ...otherParams } = params;
        defaultParams.swLng = bounds.sw[0];
        defaultParams.swLat = bounds.sw[1];
        defaultParams.neLng = bounds.ne[0];
        defaultParams.neLat = bounds.ne[1];
        Object.assign(defaultParams, otherParams);
      }
      
      const queryString = new URLSearchParams(defaultParams).toString();
      const endpoint = `/plots?${queryString}`;
      return await this.request(endpoint);
    } catch (error) {
      console.error('Failed to get plots:', error);
      throw error;
    }
  }

  async getPlot(id) {
    return await this.request(`/plots/${id}`);
  }

  async createPlot(plotData) {
    try {
      return await this.request('/plots', {
        method: 'POST',
        body: JSON.stringify(plotData),
      });
    } catch (error) {
      console.error('Failed to create plot:', error);
      throw error;
    }
  }

  async updatePlot(id, plotData) {
    try {
      return await this.request(`/plots/${id}`, {
        method: 'PUT',
        body: JSON.stringify(plotData),
      });
    } catch (error) {
      console.error('Failed to update plot:', error);
      throw error;
    }
  }

  async deletePlot(id) {
    try {
      return await this.request(`/plots/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete plot:', error);
      throw error;
    }
  }

  // Users API
  async getUsers(params = {}) {
    try {
      // Add default pagination if not provided
      const defaultParams = { page: 1, limit: 10, ...params };
      const queryString = new URLSearchParams(defaultParams).toString();
      const endpoint = `/users?${queryString}`;
      return await this.request(endpoint);
    } catch (error) {
      console.error('Failed to get users:', error);
      throw error;
    }
  }

  async getUser(id) {
    return await this.request(`/users/${id}`);
  }

  async createUser(userData) {
    try {
      return await this.request('/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }

  async updateUser(id, userData) {
    try {
      return await this.request(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
      });
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  }

  async deleteUser(id) {
    try {
      return await this.request(`/users/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  }

  // Plant Images API methods
  async getPlantImages(plantId) {
    try {
      return await this.request(`/plant-images/plant/${plantId}`);
    } catch (error) {
      console.error('Failed to get plant images:', error);
      throw error;
    }
  }

  async uploadPlantImage(plantId, month, file, description = '') {
    try {
      const formData = new FormData();
      formData.append('plantId', plantId);
      formData.append('month', month);
      formData.append('image', file);
      formData.append('description', description);

      return await this.request('/plant-images/upload', {
        method: 'POST',
        body: formData,
      });
    } catch (error) {
      console.error('Failed to upload plant image:', error);
      throw error;
    }
  }

  async uploadPlantImageUrl(plantId, month, imageUrl, description = '') {
    try {
      return await this.request('/plant-images/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plantId,
          month,
          imageUrl,
          description,
        }),
      });
    } catch (error) {
      console.error('Failed to upload plant image URL:', error);
      throw error;
    }
  }

  async replacePlantImage(imageId, file, description = '') {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('description', description);

      return await this.request(`/plant-images/replace/${imageId}`, {
        method: 'PUT',
        body: formData,
      });
    } catch (error) {
      console.error('Failed to replace plant image:', error);
      throw error;
    }
  }

  async deletePlantImage(imageId) {
    try {
      return await this.request(`/plant-images/${imageId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete plant image:', error);
      throw error;
    }
  }

  async getMissingMonths(plantId) {
    try {
      return await this.request(`/plant-images/missing-months/${plantId}`);
    } catch (error) {
      console.error('Failed to get missing months:', error);
      throw error;
    }
  }

  // Plant Types API
  async getPlantTypes(params = {}) {
    try {
      // Filter out undefined values
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== undefined && value !== null)
      );
      const queryString = new URLSearchParams(cleanParams).toString();
      const response = await this.request(`/plant-types?${queryString}`);
      return response;
    } catch (error) {
      console.error('Failed to get plant types:', error);
      throw error;
    }
  }

  async getAllPlantTypes(params = {}) {
    try {
      // Filter out undefined values
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== undefined && value !== null)
      );
      const queryString = new URLSearchParams(cleanParams).toString();
      const response = await this.request(`/plant-types/all?${queryString}`);
      return response;
    } catch (error) {
      console.error('Failed to get all plant types:', error);
      throw error;
    }
  }

  async getPlantType(id) {
    try {
      const response = await this.request(`/plant-types/${id}`);
      return response;
    } catch (error) {
      console.error('Failed to get plant type:', error);
      return { success: false, data: null };
    }
  }

  async createPlantType(plantTypeData) {
    try {
      const response = await this.request('/plant-types', {
        method: 'POST',
        body: JSON.stringify(plantTypeData),
      });
      return response;
    } catch (error) {
      console.error('Failed to create plant type:', error);
      throw error;
    }
  }

  async updatePlantType(id, plantTypeData) {
    try {
      const response = await this.request(`/plant-types/${id}`, {
        method: 'PUT',
        body: JSON.stringify(plantTypeData),
      });
      return response;
    } catch (error) {
      console.error('Failed to update plant type:', error);
      throw error;
    }
  }

  async deletePlantType(id) {
    try {
      const response = await this.request(`/plant-types/${id}`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      console.error('Failed to delete plant type:', error);
      throw error;
    }
  }

  // Plant Varieties API
  async getPlantVarieties(params = {}) {
    try {
      console.log('API Service: getPlantVarieties called with params:', params);
      // Filter out undefined values
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== undefined && value !== null)
      );
      const queryString = new URLSearchParams(cleanParams).toString();
      console.log('API Service: Making request to /plant-varieties?', queryString);
      const response = await this.request(`/plant-varieties?${queryString}`);
      console.log('API Service: getPlantVarieties response:', response);
      return response;
    } catch (error) {
      console.error('API Service: Failed to get plant varieties:', error);
      throw error;
    }
  }

  async getAllPlantVarieties(params = {}) {
    try {
      console.log('API Service: getAllPlantVarieties called with params:', params);
      // Filter out undefined values
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== undefined && value !== null)
      );
      const queryString = new URLSearchParams(cleanParams).toString();
      console.log('API Service: Making request to /plant-varieties/all?', queryString);
      const response = await this.request(`/plant-varieties/all?${queryString}`);
      console.log('API Service: getAllPlantVarieties response:', response);
      return response;
    } catch (error) {
      console.error('API Service: Failed to get all plant varieties:', error);
      throw error;
    }
  }

  async getPlantVarietiesByType(plantTypeId, params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await this.request(`/plant-varieties/by-type/${plantTypeId}?${queryString}`);
      return response;
    } catch (error) {
      console.error('Failed to get plant varieties by type:', error);
      return { success: false, data: [] };
    }
  }

  async getPlantVariety(id) {
    try {
      const response = await this.request(`/plant-varieties/${id}`);
      return response;
    } catch (error) {
      console.error('Failed to get plant variety:', error);
      return { success: false, data: null };
    }
  }

  async createPlantVariety(plantVarietyData) {
    try {
      const response = await this.request('/plant-varieties', {
        method: 'POST',
        body: JSON.stringify(plantVarietyData),
      });
      return response;
    } catch (error) {
      console.error('Failed to create plant variety:', error);
      throw error;
    }
  }

  async updatePlantVariety(id, plantVarietyData) {
    try {
      const response = await this.request(`/plant-varieties/${id}`, {
        method: 'PUT',
        body: JSON.stringify(plantVarietyData),
      });
      return response;
    } catch (error) {
      console.error('Failed to update plant variety:', error);
      throw error;
    }
  }

  async deletePlantVariety(id) {
    try {
      const response = await this.request(`/plant-varieties/${id}`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      console.error('Failed to delete plant variety:', error);
      throw error;
    }
  }

  // Categories API
  async getCategories(params = {}) {
    try {
      // Filter out undefined values
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== undefined && value !== null)
      );
      const queryString = new URLSearchParams(cleanParams).toString();
      const response = await this.request(`/categories?${queryString}`);
      return response;
    } catch (error) {
      console.error('Failed to get categories:', error);
      throw error;
    }
  }

  async getAllCategories(params = {}) {
    try {
      console.log('API Service: getAllCategories called with params:', params);
      // Filter out undefined values
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== undefined && value !== null)
      );
      const queryString = new URLSearchParams(cleanParams).toString();
      const endpoint = `/categories/all${queryString ? `?${queryString}` : ''}`;
      console.log('API Service: Making request to:', endpoint);
      const response = await this.request(endpoint);
      console.log('API Service: getAllCategories response:', {
        success: response.success,
        dataLength: response.data ? response.data.length : 0,
        data: response.data
      });
      
      // Ensure we always return a response object with success and data
      if (!response) {
        console.error('API Service: getAllCategories returned null/undefined response');
        return { success: false, data: [], message: 'No response from server' };
      }
      
      return response;
    } catch (error) {
      console.error('API Service: Failed to get all categories:', error);
      console.error('API Service: Error details:', {
        message: error.message,
        stack: error.stack
      });
      // Return a proper error response instead of throwing
      return {
        success: false,
        data: [],
        message: error.message || 'Failed to fetch categories',
        error: error
      };
    }
  }

  async getCategory(id) {
    try {
      const response = await this.request(`/categories/${id}`);
      return response;
    } catch (error) {
      console.error('Failed to get category:', error);
      return { success: false, data: null };
    }
  }

  async createCategory(categoryData) {
    try {
      const response = await this.request('/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData),
      });
      return response;
    } catch (error) {
      console.error('Failed to create category:', error);
      throw error;
    }
  }

  async updateCategory(id, categoryData) {
    try {
      const response = await this.request(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(categoryData),
      });
      return response;
    } catch (error) {
      console.error('Failed to update category:', error);
      throw error;
    }
  }

  async deleteCategory(id) {
    try {
      const response = await this.request(`/categories/${id}`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      console.error('Failed to delete category:', error);
      throw error;
    }
  }
}

const apiService = new ApiService();
export default apiService; 