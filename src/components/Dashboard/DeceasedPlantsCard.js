import React, { useState, useEffect } from 'react';
import { Skull, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../../contexts/DashboardContext';

function DeceasedPlantsCard({ user, selectedState }) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { dashboardPlants, organizations } = useDashboard();
  const navigate = useNavigate();

  useEffect(() => {
    const calculateCount = () => {
      setLoading(true);
      
      // Filter data based on selected state if not 'all' (same logic as Dashboard)
      const filteredPlants = selectedState === 'all' ? dashboardPlants : dashboardPlants.filter(plant => 
        plant.organizationId && 
        organizations.find(org => org._id === plant.organizationId)?.address?.state === selectedState
      );

      // Calculate deceased plants count
      const deceasedCount = filteredPlants.filter(plant => 
        plant.health === 'deceased'
      ).length;
      
      setCount(deceasedCount);
      setLoading(false);
    };

    calculateCount();

    // Refresh count when user returns to the page (e.g., from photos page)
    const handleFocus = () => {
      calculateCount();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [dashboardPlants, organizations, selectedState]);

  const handleClick = () => {
    navigate('/plants?health=deceased');
  };

  if (loading) {
    return (
      <div className="card border-l-4 border-gray-300 bg-gray-50 dark:bg-gray-900/20">
        <div className="flex items-center space-x-3">
          <Skull className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          <div className="flex-1">
            <div className="animate-pulse">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded mt-1"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`card border-l-4 ${
        count > 0 
          ? 'border-gray-500 bg-gray-50 dark:bg-gray-900/20' 
          : 'border-green-500 bg-green-50 dark:bg-green-900/20'
      } cursor-pointer hover:shadow-md transition-shadow`}
      onClick={handleClick}
    >
      <div className="flex items-center space-x-3">
        {count > 0 ? (
          <Skull className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        ) : (
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
        )}
        <div className="flex-1 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {count} deceased plant{count !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Click to view
          </p>
        </div>
      </div>
    </div>
  );
}

export default DeceasedPlantsCard;
