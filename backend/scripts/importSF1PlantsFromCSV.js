const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const Plot = require('../models/Plot');
const Domain = require('../models/Domain');
const User = require('../models/User');
const Plant = require('../models/Plant');
const fs = require('fs');
const path = require('path');

// Read and parse CSV file
function parseCSV(csvPath) {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Parse CSV lines (handle quoted fields)
  const rows = [];
  for (const line of lines) {
    const row = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    row.push(currentField.trim());
    rows.push(row);
  }
  
  return rows;
}

// Generate plant data from CSV
function generatePlantDataFromCSV(csvPath) {
  const rows = parseCSV(csvPath);
  
  // Row 0: Headers (SF1, Plot No -->, 1, 2, 3, ..., 300)
  // Row 1: Date row (empty, Date -->, dates for plots 1-300)
  // Row 2+: Plant data rows
  
  const dates = []; // dates[0] = plot 1, dates[1] = plot 2, etc.
  const dateRow = rows[1]; // Second row (index 1) contains dates
  
  // Extract dates for plots 1-300 (columns 2-301, indices 2-301)
  let lastValidDate = null;
  for (let i = 2; i <= 301; i++) {
    const dateStr = (dateRow[i] || '').toString().trim();
    // Only accept valid date format (DD/MM or DD/MM/YYYY), skip invalid values
    if (dateStr && /^\d{1,2}\/\d{1,2}/.test(dateStr) && !/^\d{3,}/.test(dateStr)) {
      dates.push(dateStr);
      lastValidDate = dateStr;
    } else if (lastValidDate) {
      // Use last valid date if current is empty/invalid
      dates.push(lastValidDate);
    } else {
      dates.push(null); // No date available
    }
  }
  
  const plantData = [];
  const categoryMap = {
    'Fruit Plants': 'Fruit Plants',
    'Timber Plants': 'Timber Plants',
    'Plantation & Spices Plants': 'Plantation & Spices Plants',
    'Shade Plants': 'Shade Plants'
  };
  
  let currentCategory = null;
  
  // Process plant rows (starting from row 2, index 2)
  for (let rowIdx = 2; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx];
    if (!row || row.length < 2) continue;
    
    const col0 = (row[0] || '').toString().trim();
    const col1 = (row[1] || '').toString().trim();
    
    // Check if this is a category row
    if (categoryMap[col0]) {
      currentCategory = categoryMap[col0];
      // If col1 also has a plant name, process it
      if (col1 && !categoryMap[col1]) {
        const plantType = col1;
        // Process counts for this plant type (columns 2-301 for plots 1-300)
        for (let plotIdx = 0; plotIdx < 300; plotIdx++) {
          const plotNum = plotIdx + 1;
          
          const countStr = (row[plotIdx + 2] || '').toString().trim();
          // Treat empty strings and "0" as 0, only process if it's a number > 0
          let count = 0;
          if (countStr && countStr !== '0' && /^\d+$/.test(countStr)) {
            count = parseInt(countStr, 10);
          }
          
          if (!isNaN(count) && count > 0) {
            const date = dates[plotIdx];
            // Generate individual plant entries
            for (let i = 1; i <= count; i++) {
              plantData.push({
                name: `${plantType} ${i}`,
                type: plantType,
                plot: plotNum,
                category: currentCategory,
                plantedDate: date
              });
            }
          }
        }
      }
    } else if (col1 && currentCategory) {
      // This is a plant row with plant type in col1, category from previous
      const plantType = col1;
      for (let plotIdx = 0; plotIdx < 300; plotIdx++) {
        const plotNum = plotIdx + 1;
        
        const countStr = (row[plotIdx + 2] || '').toString().trim();
        // Treat empty strings and "0" as 0
        let count = 0;
        if (countStr && countStr !== '0' && /^\d+$/.test(countStr)) {
          count = parseInt(countStr, 10);
        }
        
        if (!isNaN(count) && count > 0) {
          const date = dates[plotIdx];
          for (let i = 1; i <= count; i++) {
            plantData.push({
              name: `${plantType} ${i}`,
              type: plantType,
              plot: plotNum,
              category: currentCategory,
              plantedDate: date
            });
          }
        }
      }
    }
  }
  
  return plantData;
}

