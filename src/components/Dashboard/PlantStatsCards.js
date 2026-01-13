import React from 'react';
import { Leaf, TreePalm, Sprout, Apple, Carrot, Wheat, Bean } from 'lucide-react';

function PlantStatsCards({ stats }) {
  // Color mapping function to ensure Tailwind can detect all classes
  const getColorClasses = (color) => {
    const colorMap = {
      'plant-green': {
        bg: 'bg-plant-green-100 dark:bg-plant-green-900/20',
        icon: 'text-plant-green-600 dark:text-plant-green-400'
      },
      emerald: {
        bg: 'bg-emerald-100 dark:bg-emerald-900/20',
        icon: 'text-emerald-600 dark:text-emerald-400'
      },
      green: {
        bg: 'bg-green-100 dark:bg-green-900/20',
        icon: 'text-green-600 dark:text-green-400'
      },
      lime: {
        bg: 'bg-lime-100 dark:bg-lime-900/20',
        icon: 'text-lime-600 dark:text-lime-400'
      },
      red: {
        bg: 'bg-red-100 dark:bg-red-900/20',
        icon: 'text-red-600 dark:text-red-400'
      },
      yellow: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/20',
        icon: 'text-yellow-600 dark:text-yellow-400'
      },
      brown: {
        bg: 'bg-amber-100 dark:bg-amber-900/20',
        icon: 'text-amber-600 dark:text-amber-400'
      },
      cyan: {
        bg: 'bg-cyan-100 dark:bg-cyan-900/20',
        icon: 'text-cyan-600 dark:text-cyan-400'
      }
    };
    return colorMap[color] || colorMap['plant-green'];
  };

  const cards = [
    {
      title: 'Total Plants',
      value: stats.totalPlants,
      icon: Leaf,
      color: 'plant-green',
      description: 'Active plants in the system'
    },
    {
      title: 'Healthy Trees',
      value: stats.healthyTrees,
      icon: TreePalm,
      color: 'emerald',
      description: 'Trees in good health'
    },
    {
      title: 'Healthy Vegetables',
      value: stats.healthyVegetables,
      icon: Carrot,
      color: 'green',
      description: 'Vegetables in good health'
    },
    {
      title: 'Healthy Herbs',
      value: stats.healthyHerbs,
      icon: Leaf,
      color: 'lime',
      description: 'Herbs in good health'
    },
    {
      title: 'Healthy Fruits',
      value: stats.healthyFruits,
      icon: Apple,
      color: 'red',
      description: 'Fruits in good health'
    },
    {
      title: 'Healthy Grains',
      value: stats.healthyGrains,
      icon: Wheat,
      color: 'yellow',
      description: 'Grains in good health'
    },
    {
      title: 'Healthy Legumes',
      value: stats.healthyLegumes,
      icon: Bean,
      color: 'brown',
      description: 'Legumes in good health'
    },
    {
      title: 'Varieties',
      value: stats.numberOfVarieties,
      icon: Sprout,
      color: 'cyan',
      description: 'Unique plant varieties'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 4 xl:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const colorClasses = getColorClasses(card.color);
        return (
        <div key={index} className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {card.title}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {card.value}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {card.description}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${colorClasses.bg}`}>
              <card.icon className={`h-6 w-6 ${colorClasses.icon}`} />
            </div>
          </div>
        </div>
        );
      })}
    </div>
  );
}

export default PlantStatsCards;
