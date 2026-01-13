const axios = require('axios');

const TREFLE_API_BASE_URL = 'https://trefle.io/api/v1';
const TREFLE_TOKEN = process.env.TREFLE_API_TOKEN;

/**
 * Search for plant species/varieties using Trefle API
 * @param {string} query - Search query (plant name/variety)
 * @param {string} plantTypeName - Plant type name for better matching
 * @returns {Promise<Object>} Formatted variety data or null
 */
async function searchPlantVariety(query, plantTypeName = null) {
  if (!TREFLE_TOKEN) {
    console.warn('TREFLE_API_TOKEN not set. Skipping Trefle API lookup.');
    return null;
  }

  try {
    // Construct search query - combine variety name with plant type if available
    const searchQuery = plantTypeName 
      ? `${query} ${plantTypeName}`.trim()
      : query;

    // Search for species
    const searchResponse = await axios.get(`${TREFLE_API_BASE_URL}/species/search`, {
      params: {
        token: TREFLE_TOKEN,
        q: searchQuery,
        page_size: 5 // Limit results
      },
      timeout: 5000 // 5 second timeout
    });

    if (!searchResponse.data || !searchResponse.data.data || searchResponse.data.data.length === 0) {
      return null;
    }

    // Get the first matching result (best match)
    const species = searchResponse.data.data[0];
    const speciesId = species.id;

    // Fetch detailed information
    const detailResponse = await axios.get(`${TREFLE_API_BASE_URL}/species/${speciesId}`, {
      params: {
        token: TREFLE_TOKEN
      },
      timeout: 5000
    });

    const speciesData = detailResponse.data.data;

    // Map Trefle data to our PlantVariety format
    return mapTrefleDataToVariety(speciesData, query);
  } catch (error) {
    // Don't throw - just log and return null (graceful degradation)
    if (error.response) {
      console.warn(`Trefle API error (${error.response.status}):`, error.response.data?.error || error.message);
    } else if (error.request) {
      console.warn('Trefle API request failed (no response):', error.message);
    } else {
      console.warn('Trefle API error:', error.message);
    }
    return null;
  }
}

/**
 * Map Trefle API data to PlantVariety format
 * @param {Object} trefleData - Data from Trefle API
 * @param {string} originalVarietyName - Original variety name entered by user
 * @returns {Object} Formatted variety data
 */
function mapTrefleDataToVariety(trefleData, originalVarietyName) {
  const result = {
    description: null,
    characteristics: {},
    growingInfo: {}
  };

  // Extract scientific name and common name
  const scientificName = trefleData.scientific_name || '';
  const commonName = trefleData.common_name || '';

  // Build description from available data
  const descriptionParts = [];
  
  if (commonName && commonName.toLowerCase() !== originalVarietyName.toLowerCase()) {
    descriptionParts.push(`Common name: ${commonName}`);
  }
  
  if (scientificName) {
    descriptionParts.push(`Scientific name: ${scientificName}`);
  }
  
  if (trefleData.bibliography) {
    descriptionParts.push(trefleData.bibliography);
  }

  result.description = descriptionParts.length > 0 ? descriptionParts.join('\n\n') : null;

  // Extract growth height if available
  if (trefleData.growth?.maximum_height?.value) {
    const heightValue = trefleData.growth.maximum_height.value;
    const heightUnit = trefleData.growth.maximum_height.unit || 'cm';
    result.growingInfo.height = `${heightValue} ${heightUnit}`;
  }

  // Extract minimum height if available
  if (trefleData.growth?.minimum_height?.value) {
    const minHeight = trefleData.growth.minimum_height.value;
    const minUnit = trefleData.growth.minimum_height.unit || 'cm';
    if (!result.growingInfo.height) {
      result.growingInfo.height = `${minHeight} ${minUnit}`;
    }
  }

  // Extract pH range if available
  if (trefleData.growth?.ph_minimum && trefleData.growth?.ph_maximum) {
    result.growingInfo.phRange = `${trefleData.growth.ph_minimum}-${trefleData.growth.ph_maximum}`;
  }

  // Extract light requirement if available
  if (trefleData.growth?.light) {
    result.growingInfo.light = trefleData.growth.light;
  }

  // Extract atmospheric humidity if available
  if (trefleData.growth?.atmospheric_humidity) {
    result.growingInfo.humidity = trefleData.growth.atmospheric_humidity;
  }

  return result;
}

/**
 * Check if Trefle API is configured
 * @returns {boolean}
 */
function isTrefleConfigured() {
  return !!TREFLE_TOKEN;
}

module.exports = {
  searchPlantVariety,
  isTrefleConfigured
};