// Emoji mapping for plant types
const plantEmojiMap = {
  'mango': '🥭', 'mangoes': '🥭',
  'lemon': '🍋', 'lemons': '🍋',
  'mosambi': '🍋', 'sweet lime': '🍋',
  'jamun': '🫐', 'java plum': '🫐',
  'gooseberry': '🫐', 'amla': '🫐',
  'dragonfruit': '🍈', 'dragon fruit': '🍈',
  'fig': '🫘',
  'bread fruit': '🍞', 'breadfruit': '🍞',
  'sapota': '🍈', 'sapodilla': '🍈',
  'water apple': '🍎', 'waterapple': '🍎',
  'guava': '🍈',
  'starfruit': '⭐', 'star fruit': '⭐',
  'banana': '🍌', 'bananas': '🍌',
  'papaya': '🍈', 'papayas': '🍈',
  'mahogany': '🌳',
  'coconut': '🥥', 'coconuts': '🥥',
  'moringa': '🌿',
  'silver oak': '🌳', 'silveroak': '🌳',
  'cashew': '🌰', 'cashews': '🌰',
  'tamarind': '🫘',
  'mulberry': '🍈',
  'jackfruit': '🍈',
  'custard apple': '🍈',
  'cherry': '🍒', 'cherries': '🍒',
  'avocado': '🥑', 'avocados': '🥑',
  'neem': '🌳',
  'pomegranate': '🍈',
  'soursop': '🍈', 'soursoap': '🍈',
  'bamboo': '🎋',
  'pepper': '🌶️', 'peppers': '🌶️',
  'orange': '🍊', 'oranges': '🍊',
  'ber': '🫐',
  'teak': '🌳',
  'rosewood': '🌳',
  'litchi': '🍈', 'lychee': '🍈',
  'arecanut': '🌰', 'areca nut': '🌰', 'areca': '🌰',
  'rose apple': '🍎', 'roseapple': '🍎',
  'pungam': '🌳',
  'singapore cherry': '🍒',
  'curry leaves': '🌿', 'curryleaves': '🌿',
  'tapioca': '🌿',
  'betel nuts': '🌰',
  'cinnamon': '🌿',
  'mehandi': '🌿',
  'senna': '🌿',
  'laurel': '🌳',
  'albizia amara': '🌳',
  'longkong': '🍈',
  'neolamarckia': '🌳',
  'agathi keerai': '🌿',
  'murungai': '🌿',
  'cascara buckthorn': '🌳',
  'christmas': '🌳',
  'gulmohar': '🌳',
  'malabar neam': '🌳',
  'milk wood': '🌳',
  'naval': '🌳',
  'indian almond': '🌳',
  'tebubia': '🌳',
  'rambha': '🌿',
};

// Function to find emoji for plant type
function findPlantEmoji(plantType, category) {
  if (!plantType) return getDefaultEmoji(category);
  
  const normalizedType = plantType.toLowerCase().trim();
  
  // Direct match
  if (plantEmojiMap[normalizedType]) {
    return plantEmojiMap[normalizedType];
  }
  
  // Partial match - check if any word in the plant type matches
  const words = normalizedType.split(/\s+/);
  for (const word of words) {
    if (plantEmojiMap[word]) {
      return plantEmojiMap[word];
    }
  }
  
  // Check for common variations
  const variations = [
    normalizedType.replace(/s$/, ''), // Remove plural 's'
    normalizedType + 's', // Add plural 's'
    normalizedType.replace(/tree$/, ''), // Remove 'tree' suffix
    normalizedType.replace(/plant$/, ''), // Remove 'plant' suffix
  ];
  
  for (const variation of variations) {
    if (plantEmojiMap[variation]) {
      return plantEmojiMap[variation];
    }
  }
  
  // If no match found, return default emoji for the category
  return getDefaultEmoji(category);
}

