// Plant name to emoji mapping
const plantEmojiMap = {
  // Vegetables
  'tomato': '🍅', 'tomatoes': '🍅',
  'bell pepper': '🫑', 'pepper': '🫑', 'peppers': '🫑',
  'cucumber': '🥒', 'cucumbers': '🥒',
  'carrot': '🥕', 'carrots': '🥕',
  'lettuce': '🥬', 'leafy greens': '🥬',
  'corn': '🌽', 'maize': '🌽',
  'potato': '🥔', 'potatoes': '🥔',
  'onion': '🧅', 'onions': '🧅',
  'garlic': '🧄',
  'broccoli': '🥦',
  'peas': '🫛', 'pea': '🫛',
  'beans': '🫘', 'bean': '🫘',
  'pumpkin': '🎃', 'squash': '🎃',
  
  // Herbs
  'basil': '🌿', 'mint': '🌿', 'rosemary': '🌿', 'thyme': '🌿', 'oregano': '🌿',
  'parsley': '🌿', 'cilantro': '🌿', 'sage': '🌿', 'dill': '🌿',
  
  // Fruits
  'strawberry': '🍓', 'strawberries': '🍓',
  'apple': '🍎', 'apples': '🍎',
  'orange': '🍊', 'oranges': '🍊',
  'lemon': '🍋', 'lemons': '🍋',
  'peach': '🍑', 'peaches': '🍑',
  'cherry': '🍒', 'cherries': '🍒',
  'pear': '🍐', 'pears': '🍐',
  'blueberry': '🫐', 'blueberries': '🫐',
  'mango': '🥭', 'mangoes': '🥭',
  'banana': '🍌', 'bananas': '🍌',
  'coconut': '🥥', 'coconuts': '🥥',
  'pineapple': '🍍', 'pineapples': '🍍',
  'melon': '🍈', 'watermelon': '🍈',
  'avocado': '🥑', 'avocados': '🥑',
  'olive': '🫒', 'olives': '🫒',
  
  // Trees
  'oak': '🌳', 'maple': '🌳', 'pine': '🌲', 'cedar': '🌲',
  'palm': '🌴', 'palm tree': '🌴',
  'cherry tree': '🌸', 'apple tree': '🍎', 'orange tree': '🍊',
  
  // Grains
  'wheat': '🌾', 'rice': '🌾', 'barley': '🌾', 'oats': '🌾',
  'matta': '🌾', 'matta rice': '🌾', 'palakkadan': '🌾', 'kerala rice': '🌾',
  
  // Legumes
  'lentil': '🫘', 'lentils': '🫘', 'chickpea': '🫘', 'chickpeas': '🫘',
  
  // Nuts
  'almond': '🌰', 'almonds': '🌰', 'walnut': '🌰', 'walnuts': '🌰',
  'peanut': '🥜', 'peanuts': '🥜', 'cashew': '🌰', 'cashews': '🌰',
  
  // Default emojis by category
  'default_vegetable': '🥕',
  'default_herb': '🌿',
  'default_fruit': '🍎',
  'default_tree': '🌳',
  'default_grain': '🌾',
  'default_legume': '🫘'
};

// Function to find the best emoji for a plant name
export const findPlantEmoji = (plantName, category = 'vegetable') => {
  if (!plantName) return getDefaultEmoji(category);
  
  const normalizedName = plantName.toLowerCase().trim();
  
  // Direct match
  if (plantEmojiMap[normalizedName]) {
    return plantEmojiMap[normalizedName];
  }
  
  // Partial match - check if any word in the plant name matches
  const words = normalizedName.split(/\s+/);
  for (const word of words) {
    if (plantEmojiMap[word]) {
      return plantEmojiMap[word];
    }
  }
  
  // Check for common variations
  const variations = [
    normalizedName.replace(/s$/, ''), // Remove plural 's'
    normalizedName + 's', // Add plural 's'
    normalizedName.replace(/tree$/, ''), // Remove 'tree' suffix
    normalizedName.replace(/plant$/, ''), // Remove 'plant' suffix
  ];
  
  for (const variation of variations) {
    if (plantEmojiMap[variation]) {
      return plantEmojiMap[variation];
    }
  }
  
  // If no match found, return default emoji for the category
  return getDefaultEmoji(category);
};

// Function to get default emoji by category
export const getDefaultEmoji = (category) => {
  const defaultEmojis = {
    'vegetable': '🥕',
    'herb': '🌿',
    'fruit': '🍎',
    'tree': '🌳',
    'grain': '🌾',
    'legume': '🫘'
  };
  
  return defaultEmojis[category] || '🌱';
};

// Function to get all available emojis
export const getAllEmojis = () => {
  return [...new Set(Object.values(plantEmojiMap))];
};

// Function to get emojis by category
export const getEmojisByCategory = (category) => {
  const categoryEmojis = {
    'vegetable': ['🍅', '🫑', '🥒', '🥕', '🥬', '🌽', '🥔', '🧅', '🧄', '🥦', '🫛', '🫘', '🎃'],
    'herb': ['🌿', '🌱'],
    'fruit': ['🍓', '🍎', '🍊', '🍋', '🍑', '🍒', '🍐', '🫐', '🥭', '🍌', '🥥', '🍍', '🍈', '🥑', '🫒'],
    'tree': ['🌳', '🌲', '🌴', '🌸', '🌰'],
    'grain': ['🌾'],
    'legume': ['🫘', '🌰']
  };
  
  return categoryEmojis[category] || getAllEmojis();
};
