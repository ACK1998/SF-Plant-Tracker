// SF1 Complete Data - combines domain and all plots
import { sf1Domain } from './sf1Domain';
import { sf1Plots } from './sf1Plots';
import { sf1Plots2 } from './sf1Plots2';

// Combine all SF1 plots
export const allSf1Plots = [...sf1Plots, ...sf1Plots2];

// Export domain
export { sf1Domain };

// Summary
export const sf1Summary = {
  domain: sf1Domain,
  totalOwners: 210,
  totalPlotEntries: allSf1Plots.length,
  location: {
    lat: 12.697233258009636,
    lng: 78.06164299189902
  },
  conversionRate: '1 cent = 435.6 sq ft'
};

