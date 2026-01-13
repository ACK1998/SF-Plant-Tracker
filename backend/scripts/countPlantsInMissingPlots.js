const fs = require('fs');
const path = require('path');

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

function countPlantsInPlots(csvPath, plotNumbers) {
  const rows = parseCSV(csvPath);
  const results = {};
  
  for (const plotNum of plotNumbers) {
    results[plotNum] = {
      total: 0,
      byPlant: {}
    };
  }
  
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
        for (const plotNum of plotNumbers) {
          const plotIdx = plotNum - 1;
          const colIndex = plotIdx + 2;
          if (colIndex < row.length) {
            const countStr = (row[colIndex] || '').toString().trim();
            let count = 0;
            if (countStr && countStr !== '0' && /^\d+$/.test(countStr)) {
              count = parseInt(countStr, 10);
            }
            if (count > 0) {
              results[plotNum].total += count;
              results[plotNum].byPlant[plantType] = (results[plotNum].byPlant[plantType] || 0) + count;
            }
          }
        }
      }
    } else if (col1 && currentCategory) {
      const plantType = col1;
      for (const plotNum of plotNumbers) {
        const plotIdx = plotNum - 1;
        const colIndex = plotIdx + 2;
        if (colIndex < row.length) {
          const countStr = (row[colIndex] || '').toString().trim();
          let count = 0;
          if (countStr && countStr !== '0' && /^\d+$/.test(countStr)) {
            count = parseInt(countStr, 10);
          }
          if (count > 0) {
            results[plotNum].total += count;
            results[plotNum].byPlant[plantType] = (results[plotNum].byPlant[plantType] || 0) + count;
          }
        }
      }
    }
  }
  
  return results;
}

const csvPath = path.join(process.env.HOME || process.env.USERPROFILE || '', 'Downloads/Plants Data-Softaware - SF1.csv');
const missingPlots = [218, 285, 290];

console.log(`📖 Analyzing plants in missing plots: ${missingPlots.join(', ')}\n`);

if (!fs.existsSync(csvPath)) {
  console.error(`❌ CSV file not found at: ${csvPath}`);
  process.exit(1);
}

const results = countPlantsInPlots(csvPath, missingPlots);

console.log('📊 PLANTS IN MISSING PLOTS:\n');
for (const plotNum of missingPlots) {
  const data = results[plotNum];
  console.log(`Plot ${plotNum}:`);
  console.log(`   Total plants: ${data.total}`);
  if (data.total > 0) {
    console.log(`   By plant type:`);
    const sortedPlants = Object.entries(data.byPlant)
      .sort((a, b) => b[1] - a[1]);
    sortedPlants.forEach(([plant, count]) => {
      console.log(`     - ${plant}: ${count}`);
    });
  }
  console.log('');
}

const totalMissing = missingPlots.reduce((sum, plotNum) => sum + results[plotNum].total, 0);
console.log(`📊 Total plants in missing plots: ${totalMissing}`);

