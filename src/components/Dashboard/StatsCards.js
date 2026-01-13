import React from 'react';
import { Building, MapPin, Users } from 'lucide-react';

function StatsCards({ stats, user }) {
  // Color mapping function to ensure Tailwind can detect all classes
  const getColorClasses = (color) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-100 dark:bg-blue-900/20',
        icon: 'text-blue-600 dark:text-blue-400'
      },
      purple: {
        bg: 'bg-purple-100 dark:bg-purple-900/20',
        icon: 'text-purple-600 dark:text-purple-400'
      },
      orange: {
        bg: 'bg-orange-100 dark:bg-orange-900/20',
        icon: 'text-orange-600 dark:text-orange-400'
      },
      indigo: {
        bg: 'bg-indigo-100 dark:bg-indigo-900/20',
        icon: 'text-indigo-600 dark:text-indigo-400'
      }
    };
    return colorMap[color] || colorMap.blue;
  };

  const cards = [
    // Only show Organizations card for super_admin users
    ...(user?.role === 'super_admin' ? [{
      title: 'Organizations',
      value: stats.totalOrganizations,
      icon: Building,
      color: 'blue',
      description: 'Registered organizations'
    }] : []),
    {
      title: 'Domains',
      value: stats.totalDomains,
      icon: MapPin,
      color: 'purple',
      description: 'Cultivation domains'
    },
    {
      title: 'Plots',
      value: stats.totalPlots,
      icon: MapPin,
      color: 'orange',
      description: 'Growing plots'
    },
    {
      title: 'Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'indigo',
      description: 'System users'
    }
  ];

  return (
    <div className={`grid gap-4 ${
      cards.length === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 
      cards.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 
      'grid-cols-1 md:grid-cols-2'
    }`}>
      {cards.map((card, index) => {
        const colorClasses = getColorClasses(card.color);
        return (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-2">
            <div className={`p-2 rounded-lg ${colorClasses.bg}`}>
              <card.icon className={`h-5 w-5 ${colorClasses.icon}`} />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Active</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
              {card.title}
            </h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {card.value}
            </p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {card.description}
            </p>
          </div>
          
          <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Last updated: Today</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                Active
              </span>
            </div>
          </div>
        </div>
        );
      })}
    </div>
  );
}

export default StatsCards; 