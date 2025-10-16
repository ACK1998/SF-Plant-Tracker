import React from 'react';
import { Leaf, TreePalm, Sprout, Apple, Carrot, Wheat, Bean } from 'lucide-react';

function PlantStatsCards({ stats }) {
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
      {cards.map((card, index) => (
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
            <div className={`p-3 rounded-lg bg-${card.color}-100 dark:bg-${card.color}-900/20`}>
              <card.icon className={`h-6 w-6 text-${card.color}-600 dark:text-${card.color}-400`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default PlantStatsCards;
