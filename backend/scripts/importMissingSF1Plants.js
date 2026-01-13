const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const Plot = require('../models/Plot');
const Domain = require('../models/Domain');
const User = require('../models/User');
const Plant = require('../models/Plant');
const fs = require('fs');
const path = require('path');

// Import helper functions from the main import script
const parseCSV = require('./importSF1PlantsFromCSV').parseCSV || function(csvPath) {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
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
};

// Generate plant data from CSV (same as import script)
function generatePlantDataFromCSV(csvPath) {
  const rows = parseCSV(csvPath);
  const dates = [];
  const dateRow = rows[1];
  
  for (let i = 2; i <= 301; i++) {
    const dateStr = (dateRow[i] || '').toString().trim();
    if (dateStr && /^\d{1,2}\/\d{1,2}/.test(dateStr) && !/^\d{3,}/.test(dateStr)) {
      dates.push(dateStr);
    } else if (dates.length > 0) {
      dates.push(dates[dates.length - 1]);
    } else {
      dates.push(null);
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
  
  for (let rowIdx = 2; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx];
    if (!row || row.length < 2) continue;
    
    const col0 = (row[0] || '').toString().trim();
    const col1 = (row[1] || '').toString().trim();
    
    if (categoryMap[col0]) {
      currentCategory = categoryMap[col0];
      if (col1 && !categoryMap[col1]) {
        const plantType = col1;
        for (let plotIdx = 0; plotIdx < 300; plotIdx++) {
          const plotNum = plotIdx + 1;
          const countStr = (row[plotIdx + 2] || '').toString().trim();
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
    } else if (col1 && currentCategory) {
      const plantType = col1;
      for (let plotIdx = 0; plotIdx < 300; plotIdx++) {
        const plotNum = plotIdx + 1;
        const countStr = (row[plotIdx + 2] || '').toString().trim();
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

// Helper functions (same as import script)
function getRandomOffset() {
  return (Math.random() - 0.5) * 0.0002;
}

function generatePointInPlot(plotLat, plotLng, plotSizeSqFt) {
  if (!plotSizeSqFt || plotSizeSqFt <= 0) {
    const defaultRadiusKm = 0.05;
    const angle = Math.random() * 2 * Math.PI;
    const radius = Math.random() * defaultRadiusKm;
    const lat = plotLat + (radius / 111.32) * Math.cos(angle);
    const lng = plotLng + (radius / (111.32 * Math.cos(plotLat * Math.PI / 180))) * Math.sin(angle);
    return { latitude: lat, longitude: lng };
  }
  
  const areaSqFt = plotSizeSqFt;
  const radiusFt = Math.sqrt(areaSqFt / Math.PI);
  const radiusM = radiusFt * 0.3048;
  const radiusKm = radiusM / 1000;
  
  const angle = Math.random() * 2 * Math.PI;
  const r = Math.sqrt(Math.random()) * radiusKm;
  
  const latOffset = (r / 111.32) * Math.cos(angle);
  const lngOffset = (r / (111.32 * Math.cos(plotLat * Math.PI / 180))) * Math.sin(angle);
  
  const latitude = plotLat + latOffset;
  const longitude = plotLng + lngOffset;
  
  return {
    latitude: Math.max(-90, Math.min(90, latitude)),
    longitude: Math.max(-180, Math.min(180, longitude))
  };
}

function findPlantEmoji(plantType, category) {
  const plantEmojiMap = {
    'mango': '🥭', 'lemon': '🍋', 'mosambi': '🍋', 'jamun': '🫐',
    'gooseberry': '🫐', 'amla': '🫐', 'dragonfruit': '🍈', 'fig': '🫘',
    'sapota': '🍈', 'water apple': '🍎', 'guava': '🍈', 'starfruit': '⭐',
    'banana': '🍌', 'papaya': '🍈', 'mahogany': '🌳', 'coconut': '🥥',
    'moringa': '🌿', 'silveroak': '🌳', 'tamarind': '🫘', 'mulberry': '🍈',
    'jackfruit': '🍈', 'custard apple': '🍈', 'cherry': '🍒', 'avocado': '🥑',
    'neem': '🌳', 'pomegranate': '🍈', 'soursoap': '🍈', 'bamboo': '🎋',
    'pepper': '🌶️', 'orange': '🍊', 'ber': '🫐', 'teak': '🌳',
    'rosewood': '🌳', 'arecanut': '🌰', 'pungam': '🌳', 'singapore cherry': '🍒',
    'curry leaves': '🌿', 'tapioca': '🌿', 'betel nuts': '🌰', 'cinnamon': '🌿',
    'mehandi': '🌿', 'senna': '🌿', 'laurel': '🌳', 'albizia amara': '🌳',
    'longkong': '🍈', 'neolamarckia': '🌳', 'agathi keerai': '🌿',
    'murungai': '🌿', 'cascara buckthorn': '🌳', 'christmas': '🌳',
    'gulmohar': '🌳', 'malabar neam': '🌳', 'milk wood': '🌳', 'naval': '🌳',
    'indian almond': '🌳', 'tebubia': '🌳', 'rambha': '🌿',
  };
  
  const normalizedType = (plantType || '').toLowerCase().trim();
  if (plantEmojiMap[normalizedType]) {
    return plantEmojiMap[normalizedType];
  }
  
  const words = normalizedType.split(/\s+/);
  for (const word of words) {
    if (plantEmojiMap[word]) {
      return plantEmojiMap[word];
    }
  }
  
  const defaultEmojis = {
    'fruit': '🍎', 'tree': '🌳', 'plant': '🌱', 'vegetable': '🥕',
    'herb': '🌿', 'grain': '🌾', 'legume': '🫘'
  };
  return defaultEmojis[category] || '🌱';
}

function mapCategory(categoryStr, plantType) {
  if (!categoryStr || categoryStr === 'N/A' || categoryStr.trim() === '') {
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
    const treeTypes = ['tamarind', 'silver oak', 'silveroak', 'moringa', 'coconut', 'cashew', 'bread fruit', 'breadfruit', 'pungam', 'singapore cherry', 'neem', 'teak', 'rosewood', 'bamboo', 'naval', 'malabar neam', 'gulmohar', 'tebubia', 'indian almond', 'mahogany', 'laurel', 'albizia amara', 'neolamarckia', 'cascara buckthorn', 'christmas', 'milk wood', 'rose apple', 'roseapple'];
    const plantTypeLower = (plantType || '').toLowerCase().trim();
    if (treeTypes.some(treeType => plantTypeLower.includes(treeType.toLowerCase()))) {
      return 'tree';
    }
    return 'plant';
  }
  return 'plant';
}

function parsePlantedDate(dateStr) {
  if (!dateStr || dateStr === 'N/A' || dateStr.trim() === '') {
    return null;
  }
  try {
    const parts = dateStr.split('/');
    if (parts.length >= 2) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parts.length === 3 ? parseInt(parts[2], 10) : new Date().getFullYear();
      return new Date(year, month, day);
    }
  } catch (error) {
    console.error(`Error parsing date "${dateStr}":`, error);
  }
  return null;
}

async function findPlotOwner(plotId) {
  try {
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
    
    const plot = await Plot.findById(plotId).populate('createdBy', 'firstName lastName username');
    if (plot && plot.createdBy) {
      return {
        _id: plot.createdBy._id,
        name: `${plot.createdBy.firstName || ''} ${plot.createdBy.lastName || ''}`.trim() || plot.createdBy.username
      };
    }
    
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

async function importMissingSF1Plants() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    const domain = await Domain.findOne({ name: 'SF1' });
    if (!domain) {
      throw new Error('SF1 domain not found.');
    }
    console.log('✅ Found domain:', domain.name, `(${domain._id})`);

    const organizationId = domain.organizationId;
    if (!organizationId) {
      throw new Error('SF1 domain does not have an organizationId.');
    }

    const csvPath = path.join(process.env.HOME || process.env.USERPROFILE || '', 'Downloads/Plants Data-Softaware - SF1.csv');
    console.log(`\n📖 Reading CSV file from: ${csvPath}`);
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found at: ${csvPath}`);
    }

    const csvPlantData = generatePlantDataFromCSV(csvPath);
    console.log(`✅ Parsed ${csvPlantData.length} plants from CSV`);

    // Get all existing plants - check by type and plot, ignoring emoji in name
    const existingPlants = await Plant.find({
      domainId: domain._id,
      isActive: true
    }).select('name type plotId');

    // Create a map of existing plants: key = "plotId_type_nameWithoutEmoji"
    const existingMap = new Map();
    for (const plant of existingPlants) {
      // Remove emoji from name for comparison (emoji is usually first character or two)
      const nameWithoutEmoji = plant.name.replace(/^[\u{1F300}-\u{1F9FF}]+\s*/u, '').trim();
      const key = `${plant.plotId}_${plant.type}_${nameWithoutEmoji}`;
      existingMap.set(key, true);
    }

    console.log(`✅ Found ${existingPlants.length} existing plants in database`);

    // Get all plots
    const allPlots = await Plot.find({
      domainId: domain._id,
      isActive: true
    });

    const plotMap = new Map();
    for (const plot of allPlots) {
      const match = plot.name.match(/Plot\s*(\d+)/i);
      if (match) {
        const plotNum = parseInt(match[1], 10);
        plotMap.set(plotNum, plot);
      }
    }

    console.log(`✅ Mapped ${plotMap.size} plots by number\n`);

    // Find missing plants
    const missingPlants = [];
    for (const plantInfo of csvPlantData) {
      const plot = plotMap.get(plantInfo.plot);
      if (!plot) {
        continue;
      }

      const key = `${plot._id}_${plantInfo.type}_${plantInfo.name}`;
      if (!existingMap.has(key)) {
        missingPlants.push({
          ...plantInfo,
          plotId: plot._id,
          plot: plot
        });
      }
    }

    console.log(`📊 Found ${missingPlants.length} missing plants to import\n`);

    if (missingPlants.length === 0) {
      console.log('✅ All plants are already imported!');
      await mongoose.connection.close();
      return;
    }

    let created = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails = [];

    console.log(`📊 Processing ${missingPlants.length} missing plants...\n`);

    for (const plantInfo of missingPlants) {
      try {
        const plot = plantInfo.plot;

        const plotOwner = await findPlotOwner(plot._id);
        if (!plotOwner) {
          skipped++;
          continue;
        }

        const category = mapCategory(plantInfo.category, plantInfo.type);
        const emoji = findPlantEmoji(plantInfo.type, category);

        const newLocation = generatePointInPlot(
          plot.latitude,
          plot.longitude,
          plot.size || 0
        );

        const plantName = `${emoji} ${plantInfo.name}`;

        let plantedDate = new Date();
        if (plantInfo.plantedDate) {
          const parsedDate = parsePlantedDate(plantInfo.plantedDate);
          if (parsedDate) {
            plantedDate = parsedDate;
          }
        }

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
          latitude: newLocation.latitude,
          longitude: newLocation.longitude,
          statusHistory: [{
            date: plantedDate,
            status: 'planted',
            health: 'excellent',
            growthStage: 'flowering',
            notes: 'Created via SF1 missing plants import script',
            updatedBy: plotOwner._id,
          }]
        };

        const plant = new Plant(plantDataObj);
        await plant.save();

        created++;
        if (created % 50 === 0) {
          console.log(`✅ Created ${created} plants...`);
        }

      } catch (error) {
        errors++;
        errorDetails.push({
          plant: plantInfo.name,
          plot: plantInfo.plot.name,
          error: error.message
        });
        if (errors <= 10) {
          console.error(`❌ Error creating ${plantInfo.name} in ${plantInfo.plot.name}: ${error.message}`);
        }
      }
    }

    console.log(`\n✅ Script completed!`);
    console.log(`   Created: ${created} plants`);
    console.log(`   Skipped: ${skipped} plants`);
    console.log(`   Errors: ${errors} plants`);

    // Verify final count
    const finalCount = await Plant.countDocuments({
      domainId: domain._id,
      isActive: true
    });
    console.log(`\n📊 Final plant count in SF1: ${finalCount}`);
    console.log(`📊 Expected from CSV: 1797`);
    console.log(`📊 Difference: ${1797 - finalCount} plants`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

if (require.main === module) {
  importMissingSF1Plants();
}

module.exports = importMissingSF1Plants;

