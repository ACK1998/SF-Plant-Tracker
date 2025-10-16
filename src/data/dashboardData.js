export const dashboardStats = [
  {
    title: 'Total Plants',
    value: '24',
    change: '+3',
    changeType: 'positive',
    icon: 'Leaf',
    color: 'plant-green',
  },
  {
    title: 'Watering Due',
    value: '8',
    change: '-2',
    changeType: 'negative',
    icon: 'Droplets',
    color: 'blue',
  },
  {
    title: 'Tasks Today',
    value: '12',
    change: '+1',
    changeType: 'positive',
    icon: 'Calendar',
    color: 'yellow',
  },
  {
    title: 'Growth Rate',
    value: '85%',
    change: '+5%',
    changeType: 'positive',
    icon: 'TrendingUp',
    color: 'purple',
  },
];

export const recentActivity = [
  {
    id: 1,
    type: 'watering',
    message: 'Tomato plant #12 was watered',
    time: '2 hours ago',
    color: 'plant-green',
  },
  {
    id: 2,
    type: 'planting',
    message: 'New lettuce seedlings planted in Plot P002',
    time: '4 hours ago',
    color: 'blue',
  },
  {
    id: 3,
    type: 'status-update',
    message: 'Monthly status update added for Basil plant',
    time: '6 hours ago',
    color: 'yellow',
  },
  {
    id: 4,
    type: 'domain-creation',
    message: 'New domain "Phase 3 - East Field" created',
    time: '1 day ago',
    color: 'purple',
  },
  {
    id: 5,
    type: 'plot-assignment',
    message: 'Plot P003 assigned to Domain Phase 1',
    time: '2 days ago',
    color: 'orange',
  },
];

export const weatherForecast = [
  {
    day: 'Today',
    icon: '🌤️',
    temperature: '72°F',
    condition: 'Partly cloudy',
  },
  {
    day: 'Tomorrow',
    icon: '🌤️',
    temperature: '72°F',
    condition: 'Partly cloudy',
  },
  {
    day: 'Wed',
    icon: '🌤️',
    temperature: '72°F',
    condition: 'Partly cloudy',
  },
  {
    day: 'Thu',
    icon: '🌤️',
    temperature: '72°F',
    condition: 'Partly cloudy',
  },
  {
    day: 'Fri',
    icon: '🌤️',
    temperature: '72°F',
    condition: 'Partly cloudy',
  },
];

export const getColorClasses = (color) => {
  const colorMap = {
    'plant-green': {
      bg: 'bg-plant-green-50 dark:bg-plant-green-900/30',
      text: 'text-plant-green-600 dark:text-plant-green-400',
      icon: 'text-plant-green-600 dark:text-plant-green-400',
      border: 'border-plant-green-200 dark:border-plant-green-700',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      icon: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-700',
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/30',
      text: 'text-yellow-600 dark:text-yellow-400',
      icon: 'text-yellow-600 dark:text-yellow-400',
      border: 'border-yellow-200 dark:border-yellow-700',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/30',
      text: 'text-purple-600 dark:text-purple-400',
      icon: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-700',
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900/30',
      text: 'text-orange-600 dark:text-orange-400',
      icon: 'text-orange-600 dark:text-orange-400',
      border: 'border-orange-200 dark:border-orange-700',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/30',
      text: 'text-red-600 dark:text-red-400',
      icon: 'text-red-600 dark:text-red-400',
      border: 'border-red-200 dark:border-red-700',
    },
  };

  return colorMap[color] || colorMap['plant-green'];
}; 