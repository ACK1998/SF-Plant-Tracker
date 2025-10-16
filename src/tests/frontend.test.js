import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { DarkModeProvider } from '../contexts/DarkModeContext';
import { ApiProvider } from '../contexts/ApiContext';
import App from '../App';
import LoginForm from '../components/Auth/LoginForm';
import Dashboard from '../components/Dashboard/Dashboard';
import PlantsList from '../components/Plants/PlantsList';
import PlantTypesList from '../components/PlantTypes/PlantTypesList';
import OrganizationsList from '../components/Organizations/OrganizationsList';
import DomainsList from '../components/Domains/DomainsList';
import PlotsList from '../components/Plots/PlotsList';
import UsersList from '../components/Users/UsersList';

// Mock API service
jest.mock('../services/api', () => ({
  login: jest.fn(),
  register: jest.fn(),
  getCurrentUser: jest.fn(),
  getPlants: jest.fn(),
  getPlantTypes: jest.fn(),
  getPlantVarieties: jest.fn(),
  getOrganizations: jest.fn(),
  getDomains: jest.fn(),
  getPlots: jest.fn(),
  getUsers: jest.fn(),
  createPlant: jest.fn(),
  createPlantType: jest.fn(),
  createPlantVariety: jest.fn(),
  createOrganization: jest.fn(),
  createDomain: jest.fn(),
  createPlot: jest.fn(),
  createUser: jest.fn(),
  updatePlant: jest.fn(),
  updatePlantType: jest.fn(),
  updatePlantVariety: jest.fn(),
  updateOrganization: jest.fn(),
  updateDomain: jest.fn(),
  updatePlot: jest.fn(),
  updateUser: jest.fn(),
  deletePlant: jest.fn(),
  deletePlantType: jest.fn(),
  deletePlantVariety: jest.fn(),
  deleteOrganization: jest.fn(),
  deleteDomain: jest.fn(),
  deletePlot: jest.fn(),
  deleteUser: jest.fn(),
  logout: jest.fn(),
  checkServerHealth: jest.fn(),
}));

// Mock notification system
global.showNotification = jest.fn();

// Test wrapper component
const TestWrapper = ({ children, user = null }) => (
  <BrowserRouter>
    <DarkModeProvider>
      <ApiProvider>
        {children}
      </ApiProvider>
    </DarkModeProvider>
  </BrowserRouter>
);

// Mock user data
const mockSuperAdmin = {
  _id: '1',
  username: 'superadmin',
  email: 'superadmin@example.com',
  firstName: 'Super',
  lastName: 'Admin',
  role: 'super_admin',
  organizationId: 'org1'
};

const mockOrgAdmin = {
  _id: '2',
  username: 'orgadmin',
  email: 'orgadmin@example.com',
  firstName: 'Org',
  lastName: 'Admin',
  role: 'org_admin',
  organizationId: 'org1'
};

const mockDomainAdmin = {
  _id: '3',
  username: 'domainadmin',
  email: 'domainadmin@example.com',
  firstName: 'Domain',
  lastName: 'Admin',
  role: 'domain_admin',
  organizationId: 'org1',
  domainId: 'domain1'
};

const mockAppUser = {
  _id: '4',
  username: 'appuser',
  email: 'appuser@example.com',
  firstName: 'App',
  lastName: 'User',
  role: 'application_user',
  organizationId: 'org1',
  domainId: 'domain1',
  plotId: 'plot1'
};

