export const organizationsData = [
  {
    id: 1,
    name: 'Sanctity Ferme',
    description: 'Main agricultural organization',
    address: '123 Farm Road, Agricultural District',
    contactEmail: 'info@sanctityferme.com',
    contactPhone: '+1-555-0123',
    createdAt: '2024-01-01',
    createdBy: 1,
    isActive: true,
  },
  {
    id: 2,
    name: 'Green Valley Farms',
    description: 'Organic farming cooperative',
    address: '456 Valley Lane, Green District',
    contactEmail: 'contact@greenvalleyfarms.com',
    contactPhone: '+1-555-0456',
    createdAt: '2024-01-15',
    createdBy: 1,
    isActive: true,
  },
];

export const createOrganization = (orgData) => {
  const newOrg = {
    id: Date.now(),
    ...orgData,
    createdAt: new Date().toISOString().split('T')[0],
    isActive: true,
  };
  return newOrg;
}; 