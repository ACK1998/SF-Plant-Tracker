# Emoji Auto-Selection Feature

## Overview
The plant type creation and editing forms now include intelligent emoji auto-selection based on the plant name. When you enter a plant name, the system automatically suggests an appropriate emoji and allows you to manually change it if needed.

## Features

### 🎯 Automatic Emoji Selection
- **Name-based matching**: The system searches for emojis based on the plant name
- **Category-specific defaults**: If no match is found, uses category-appropriate default emojis
- **Smart variations**: Handles plurals, compound names, and common variations

### 🔄 Dynamic Emoji Grid
- **Category-based filtering**: Shows relevant emojis based on the selected category
- **Visual feedback**: Highlights the auto-selected emoji
- **Manual override**: Users can still manually select any emoji

### 💡 User Experience
- **Real-time updates**: Emoji updates as you type the plant name
- **Visual indicators**: Shows when emoji is auto-suggested vs manually selected
- **Helpful tips**: Provides guidance on how the auto-selection works

## How It Works

### 1. Plant Name Analysis
The system analyzes the plant name using multiple strategies:
- **Direct match**: Exact name match (e.g., "Tomato" → 🍅)
- **Word matching**: Matches individual words in compound names
- **Variation handling**: Handles plurals, suffixes, and common variations

### 2. Category-Based Fallbacks
If no specific emoji is found, the system uses category defaults:
- **Vegetables**: 🥕 (carrot)
- **Herbs**: 🌿 (herb)
- **Fruits**: 🍎 (apple)
- **Trees**: 🌳 (deciduous tree)
- **Grains**: 🌾 (sheaf of rice)
- **Legumes**: 🫘 (beans)

### 3. Emoji Grid Filtering
The available emoji grid is filtered based on the selected category:
- **Vegetables**: 🍅🫑🥒🥕🥬🌽🥔🧅🧄🥦🫛🫘🎃
- **Herbs**: 🌿🌱
- **Fruits**: 🍓🍎🍊🍋🍑🍒🍐🫐🥭🍌🥥🍍🍈🥑🫒
- **Trees**: 🌳🌲🌴🌸🌰
- **Grains**: 🌾
- **Legumes**: 🫘🌰

## Supported Plant Names

### Vegetables
- Tomato/Tomatoes → 🍅
- Bell Pepper/Pepper → 🫑
- Cucumber/Cucumbers → 🥒
- Carrot/Carrots → 🥕
- Lettuce/Leafy Greens → 🥬
- Corn/Maize → 🌽
- Potato/Potatoes → 🥔
- Onion/Onions → 🧅
- Garlic → 🧄
- Broccoli → 🥦
- Peas/Pea → 🫛
- Beans/Bean → 🫘
- Pumpkin/Squash → 🎃

### Herbs
- Basil, Mint, Rosemary, Thyme, Oregano, Parsley, Cilantro, Sage, Dill → 🌿

### Fruits
- Strawberry/Strawberries → 🍓
- Apple/Apples → 🍎
- Orange/Oranges → 🍊
- Lemon/Lemons → 🍋
- Peach/Peaches → 🍑
- Cherry/Cherries → 🍒
- Pear/Pears → 🍐
- Blueberry/Blueberries → 🫐
- Mango/Mangoes → 🥭
- Banana/Bananas → 🍌
- Coconut/Coconuts → 🥥
- Pineapple/Pineapples → 🍍
- Melon/Watermelon → 🍈
- Avocado/Avocados → 🥑
- Olive/Olives → 🫒

### Trees
- Oak, Maple → 🌳
- Pine, Cedar → 🌲
- Palm/Palm Tree → 🌴
- Cherry Tree → 🌸
- Apple Tree → 🍎
- Orange Tree → 🍊

### Grains
- Wheat, Rice, Corn, Barley, Oats → 🌾

### Legumes
- Lentil/Lentils, Chickpea/Chickpeas → 🫘

### Nuts
- Almond/Almonds, Walnut/Walnuts, Cashew/Cashews → 🌰
- Peanut/Peanuts → 🥜

## Usage

### Adding a New Plant Type
1. Enter the plant name in the "Name" field
2. Select the appropriate category
3. The emoji will be automatically selected based on the name
4. You can manually change the emoji if desired
5. Complete the rest of the form and save

### Editing a Plant Type
1. The existing emoji will be preserved initially
2. If you change the name, the emoji will update automatically
3. You can manually override the auto-selection at any time

## Technical Implementation

### Files Modified
- `src/utils/emojiMapper.js` - Core emoji mapping logic
- `src/components/PlantTypes/AddPlantTypeModal.js` - Add plant type form
- `src/components/PlantTypes/EditPlantTypeModal.js` - Edit plant type form

### Key Functions
- `findPlantEmoji(plantName, category)` - Main emoji selection logic
- `getDefaultEmoji(category)` - Category-specific defaults
- `getEmojisByCategory(category)` - Category-filtered emoji lists

### React Hooks Used
- `useEffect` for auto-updating emoji when name/category changes
- `useState` for managing emoji grid state

## Testing

You can test the emoji mapping functionality by running:
```javascript
// In browser console
import('./utils/testEmojiMapper.js').then(module => {
  module.default();
});
```

This will run comprehensive tests on the emoji mapping system and show results in the console.

## Benefits

1. **Improved UX**: Users don't need to manually search for appropriate emojis
2. **Consistency**: Ensures plant types have relevant emojis
3. **Efficiency**: Reduces time spent on emoji selection
4. **Flexibility**: Still allows manual override when needed
5. **Category Awareness**: Shows relevant emojis based on plant category
