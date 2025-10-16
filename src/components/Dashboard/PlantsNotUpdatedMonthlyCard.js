import React, { useState, useEffect } from 'react';
import { Calendar, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../contexts/ApiContext';

function PlantsNotUpdatedMonthlyCard({ user }) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { getPlantsNotUpdatedMonthly } = useApi();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCount = async () => {
      try {
        setLoading(true);
        const plants = await getPlantsNotUpdatedMonthly();
        setCount(plants.length);
      } catch (error) {
        console.error('Failed to fetch plants not updated monthly:', error);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();

    // Refresh count when user returns to the page (e.g., from photos page)
    const handleFocus = () => {
      fetchCount();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [getPlantsNotUpdatedMonthly]);

  const handleClick = () => {
    navigate('/plants?notUpdatedMonthly=true');
  };

  if (loading) {
    return (
      <div className="card border-l-4 border-gray-300 bg-gray-50 dark:bg-gray-900/20">
        <div className="flex items-center space-x-3">
          <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500" />
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
          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
          : 'border-green-500 bg-green-50 dark:bg-green-900/20'
      } cursor-pointer hover:shadow-md transition-shadow`}
      onClick={handleClick}
    >
      <div className="flex items-center space-x-3">
        {count > 0 ? (
          <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        ) : (
          <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
        )}
        <div className="flex-1 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {count} plant{count !== 1 ? 's' : ''} {count > 0 ? 'not updated monthly' : 'up to date'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Click to view
          </p>
        </div>
      </div>
    </div>
  );
}

export default PlantsNotUpdatedMonthlyCard;
