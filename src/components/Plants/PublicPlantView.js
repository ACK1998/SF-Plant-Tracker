import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, User, Heart, Leaf, ExternalLink, TreePalm } from 'lucide-react';
import { findPlantEmoji } from '../../utils/emojiMapper';
import { DarkModeProvider } from '../../contexts/DarkModeContext';

function PublicPlantView({ plantId }) {
  const [plant, setPlant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPlant();
  }, [plantId]);

  const fetchPlant = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/plants/public/${plantId}`);
      const data = await response.json();
      
      if (data.success) {
        setPlant(data.data);
      } else {
        setError(data.message || 'Plant not found');
      }
    } catch (err) {
      setError('Failed to load plant information');
      console.error('Error fetching plant:', err);
    } finally {
      setLoading(false);
    }
  };


  const getHealthColor = (health) => {
    switch (health) {
      case 'excellent':
        return 'text-green-600 bg-green-50';
      case 'good':
        return 'text-blue-600 bg-blue-50';
      case 'fair':
        return 'text-yellow-600 bg-yellow-50';
      case 'poor':
        return 'text-red-600 bg-red-50';
      case 'deceased':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getGrowthStageColor = (stage) => {
    switch (stage) {
      case 'seedling':
        return 'text-blue-600 bg-blue-50';
      case 'vegetative':
        return 'text-green-600 bg-green-50';
      case 'flowering':
        return 'text-purple-600 bg-purple-50';
      case 'fruiting':
        return 'text-orange-600 bg-orange-50';
      case 'mature':
        return 'text-green-700 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const generateWikipediaUrl = (plant) => {
    // Create search term with variety and type for more accurate results
    let searchTerm = '';
    if (plant.variety && plant.type) {
      searchTerm = `${plant.variety} ${plant.type}`;
    } else if (plant.variety) {
      searchTerm = plant.variety;
    } else if (plant.type) {
      searchTerm = plant.type;
    } else {
      searchTerm = plant.name;
    }
    
    return `https://en.wikipedia.org/wiki/Special:Search/${encodeURIComponent(searchTerm)}`;
  };

  if (loading) {
    return (
      <DarkModeProvider>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading plant information...</p>
          </div>
        </div>
      </DarkModeProvider>
    );
  }

  if (error) {
    return (
      <DarkModeProvider>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🌱</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Plant Not Found</h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </DarkModeProvider>
    );
  }

  if (!plant) {
    return (
      <DarkModeProvider>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🌱</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">No Plant Data</h1>
            <p className="text-gray-600">Unable to load plant information.</p>
          </div>
        </div>
      </DarkModeProvider>
    );
  }

  return (
    <DarkModeProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <div className="flex items-center space-x-3">
                <img 
                  src="/sfLogo.png" 
                  alt="Sanctity Ferme Logo" 
                  className="h-8 w-8"
                />
                <h1 className="text-xl font-semibold text-gray-900">
                  Sanctity Ferme
                </h1>
              </div>
            </div>
          </div>
        </header>


        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Plant Image */}
            {plant.image && (
              <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                <img
                  src={plant.image}
                  alt={plant.name}
                  className="w-full h-64 object-cover"
                />
              </div>
            )}

            <div className="p-6">
              {/* Plant Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="text-4xl">
                    {findPlantEmoji(plant.name, plant.category) || '🌱'}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{plant.name}</h1>
                    {plant.variety && (
                      <p className="text-lg text-gray-600">{plant.variety}</p>
                    )}
                    <p className="text-sm text-gray-500">{plant.type}</p>
                  </div>
                </div>
              </div>

              {/* Plant Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Plant Information</h2>
                  
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Planted Date</p>
                      <p className="font-medium">{plant.plantedDateFormatted}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Heart className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Age</p>
                      <p className="font-medium">{plant.age}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Leaf className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Health</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getHealthColor(plant.health)}`}>
                        {plant.health}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <TreePalm className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Growth Stage</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getGrowthStageColor(plant.growthStage)}`}>
                        {plant.growthStage}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>
                  
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Plot</p>
                      <p className="font-medium">{plant.plotId?.name || 'Unknown Plot'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Domain</p>
                      <p className="font-medium">{plant.domainId?.name || 'Unknown Domain'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Planted By</p>
                      <p className="font-medium">{plant.plantedBy?.firstName || 'Unknown'}</p>
                    </div>
                  </div>

                  {plant.organizationId?.name && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Organization</p>
                        <p className="font-medium">{plant.organizationId.name}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Wikipedia Link */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Learn More</h3>
                    <p className="text-gray-600">Get detailed information about this plant from Wikipedia</p>
                  </div>
                  <a
                    href={generateWikipediaUrl(plant)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>View on Wikipedia</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </main>

      </div>
    </DarkModeProvider>
  );
}

export default PublicPlantView;
