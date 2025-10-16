const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';
let authToken = '';

// Test data
const testPlantType = {
  name: 'Test Tomato',
  category: 'vegetable',
  emoji: '🍅',
  description: 'Test tomato type for CRUD testing'
};

const testPlantVariety = {
  name: 'Test Roma',
  description: 'Test variety for CRUD testing',
  characteristics: {
    color: 'red',
    size: 'medium'
  },
  growingInfo: {
    daysToMaturity: 75,
    height: '4-6 ft'
  }
};

let createdTypeId = '';
let createdVarietyId = '';

async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'superadmin@sanctityferme.com',
      password: 'password123'
    });
    
    if (response.data.success) {
      authToken = response.data.token;
      console.log('✅ Login successful');
      return true;
    } else {
      console.log('❌ Login failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Login error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testPlantTypesCRUD() {
  console.log('\n🌱 Testing Plant Types CRUD Operations...');
  
  // CREATE
  try {
    console.log('\n📝 Testing CREATE Plant Type...');
    const createResponse = await axios.post(`${BASE_URL}/plant-types`, testPlantType, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (createResponse.data.success) {
      createdTypeId = createResponse.data.data._id;
      console.log('✅ Plant type created:', createResponse.data.data.name);
    } else {
      console.log('❌ Failed to create plant type:', createResponse.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Create plant type error:', error.response?.data?.message || error.message);
    console.log('❌ Full error response:', error.response?.data);
    return false;
  }
  
  // READ
  try {
    console.log('\n📖 Testing READ Plant Types...');
    const readResponse = await axios.get(`${BASE_URL}/plant-types`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (readResponse.data.success) {
      const types = readResponse.data.data;
      const createdType = types.find(t => t._id === createdTypeId);
      if (createdType) {
        console.log('✅ Plant types read successfully, found created type:', createdType.name);
      } else {
        console.log('❌ Created plant type not found in list');
        return false;
      }
    } else {
      console.log('❌ Failed to read plant types:', readResponse.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Read plant types error:', error.response?.data?.message || error.message);
    return false;
  }
  
  // UPDATE
  try {
    console.log('\n✏️ Testing UPDATE Plant Type...');
    const updateData = { name: 'Updated Test Tomato' };
    const updateResponse = await axios.put(`${BASE_URL}/plant-types/${createdTypeId}`, updateData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (updateResponse.data.success) {
      console.log('✅ Plant type updated:', updateResponse.data.data.name);
    } else {
      console.log('❌ Failed to update plant type:', updateResponse.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Update plant type error:', error.response?.data?.message || error.message);
    return false;
  }
  
  return true;
}

async function testPlantVarietiesCRUD() {
  console.log('\n🍃 Testing Plant Varieties CRUD Operations...');
  
  if (!createdTypeId) {
    console.log('❌ No plant type ID available for variety testing');
    return false;
  }
  
  // CREATE
  try {
    console.log('\n📝 Testing CREATE Plant Variety...');
    const varietyData = { ...testPlantVariety, plantTypeId: createdTypeId };
    const createResponse = await axios.post(`${BASE_URL}/plant-varieties`, varietyData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (createResponse.data.success) {
      createdVarietyId = createResponse.data.data._id;
      console.log('✅ Plant variety created:', createResponse.data.data.name);
    } else {
      console.log('❌ Failed to create plant variety:', createResponse.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Create plant variety error:', error.response?.data?.message || error.message);
    return false;
  }
  
  // READ
  try {
    console.log('\n📖 Testing READ Plant Varieties...');
    const readResponse = await axios.get(`${BASE_URL}/plant-varieties`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (readResponse.data.success) {
      const varieties = readResponse.data.data;
      const createdVariety = varieties.find(v => v._id === createdVarietyId);
      if (createdVariety) {
        console.log('✅ Plant varieties read successfully, found created variety:', createdVariety.name);
      } else {
        console.log('❌ Created plant variety not found in list');
        return false;
      }
    } else {
      console.log('❌ Failed to read plant varieties:', readResponse.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Read plant varieties error:', error.response?.data?.message || error.message);
    return false;
  }
  
  // UPDATE
  try {
    console.log('\n✏️ Testing UPDATE Plant Variety...');
    const updateData = { name: 'Updated Test Roma' };
    const updateResponse = await axios.put(`${BASE_URL}/plant-varieties/${createdVarietyId}`, updateData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (updateResponse.data.success) {
      console.log('✅ Plant variety updated:', updateResponse.data.data.name);
    } else {
      console.log('❌ Failed to update plant variety:', updateResponse.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Update plant variety error:', error.response?.data?.message || error.message);
    return false;
  }
  
  return true;
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  // DELETE Plant Variety
  if (createdVarietyId) {
    try {
      await axios.delete(`${BASE_URL}/plant-varieties/${createdVarietyId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ Test plant variety deleted');
    } catch (error) {
      console.log('⚠️ Failed to delete test variety:', error.response?.data?.message || error.message);
    }
  }
  
  // DELETE Plant Type
  if (createdTypeId) {
    try {
      await axios.delete(`${BASE_URL}/plant-types/${createdTypeId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ Test plant type deleted');
    } catch (error) {
      console.log('⚠️ Failed to delete test type:', error.response?.data?.message || error.message);
    }
  }
}

async function runTests() {
  console.log('🚀 Starting CRUD Operations Test Suite...');
  
  // Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  // Test Plant Types CRUD
  const typesCRUDSuccess = await testPlantTypesCRUD();
  if (!typesCRUDSuccess) {
    console.log('❌ Plant Types CRUD tests failed');
    await cleanup();
    return;
  }
  
  // Test Plant Varieties CRUD
  const varietiesCRUDSuccess = await testPlantVarietiesCRUD();
  if (!varietiesCRUDSuccess) {
    console.log('❌ Plant Varieties CRUD tests failed');
    await cleanup();
    return;
  }
  
  // Cleanup
  await cleanup();
  
  console.log('\n🎉 All CRUD operations tests completed successfully!');
  console.log('✅ Plant Types: CREATE, READ, UPDATE');
  console.log('✅ Plant Varieties: CREATE, READ, UPDATE');
  console.log('✅ Cleanup: DELETE operations');
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error.message);
  cleanup().catch(cleanupError => {
    console.error('❌ Cleanup failed:', cleanupError.message);
  });
});
