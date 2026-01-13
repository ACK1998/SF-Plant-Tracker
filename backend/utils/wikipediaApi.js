const axios = require('axios');

const WIKIPEDIA_API_BASE_URL = 'https://en.wikipedia.org/api/rest_v1/page';

/**
 * Fetch Wikipedia summary/extract for a plant
 * @param {string} searchTerm - Plant name to search for
 * @returns {Promise<Object>} Wikipedia data with extract, title, thumbnail, etc. or null
 */
async function fetchWikipediaSummary(searchTerm) {
  if (!searchTerm || !searchTerm.trim()) {
    return null;
  }

  try {
    // First, try to get the exact page summary
    // Wikipedia API automatically handles URL encoding and title normalization
    const encodedTitle = encodeURIComponent(searchTerm.trim());
    
    const response = await axios.get(`${WIKIPEDIA_API_BASE_URL}/summary/${encodedTitle}`, {
      timeout: 5000, // 5 second timeout
      headers: {
        'User-Agent': 'Sanctity-Ferme-Plant-Tracker/1.0 (https://sanctity-ferme.com)'
      }
    });

    if (response.data && response.data.extract) {
      return {
        title: response.data.title,
        extract: response.data.extract,
        description: response.data.description,
        thumbnail: response.data.thumbnail?.source,
        url: response.data.content_urls?.desktop?.page,
        originalimage: response.data.originalimage?.source
      };
    }

    return null;
  } catch (error) {
    // If exact page not found, try searching
    if (error.response?.status === 404) {
      try {
        return await searchWikipedia(searchTerm);
      } catch (searchError) {
        console.warn('Wikipedia search failed:', searchError.message);
        return null;
      }
    }
    
    // Don't throw - just log and return null (graceful degradation)
    if (error.response) {
      console.warn(`Wikipedia API error (${error.response.status}):`, error.response.data?.title || error.message);
    } else if (error.request) {
      console.warn('Wikipedia API request failed (no response):', error.message);
    } else {
      console.warn('Wikipedia API error:', error.message);
    }
    return null;
  }
}

/**
 * Search Wikipedia and return first result summary
 * @param {string} searchTerm - Search query
 * @returns {Promise<Object>} Wikipedia data or null
 */
async function searchWikipedia(searchTerm) {
  try {
    // Use Wikipedia's search API to find the page
    const searchResponse = await axios.get('https://en.wikipedia.org/w/api.php', {
      params: {
        action: 'query',
        list: 'search',
        srsearch: searchTerm,
        format: 'json',
        srlimit: 1
      },
      timeout: 5000,
      headers: {
        'User-Agent': 'Sanctity-Ferme-Plant-Tracker/1.0 (https://sanctity-ferme.com)'
      }
    });

    if (searchResponse.data?.query?.search?.length > 0) {
      const firstResult = searchResponse.data.query.search[0];
      const title = firstResult.title;
      
      // Now fetch the summary for the found title
      return await fetchWikipediaSummary(title);
    }

    return null;
  } catch (error) {
    console.warn('Wikipedia search API error:', error.message);
    return null;
  }
}

/**
 * Check if Wikipedia API is available (for configuration purposes)
 * @returns {boolean} Always true (Wikipedia API is public, no token needed)
 */
function isWikipediaConfigured() {
  return true; // Wikipedia API is public, no configuration needed
}

module.exports = { fetchWikipediaSummary, isWikipediaConfigured };
