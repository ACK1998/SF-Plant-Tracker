import React from 'react';
import { useApi } from '../../contexts/ApiContext';
import SearchableDropdown from '../common/SearchableDropdown';

function FilterTest() {
  const { domains, plots, plants } = useApi();

  // Get unique plant types and varieties
  const uniquePlantTypes = [...new Set(plants.map(plant => plant.type).filter(Boolean))];
  const uniquePlantVarieties = [...new Set(plants.map(plant => plant.variety).filter(Boolean))];

  // Get unique domains and plots from plant data
  const domainsFromPlants = [...new Set(plants.map(plant => plant.domainId).filter(Boolean))];
  const plotsFromPlants = [...new Set(plants.map(plant => plant.plotId).filter(Boolean))];

  console.log('FilterTest - Domains from API:', domains);
  console.log('FilterTest - Plots from API:', plots);
  console.log('FilterTest - Domains from plants:', domainsFromPlants);
  console.log('FilterTest - Plots from plants:', plotsFromPlants);
  console.log('FilterTest - Plant types:', uniquePlantTypes);
  console.log('FilterTest - Plant varieties:', uniquePlantVarieties);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Filter Test</h2>
      
      <div className="space-y-2">
        <h3 className="font-semibold">Domains ({domains.length})</h3>
        <SearchableDropdown
          options={[
            { value: 'all', label: 'All Domains' },
            ...domains.map(domain => ({ value: domain._id, label: domain.name }))
          ]}
          value="all"
          onChange={(e) => console.log('Domain selected:', e.target.value)}
          placeholder="All Domains"
          searchPlaceholder="Search domains..."
          className="w-64"
        />
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Plots ({plots.length})</h3>
        <SearchableDropdown
          options={[
            { value: 'all', label: 'All Plots' },
            ...plots.map(plot => ({ value: plot._id, label: plot.name }))
          ]}
          value="all"
          onChange={(e) => console.log('Plot selected:', e.target.value)}
          placeholder="All Plots"
          searchPlaceholder="Search plots..."
          className="w-64"
        />
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Plant Types ({uniquePlantTypes.length})</h3>
        <SearchableDropdown
          options={[
            { value: 'all', label: 'All Types' },
            ...uniquePlantTypes.map(type => ({ value: type, label: type }))
          ]}
          value="all"
          onChange={(e) => console.log('Type selected:', e.target.value)}
          placeholder="All Types"
          searchPlaceholder="Search types..."
          className="w-64"
        />
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Plant Varieties ({uniquePlantVarieties.length})</h3>
        <SearchableDropdown
          options={[
            { value: 'all', label: 'All Varieties' },
            ...uniquePlantVarieties.map(variety => ({ value: variety, label: variety }))
          ]}
          value="all"
          onChange={(e) => console.log('Variety selected:', e.target.value)}
          placeholder="All Varieties"
          searchPlaceholder="Search varieties..."
          className="w-64"
        />
      </div>

      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Debug Info:</h3>
        <p>Domains loaded: {domains.length}</p>
        <p>Plots loaded: {plots.length}</p>
        <p>Plants loaded: {plants.length}</p>
        <p>Plant types: {uniquePlantTypes.join(', ')}</p>
        <p>Plant varieties: {uniquePlantVarieties.join(', ')}</p>
        <p>Domains from plants: {domainsFromPlants.length}</p>
        <p>Plots from plants: {plotsFromPlants.length}</p>
        
        <h4 className="font-semibold mt-4 mb-2">Sample Data:</h4>
        {domains.length > 0 && (
          <div className="mb-2">
            <p className="font-medium">First Domain:</p>
            <pre className="text-xs bg-white p-2 rounded">{JSON.stringify(domains[0], null, 2)}</pre>
          </div>
        )}
        {plots.length > 0 && (
          <div className="mb-2">
            <p className="font-medium">First Plot:</p>
            <pre className="text-xs bg-white p-2 rounded">{JSON.stringify(plots[0], null, 2)}</pre>
          </div>
        )}
        {plants.length > 0 && (
          <div className="mb-2">
            <p className="font-medium">First Plant:</p>
            <pre className="text-xs bg-white p-2 rounded">{JSON.stringify(plants[0], null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default FilterTest;
