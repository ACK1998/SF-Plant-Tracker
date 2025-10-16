import React, { useState } from 'react';
import { LogOut, User, Leaf, BarChart3, Building, Map, Square, Users } from 'lucide-react';
import Dashboard from './Dashboard/Dashboard';
import PlantsList from './Plants/PlantsList';
import OrganizationsList from './Organizations/OrganizationsList';
import DomainsList from './Domains/DomainsList';
import PlotsList from './Plots/PlotsList';
import UsersList from './Users/UsersList';
import ProfileModal from './Auth/ProfileModal';
import DarkModeToggle from './DarkModeToggle';

function PlantTracker({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showProfile, setShowProfile] = useState(false);

  // Debug user data
  console.log('PlantTracker received user:', user);

  // Show loading state if user is not yet loaded
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-plant-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading user data...</p>
        </div>
      </div>
    );
  }

  // Define tabs based on user role
  const getTabs = () => {
    const baseTabs = [
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
      { id: 'plants', label: 'Plants & Trees', icon: Leaf },
    ];

    // Add null check for user
    if (!user || !user.role) {
      console.log('User or user role is undefined, returning base tabs');
      return baseTabs;
    }

    // Super Admin: Can see Organizations, Domains, Plots, Users
    if (user.role === 'super_admin') {
      baseTabs.push(
        { id: 'organizations', label: 'Organizations', icon: Building },
        { id: 'domains', label: 'Domains', icon: Map },
        { id: 'plots', label: 'Plots', icon: Square },
        { id: 'users', label: 'Users', icon: Users }
      );
    }

    // Org Admin: Can see Domains, Plots, Users (within their organization)
    if (user.role === 'org_admin') {
      baseTabs.push(
        { id: 'domains', label: 'Domains', icon: Map },
        { id: 'plots', label: 'Plots', icon: Square },
        { id: 'users', label: 'Users', icon: Users }
      );
    }

    // Domain Admin: Can see Plots, Users (within their domain)
    if (user.role === 'domain_admin') {
      baseTabs.push(
        { id: 'plots', label: 'Plots', icon: Square },
        { id: 'users', label: 'Users', icon: Users }
      );
    }

    // Application User: Can only see Plots (within their domain)
    if (user.role === 'application_user') {
      baseTabs.push(
        { id: 'plots', label: 'Plots', icon: Square }
      );
    }

    console.log('Generated tabs:', baseTabs);
    return baseTabs;
  };

  const tabs = getTabs();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard user={user} />;
      case 'plants':
        return <PlantsList user={user} />;
      case 'users':
        return <UsersList user={user} />;
      case 'organizations':
        return <OrganizationsList user={user} />;
      case 'domains':
        return <DomainsList user={user} />;
      case 'plots':
        return <PlotsList user={user} />;
      default:
        return <Dashboard user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-plant-green-800 dark:text-plant-green-400">
                Sanctity Ferme Plant Tracker
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <DarkModeToggle />
              
              <button
                onClick={() => setShowProfile(true)}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-plant-green-600 dark:hover:text-plant-green-400 transition-colors"
              >
                <User size={20} />
                <span>{user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || 'User'}</span>
                <span className="text-xs bg-plant-green-100 dark:bg-plant-green-900 text-plant-green-800 dark:text-plant-green-200 px-2 py-1 rounded-full">
                  {user?.role ? user.role.replace('_', ' ').toUpperCase() : 'USER'}
                </span>
              </button>
              
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-plant-green-500 text-plant-green-600 dark:text-plant-green-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {renderContent()}
        </div>
      </main>

      {/* Profile Modal */}
      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
}

export default PlantTracker;