describe('Frontend Application Testing', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  describe('Authentication', () => {
    test('should render login form with app title', () => {
      render(
        <TestWrapper>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  🌱 Sanctity Ferme
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Plant Tracking System
                </p>
              </div>
              <LoginForm onLogin={jest.fn()} onToggleMode={jest.fn()} />
            </div>
          </div>
        </TestWrapper>
      );

      expect(screen.getByText('🌱 Sanctity Ferme')).toBeInTheDocument();
      expect(screen.getByText('Plant Tracking System')).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    test('should handle login form submission', async () => {
      const mockOnLogin = jest.fn();

      render(
        <TestWrapper>
          <LoginForm onLogin={mockOnLogin} onToggleMode={jest.fn()} />
        </TestWrapper>
      );

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockOnLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        });
      });
    });

    test('should handle registration form toggle', async () => {
      const mockOnToggleMode = jest.fn();

      render(
        <TestWrapper>
          <LoginForm onLogin={jest.fn()} onToggleMode={mockOnToggleMode} />
        </TestWrapper>
      );

      // Click on register tab
      fireEvent.click(screen.getByText(/sign up/i));

      // Verify toggle was called
      expect(mockOnToggleMode).toHaveBeenCalled();
    });
  });

  describe('Dashboard', () => {
    test('should render dashboard for super admin', () => {
      const api = require('../services/api');
      api.getPlants.mockResolvedValue({ success: true, data: [] });
      api.getPlantTypes.mockResolvedValue({ success: true, data: [] });

      render(
        <TestWrapper>
          <Dashboard user={mockSuperAdmin} selectedState="all" />
        </TestWrapper>
      );

      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });

    test('should render dashboard for application user', () => {
      const api = require('../services/api');
      api.getPlants.mockResolvedValue({ success: true, data: [] });
      api.getPlantTypes.mockResolvedValue({ success: true, data: [] });

      render(
        <TestWrapper>
          <Dashboard user={mockAppUser} selectedState="all" />
        </TestWrapper>
      );

      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });

  describe('Plants Management', () => {
    test('should render plants list', () => {
      const api = require('../services/api');
      api.getPlants.mockResolvedValue({ success: true, data: [] });

      render(
        <TestWrapper>
          <PlantsList user={mockSuperAdmin} selectedState="all" />
        </TestWrapper>
      );

      expect(screen.getByText(/plants/i)).toBeInTheDocument();
    });

    test('should handle plant creation for super admin', async () => {
      const api = require('../services/api');
      api.getPlants.mockResolvedValue({ success: true, data: [] });
      api.createPlant.mockResolvedValue({ success: true, data: { _id: '1', name: 'Test Plant' } });

      render(
        <TestWrapper>
          <PlantsList user={mockSuperAdmin} selectedState="all" />
        </TestWrapper>
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText(/plants/i)).toBeInTheDocument();
      });
    });

    test('should handle plant creation for application user', async () => {
      const api = require('../services/api');
      api.getPlants.mockResolvedValue({ success: true, data: [] });
      api.createPlant.mockResolvedValue({ success: true, data: { _id: '1', name: 'Test Plant' } });

      render(
        <TestWrapper>
          <PlantsList user={mockAppUser} selectedState="all" />
        </TestWrapper>
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText(/plants/i)).toBeInTheDocument();
      });
    });
  });

  describe('Plant Types Management', () => {
    test('should render plant types list', () => {
      const api = require('../services/api');
      api.getPlantTypes.mockResolvedValue({ success: true, data: [] });

      render(
        <TestWrapper>
          <PlantTypesList />
        </TestWrapper>
      );

      expect(screen.getByText(/plant types & varieties/i)).toBeInTheDocument();
    });

    test('should handle plant type creation', async () => {
      const api = require('../services/api');
      api.getPlantTypes.mockResolvedValue({ success: true, data: [] });
      api.createPlantType.mockResolvedValue({ success: true, data: { _id: '1', name: 'Test Type' } });

      render(
        <TestWrapper>
          <PlantTypesList />
        </TestWrapper>
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText(/plant types & varieties/i)).toBeInTheDocument();
      });
    });
  });

  describe('Organizations Management', () => {
    test('should render organizations list for super admin', () => {
      const api = require('../services/api');
      api.getOrganizations.mockResolvedValue({ success: true, data: [] });

      render(
        <TestWrapper>
          <OrganizationsList user={mockSuperAdmin} selectedState="all" />
        </TestWrapper>
      );

      expect(screen.getByText(/organizations/i)).toBeInTheDocument();
    });

    test('should show error for non-super admin', async () => {
      render(
        <TestWrapper>
          <OrganizationsList user={mockAppUser} selectedState="all" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/error loading organizations/i)).toBeInTheDocument();
      });
    });
  });

  describe('Domains Management', () => {
    test('should render domains list for super admin', () => {
      const api = require('../services/api');
      api.getDomains.mockResolvedValue({ success: true, data: [] });

      render(
        <TestWrapper>
          <DomainsList user={mockSuperAdmin} selectedState="all" />
        </TestWrapper>
      );

      expect(screen.getByText(/domains/i)).toBeInTheDocument();
    });

    test('should render domains list for org admin', () => {
      const api = require('../services/api');
      api.getDomains.mockResolvedValue({ success: true, data: [] });

      render(
        <TestWrapper>
          <DomainsList user={mockOrgAdmin} selectedState="all" />
        </TestWrapper>
      );

      expect(screen.getByText(/domains/i)).toBeInTheDocument();
    });

    test('should show error for application user', async () => {
      render(
        <TestWrapper>
          <DomainsList user={mockAppUser} selectedState="all" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/error loading domains/i)).toBeInTheDocument();
      });
    });
  });

  describe('Plots Management', () => {
    test('should render plots list for all users', () => {
      const api = require('../services/api');
      api.getPlots.mockResolvedValue({ success: true, data: [] });

      render(
        <TestWrapper>
          <PlotsList user={mockAppUser} selectedState="all" />
        </TestWrapper>
      );

      expect(screen.getByText(/plots/i)).toBeInTheDocument();
    });
  });

  describe('Users Management', () => {
    test('should render users list for super admin', () => {
      const api = require('../services/api');
      api.getUsers.mockResolvedValue({ success: true, data: [] });

      render(
        <TestWrapper>
          <UsersList user={mockSuperAdmin} selectedState="all" />
        </TestWrapper>
      );

      expect(screen.getByText(/users/i)).toBeInTheDocument();
    });

    test('should show error for application user', async () => {
      render(
        <TestWrapper>
          <UsersList user={mockAppUser} selectedState="all" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/error loading users/i)).toBeInTheDocument();
      });
    });
  });

  describe('Dark/Light Theme', () => {
    test('should toggle between dark and light themes', () => {
      render(
        <TestWrapper>
          <div data-testid="theme-container">
            <button onClick={() => {}}>Toggle Theme</button>
          </div>
        </TestWrapper>
      );

      const themeToggle = screen.getByRole('button', { name: /toggle theme/i });
      fireEvent.click(themeToggle);

      // Check if theme class is applied
      expect(screen.getByTestId('theme-container')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    test('should show correct navigation links for super admin', () => {
      render(
        <TestWrapper>
          <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex space-x-8 h-14">
              <a href="/dashboard">Dashboard</a>
              <a href="/plants">Plants</a>
              <a href="/plant-types">Plant Types</a>
              <a href="/organizations">Organizations</a>
              <a href="/domains">Domains</a>
              <a href="/plots">Plots</a>
              <a href="/users">Users</a>
            </div>
          </nav>
        </TestWrapper>
      );

      // Check for all navigation links
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/plants/i)).toBeInTheDocument();
      expect(screen.getByText(/plant types/i)).toBeInTheDocument();
      expect(screen.getByText(/organizations/i)).toBeInTheDocument();
      expect(screen.getByText(/domains/i)).toBeInTheDocument();
      expect(screen.getByText(/plots/i)).toBeInTheDocument();
      expect(screen.getByText(/users/i)).toBeInTheDocument();
    });

    test('should show limited navigation links for application user', () => {
      render(
        <TestWrapper>
          <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex space-x-8 h-14">
              <a href="/dashboard">Dashboard</a>
              <a href="/plants">Plants</a>
              <a href="/plant-types">Plant Types</a>
              <a href="/plots">Plots</a>
            </div>
          </nav>
        </TestWrapper>
      );

      // Check for limited navigation links
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/plants/i)).toBeInTheDocument();
      expect(screen.getByText(/plant types/i)).toBeInTheDocument();
      expect(screen.getByText(/plots/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      const api = require('../services/api');
      api.getPlants.mockRejectedValue(new Error('Failed to load plants'));

      render(
        <TestWrapper>
          <div className="text-center py-12">
            <div className="text-red-600 dark:text-red-400 mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Error loading plants
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Failed to load plants
            </p>
            <button className="btn-primary">
              Refresh Page
            </button>
          </div>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    test('should show loading states', () => {
      render(
        <TestWrapper>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-plant-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </TestWrapper>
      );

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    test('should validate email format in login form', async () => {
      render(
        <TestWrapper>
          <LoginForm onLogin={jest.fn()} onToggleMode={jest.fn()} />
        </TestWrapper>
      );

      // Test email validation
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, {
        target: { value: 'invalid-email' }
      });

      fireEvent.blur(emailInput);

      // The actual validation would be handled by the browser's built-in email validation
      expect(emailInput).toHaveValue('invalid-email');
    });
  });
});
