// Color constants for the application
// Centralized color definitions to avoid hardcoded values

export const HEALTH_COLORS = {
  // Health status colors (matching backend enum: excellent, good, fair, poor, deceased)
  excellent: {
    primary: '#059669',      // emerald-600
    secondary: '#10b981',   // emerald-500
    light: '#d1fae5',        // emerald-100
    text: 'text-green-600 bg-green-50'
  },
  good: {
    primary: '#059669',      // emerald-600
    secondary: '#10b981',   // emerald-500
    light: '#d1fae5',        // emerald-100
    text: 'text-green-600 bg-green-50'
  },
  fair: {
    primary: '#d97706',      // amber-600
    secondary: '#f59e0b',   // amber-500
    light: '#fde68a',        // amber-200
    text: 'text-yellow-600 bg-yellow-50'
  },
  poor: {
    primary: '#dc2626',      // red-600
    secondary: '#ef4444',   // red-500
    light: '#fee2e2',        // red-100
    text: 'text-red-600 bg-red-50'
  },
  deceased: {
    primary: '#6b7280',      // gray-500
    secondary: '#9ca3af',   // gray-400
    light: '#f3f4f6',        // gray-100
    text: 'text-gray-600 bg-gray-50'
  },
  // Legacy capitalized values (for backward compatibility)
  'Excellent': {
    primary: '#059669',
    secondary: '#10b981',
    light: '#d1fae5',
    text: 'text-green-600 bg-green-50'
  },
  'Good': {
    primary: '#059669',
    secondary: '#10b981',
    light: '#d1fae5',
    text: 'text-green-600 bg-green-50'
  },
  'Fair': {
    primary: '#d97706',
    secondary: '#f59e0b',
    light: '#fde68a',
    text: 'text-yellow-600 bg-yellow-50'
  },
  'Poor': {
    primary: '#dc2626',
    secondary: '#ef4444',
    light: '#fee2e2',
    text: 'text-red-600 bg-red-50'
  },
  'Deceased': {
    primary: '#6b7280',
    secondary: '#9ca3af',
    light: '#f3f4f6',
    text: 'text-gray-600 bg-gray-50'
  }
};

// UI Colors
export const UI_COLORS = {
  // Primary colors
  primary: {
    blue: '#2563eb',         // blue-600
    green: '#059669',        // emerald-600
    purple: '#8b5cf6',      // violet-500
    orange: '#f97316',      // orange-500
  },
  // Text colors
  text: {
    primary: '#1f2937',      // gray-800
    secondary: '#6b7280',   // gray-500
    muted: '#9ca3af',       // gray-400
  },
  // Background colors
  background: {
    white: '#ffffff',
    light: '#f9fafb',       // gray-50
    border: '#e5e7eb',       // gray-200
  },
  // Status colors
  status: {
    active: '#10b981',      // emerald-500
    inactive: '#ef4444',    // red-500
    pending: '#f59e0b',     // amber-500
  },
  // Cluster colors (for map markers)
  cluster: {
    small: '#10b981',        // emerald-500 (< 10)
    medium: '#f59e0b',      // amber-500 (10-49)
    large: '#ef4444',       // red-500 (50+)
  }
};

// Helper function to get health color
export const getHealthColor = (health) => {
  if (!health) return HEALTH_COLORS.good; // Default to good
  return HEALTH_COLORS[health] || HEALTH_COLORS.good;
};

// Helper function to get health color value (for inline styles)
export const getHealthColorValue = (health, type = 'primary') => {
  const colors = getHealthColor(health);
  return colors[type] || colors.primary;
};