// Function to get default emoji by category
function getDefaultEmoji(category) {
  const defaultEmojis = {
    'fruit': '🍎',
    'tree': '🌳',
    'plant': '🌱',
    'vegetable': '🥕',
    'herb': '🌿',
    'grain': '🌾',
    'legume': '🫘'
  };
  
  return defaultEmojis[category] || '🌱';
}

// Function to map category string to enum value
function mapCategory(categoryStr, plantType) {
  if (!categoryStr || categoryStr === 'N/A' || categoryStr.trim() === '') {
    // Check if plant type should be a tree
    const treeTypes = ['tamarind', 'silver oak', 'silveroak', 'moringa', 'coconut', 'cashew', 'bread fruit', 'breadfruit', 'pungam', 'singapore cherry', 'neem', 'teak', 'rosewood', 'bamboo', 'naval', 'malabar neam', 'gulmohar', 'tebubia', 'indian almond', 'mahogany', 'laurel', 'albizia amara', 'neolamarckia', 'cascara buckthorn', 'christmas', 'milk wood', 'rose apple', 'roseapple'];
    const plantTypeLower = (plantType || '').toLowerCase().trim();
    if (treeTypes.some(treeType => plantTypeLower.includes(treeType.toLowerCase()))) {
      return 'tree';
    }
    return 'plant';
  }
  
  const categoryLower = categoryStr.toLowerCase();
  
  if (categoryLower.includes('fruit')) {
    return 'fruit';
  } else if (categoryLower.includes('timber')) {
    return 'tree';
  } else if (categoryLower.includes('shade')) {
    return 'tree';
  } else if (categoryLower.includes('plantation') || categoryLower.includes('spices')) {
    // Check if plant type should be a tree even if category says plantation/spices
    const treeTypes = ['tamarind', 'silver oak', 'silveroak', 'moringa', 'coconut', 'cashew', 'bread fruit', 'breadfruit', 'pungam', 'singapore cherry', 'neem', 'teak', 'rosewood', 'bamboo', 'naval', 'malabar neam', 'gulmohar', 'tebubia', 'indian almond', 'mahogany', 'laurel', 'albizia amara', 'neolamarckia', 'cascara buckthorn', 'christmas', 'milk wood', 'rose apple', 'roseapple'];
    const plantTypeLower = (plantType || '').toLowerCase().trim();
    if (treeTypes.some(treeType => plantTypeLower.includes(treeType.toLowerCase()))) {
      return 'tree';
    }
    return 'plant';
  }
  
  return 'plant'; // Default
}

// Function to parse date string (format: DD/MM or DD/MM/YYYY)
function parsePlantedDate(dateStr) {
  if (!dateStr || dateStr === 'N/A' || dateStr.trim() === '') {
    return null;
  }
  
  try {
    // Parse date in format DD/MM or DD/MM/YYYY (assume current year if year missing)
    const parts = dateStr.split('/');
    if (parts.length >= 2) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JS Date
      const year = parts.length === 3 ? parseInt(parts[2], 10) : new Date().getFullYear();
      return new Date(year, month, day);
    }
  } catch (error) {
    console.error(`Error parsing date "${dateStr}":`, error);
  }
  
  return null;
}

// Function to generate random offset for coordinates (±0.0001 degrees)
function getRandomOffset() {
  return (Math.random() - 0.5) * 0.0002; // Range: -0.0001 to +0.0001
}

