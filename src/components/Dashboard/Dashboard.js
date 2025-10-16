import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, Users, MapPin, Leaf, TrendingUp, Calendar, AlertTriangle, Building, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatsCards from './StatsCards';
import PlantStatsCards from './PlantStatsCards';
import PlantsNotUpdatedMonthlyCard from './PlantsNotUpdatedMonthlyCard';
import PlantsWithRecentImagesCard from './PlantsWithRecentImagesCard';
import DeceasedPlantsCard from './DeceasedPlantsCard';
import { useApi } from '../../contexts/ApiContext';
import { useDashboard } from '../../contexts/DashboardContext';

function Dashboard({ user, selectedState }) {
  const { dashboardPlants, loading: dashboardLoading, error: dashboardError } = useDashboard();
  const { 
    organizations, 
    domains, 
    plots, 
    users, 
    loading, 
    error
  } = useApi();

  const [stats, setStats] = useState({
    totalPlants: 0,
    totalOrganizations: 0,
    totalDomains: 0,
    totalPlots: 0,
    totalUsers: 0,
    healthyPlants: 0,
    healthyTrees: 0,
    deceasedPlants: 0,
    numberOfVarieties: 0
  });

  // Pagination state for Recent Activity
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // Show 5 items per page


  useEffect(() => {
    calculateStats();
    // Reset to first page when data changes
    setCurrentPage(1);
  }, [dashboardPlants, organizations, domains, plots, users, selectedState]);

  const calculateStats = useCallback(() => {
    // Filter data based on selected state if not 'all'
    const filteredPlants = selectedState === 'all' ? dashboardPlants : dashboardPlants.filter(plant => 
      plant.organizationId && 
      organizations.find(org => org._id === plant.organizationId)?.address?.state === selectedState
    );

    const filteredOrganizations = selectedState === 'all' ? organizations : organizations.filter(org => 
      org.address?.state === selectedState
    );

    const filteredDomains = selectedState === 'all' ? domains : domains.filter(domain => 
      organizations.find(org => org._id === domain.organizationId)?.address?.state === selectedState
    );

    const filteredPlots = selectedState === 'all' ? plots : plots.filter(plot => 
      organizations.find(org => org._id === plot.organizationId)?.address?.state === selectedState
    );

    const filteredUsers = selectedState === 'all' ? users : users.filter(user => 
      user.organizationId && 
      organizations.find(org => org._id === user.organizationId)?.address?.state === selectedState
    );

    // Calculate stats
    const totalPlants = filteredPlants.length;
    const totalOrganizations = filteredOrganizations.length;
    const totalDomains = filteredDomains.length;
    const totalPlots = filteredPlots.length;
    const totalUsers = filteredUsers.length;

    // Health and status calculations
    const healthyTrees = filteredPlants.filter(plant => 
      (plant.health === 'excellent' || plant.health === 'good') && plant.category === 'tree'
    ).length;

    const healthyVegetables = filteredPlants.filter(plant => 
      (plant.health === 'excellent' || plant.health === 'good') && plant.category === 'vegetable'
    ).length;

    const healthyHerbs = filteredPlants.filter(plant => 
      (plant.health === 'excellent' || plant.health === 'good') && plant.category === 'herb'
    ).length;

    const healthyFruits = filteredPlants.filter(plant => 
      (plant.health === 'excellent' || plant.health === 'good') && plant.category === 'fruit'
    ).length;

    const healthyGrains = filteredPlants.filter(plant => 
      (plant.health === 'excellent' || plant.health === 'good') && plant.category === 'grain'
    ).length;

    const healthyLegumes = filteredPlants.filter(plant => 
      (plant.health === 'excellent' || plant.health === 'good') && plant.category === 'legume'
    ).length;

    // Calculate deceased plants count
    const deceasedPlants = filteredPlants.filter(plant => 
      plant.health === 'deceased'
    ).length;

    // Calculate number of unique varieties
    const numberOfVarieties = [...new Set(filteredPlants.map(plant => plant.variety).filter(Boolean))].length;

    setStats({
      totalPlants,
      totalOrganizations,
      totalDomains,
      totalPlots,
      totalUsers,
      healthyTrees,
      healthyVegetables,
      healthyHerbs,
      healthyFruits,
      healthyGrains,
      healthyLegumes,
      deceasedPlants,
      numberOfVarieties
    });
  }, [dashboardPlants, organizations, domains, plots, users, selectedState]);

  // Helper function to get category icon and label
  const getCategoryInfo = (category) => {
    switch (category) {
      case 'tree':
        return { icon: '🌳', label: 'Tree' };
      case 'fruit':
        return { icon: '🍎', label: 'Fruit' };
      case 'vegetable':
        return { icon: '🥕', label: 'Vegetable' };
      case 'herb':
        return { icon: '🌿', label: 'Herb' };
      case 'grain':
        return { icon: '🌾', label: 'Grain' };
      case 'legume':
        return { icon: '🫘', label: 'Legume' };
      default:
        return { icon: '🌱', label: 'Plant' };
    }
  };

  const getRecentActivity = () => {
    const allActivities = [];
  
    // 1. Plant/Tree Addition Activities
    dashboardPlants.forEach(plant => {
      const plantedDate = new Date(plant.plantedDate);
      const today = new Date();
      const daysSincePlanted = Math.floor((today - plantedDate) / (1000 * 60 * 60 * 24));
      
      const categoryInfo = getCategoryInfo(plant.category);
      
      // New plants (added within last 30 days)
      if (daysSincePlanted <= 30) {
        allActivities.push({
          id: `${plant._id}-addition`,
          type: 'addition',
          name: plant.name,
          action: `Added ${categoryInfo.label.toLowerCase()}`,
          date: plantedDate,
          status: plant.health,
          icon: categoryInfo.icon,
          category: plant.category,
          details: `${categoryInfo.label} added to the collection`
        });
      }
  
      // Plant/Tree Anniversaries (planted 1 year ago or multiples)
      if (daysSincePlanted >= 365 && daysSincePlanted % 365 <= 7) {
        const years = Math.floor(daysSincePlanted / 365);
        allActivities.push({
          id: `${plant._id}-anniversary`,
          type: 'anniversary',
          name: plant.name,
          action: `${years} year${years > 1 ? 's' : ''} anniversary`,
          date: plantedDate,
          status: plant.health,
          icon: '🌱',
          category: plant.category,
          details: `${plant.name} has been growing for ${years} year${years > 1 ? 's' : ''}!`
        });
      }
  
      // Plant/Tree Death (poor health for extended period)
      if (plant.health === 'poor' || plant.health === 'critical') {
        const lastStatus = plant.statusHistory?.length > 0 ? 
          plant.statusHistory[plant.statusHistory.length - 1] : null;
        
        if (lastStatus && (lastStatus.status === 'died' || lastStatus?.notes?.toLowerCase().includes('died'))) {
          const categoryInfo = getCategoryInfo(plant.category);
          allActivities.push({
            id: `${plant._id}-death`,
            type: 'death',
            name: plant.name,
            action: `${categoryInfo.label} died`,
            date: new Date(lastStatus.date),
            status: 'deceased',
            icon: '💀',
            category: plant.category,
            details: `${plant.name} has passed away`
          });
        }
      }
  
      // Recent status updates
      if (plant.statusHistory?.length > 0) {
        const lastStatus = plant.statusHistory[plant.statusHistory.length - 1];
        const statusDate = new Date(lastStatus.date);
        const daysSinceUpdate = Math.floor((today - statusDate) / (1000 * 60 * 60 * 24));
        
        if (daysSinceUpdate <= 7) {
          allActivities.push({
            id: `${plant._id}-update-${lastStatus.date}`,
            type: 'update',
            name: plant.name,
            action: `Status: ${lastStatus.status}`,
            date: statusDate,
            status: plant.health,
            icon: '📊',
            category: plant.category,
            details: lastStatus.notes || `Status updated to ${lastStatus.status}`
          });
        }
      }
    });
  
    // 2. Plot Addition Activities
    plots.forEach(plot => {
      const createdDate = new Date(plot.createdAt);
      const today = new Date();
      const daysSinceCreated = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));
      
      // New plots (added within last 30 days)
      if (daysSinceCreated <= 30) {
        allActivities.push({
          id: `${plot._id}-addition`,
          type: 'plot-addition',
          name: plot.name,
          action: 'Added new plot',
          date: createdDate,
          status: plot.isActive ? 'active' : 'inactive',
          icon: '🌱',
          category: 'plot',
          details: `New growing plot "${plot.name}" created`
        });
      }
    });
  
    // 3. Organization Addition Activities
    organizations.forEach(org => {
      const createdDate = new Date(org.createdAt);
      const today = new Date();
      const daysSinceCreated = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));
      
      // New organizations (added within last 30 days)
      if (daysSinceCreated <= 30) {
        allActivities.push({
          id: `${org._id}-addition`,
          type: 'org-addition',
          name: org.name,
          action: 'Added new organization',
          date: createdDate,
          status: org.isActive ? 'active' : 'inactive',
          icon: '🏢',
          category: 'organization',
          details: `New organization "${org.name}" registered`
        });
      }
    });
  
    // 4. Domain Addition Activities
    domains.forEach(domain => {
      const createdDate = new Date(domain.createdAt);
      const today = new Date();
      const daysSinceCreated = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));
      
      // New domains (added within last 30 days)
      if (daysSinceCreated <= 30) {
        allActivities.push({
          id: `${domain._id}-addition`,
          type: 'domain-addition',
          name: domain.name,
          action: 'Added new domain',
          date: createdDate,
          status: domain.isActive ? 'active' : 'inactive',
          icon: '🗺️',
          category: 'domain',
          details: `New cultivation domain "${domain.name}" created`
        });
      }
    });
  
    // Sort by date (most recent first) and return all activities
    return allActivities
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const getAlerts = () => {
    const alerts = [];

    // Plants with poor health
    const unhealthyPlants = dashboardPlants.filter(plant => 
      plant.health === 'poor'
    );

    if (unhealthyPlants.length > 0) {
      alerts.push({
        id: 'health-alert',
        type: 'error',
        message: `${unhealthyPlants.length} plants have health issues`,
        icon: AlertTriangle
      });
    }



    return alerts;
  };

  const navigate = useNavigate();

  const handleAddPlantClick = () => {
    navigate('/plants');
  };

  const handleAddPlotClick = () => {
    navigate('/plots');
  };

  const handleAddUserClick = () => {
    navigate('/users');
  };

  const handleAddOrganizationClick = () => {
    navigate('/organizations');
  };

  const handleAddDomainClick = () => {
    navigate('/domains');
  };

  const handleHealthAlertClick = () => {
    console.log('Dashboard: Health alert clicked, navigating to plants with health=poor filter');
    navigate('/plants?health=poor');
  };


  // Pagination functions for Recent Activity
  const getPaginatedActivities = () => {
    const allActivities = getRecentActivity();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return allActivities.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    const allActivities = getRecentActivity();
    return Math.ceil(allActivities.length / itemsPerPage);
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, getTotalPages()));
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-plant-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 dark:text-red-400 mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Error loading dashboard</h3>
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back, {user.firstName}! Here's what's happening with your plants.
            {selectedState !== 'all' && ` Showing data for ${selectedState}`}
          </p>
        </div>
      </div>

      {/* Organization Stats Cards - 1x4 Layout */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {user?.role === 'org_admin' ? 'System Overview' : 'Organization Overview'}
            </h2>
            {/* <p className="text-gray-600 dark:text-gray-300">Manage and track your organization structure</p> */}
          </div>
        </div>
        <StatsCards stats={stats} user={user} />
      </div>

      {/* Plant Stats Cards */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Plant Statistics</h2>
            {/* <p className="text-gray-600 dark:text-gray-300">Monitor plant health and growth metrics</p> */}
          </div>
        </div>
        <PlantStatsCards stats={stats} />
      </div>

      {/* Plant Monitoring Cards */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Plant Monitoring</h2>
            {/* <p className="text-gray-600 dark:text-gray-300">Track plants that need attention</p> */}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <PlantsNotUpdatedMonthlyCard user={user} />
          <PlantsWithRecentImagesCard user={user} />
          <DeceasedPlantsCard user={user} selectedState={selectedState} />
          {getAlerts().length > 0 && getAlerts().map(alert => (
            <div 
              key={alert.id} 
              className={`card border-l-4 ${
                alert.type === 'error' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                alert.type === 'warning' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              } ${alert.id === 'health-alert' ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
              onClick={alert.id === 'health-alert' ? handleHealthAlertClick : undefined}
            >
              <div className="flex items-center space-x-3">
                <alert.icon className={`h-5 w-5 ${
                  alert.type === 'error' ? 'text-red-600 dark:text-red-400' :
                  alert.type === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-blue-600 dark:text-blue-400'
                }`} />
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {alert.message}
                </p>
                {alert.id === 'health-alert' && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                    Click to view
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Activity</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {getRecentActivity().length} activities
              </span>
              <BarChart3 className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
          
          {/* Scrollable Activity List */}
          <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
            <div className="space-y-3 pr-2">
              {getPaginatedActivities().map(activity => (
                <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div className="text-lg">{activity.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {activity.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.action} • {activity.date.toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {activity.details}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                    activity.status === 'excellent' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    activity.status === 'good' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    activity.status === 'fair' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    activity.status === 'deceased' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {activity.status}
                  </span>
                </div>
              ))}
              
              {getPaginatedActivities().length === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2 bg-emoji">🌱</div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
                </div>
              )}
            </div>
          </div>

          {/* Pagination Controls */}
          {getTotalPages() > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, getTotalPages()) }, (_, i) => {
                    let pageNum;
                    if (getTotalPages() <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= getTotalPages() - 2) {
                      pageNum = getTotalPages() - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-2 py-1 text-xs rounded-md ${
                          currentPage === pageNum
                            ? 'bg-plant-green-100 text-plant-green-800 dark:bg-plant-green-900 dark:text-plant-green-200'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === getTotalPages()}
                  className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Page {currentPage} of {getTotalPages()}
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Quick Actions</h3>
            <TrendingUp className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <button onClick={handleAddPlantClick} className="p-4 bg-plant-green-50 dark:bg-plant-green-900/20 rounded-lg text-center hover:bg-plant-green-100 dark:hover:bg-plant-green-900/40 transition-colors">
              <Leaf className="h-6 w-6 text-plant-green-600 dark:text-plant-green-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Add Plant</p>
            </button>
            <button onClick={handleAddPlotClick} className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
              <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Add Plot</p>
            </button>
            <button onClick={handleAddUserClick} className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Add User</p>
            </button>
            {user?.role === 'super_admin' && (
              <button onClick={handleAddOrganizationClick} className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors">
                <Building className="h-6 w-6 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Add Organization</p>
              </button>
            )}
            {(user?.role === 'super_admin' || user?.role === 'org_admin') && (
              <button onClick={handleAddDomainClick} className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Add Domain</p>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 