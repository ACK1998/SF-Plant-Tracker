const axios = require('axios');

async function testAPI() {
  try {
    console.log('🧪 Testing Plant API with new changes...');
    console.log('');

    // You'll need to replace this with a valid token from your application
    const token = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token
    
    const response = await axios.get('http://localhost:5001/api/plants?page=1&limit=50', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ API Response:');
    console.log(`Status: ${response.status}`);
    console.log(`Total Plants: ${response.data.pagination.totalItems}`);
    console.log(`Plants Returned: ${response.data.data.length}`);
    console.log('');

    // Check if editable flag is present
    const hasEditableFlag = response.data.data.every(plant => 'editable' in plant);
    console.log(`Editable flag present: ${hasEditableFlag ? '✅' : '❌'}`);

    // Check plantedBy format
    const samplePlant = response.data.data[0];
    if (samplePlant) {
      console.log('📋 Sample Plant:');
      console.log(`   Name: ${samplePlant.name}`);
      console.log(`   Editable: ${samplePlant.editable}`);
      console.log(`   Planted By: ${samplePlant.plantedBy?.firstName || 'N/A'}`);
      console.log(`   Plot: ${samplePlant.plotId?.name || 'N/A'}`);
    }

  } catch (error) {
    console.error('❌ Error testing API:', error.response?.data || error.message);
    console.log('');
    console.log('💡 To test with a real token:');
    console.log('1. Login to your application');
    console.log('2. Get the JWT token from browser dev tools');
    console.log('3. Replace YOUR_JWT_TOKEN_HERE with the actual token');
  }
}

// Run the test
testAPI();
