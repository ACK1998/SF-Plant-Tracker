const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const Plot = require('../models/Plot');
const Domain = require('../models/Domain');

// Plot sizes for plots 1-176 (in square feet)
// NA values will be skipped (not updated)
const plotSizes = [
  11156,   // Plot 1
  10020,   // Plot 2
  10020,   // Plot 3
  10018,   // Plot 4
  10016,   // Plot 5
  10020,   // Plot 6
  10020,   // Plot 7
  10021,   // Plot 8
  10782,   // Plot 9
  16735,   // Plot 10
  10030,   // Plot 11
  10208,   // Plot 12
  14846,   // Plot 13
  10017,   // Plot 14
  10017,   // Plot 15
  10017.86,// Plot 16
  10017,   // Plot 17
  10017,   // Plot 18
  10017,   // Plot 19
  10017,   // Plot 20
  10017,   // Plot 21
  12051,   // Plot 22
  10018,   // Plot 23
  10017,   // Plot 24
  10019,   // Plot 25
  10017,   // Plot 26
  10017,   // Plot 27
  10017,   // Plot 28
  10017,   // Plot 29
  10017,   // Plot 30
  10017,   // Plot 31
  10016,   // Plot 32
  10018,   // Plot 33
  10362,   // Plot 34
  10018,   // Plot 35
  10875,   // Plot 36
  10016,   // Plot 37
  17142,   // Plot 38
  10020,   // Plot 39
  10020,   // Plot 40
  11322,   // Plot 41
  10017,   // Plot 42
  10017,   // Plot 43
  10017,   // Plot 44
  10019,   // Plot 45
  10018,   // Plot 46
  10530,   // Plot 47
  12489,   // Plot 48
  12349,   // Plot 49
  10016,   // Plot 50
  10031,   // Plot 51
  104077,  // Plot 52
  11947,   // Plot 53
  10041,   // Plot 54
  10022,   // Plot 55
  10051,   // Plot 56
  'NA',    // Plot 57
  10018,   // Plot 58
  10019,   // Plot 59
  10022,   // Plot 60
  10028,   // Plot 61
  10016,   // Plot 62
  10015,   // Plot 63
  10047,   // Plot 64
  10028,   // Plot 65
  10055,   // Plot 66
  12800,   // Plot 67
  10059,   // Plot 68
  10019,   // Plot 69
  10023,   // Plot 70
  10032,   // Plot 71
  10107,   // Plot 72
  11659,   // Plot 73
  10027,   // Plot 74
  10026,   // Plot 75
  10016,   // Plot 76
  10022,   // Plot 77
  10664,   // Plot 78
  10086,   // Plot 79
  10098,   // Plot 80
  10021,   // Plot 81
  11890,   // Plot 82
  'NA',    // Plot 83
  'NA',    // Plot 84
  17801,   // Plot 85
  10046,   // Plot 86
  10019,   // Plot 87
  10017,   // Plot 88
  10028,   // Plot 89
  10019,   // Plot 90
  10022,   // Plot 91
  10063,   // Plot 92
  10017,   // Plot 93
  10019,   // Plot 94
  15625,   // Plot 95
  10010,   // Plot 96
  10387,   // Plot 97
  16036,   // Plot 98
  16041,   // Plot 99
  10228,   // Plot 100
  10010,   // Plot 101
  10010,   // Plot 102
  7934,    // Plot 103
  10026,   // Plot 104
  10024,   // Plot 105
  12442,   // Plot 106
  14726,   // Plot 107
  10034,   // Plot 108
  12187,   // Plot 109
  11808,   // Plot 110
  10017,   // Plot 111
  10017,   // Plot 112
  10017,   // Plot 113
  10017,   // Plot 114
  10017,   // Plot 115
  10017,   // Plot 116
  10017,   // Plot 117
  10738,   // Plot 118
  10108,   // Plot 119
  10017,   // Plot 120
  10022,   // Plot 121
  10136,   // Plot 122
  11431,   // Plot 123
  13187,   // Plot 124
  14000,   // Plot 125
  10006,   // Plot 126
  10000,   // Plot 127
  14222,   // Plot 128
  11352,   // Plot 129
  10589,   // Plot 130
  10021,   // Plot 131
  7516,    // Plot 132
  7515,    // Plot 133
  10016,   // Plot 134
  10020,   // Plot 135
  10019,   // Plot 136
  13952,   // Plot 137
  10206,   // Plot 138
  10020,   // Plot 139
  10018,   // Plot 140
  9434,    // Plot 141
  9435,    // Plot 142
  10021,   // Plot 143
  10021,   // Plot 144
  10921,   // Plot 145
  9783,    // Plot 146
  'NA',    // Plot 147
  9963,    // Plot 148
  10019,   // Plot 149
  9348,    // Plot 150
  10019,   // Plot 151
  10019,   // Plot 152
  9302,    // Plot 153
  10006,   // Plot 154
  10001,   // Plot 155
  9812,    // Plot 156
  10006,   // Plot 157
  10006,   // Plot 158
  10006,   // Plot 159
  9473,    // Plot 160
  9370,    // Plot 161
  9420,    // Plot 162
  9591,    // Plot 163
  10010,   // Plot 164
  10031,   // Plot 165
  10302,   // Plot 166
  10308,   // Plot 167
  10005,   // Plot 168
  10000,   // Plot 169
  10008,   // Plot 170
  10008,   // Plot 171
  10008,   // Plot 172
  10008,   // Plot 173
  10008,   // Plot 174
  10008,   // Plot 175
  16325    // Plot 176
];

async function updateSF4PlotSizes() {
  try {
    // Connect to database
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get the SF4 domain
    const domain = await Domain.findOne({ name: 'SF4' });
    if (!domain) {
      throw new Error('SF4 domain not found. Please create it first.');
    }
    console.log('✅ Found domain:', domain.name, `(${domain._id})`);

    // Get all SF4 plots, sorted by plot number
    const plots = await Plot.find({ domainId: domain._id })
      .sort({ name: 1 }); // Sort by name (Plot 1, Plot 2, etc.)

    if (plots.length === 0) {
      throw new Error('No plots found for SF4 domain.');
    }

    console.log(`✅ Found ${plots.length} plots for SF4`);
    console.log(`📊 Will update sizes for plots 1-${plotSizes.length}\n`);

    let updated = 0;
    let skipped = 0;
    let notFound = 0;

    // Update plot sizes
    for (let i = 0; i < plotSizes.length; i++) {
      const plotNumber = i + 1;
      const plotName = `Plot ${plotNumber}`;
      const sizeValue = plotSizes[i];

      // Find the plot
      const plot = plots.find(p => p.name === plotName);

      if (!plot) {
        console.log(`⚠️  ${plotName} not found - skipping`);
        notFound++;
        continue;
      }

      // Skip NA values (keep existing size)
      if (sizeValue === 'NA' || sizeValue === null || sizeValue === undefined) {
        console.log(`⏭️  ${plotName} - NA value, keeping existing size: ${plot.size || 'N/A'}`);
        skipped++;
        continue;
      }

      // Update the size (stored in square feet as per model comment)
      const oldSize = plot.size;
      plot.size = Number(sizeValue);
      await plot.save();

      updated++;
      console.log(`✅ ${plotName}: ${oldSize || 'N/A'} → ${plot.size} sq ft`);
    }

    console.log(`\n✅ Script completed!`);
    console.log(`   Updated: ${updated} plots`);
    console.log(`   Skipped: ${skipped} plots (NA values)`);
    console.log(`   Not found: ${notFound} plots`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error updating plot sizes:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
updateSF4PlotSizes();

