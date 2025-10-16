import { findPlantEmoji, getDefaultEmoji, getEmojisByCategory } from './emojiMapper';

// Test the emoji mapping functionality
function testEmojiMapper() {
  console.log('🧪 Testing Emoji Mapper...\n');

  // Test direct matches
  const testCases = [
    { name: 'Tomato', category: 'vegetable', expected: '🍅' },
    { name: 'Basil', category: 'herb', expected: '🌿' },
    { name: 'Apple', category: 'fruit', expected: '🍎' },
    { name: 'Oak', category: 'tree', expected: '🌳' },
    { name: 'Wheat', category: 'grain', expected: '🌾' },
    { name: 'Lentil', category: 'legume', expected: '🫘' },
  ];

  console.log('📋 Testing Direct Matches:');
  testCases.forEach(test => {
    const result = findPlantEmoji(test.name, test.category);
    const status = result === test.expected ? '✅' : '❌';
    console.log(`${status} "${test.name}" (${test.category}) → ${result} (expected: ${test.expected})`);
  });

  // Test variations
  console.log('\n📋 Testing Variations:');
  const variations = [
    { name: 'Tomatoes', category: 'vegetable', expected: '🍅' },
    { name: 'Bell Pepper', category: 'vegetable', expected: '🫑' },
    { name: 'Apple Tree', category: 'tree', expected: '🍎' },
    { name: 'Cherry Tree', category: 'tree', expected: '🌸' },
  ];

  variations.forEach(test => {
    const result = findPlantEmoji(test.name, test.category);
    const status = result === test.expected ? '✅' : '❌';
    console.log(`${status} "${test.name}" (${test.category}) → ${result} (expected: ${test.expected})`);
  });

  // Test unknown plants
  console.log('\n📋 Testing Unknown Plants (should use default):');
  const unknownPlants = [
    { name: 'Unknown Plant', category: 'vegetable', expected: '🥕' },
    { name: 'Mystery Herb', category: 'herb', expected: '🌿' },
    { name: 'Strange Fruit', category: 'fruit', expected: '🍎' },
  ];

  unknownPlants.forEach(test => {
    const result = findPlantEmoji(test.name, test.category);
    const status = result === test.expected ? '✅' : '❌';
    console.log(`${status} "${test.name}" (${test.category}) → ${result} (expected: ${test.expected})`);
  });

  // Test category-specific emojis
  console.log('\n📋 Testing Category-Specific Emojis:');
  const categories = ['vegetable', 'herb', 'fruit', 'tree', 'grain', 'legume'];
  categories.forEach(category => {
    const emojis = getEmojisByCategory(category);
    console.log(`${category}: ${emojis.join(' ')}`);
  });

  console.log('\n✅ Emoji Mapper Test Complete!');
}

// Run the test if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  window.testEmojiMapper = testEmojiMapper;
} else {
  // Node.js environment
  testEmojiMapper();
}

export default testEmojiMapper;
