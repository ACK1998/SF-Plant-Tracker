# Plant Permission System

## Overview
The plant permission system allows application users to view all plants in their organization but only edit plants in their assigned plot.

## Permission Rules

### View Permissions
- **Super Admin**: Can view all plants across all organizations
- **Org Admin**: Can view all plants in their organization
- **Domain Admin**: Can view all plants in their organization
- **Application User**: Can view all plants in their organization

### Edit Permissions
- **Super Admin**: Can edit any plant
- **Org Admin**: Can edit any plant in their organization
- **Domain Admin**: Can edit any plant in their domain
- **Application User**: Can only edit plants in their assigned plot

## Plant Types & Varieties Permissions

### View/Search/Filter Permissions
- **All Roles**: Can view, search, and filter plant types and varieties in their organization

### Create Permissions
- **Super Admin**: Can create plant types and varieties anywhere
- **Org Admin**: Can create plant types and varieties within their organization
- **Domain Admin**: Can create plant types and varieties within their organization
- **Application User**: Can create plant types and varieties within their organization

### Edit Permissions
- **Super Admin**: Can edit any plant type or variety
- **Org Admin**: Can edit any plant type or variety within their organization
- **Domain Admin**: Can edit any plant type or variety within their domain
- **Application User**: Can only edit plant types and varieties they created

### Delete Permissions
- **Super Admin**: Can delete any plant type or variety
- **Org Admin**: Can delete any plant type or variety within their organization
- **Domain Admin**: Can delete any plant type or variety within their domain
- **Application User**: Can only delete plant types and varieties they created

## Implementation Details

### Helper Function: `canEditPlant(user, plant)`
This function determines if a user has permission to edit a specific plant:

```javascript
const canEditPlant = (user, plant) => {
  // Super admin can edit any plant
  if (user.role === 'super_admin') return true;
  
  // Org admin can edit any plant in their organization
  if (user.role === 'org_admin' && plant.organizationId.toString() === user.organizationId.toString()) return true;
  
  // Domain admin can edit any plant in their domain
  if (user.role === 'domain_admin' && 
      plant.organizationId.toString() === user.organizationId.toString() &&
      plant.domainId.toString() === user.domainId.toString()) return true;
  
  // Application user can only edit plants in their assigned plot
  if (user.role === 'application_user' && 
      plant.organizationId.toString() === user.organizationId.toString() &&
      plant.plotId.toString() === user.plotId.toString()) return true;
  
  return false;
};
```

### API Endpoints Updated

#### 1. GET /api/plants
- **View**: Application users can see all plants in their organization
- **Response**: Each plant includes an `editable` flag indicating if the user can edit it

#### 2. GET /api/plants/:id
- **View**: Application users can view any plant in their organization
- **Response**: Plant includes an `editable` flag

#### 3. POST /api/plants
- **Create**: Application users can only create plants in their assigned plot
- **Validation**: Automatically sets plotId to user's assigned plot

#### 4. PUT /api/plants/:id
- **Update**: Checks permissions before allowing updates
- **Error**: Returns 403 if user doesn't have permission

#### 5. DELETE /api/plants/:id
- **Delete**: Checks permissions before allowing deletion
- **Error**: Returns 403 if user doesn't have permission

#### 6. POST /api/plants/:id/status
- **Status Update**: Checks permissions before allowing status updates
- **Error**: Returns 403 if user doesn't have permission

## Frontend Integration

### Editable Flag
Each plant object returned by the API includes an `editable` boolean flag:

```javascript
{
  _id: "plant_id",
  name: "Tomato Plant",
  // ... other plant properties
  editable: true // or false based on user permissions
}
```

### UI Recommendations
- Show edit/delete buttons only when `plant.editable === true`
- Disable form inputs when `plant.editable === false`
- Show appropriate error messages when permission is denied

## Error Messages

When permission is denied, the API returns a 403 status with these messages:

- **Update**: "You do not have permission to edit this plant. You can only edit plants in your assigned plot."
- **Delete**: "You do not have permission to delete this plant. You can only delete plants in your assigned plot."
- **Status Update**: "You do not have permission to update this plant. You can only update plants in your assigned plot."
- **Create**: "You can only create plants in your assigned plot."

## Testing

Run the test script to verify permissions:

```bash
node testPlantPermissions.js
```

This will test all user roles and their permissions on various plants.

## Security Considerations

1. **Server-side validation**: All permission checks are performed on the server
2. **No client-side bypass**: Frontend can't bypass permission checks
3. **Consistent enforcement**: All plant operations (CRUD) enforce permissions
4. **Role-based access**: Permissions are tied to user roles and organizational hierarchy

## Example Usage

### Application User Experience
1. User logs in and is assigned to Plot A
2. User can view all plants in their organization (Plots A, B, C, etc.)
3. User can only edit/delete plants in Plot A
4. User can only create new plants in Plot A
5. UI shows edit buttons only for plants in Plot A

### API Response Example
```javascript
// GET /api/plants response
{
  "success": true,
  "data": [
    {
      "_id": "plant1",
      "name": "Tomato in Plot A",
      "plotId": "plotA",
      "editable": true  // User can edit (in their plot)
    },
    {
      "_id": "plant2", 
      "name": "Tomato in Plot B",
      "plotId": "plotB",
      "editable": false // User cannot edit (not in their plot)
    }
  ]
}
```
