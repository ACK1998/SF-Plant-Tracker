# MongoDB Queries to Update OrganizationId

## Overview
Replace `organizationId: 68972f30af8abc96c1bb218a` with `organizationId: 689220c1596aee3de42045d3` across all collections.

## Individual Queries

### 1. Update Plants
```javascript
db.plants.updateMany(
  { organizationId: ObjectId("68972f30af8abc96c1bb218a") },
  { $set: { organizationId: ObjectId("689220c1596aee3de42045d3") } }
)
```

### 2. Update Users (excluding super_admin)
```javascript
db.users.updateMany(
  { 
    organizationId: ObjectId("68972f30af8abc96c1bb218a"),
    role: { $ne: "super_admin" }
  },
  { $set: { organizationId: ObjectId("689220c1596aee3de42045d3") } }
)
```

### 3. Update Plots
```javascript
db.plots.updateMany(
  { organizationId: ObjectId("68972f30af8abc96c1bb218a") },
  { $set: { organizationId: ObjectId("689220c1596aee3de42045d3") } }
)
```

### 4. Update Domains
```javascript
db.domains.updateMany(
  { organizationId: ObjectId("68972f30af8abc96c1bb218a") },
  { $set: { organizationId: ObjectId("689220c1596aee3de42045d3") } }
)
```

### 5. Update PlantTypes
```javascript
db.planttypes.updateMany(
  { organizationId: ObjectId("68972f30af8abc96c1bb218a") },
  { $set: { organizationId: ObjectId("689220c1596aee3de42045d3") } }
)
```

### 6. Update PlantVarieties
```javascript
db.plantvarieties.updateMany(
  { organizationId: ObjectId("68972f30af8abc96c1bb218a") },
  { $set: { organizationId: ObjectId("689220c1596aee3de42045d3") } }
)
```

## Verification Queries

### Check remaining documents with old organizationId
```javascript
// Check each collection
db.plants.countDocuments({ organizationId: ObjectId("68972f30af8abc96c1bb218a") })
db.users.countDocuments({ organizationId: ObjectId("68972f30af8abc96c1bb218a") })
db.plots.countDocuments({ organizationId: ObjectId("68972f30af8abc96c1bb218a") })
db.domains.countDocuments({ organizationId: ObjectId("68972f30af8abc96c1bb218a") })
db.planttypes.countDocuments({ organizationId: ObjectId("68972f30af8abc96c1bb218a") })
db.plantvarieties.countDocuments({ organizationId: ObjectId("68972f30af8abc96c1bb218a") })
```

### Verify new organizationId documents
```javascript
// Check each collection
db.plants.countDocuments({ organizationId: ObjectId("689220c1596aee3de42045d3") })
db.users.countDocuments({ organizationId: ObjectId("689220c1596aee3de42045d3") })
db.plots.countDocuments({ organizationId: ObjectId("689220c1596aee3de42045d3") })
db.domains.countDocuments({ organizationId: ObjectId("689220c1596aee3de42045d3") })
db.planttypes.countDocuments({ organizationId: ObjectId("689220c1596aee3de42045d3") })
db.plantvarieties.countDocuments({ organizationId: ObjectId("689220c1596aee3de42045d3") })
```

## Usage Instructions

### Option 1: Run the automated script
```bash
node updateOrganizationId.js
```

### Option 2: Run queries manually in MongoDB shell
1. Connect to your MongoDB database
2. Run each query individually
3. Use verification queries to confirm the update

### Option 3: Run queries in MongoDB Compass
1. Open MongoDB Compass
2. Navigate to your database
3. Use the query bar to run each update query
4. Use verification queries to confirm the update

## Important Notes

- **Backup**: Always backup your database before running bulk updates
- **Test**: Test the queries on a small dataset first
- **Verification**: Always verify the results after running the updates
- **Super Admin Users**: The user update query excludes super_admin users as they don't require organizationId
- **Indexes**: The updates will maintain existing indexes and relationships
