const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const Plant = require('../models/Plant');
const Domain = require('../models/Domain');
const Plot = require('../models/Plot');
const fs = require('fs');
const path = require('path');

// Read and parse CSV file
function parseCSV(csvPath) {
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
}

// Generate plant data from CSV
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

async function findMissingSF1Plants() {
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
    console.log('✅ Found domain:', domain.name);

    // Read CSV
    const csvPath = path.join(process.env.HOME || process.env.USERPROFILE || '', 'Downloads/Plants Data-Softaware - SF1.csv');
    console.log(`\n📖 Reading CSV file from: ${csvPath}`);
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found at: ${csvPath}`);
    }

    const csvPlantData = generatePlantDataFromCSV(csvPath);
    console.log(`✅ Parsed ${csvPlantData.length} plants from CSV`);

    // Get all existing plants grouped by plot and type
    const existingPlants = await Plant.find({
      domainId: domain._id,
      isActive: true
    }).select('name type plotId');

    const existingMap = new Map();
    for (const plant of existingPlants) {
      const key = `${plant.plotId}_${plant.type}_${plant.name}`;
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
    const missingByPlot = new Map();

    for (const plantInfo of csvPlantData) {
      const plot = plotMap.get(plantInfo.plot);
      if (!plot) {
        continue; // Skip if plot doesn't exist
      }

      // Check if plant exists
      const key = `${plot._id}_${plantInfo.type}_${plantInfo.name}`;
      if (!existingMap.has(key)) {
        missingPlants.push({
          ...plantInfo,
          plotId: plot._id,
          plotName: plot.name
        });

        const count = missingByPlot.get(plantInfo.plot) || 0;
        missingByPlot.set(plantInfo.plot, count + 1);
      }
    }

    console.log(`\n📊 MISSING PLANTS ANALYSIS:`);
    console.log(`   Total missing: ${missingPlants.length} plants`);
    console.log(`   Plots with missing plants: ${missingByPlot.size}\n`);

    if (missingByPlot.size > 0) {
      console.log(`📋 Missing plants by plot:`);
      const sortedPlots = Array.from(missingByPlot.entries())
        .sort((a, b) => b[1] - a[1]);
      
      sortedPlots.forEach(([plotNum, count]) => {
        const plot = plotMap.get(plotNum);
        console.log(`   Plot ${plotNum} (${plot ? plot.name : 'NOT FOUND'}): ${count} plants`);
      });
    }

    // Show sample missing plants
    if (missingPlants.length > 0) {
      console.log(`\n📋 Sample missing plants (first 20):`);
      missingPlants.slice(0, 20).forEach(plant => {
        console.log(`   ${plant.name} (${plant.type}) in Plot ${plant.plot} (${plant.plotName})`);
      });
    }

    await mongoose.connection.close();
    
    return {
      totalMissing: missingPlants.length,
      missingPlants: missingPlants,
      missingByPlot: Array.from(missingByPlot.entries())
    };

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

if (require.main === module) {
  findMissingSF1Plants();
}

module.exports = findMissingSF1Plants;

