export const domainsData = [
  {
    id: 1,
    name: 'Phase 1 - North Field',
    description: 'Northern section of the farm with plots 1-50',
    organizationId: 1,
    location: 'North Field Area',
    totalPlots: 50,
    createdAt: '2024-01-01',
    createdBy: 1,
    isActive: true,
  },
  {
    id: 2,
    name: 'Phase 2 - South Field',
    description: 'Southern section of the farm with plots 51-100',
    organizationId: 1,
    location: 'South Field Area',
    totalPlots: 50,
    createdAt: '2024-01-15',
    createdBy: 2,
    isActive: true,
  },
  {
    id: 3,
    name: 'Greenhouse Complex A',
    description: 'Controlled environment growing area',
    organizationId: 1,
    location: 'Greenhouse Area A',
    totalPlots: 25,
    createdAt: '2024-02-01',
    createdBy: 2,
    isActive: true,
  },
];

export const createDomain = (domainData) => {
  const newDomain = {
    id: Date.now(),
    ...domainData,
    createdAt: new Date().toISOString().split('T')[0],
    isActive: true,
  };
  return newDomain;
}; 