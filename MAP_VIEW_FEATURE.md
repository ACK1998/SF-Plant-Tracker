# Map View Feature

## Overview

The Map View feature provides an interactive map interface for visualizing and managing plots and plants based on their geographical coordinates. This feature uses Mapbox for map rendering and provides comprehensive filtering and location management capabilities.

## Features

### 1. Interactive Map Display
- **Mapbox Integration**: Uses Mapbox for high-quality map rendering with multiple style options
- **Custom Markers**: Different colored markers for plots (blue) and plants (green)
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Mode Support**: Automatically adapts to the application's dark/light theme

### 2. Location Management
- **Coordinate Input**: Manual latitude/longitude input fields
- **Map Click Selection**: Click anywhere on the map to set coordinates
- **Draggable Markers**: Drag markers to update coordinates
- **Current Location**: Use device GPS to get current location
- **Coordinate Validation**: Ensures coordinates are within valid ranges

### 3. Filtering and Search
- **Organization Filter**: Filter by organization (role-based)
- **Domain Filter**: Filter by domain within selected organization
- **Plot Filter**: Filter plants by specific plot
- **Search Functionality**: Search plots and plants by name, description, or type
- **State Filter**: Filter by Indian states (inherited from existing functionality)

### 4. Layer Controls
- **Toggle Plots**: Show/hide plot markers
- **Toggle Plants**: Show/hide plant markers
- **Independent Control**: Each layer can be controlled separately

### 5. Information Display
- **Detailed Popups**: Rich information in marker popups
- **Summary Statistics**: Count of items with and without coordinates
- **Legend**: Visual guide for marker types

## Technical Implementation

### Frontend Components

#### MapViewMapbox.js
Main map component that displays all plots and plants with filtering capabilities.

**Key Features:**
- Role-based data filtering
- Real-time search and filtering
- Automatic map centering based on data
- Custom marker icons with emojis
- Responsive design

#### MapPickerMapbox.js
Reusable component for selecting coordinates when creating/editing plots and plants.

**Key Features:**
- Interactive map for coordinate selection
- Manual coordinate input
- GPS location detection
- Draggable markers
- Coordinate validation

### Backend Changes

#### Database Schema Updates
- **Plot Model**: Added `latitude` and `longitude` fields (Number, optional)
- **Plant Model**: Added `latitude` and `longitude` fields (Number, optional)

#### Migration Script
`addCoordinatesToExistingData.js` - Adds sample coordinates to existing plots and plants.

### Dependencies
- **mapbox-gl**: Core mapping library
- **react-map-gl**: React wrapper for Mapbox
- **@turf/turf**: Geospatial analysis library
- **lucide-react**: Icons for UI elements

## Usage

### Accessing Map View
1. Navigate to "Map View" in the main navigation
2. The map will load with all available plots and plants
3. Use filters to narrow down the view
4. Click on markers to see detailed information

### Adding Coordinates to New Items

#### For Plots:
1. Click "Add Plot" button
2. Fill in plot details
3. Use the map picker to select location
4. Coordinates will be automatically saved

#### For Plants:
1. Click "Add Plant" button
2. Fill in plant details
3. Use the map picker to select location
4. Coordinates will be automatically saved

### Editing Coordinates
1. Edit any plot or plant
2. Use the map picker to update location
3. Save changes

## Configuration

### Map Settings
- **Default Center**: India (20.5937, 78.9629)
- **Default Zoom**: 5 (country level)
- **Marker Zoom**: 15 (street level)
- **Tile Provider**: OpenStreetMap

### Coordinate Validation
- **Latitude**: -90 to 90 degrees
- **Longitude**: -180 to 180 degrees
- **Precision**: 6 decimal places

## Styling

### Custom CSS Classes
- `.mapboxgl-map`: Main map container
- `.custom-marker`: Custom marker styling
- `.mapboxgl-popup-content`: Popup styling
- Dark mode variants for all map elements

### Responsive Design
- Mobile-friendly touch interactions
- Adaptive marker sizes
- Responsive popup layouts

## Security and Permissions

### Role-Based Access
- **Super Admin**: Access to all organizations and domains
- **Org Admin**: Access to their organization and domains
- **Domain Admin**: Access to their domain and plots
- **Application User**: Access to their assigned plot

### Data Privacy
- Coordinates are stored securely in the database
- Access is controlled by existing permission system
- No external location tracking

## Performance Considerations

### Optimization
- Lazy loading of map tiles
- Efficient marker rendering
- Debounced search functionality
- Optimized database queries

### Browser Compatibility
- Modern browsers with ES6+ support
- Mobile browsers with touch support
- Fallback for older browsers

## Future Enhancements

### Planned Features
- **Clustering**: Group nearby markers for better performance
- **Heat Maps**: Visualize plant density
- **Routing**: Navigation between plots
- **Export**: Export map data to various formats
- **Satellite View**: Alternative map layers
- **Measurement Tools**: Distance and area calculations

### Integration Opportunities
- **Weather Data**: Real-time weather for locations
- **Soil Data**: Soil type mapping
- **Crop Planning**: Seasonal planting recommendations
- **IoT Integration**: Sensor data visualization

## Troubleshooting

### Common Issues

#### Map Not Loading
- Check internet connection (requires Mapbox tiles)
- Verify browser compatibility
- Check console for JavaScript errors

#### Coordinates Not Saving
- Verify coordinate validation
- Check form submission
- Ensure database connection

#### Markers Not Appearing
- Check if items have valid coordinates
- Verify filtering settings
- Check layer visibility toggles

#### GPS Not Working
- Ensure HTTPS connection (required for geolocation)
- Check browser permissions
- Verify device GPS is enabled

### Debug Information
- Browser console logs for JavaScript errors
- Network tab for API calls
- Database queries for data verification

## Support

For issues or questions regarding the Map View feature:
1. Check this documentation
2. Review browser console for errors
3. Verify data integrity in database
4. Contact development team

---

*Last Updated: August 2024*
*Version: 1.0.0*
