import React from 'react';
import { Calendar, Info, Ruler, Clock, Droplets, Thermometer, Sun, Cloud, Wind, Sprout, AlertCircle, Lightbulb, Leaf } from 'lucide-react';

/**
 * Comprehensive Plant Details Component
 * Displays all plant type information in organized sections
 */
export function ComprehensivePlantDetails({ plantTypeDetails, plantVarietyDetails }) {
  if (!plantTypeDetails && !plantVarietyDetails) {
    return null;
  }

  const details = plantTypeDetails || {};

  return (
    <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
        <Info className="h-5 w-5 mr-2 text-green-600" />
        {plantVarietyDetails ? 'Plant Type & Variety Details' : 'Plant Type Details'}
      </h2>

      {/* Scientific Name & Basic Info */}
      {(details.scientificName || details.shortDescription) && (
        <div className="mb-6">
          {details.scientificName && (
            <div className="mb-2">
              <span className="text-sm font-medium text-gray-500">Scientific Name: </span>
              <span className="text-sm text-gray-700 italic">{details.scientificName}</span>
            </div>
          )}
          {details.shortDescription && (
            <p className="text-sm text-gray-700 leading-relaxed">{details.shortDescription}</p>
          )}
        </div>
      )}

      {/* Detailed Description */}
      {details.detailedDescription && (
        <div className="mb-6">
          <h3 className="text-md font-semibold text-gray-800 mb-2">Description</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{details.detailedDescription}</p>
        </div>
      )}

      {/* Uses */}
      {details.uses && details.uses.length > 0 && (
        <div className="mb-6">
          <h3 className="text-md font-semibold text-gray-800 mb-2 flex items-center">
            <Leaf className="h-4 w-4 mr-2 text-green-600" />
            Uses
          </h3>
          <div className="flex flex-wrap gap-2">
            {details.uses.map((use, index) => (
              <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {use}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Varieties */}
      {details.varieties && details.varieties.length > 0 && (
        <div className="mb-6">
          <h3 className="text-md font-semibold text-gray-800 mb-2">Available Varieties</h3>
          <div className="flex flex-wrap gap-2">
            {details.varieties.map((variety, index) => (
              <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {variety}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Growth Cycle */}
      {details.growthCycle && (
        <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
          <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
            <Sprout className="h-4 w-4 mr-2 text-green-600" />
            Growth Cycle
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            {details.growthCycle.seedingTimeDays && (
              <div>
                <span className="text-gray-500">Seeding Time: </span>
                <span className="text-gray-700 font-medium">{details.growthCycle.seedingTimeDays} days</span>
              </div>
            )}
            {details.growthCycle.germinationDays && (
              <div>
                <span className="text-gray-500">Germination: </span>
                <span className="text-gray-700 font-medium">{details.growthCycle.germinationDays} days</span>
              </div>
            )}
            {details.growthCycle.floweringTimeDays && (
              <div>
                <span className="text-gray-500">Flowering: </span>
                <span className="text-gray-700 font-medium">{details.growthCycle.floweringTimeDays} days</span>
              </div>
            )}
            {details.growthCycle.fruitingTimeDays && (
              <div>
                <span className="text-gray-500">Fruiting: </span>
                <span className="text-gray-700 font-medium">{details.growthCycle.fruitingTimeDays} days</span>
              </div>
            )}
            {details.growthCycle.harvestTimeDays && (
              <div>
                <span className="text-gray-500">Harvest: </span>
                <span className="text-gray-700 font-medium">{details.growthCycle.harvestTimeDays} days</span>
              </div>
            )}
            {details.growthCycle.totalTimeToHarvestDays && (
              <div>
                <span className="text-gray-500">Total to Harvest: </span>
                <span className="text-gray-700 font-medium">{details.growthCycle.totalTimeToHarvestDays} days</span>
              </div>
            )}
          </div>
          {details.growthCycle.growthExplanation && (
            <p className="text-sm text-gray-600 mt-3 italic">{details.growthCycle.growthExplanation}</p>
          )}
        </div>
      )}

      {/* Climate, Soil, Watering Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Climate */}
        {details.climate && (
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
              <Thermometer className="h-4 w-4 mr-2 text-orange-600" />
              Climate
            </h3>
            <div className="space-y-2 text-sm">
              {details.climate.temperatureCelsius && (
                <div>
                  <span className="text-gray-500">Temperature: </span>
                  <span className="text-gray-700">{details.climate.temperatureCelsius.min}°C - {details.climate.temperatureCelsius.max}°C</span>
                </div>
              )}
              {details.climate.rainfall && (
                <div>
                  <span className="text-gray-500">Rainfall: </span>
                  <span className="text-gray-700 capitalize">{details.climate.rainfall}</span>
                </div>
              )}
              {details.climate.sunlight && (
                <div className="flex items-center">
                  <Sun className="h-3 w-3 mr-1 text-yellow-500" />
                  <span className="text-gray-500">Sunlight: </span>
                  <span className="text-gray-700 ml-1 capitalize">{details.climate.sunlight}</span>
                </div>
              )}
              {details.climate.humidity && (
                <div className="flex items-center">
                  <Cloud className="h-3 w-3 mr-1 text-blue-500" />
                  <span className="text-gray-500">Humidity: </span>
                  <span className="text-gray-700 ml-1 capitalize">{details.climate.humidity}</span>
                </div>
              )}
            </div>
            {details.climate.climateExplanation && (
              <p className="text-xs text-gray-600 mt-2 italic">{details.climate.climateExplanation}</p>
            )}
          </div>
        )}

        {/* Soil */}
        {details.soil && (
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
              <Leaf className="h-4 w-4 mr-2 text-amber-600" />
              Soil
            </h3>
            <div className="space-y-2 text-sm">
              {details.soil.soilType && details.soil.soilType.length > 0 && (
                <div>
                  <span className="text-gray-500">Type: </span>
                  <span className="text-gray-700">{details.soil.soilType.join(', ')}</span>
                </div>
              )}
              {details.soil.phRange && (
                <div>
                  <span className="text-gray-500">pH Range: </span>
                  <span className="text-gray-700">{details.soil.phRange.min} - {details.soil.phRange.max}</span>
                </div>
              )}
              {details.soil.drainage && (
                <div>
                  <span className="text-gray-500">Drainage: </span>
                  <span className="text-gray-700 capitalize">{details.soil.drainage}</span>
                </div>
              )}
            </div>
            {details.soil.soilExplanation && (
              <p className="text-xs text-gray-600 mt-2 italic">{details.soil.soilExplanation}</p>
            )}
          </div>
        )}

        {/* Watering */}
        {details.watering && (
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
              <Droplets className="h-4 w-4 mr-2 text-blue-600" />
              Watering
            </h3>
            <div className="space-y-2 text-sm">
              {details.watering.method && (
                <div>
                  <span className="text-gray-500">Method: </span>
                  <span className="text-gray-700 capitalize">{details.watering.method}</span>
                </div>
              )}
              {details.watering.frequency && (
                <div>
                  <span className="text-gray-500">Frequency: </span>
                  <span className="text-gray-700">{details.watering.frequency}</span>
                </div>
              )}
              {details.watering.waterRequirement && (
                <div>
                  <span className="text-gray-500">Requirement: </span>
                  <span className="text-gray-700 capitalize">{details.watering.waterRequirement}</span>
                </div>
              )}
            </div>
            {details.watering.wateringExplanation && (
              <p className="text-xs text-gray-600 mt-2 italic">{details.watering.wateringExplanation}</p>
            )}
          </div>
        )}
      </div>

      {/* Spacing & Lifespan */}
      {(details.spacing || details.lifespanYears) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {details.spacing && (
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="text-md font-semibold text-gray-800 mb-2 flex items-center">
                <Ruler className="h-4 w-4 mr-2 text-gray-600" />
                Spacing
              </h3>
              <div className="text-sm space-y-1">
                {details.spacing.plantToPlantCm && (
                  <div>
                    <span className="text-gray-500">Plant to Plant: </span>
                    <span className="text-gray-700">{details.spacing.plantToPlantCm} cm</span>
                  </div>
                )}
                {details.spacing.rowToRowCm && (
                  <div>
                    <span className="text-gray-500">Row to Row: </span>
                    <span className="text-gray-700">{details.spacing.rowToRowCm} cm</span>
                  </div>
                )}
              </div>
            </div>
          )}
          {details.lifespanYears && (
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="text-md font-semibold text-gray-800 mb-2 flex items-center">
                <Clock className="h-4 w-4 mr-2 text-gray-600" />
                Lifespan
              </h3>
              <div className="text-sm">
                <span className="text-gray-700 font-medium">{details.lifespanYears} year{details.lifespanYears !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Care Tips */}
      {details.careTips && details.careTips.length > 0 && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
            <Lightbulb className="h-4 w-4 mr-2 text-green-600" />
            Care Tips
          </h3>
          <ul className="space-y-2">
            {details.careTips.map((tip, index) => (
              <li key={index} className="flex items-start text-sm text-gray-700">
                <span className="text-green-600 mr-2">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Common Problems */}
      {details.commonProblems && details.commonProblems.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
          <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
            Common Problems
          </h3>
          <ul className="space-y-2">
            {details.commonProblems.map((problem, index) => (
              <li key={index} className="flex items-start text-sm text-gray-700">
                <span className="text-red-600 mr-2">•</span>
                <span>{problem}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Notes */}
      {details.notes && (
        <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Notes</h3>
          <p className="text-sm text-gray-700">{details.notes}</p>
        </div>
      )}

      {/* Legacy fields fallback (for backward compatibility) */}
      {details.description && !details.detailedDescription && (
        <div className="mb-4">
          <h3 className="text-md font-semibold text-gray-800 mb-2">Description</h3>
          <p className="text-sm text-gray-600">{details.description}</p>
        </div>
      )}
      {(details.growingSeason || details.sunRequirement || details.waterRequirement) && (
        <div className="mb-4 p-3 bg-white rounded border border-gray-200">
          <div className="flex flex-wrap gap-3 text-sm">
            {details.growingSeason && (
              <span className="text-gray-600">
                <span className="font-medium">Season:</span> {details.growingSeason}
              </span>
            )}
            {details.sunRequirement && (
              <span className="text-gray-600">
                <span className="font-medium">Sun:</span> {details.sunRequirement}
              </span>
            )}
            {details.waterRequirement && (
              <span className="text-gray-600">
                <span className="font-medium">Water:</span> {details.waterRequirement}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Variety Details (if available) */}
      {plantVarietyDetails && (
        <div className="border-t border-gray-300 pt-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Variety Details</h3>
          {plantVarietyDetails.description && (
            <p className="text-sm text-gray-600 mb-4">{plantVarietyDetails.description}</p>
          )}
          {plantVarietyDetails.characteristics && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Characteristics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                {plantVarietyDetails.characteristics.color && (
                  <div>
                    <span className="text-gray-500">Color:</span>{' '}
                    <span className="text-gray-700">{plantVarietyDetails.characteristics.color}</span>
                  </div>
                )}
                {plantVarietyDetails.characteristics.size && (
                  <div>
                    <span className="text-gray-500">Size:</span>{' '}
                    <span className="text-gray-700 capitalize">{plantVarietyDetails.characteristics.size}</span>
                  </div>
                )}
                {plantVarietyDetails.characteristics.taste && (
                  <div>
                    <span className="text-gray-500">Taste:</span>{' '}
                    <span className="text-gray-700">{plantVarietyDetails.characteristics.taste}</span>
                  </div>
                )}
                {plantVarietyDetails.characteristics.texture && (
                  <div>
                    <span className="text-gray-500">Texture:</span>{' '}
                    <span className="text-gray-700">{plantVarietyDetails.characteristics.texture}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          {plantVarietyDetails.growingInfo && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Growing Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {plantVarietyDetails.growingInfo.daysToMaturity && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Days to Maturity:</span>{' '}
                    <span className="text-gray-700">{plantVarietyDetails.growingInfo.daysToMaturity}</span>
                  </div>
                )}
                {plantVarietyDetails.growingInfo.height && (
                  <div className="flex items-center space-x-2">
                    <Ruler className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Height:</span>{' '}
                    <span className="text-gray-700">{plantVarietyDetails.growingInfo.height}</span>
                  </div>
                )}
                {plantVarietyDetails.growingInfo.spacing && (
                  <div className="flex items-center space-x-2">
                    <Ruler className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Spacing:</span>{' '}
                    <span className="text-gray-700">{plantVarietyDetails.growingInfo.spacing}</span>
                  </div>
                )}
                {plantVarietyDetails.growingInfo.harvestTime && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Harvest Time:</span>{' '}
                    <span className="text-gray-700">{plantVarietyDetails.growingInfo.harvestTime}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
