import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { useApi } from './contexts/ApiContext';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { ApiProvider } from './contexts/ApiContext';
import { DashboardProvider } from './contexts/DashboardContext';
import { MapViewProvider } from './contexts/MapViewContext';
import LoginForm from './components/Auth/LoginForm';
import Dashboard from './components/Dashboard/Dashboard';
import PlantsList from './components/Plants/PlantsList';
import OrganizationsList from './components/Organizations/OrganizationsList';
import DomainsList from './components/Domains/DomainsList';
import PlotsList from './components/Plots/PlotsList';
import UsersList from './components/Users/UsersList';
import ProfileModal from './components/Auth/ProfileModal';
import DarkModeToggle from './components/DarkModeToggle';
import NotificationManager from './components/common/NotificationManager';
import ErrorBoundary from './components/common/ErrorBoundary';
import PlantTypesList from './components/PlantTypes/PlantTypesList';
import MapViewMapbox from './components/MapView/MapViewMapbox';
import PublicPlantView from './components/Plants/PublicPlantView';
import AddPlantModal from './components/Plants/AddPlantModal';
import PlantImageUpload from './components/Plants/PlantImageUpload';
import Footer from './components/Footer';
import api from './services/api';
import './index.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedState] = useState('all');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('sanctityFermeToken');
      if (token) {
        const response = await api.getCurrentUser();
        if (response.success) {
          setUser(response.data);
        } else {
          localStorage.removeItem('sanctityFermeToken');
          localStorage.removeItem('currentUser');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('sanctityFermeToken');
      localStorage.removeItem('currentUser');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (credentials) => {
    try {
      const response = await api.login(credentials);
      if (response.success) {
        setUser(response.user);
        // Store user in localStorage for persistence
        localStorage.setItem('currentUser', JSON.stringify(response.user));
      }
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    // Clear stored user data
    localStorage.removeItem('currentUser');
    navigate('/logout');
  };

  const handleRegister = async (userData) => {
    try {
      const response = await api.register(userData);
      if (response.success) {
        setUser(response.user);
      }
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen nature-background flex flex-col items-center justify-center">
        {/* Nature Emojis Background */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute bg-emoji" style={{top: '20%', left: '15%', fontSize: '1.2rem', opacity: '0.4', animation: 'gentleFloat 20s ease-in-out infinite'}}>🍎</div>
          <div className="absolute bg-emoji" style={{top: '35%', right: '20%', fontSize: '1.1rem', opacity: '0.35', animation: 'gentleFloat 22s ease-in-out infinite reverse'}}>🍊</div>
          <div className="absolute bg-emoji" style={{top: '15%', right: '10%', fontSize: '1.3rem', opacity: '0.3', animation: 'gentleFloat 18s ease-in-out infinite'}}>🍃</div>
          <div className="absolute bg-emoji" style={{top: '60%', left: '8%', fontSize: '1.4rem', opacity: '0.25', animation: 'gentleFloat 24s ease-in-out infinite reverse'}}>🌿</div>
          <div className="absolute bg-emoji" style={{top: '45%', left: '25%', fontSize: '1rem', opacity: '0.4', animation: 'gentleFloat 19s ease-in-out infinite'}}>🍋</div>
          <div className="absolute bg-emoji" style={{top: '70%', right: '15%', fontSize: '1.2rem', opacity: '0.3', animation: 'gentleFloat 21s ease-in-out infinite reverse'}}>🌱</div>
          <div className="absolute bg-emoji" style={{top: '25%', left: '5%', fontSize: '0.9rem', opacity: '0.35', animation: 'gentleFloat 23s ease-in-out infinite'}}>🍇</div>
          <div className="absolute bg-emoji" style={{top: '55%', right: '25%', fontSize: '1.1rem', opacity: '0.3', animation: 'gentleFloat 17s ease-in-out infinite reverse'}}>🌾</div>
        </div>
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-plant-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Check if current route is a public route
  const isPublicRoute = location.pathname.startsWith('/plant/');

  if (isPublicRoute) {
    // Render public routes (no authentication required)
    return (
      <DarkModeProvider>
        <ErrorBoundary>
          <Routes>
            <Route path="/plant/:id" element={<PublicPlantViewWrapper />} />
          </Routes>
        </ErrorBoundary>
      </DarkModeProvider>
    );
  }

  if (!user) {
    return (
      <DarkModeProvider>
        <div className="min-h-screen nature-background flex flex-col items-center justify-center p-4">
          {/* Nature Emojis Background */}
          <div className="fixed inset-0 pointer-events-none z-0">
            <div className="absolute bg-emoji" style={{top: '20%', left: '15%', fontSize: '1.2rem', opacity: '0.4', animation: 'gentleFloat 20s ease-in-out infinite'}}>🍎</div>
            <div className="absolute bg-emoji" style={{top: '35%', right: '20%', fontSize: '1.1rem', opacity: '0.35', animation: 'gentleFloat 22s ease-in-out infinite reverse'}}>🍊</div>
            <div className="absolute bg-emoji" style={{top: '15%', right: '10%', fontSize: '1.3rem', opacity: '0.3', animation: 'gentleFloat 18s ease-in-out infinite'}}>🍃</div>
            <div className="absolute bg-emoji" style={{top: '60%', left: '8%', fontSize: '1.4rem', opacity: '0.25', animation: 'gentleFloat 24s ease-in-out infinite reverse'}}>🌿</div>
            <div className="absolute bg-emoji" style={{top: '45%', left: '25%', fontSize: '1rem', opacity: '0.4', animation: 'gentleFloat 19s ease-in-out infinite'}}>🍋</div>
            <div className="absolute bg-emoji" style={{top: '70%', right: '15%', fontSize: '1.2rem', opacity: '0.3', animation: 'gentleFloat 21s ease-in-out infinite reverse'}}>🌱</div>
            <div className="absolute bg-emoji" style={{top: '25%', left: '5%', fontSize: '0.9rem', opacity: '0.35', animation: 'gentleFloat 23s ease-in-out infinite'}}>🍇</div>
            <div className="absolute bg-emoji" style={{top: '55%', right: '25%', fontSize: '1.1rem', opacity: '0.3', animation: 'gentleFloat 17s ease-in-out infinite reverse'}}>🌾</div>
          </div>
          <div className="flex-grow flex items-center justify-center">
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  🌱 Sanctity Ferme
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Plant Tracking System
                </p>
              </div>
              <LoginForm onLogin={handleLogin} onRegister={handleRegister} />
            </div>
          </div>
          <Footer />
        </div>
      </DarkModeProvider>
    );
  }

  return (
    <DarkModeProvider>
      <ApiProvider>
        <DashboardProvider>
          <MapViewProvider>
            <ErrorBoundary>
          <div className="min-h-screen nature-background flex flex-col">
            {/* Nature Emojis Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
              <div className="absolute bg-emoji" style={{top: '20%', left: '15%', fontSize: '1.2rem', opacity: '0.4', animation: 'gentleFloat 20s ease-in-out infinite'}}>🍎</div>
              <div className="absolute bg-emoji" style={{top: '35%', right: '20%', fontSize: '1.1rem', opacity: '0.35', animation: 'gentleFloat 22s ease-in-out infinite reverse'}}>🍊</div>
              <div className="absolute bg-emoji" style={{top: '15%', right: '10%', fontSize: '1.3rem', opacity: '0.3', animation: 'gentleFloat 18s ease-in-out infinite'}}>🍃</div>
              <div className="absolute bg-emoji" style={{top: '60%', left: '8%', fontSize: '1.4rem', opacity: '0.25', animation: 'gentleFloat 24s ease-in-out infinite reverse'}}>🌿</div>
              <div className="absolute bg-emoji" style={{top: '45%', left: '25%', fontSize: '1rem', opacity: '0.4', animation: 'gentleFloat 19s ease-in-out infinite'}}>🍋</div>
              <div className="absolute bg-emoji" style={{top: '70%', right: '15%', fontSize: '1.2rem', opacity: '0.3', animation: 'gentleFloat 21s ease-in-out infinite reverse'}}>🌱</div>
              <div className="absolute bg-emoji" style={{top: '25%', left: '5%', fontSize: '0.9rem', opacity: '0.35', animation: 'gentleFloat 23s ease-in-out infinite'}}>🍇</div>
              <div className="absolute bg-emoji" style={{top: '55%', right: '25%', fontSize: '1.1rem', opacity: '0.3', animation: 'gentleFloat 17s ease-in-out infinite reverse'}}>🌾</div>
              <div className="absolute bg-emoji" style={{top: '80%', left: '20%', fontSize: '1.3rem', opacity: '0.25', animation: 'gentleFloat 26s ease-in-out infinite'}}>🌻</div>
              <div className="absolute bg-emoji" style={{top: '10%', left: '30%', fontSize: '0.8rem', opacity: '0.4', animation: 'gentleFloat 15s ease-in-out infinite reverse'}}>🍓</div>
            </div>
            
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center space-x-4">
                    <img 
                      src="/sfLogo.png" 
                      alt="Sanctity Ferme Logo" 
                      className="h-8 w-8"
                    />
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Sanctity Ferme
                    </h1>
                  </div>

                  <div className="flex items-center space-x-2 sm:space-x-4">
                    <DarkModeToggle />
                    <button
                      onClick={() => setShowProfileModal(true)}
                      className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                    >
                      <span className="w-8 h-8 bg-plant-green-100 dark:bg-plant-green-900 rounded-full flex items-center justify-center">
                        {user.firstName?.charAt(0) || user.username?.charAt(0) || 'U'}
                      </span>
                      <span className="hidden sm:block">
                        {user.firstName} {user.lastName}
                      </span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm sm:text-base"
                    >
                      <span className="hidden sm:inline">Logout</span>
                      <span className="sm:hidden">Exit</span>
                    </button>
                  </div>
                </div>
              </div>
            </header>

            {/* Navigation */}
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Mobile Navigation - Horizontal Scroll */}
                <div className="flex overflow-x-auto scrollbar-hide h-14">
                  <div className="flex space-x-2 sm:space-x-4 lg:space-x-8 min-w-max">
                    <NavLink to="/dashboard">Dashboard</NavLink>
                    <NavLink to="/plants">Plants</NavLink>
                    <NavLink to="/plant-types">Plant Types</NavLink>
                    <NavLink to="/map">Map View</NavLink>
                    {user.role === 'super_admin' && (
                      <NavLink to="/organizations">Organizations</NavLink>
                    )}
                    {(user.role === 'super_admin' || user.role === 'org_admin') && (
                      <NavLink to="/domains">Domains</NavLink>
                    )}
                    <NavLink to="/plots">Plots</NavLink>
                    {(user.role === 'super_admin' || user.role === 'org_admin' || user.role === 'domain_admin') && (
                      <NavLink to="/users">Users</NavLink>
                    )}
                  </div>
                </div>
              </div>
            </nav>

            {/* Main Content */}
            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
              <Routes>
                <Route path="/dashboard" element={<Dashboard user={user} selectedState={selectedState} />} />
                
                {/* Plants Routes */}
                <Route path="/plants" element={<PlantsList user={user} selectedState={selectedState} />} />
                <Route path="/plants/add" element={<AddPlantModalWrapper user={user} selectedState={selectedState} />} />
                <Route path="/plants/:id/edit" element={<EditPlantModalWrapper user={user} selectedState={selectedState} />} />
                <Route path="/plants/:id/status" element={<StatusModalWrapper user={user} selectedState={selectedState} />} />
                <Route path="/plants/:id/photos" element={<PhotosModalWrapper user={user} selectedState={selectedState} />} />
                <Route path="/plants/:id/history" element={<HistoryModalWrapper user={user} selectedState={selectedState} />} />
                

                
                {/* Plant Types Routes */}
                <Route path="/plant-types" element={<PlantTypesList user={user} />} />
                <Route path="/plant-types/add" element={<PlantTypesList user={user} showAddModal={true} />} />
                <Route path="/plant-types/:id/edit" element={<PlantTypesList user={user} showEditModal={true} />} />
                
                {/* Plant Varieties Routes */}
                <Route path="/plant-varieties" element={<PlantTypesList user={user} showVarieties={true} />} />
                <Route path="/plant-varieties/add" element={<PlantTypesList user={user} showVarieties={true} showAddVarietyModalProp={true} />} />
                <Route path="/plant-varieties/:id/edit" element={<PlantTypesList user={user} showVarieties={true} showEditVarietyModalProp={true} />} />
                
                {/* Plant Categories Routes */}
                <Route path="/plant-categories/add" element={<PlantTypesList user={user} showAddCategoryModal={true} />} />
                
                {/* Map View Routes */}
                <Route path="/map" element={<MapViewMapbox user={user} selectedState={selectedState} />} />
                
                {/* Organizations Routes */}
                {user.role === 'super_admin' && (
                  <>
                    <Route path="/organizations" element={<OrganizationsList user={user} selectedState={selectedState} />} />
                    <Route path="/organizations/add" element={<OrganizationsList user={user} selectedState={selectedState} showAddModal={true} />} />
                    <Route path="/organizations/:id/edit" element={<OrganizationsList user={user} selectedState={selectedState} showEditModal={true} />} />
                  </>
                )}
                
                {/* Domains Routes */}
                {(user.role === 'super_admin' || user.role === 'org_admin') && (
                  <>
                    <Route path="/domains" element={<DomainsList user={user} selectedState={selectedState} />} />
                    <Route path="/domains/add" element={<DomainsList user={user} selectedState={selectedState} showAddModal={true} />} />
                    <Route path="/domains/:id/edit" element={<DomainsList user={user} selectedState={selectedState} showEditModal={true} />} />
                  </>
                )}
                
                {/* Plots Routes */}
                <Route path="/plots" element={<PlotsList user={user} selectedState={selectedState} />} />
                <Route path="/plots/add" element={<PlotsList user={user} selectedState={selectedState} showAddModal={true} />} />
                <Route path="/plots/:id/edit" element={<PlotsList user={user} selectedState={selectedState} showEditModal={true} />} />
                
                {/* Users Routes */}
                {(user.role === 'super_admin' || user.role === 'org_admin' || user.role === 'domain_admin') && (
                  <>
                    <Route path="/users" element={<UsersList user={user} selectedState={selectedState} />} />
                    <Route path="/users/add" element={<UsersList user={user} selectedState={selectedState} showAddModal={true} />} />
                    <Route path="/users/:id/edit" element={<UsersList user={user} selectedState={selectedState} showEditModal={true} />} />
                  </>
                )}
                
                <Route path="/logout" element={<LogoutPage />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>

            {/* Footer */}
            <Footer />

            {/* Profile Modal */}
            {showProfileModal && (
              <ProfileModal
                user={user}
                onClose={() => setShowProfileModal(false)}
                onUpdate={(updatedUser) => setUser(updatedUser)}
              />
            )}

            {/* Notification Manager */}
            <NotificationManager />
          </div>
            </ErrorBoundary>
          </MapViewProvider>
        </DashboardProvider>
      </ApiProvider>
    </DarkModeProvider>
  );
}

// NavLink component for navigation
function NavLink({ to, children }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      className={`inline-flex items-center px-3 py-4 border-b-2 text-sm font-medium transition-colors ${
        isActive
          ? 'border-plant-green-500 text-plant-green-600 dark:text-plant-green-400'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
      }`}
    >
      {children}
    </Link>
  );
}

// Logout Page Component
function LogoutPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login after a brief delay
    const timer = setTimeout(() => {
      navigate('/');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen nature-background flex flex-col items-center justify-center">
      {/* Nature Emojis Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute bg-emoji" style={{top: '20%', left: '15%', fontSize: '1.2rem', opacity: '0.4', animation: 'gentleFloat 20s ease-in-out infinite'}}>🍎</div>
        <div className="absolute bg-emoji" style={{top: '35%', right: '20%', fontSize: '1.1rem', opacity: '0.35', animation: 'gentleFloat 22s ease-in-out infinite reverse'}}>🍊</div>
        <div className="absolute bg-emoji" style={{top: '15%', right: '10%', fontSize: '1.3rem', opacity: '0.3', animation: 'gentleFloat 18s ease-in-out infinite'}}>🍃</div>
        <div className="absolute bg-emoji" style={{top: '60%', left: '8%', fontSize: '1.4rem', opacity: '0.25', animation: 'gentleFloat 24s ease-in-out infinite reverse'}}>🌿</div>
        <div className="absolute bg-emoji" style={{top: '45%', left: '25%', fontSize: '1rem', opacity: '0.4', animation: 'gentleFloat 19s ease-in-out infinite'}}>🍋</div>
        <div className="absolute bg-emoji" style={{top: '70%', right: '15%', fontSize: '1.2rem', opacity: '0.3', animation: 'gentleFloat 21s ease-in-out infinite reverse'}}>🌱</div>
        <div className="absolute bg-emoji" style={{top: '25%', left: '5%', fontSize: '0.9rem', opacity: '0.35', animation: 'gentleFloat 23s ease-in-out infinite'}}>🍇</div>
        <div className="absolute bg-emoji" style={{top: '55%', right: '25%', fontSize: '1.1rem', opacity: '0.3', animation: 'gentleFloat 17s ease-in-out infinite reverse'}}>🌾</div>
      </div>
      <div className="flex-grow flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">👋</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Logged Out Successfully
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Thank you for using Sanctity Ferme
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-plant-green-600 mx-auto"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Redirecting to login...
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// Public Plant View Wrapper Component
function PublicPlantViewWrapper() {
  const { id } = useParams();
  return <PublicPlantView plantId={id} />;
}

// Modal Wrapper Components
function AddPlantModalWrapper({ user, selectedState }) {
  const navigate = useNavigate();
  const { organizations, domains, plots, addPlant } = useApi();
  
  const handleClose = () => {
    navigate('/plants');
  };
  
  const handleAdd = async (plantData) => {
    try {
      await addPlant(plantData);
      navigate('/plants');
    } catch (error) {
      console.error('Failed to add plant:', error);
    }
  };

  const getDomainName = (domainId) => {
    if (!domainId || !domains || !Array.isArray(domains)) return 'Unknown Domain';
    
    const domain = domains.find(domain => {
      return domain && (String(domain._id) === String(domainId) || 
             String(domain.id) === String(domainId) ||
             (typeof domainId === 'object' && domainId && String(domain._id) === String(domainId._id)));
    });
    
    return domain?.name || 'Unknown Domain';
  };
  
  return (
    <AddPlantModal
      onClose={handleClose}
      onAdd={handleAdd}
      organizations={organizations}
      domains={domains}
      plots={plots}
      user={user}
      getDomainName={getDomainName}
    />
  );
}

function EditPlantModalWrapper({ user, selectedState }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { organizations, domains, plots, updatePlant } = useApi();
  const [plant, setPlant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  console.log('EditPlantModalWrapper: Component rendered');
  console.log('EditPlantModalWrapper: looking for plant with id:', id);
  
  // Fetch the specific plant data by ID
  useEffect(() => {
    const fetchPlant = async () => {
      if (!id) {
        setError('No plant ID provided');
        setLoading(false);
        return;
      }
      
      try {
        console.log('EditPlantModalWrapper: Fetching plant data for ID:', id);
        setLoading(true);
        setError(null);
        
        const response = await api.getPlant(id);
        if (response.success) {
          console.log('EditPlantModalWrapper: Plant data loaded:', response.data);
          setPlant(response.data);
        } else {
          console.error('EditPlantModalWrapper: Failed to load plant:', response.message);
          setError(response.message || 'Failed to load plant data');
        }
      } catch (err) {
        console.error('EditPlantModalWrapper: Error fetching plant:', err);
        setError(err.message || 'Failed to load plant data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlant();
  }, [id]);
  
  const handleClose = () => {
    navigate('/plants');
  };
  
  const handleUpdate = async (plantData) => {
    try {
      await updatePlant(plantData._id, plantData);
      navigate('/plants');
    } catch (error) {
      console.error('Failed to update plant:', error);
    }
  };

  const getDomainName = (domainId) => {
    if (!domainId || !domains || !Array.isArray(domains)) return 'Unknown Domain';
    
    const domain = domains.find(domain => {
      return domain && (String(domain._id) === String(domainId) || 
             String(domain.id) === String(domainId) ||
             (typeof domainId === 'object' && domainId && String(domain._id) === String(domainId._id)));
    });
    
    return domain?.name || 'Unknown Domain';
  };
  
  if (loading) {
    return <div>Loading plant data...</div>;
  }
  
  if (error) {
    return <div>Error: {error}</div>;
  }
  
  if (!plant) {
    return <div>Plant not found</div>;
  }
  
  return (
    <AddPlantModal
      plant={plant}
      onClose={handleClose}
      onAdd={handleUpdate}
      organizations={organizations}
      domains={domains}
      plots={plots}
      user={user}
      getDomainName={getDomainName}
      isEdit={true}
    />
  );
}

function StatusModalWrapper({ user, selectedState }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { plants, addPlantStatus } = useApi();
  
  const plant = plants.find(p => p._id === id);
  const [statusUpdate, setStatusUpdate] = useState({
    status: 'growing',
    health: plant?.health || 'good',
    growthStage: plant?.growthStage || 'vegetative',
    image: '',
    notes: '',
  });
  
  const handleClose = () => {
    navigate('/plants');
  };

  const handleStatusUpdate = async () => {
    try {
      const statusData = {
        ...statusUpdate,
        updatedBy: user._id,
        date: new Date()
      };
      
      await addPlantStatus(plant._id, statusData);
      handleClose();
    } catch (error) {
      console.error('Failed to add plant status:', error);
    }
  };
  
  if (!plant) {
    return <div>Plant not found</div>;
  }
  
  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Add Status Update for {plant.name}</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={statusUpdate.status}
                onChange={(e) => setStatusUpdate({...statusUpdate, status: e.target.value})}
                className="input-field"
              >
                <option key="planted" value="planted">Planted</option>
                <option key="growing" value="growing">Growing</option>
                <option key="mature" value="mature">Mature</option>
                <option key="harvested" value="harvested">Harvested</option>
                <option key="dormant" value="dormant">Dormant</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Health
              </label>
              <select
                value={statusUpdate.health}
                onChange={(e) => setStatusUpdate({...statusUpdate, health: e.target.value})}
                className="input-field"
              >
                <option key="excellent" value="excellent">Excellent</option>
                <option key="good" value="good">Good</option>
                <option key="fair" value="fair">Fair</option>
                <option key="poor" value="poor">Poor</option>
                <option key="deceased" value="deceased">Deceased</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Growth Stage
              </label>
              <select
                value={statusUpdate.growthStage}
                onChange={(e) => setStatusUpdate({...statusUpdate, growthStage: e.target.value})}
                className="input-field"
              >
                <option key="seedling" value="seedling">Seedling</option>
                <option key="vegetative" value="vegetative">Vegetative</option>
                <option key="flowering" value="flowering">Flowering</option>
                <option key="fruiting" value="fruiting">Fruiting</option>
                <option key="mature" value="mature">Mature</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Image (Emoji or URL)
              </label>
              <input
                type="text"
                value={statusUpdate.image}
                onChange={(e) => setStatusUpdate({...statusUpdate, image: e.target.value})}
                className="input-field"
                placeholder="🌱 or https://example.com/image.jpg"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter an emoji (🌱) or paste an image URL
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={statusUpdate.notes}
                onChange={(e) => setStatusUpdate({...statusUpdate, notes: e.target.value})}
                className="input-field"
                rows={3}
                placeholder="Add notes about the plant's current status..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button onClick={handleClose} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleStatusUpdate} className="btn-primary">
              Add Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhotosModalWrapper({ user, selectedState }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { plants } = useApi();
  
  const plant = plants.find(p => p._id === id);
  
  const handleClose = () => {
    navigate('/plants');
  };
  
  if (!plant) {
    return <div>Plant not found</div>;
  }
  
  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <PlantImageUpload
            plant={plant}
            onImageUpload={(image) => {
              console.log('Image uploaded:', image);
              handleClose();
            }}
            onImageDelete={(imageId) => {
              console.log('Image deleted:', imageId);
            }}
            onClose={handleClose}
          />
        </div>
      </div>
    </div>
  );
}

function HistoryModalWrapper({ user, selectedState }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { plants } = useApi();
  
  const plant = plants.find(p => p._id === id);
  
  const handleClose = () => {
    navigate('/plants');
  };

  // Safe date parsing with fallback
  const parseDate = (dateString) => {
    if (!dateString) return new Date();
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date() : date;
  };

  const getHealthColor = (health) => {
    switch (health) {
      case 'excellent':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'good':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'fair':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'poor':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'deceased':
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700';
    }
  };

  const getGrowthStageColor = (stage) => {
    switch (stage) {
      case 'seedling':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'vegetative':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'flowering':
        return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20';
      case 'fruiting':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
      case 'mature':
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700';
    }
  };
  
  if (!plant) {
    return <div>Plant not found</div>;
  }
  
  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Plant History</h3>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {(plant.statusHistory || []).map((update, index) => (
              <div key={update.id || index} className="border-l-4 border-plant-green-500 pl-4 py-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {update.image && update.image.startsWith('http') ? (
                      <img 
                        src={update.image} 
                        alt="Plant status update" 
                        className="w-8 h-8 rounded-full object-cover border-2 border-plant-green-200"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'inline';
                        }}
                      />
                    ) : null}
                    <span className="text-2xl" style={{ display: update.image && update.image.startsWith('http') ? 'none' : 'inline' }}>
                      {update.image && !update.image.startsWith('http') ? update.image : '🌱'}
                    </span>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {update.status.charAt(0).toUpperCase() + update.status.slice(1)}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                        {format(parseDate(update.date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(update.health)}`}>
                      {update.health}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getGrowthStageColor(update.growthStage)}`}>
                      {update.growthStage}
                    </span>
                  </div>
                </div>
                {update.notes && !update.notes.startsWith('http') && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{update.notes}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-6">
            <button onClick={handleClose} className="btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;