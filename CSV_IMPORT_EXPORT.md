# CSV Import/Export Functionality

This document describes the CSV import and export functionality for the Plant Tracker application.

## Features

### CSV Export
- Export all plants or filtered plants to CSV format
- Includes all plant data fields
- Respects user permissions and role-based filtering
- Downloads automatically to the user's device

### CSV Import
- Import plants from CSV files
- Preview functionality to review data before import
- Option to update existing plants or skip duplicates
- Template download for proper CSV format
- Error handling and validation

## CSV Format

### Required Fields
- **Name**: Plant name (required)
- **Type**: Plant type (required)
- **Domain**: Domain name (will be matched to existing domains)
- **Plot**: Plot name (will be matched to existing plots)
- **Planted Date**: Date when plant was planted (YYYY-MM-DD format)
- **Planted By**: Name of person who planted the plant (required)

### Optional Fields
- **Variety**: Plant variety
- **Category**: Plant category (plant, tree, vegetable, herb, fruit, grain, legume)
- **Last Watered**: Date when plant was last watered (YYYY-MM-DD format)
- **Next Watering Date**: Date for next scheduled watering (YYYY-MM-DD format)
- **Health**: Plant health status (excellent, good, fair, poor, deceased)
- **Growth Stage**: Growth stage (seed, seedling, vegetative, flowering, fruiting, mature)
- **Expected Harvest Date**: Expected harvest date (YYYY-MM-DD format)
- **Actual Harvest Date**: Actual harvest date (YYYY-MM-DD format)
- **Harvest Yield (kg)**: Harvest yield in kilograms (numeric value)
- **Latitude**: GPS latitude coordinate (numeric value)
- **Longitude**: GPS longitude coordinate (numeric value)
- **Image**: Plant image/emoji representation
- **Is Active**: Whether the plant is active (true/false)

## Usage

### Exporting Plants

1. Navigate to the Plants page
2. Apply any desired filters (type, plot, domain, category, variety, search)
3. Click the "Export CSV" button
4. The CSV file will be downloaded automatically

### Importing Plants

1. Navigate to the Plants page
2. Click the "Import CSV" button
3. Upload a CSV file or download the template first
4. Review the preview of your data
5. Choose whether to update existing plants
6. Click "Import Plants" to complete the import

## Template

You can download a template CSV file from the import modal that shows the correct format and includes sample data.

## Permissions

- **Export**: All authenticated users can export plants they have access to based on their role
- **Import**: All authenticated users can import plants (plants will be assigned to their organization)

## Error Handling

The import process includes comprehensive error handling:
- File format validation
- Data validation
- Duplicate detection
- Detailed error reporting with row numbers
- Graceful handling of missing or invalid data

## Backend Endpoints

- `GET /api/plants/export/csv` - Export plants to CSV
- `POST /api/plants/import/csv` - Import plants from CSV

## Frontend Components

- `CSVImportModal.js` - Modal for CSV import functionality
- `PlantsList.js` - Updated to include import/export buttons
- `ApiContext.js` - Added CSV methods to API context
- `api.js` - Added CSV endpoints to API service