// Function to find plot owner (user with plotIds containing the plot)
async function findPlotOwner(plotId) {
  try {
    // Find users with plotIds containing this plot
    const user = await User.findOne({
      plotIds: plotId,
      isActive: true
    });
    
    if (user) {
      return {
        _id: user._id,
        name: `${user.firstName} ${user.lastName}`.trim() || user.username
      };
    }
    
    // Fallback: use plot's createdBy
    const plot = await Plot.findById(plotId).populate('createdBy', 'firstName lastName username');
    if (plot && plot.createdBy) {
      return {
        _id: plot.createdBy._id,
        name: `${plot.createdBy.firstName || ''} ${plot.createdBy.lastName || ''}`.trim() || plot.createdBy.username
      };
    }
    
    // Final fallback: get any admin user
    const adminUser = await User.findOne({ 
      role: { $in: ['super_admin', 'org_admin'] },
      isActive: true 
    });
    
    if (adminUser) {
      return {
        _id: adminUser._id,
        name: `${adminUser.firstName || ''} ${adminUser.lastName || ''}`.trim() || adminUser.username
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error finding plot owner for plot ${plotId}:`, error);
    return null;
  }
}

async function importSF1PlantsFromCSV() {
  try {
    // Connect to database
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get the SF1 domain
    const domain = await Domain.findOne({ name: 'SF1' });
    if (!domain) {
      throw new Error('SF1 domain not found. Please create it first.');
    }
    console.log('✅ Found domain:', domain.name, `(${domain._id})`);

    // Get organizationId from domain
    const organizationId = domain.organizationId;
    if (!organizationId) {
      throw new Error('SF1 domain does not have an organizationId.');
    }
    console.log('✅ Organization ID:', organizationId);

    // Read CSV file
    const csvPath = path.join(process.env.HOME || process.env.USERPROFILE || '', 'Downloads/Plants Data-Softaware - SF1.csv');
    console.log(`\n📖 Reading CSV file from: ${csvPath}`);
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found at: ${csvPath}`);
    }

    const plantData = generatePlantDataFromCSV(csvPath);
    console.log(`✅ Parsed ${plantData.length} plants from CSV`);

    // Get all plots in SF1 domain
    const allSF1Plots = await Plot.find({ 
      domainId: domain._id,
      isActive: true 
    }).select('name _id');
    
    console.log(`\n📋 Found ${allSF1Plots.length} active plots in SF1 domain`);
    
    // Create a map of plot numbers to plot objects
    const plotMap = new Map();
    
    for (const plot of allSF1Plots) {
      // Extract plot number from name (e.g., "Plot 8" -> 8, "Plot 10" -> 10)
      const match = plot.name.match(/Plot\s*(\d+)/i);
      if (match) {
        const plotNum = parseInt(match[1], 10);
        plotMap.set(plotNum, plot);
      }
    }
    
    console.log(`✅ Mapped ${plotMap.size} plots by number`);

    if (plotMap.size === 0) {
      throw new Error('No plots found for SF1 domain. Please create plots first.');
    }

    console.log(`\n📊 Processing ${plantData.length} plants...\n`);

    let created = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails = [];
    const plotCounts = new Map();

    // Process each plant
    for (const plantInfo of plantData) {
      try {
        const plot = plotMap.get(plantInfo.plot);
        
        if (!plot) {
          skipped++;
          if (skipped <= 20) {
            console.log(`⏭️  Skipping ${plantInfo.name} - Plot ${plantInfo.plot} not found`);
          }
          continue;
        }

        // Check if plant already exists (account for emoji in name)
        // Plant names in DB have format: "🥭 Mango 1", CSV has "Mango 1"
        const plantNameWithoutEmoji = plantInfo.name;
        const existingPlant = await Plant.findOne({
          $or: [
            { name: plantNameWithoutEmoji, type: plantInfo.type, plotId: plot._id, domainId: domain._id, isActive: true },
            { name: { $regex: new RegExp(plantNameWithoutEmoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }, type: plantInfo.type, plotId: plot._id, domainId: domain._id, isActive: true }
          ]
        });

        if (existingPlant) {
          skipped++;
          continue;
        }

        // Find plot owner
        const plotOwner = await findPlotOwner(plot._id);
        if (!plotOwner) {
          skipped++;
          continue;
        }

        // Map category
        const category = mapCategory(plantInfo.category, plantInfo.type);

        // Get emoji
        const emoji = findPlantEmoji(plantInfo.type, category);

        // Generate coordinates with small random offset
        let latitude = null;
        let longitude = null;
        
        if (plot.latitude && plot.longitude) {
          latitude = plot.latitude + getRandomOffset();
          longitude = plot.longitude + getRandomOffset();
          
          // Ensure coordinates are within valid ranges
          latitude = Math.max(-90, Math.min(90, latitude));
          longitude = Math.max(-180, Math.min(180, longitude));
        } else if (domain.latitude && domain.longitude) {
          // Fallback to domain coordinates if plot doesn't have them
          latitude = domain.latitude + getRandomOffset();
          longitude = domain.longitude + getRandomOffset();
          
          latitude = Math.max(-90, Math.min(90, latitude));
          longitude = Math.max(-180, Math.min(180, longitude));
        }

        // Create plant name with emoji
        const plantName = `${emoji} ${plantInfo.name}`;

        // Parse planted date if provided
        let plantedDate = new Date(); // Default to today
        if (plantInfo.plantedDate) {
          const parsedDate = parsePlantedDate(plantInfo.plantedDate);
          if (parsedDate) {
            plantedDate = parsedDate;
          }
        }

        // Create plant data
        const plantDataObj = {
          name: plantName,
          type: plantInfo.type,
          category: category,
          plotId: plot._id,
          domainId: domain._id,
          organizationId: organizationId,
          plantedDate: plantedDate,
          plantedBy: plotOwner._id,
          planter: plotOwner.name,
          health: 'excellent',
          growthStage: 'flowering',
          isActive: true,
          latitude: latitude,
          longitude: longitude,
          statusHistory: [{
            date: plantedDate,
            status: 'planted',
            health: 'excellent',
            growthStage: 'flowering',
            notes: 'Created via SF1 plant data import script from CSV',
            updatedBy: plotOwner._id,
          }]
        };

        // Create the plant
        const plant = new Plant(plantDataObj);
        await plant.save();

        created++;
        
        // Track plot counts
        const currentCount = plotCounts.get(plantInfo.plot) || 0;
        plotCounts.set(plantInfo.plot, currentCount + 1);
        
        if (created % 100 === 0) {
          console.log(`✅ Created ${created} plants...`);
        }

      } catch (error) {
        errors++;
        const errorMsg = `Error creating ${plantInfo.name} in Plot ${plantInfo.plot}: ${error.message}`;
        if (errors <= 10) {
          console.error(`❌ ${errorMsg}`);
        }
        errorDetails.push({
          plant: plantInfo.name,
          plot: plantInfo.plot,
          error: error.message
        });
      }
    }

    console.log(`\n✅ Script completed!`);
    console.log(`   Created: ${created} plants`);
    console.log(`   Skipped: ${skipped} plants`);
    console.log(`   Errors: ${errors} plants`);
    
    if (errorDetails.length > 0 && errorDetails.length <= 20) {
      console.log(`\n❌ Error Details:`);
      errorDetails.forEach(detail => {
        console.log(`   - ${detail.plant} (Plot ${detail.plot}): ${detail.error}`);
      });
    } else if (errorDetails.length > 20) {
      console.log(`\n❌ First 20 Errors:`);
      errorDetails.slice(0, 20).forEach(detail => {
        console.log(`   - ${detail.plant} (Plot ${detail.plot}): ${detail.error}`);
      });
    }

    // Summary by plot (top 20)
    console.log(`\n📊 Summary by Plot (top 20):`);
    const sortedPlots = Array.from(plotCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
    sortedPlots.forEach(([plotNum, count]) => {
      console.log(`   Plot ${plotNum}: ${count} plants`);
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error importing SF1 plants:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  importSF1PlantsFromCSV();
}

module.exports = importSF1PlantsFromCSV;


