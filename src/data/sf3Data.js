// SF3 Complete Data - domain and all plots
import { sf3Plots } from './sf3Plots';

// SF3 Domain Data
// Location based on farmLayout.js center
export const sf3Domain = {
  id: 3,
  name: 'SF3',
  description: 'Sanctity Ferme Phase 3',
  organizationId: 1,
  location: '12.7178, 78.0072',
  coordinates: {
    lat: 12.7178,
    lng: 78.0072
  },
  totalPlots: 157, // plots 1-109, 200-260, 300-347
  createdAt: '2024-01-01',
  createdBy: 1,
  isActive: true,
};

// Export all SF3 plots
export const allSf3Plots = sf3Plots;

// Summary statistics
export const sf3Stats = {
  totalPlotEntries: allSf3Plots.length,
  uniqueOwners: [...new Set(allSf3Plots.map(p => p.ownerName))].length,
};

export { sf3Domain as domain };

