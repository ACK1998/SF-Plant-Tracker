export const userRoles = [
  { value: 'org_admin', label: 'Organization Admin' },
  { value: 'domain_admin', label: 'Domain Admin' },
  { value: 'application_user', label: 'Application User' },
];

// Function to get available roles based on current user's role
export const getAvailableRoles = (currentUserRole) => {
  if (currentUserRole === 'super_admin') {
    return [
      { value: 'application_user', label: 'Application User' },
      { value: 'domain_admin', label: 'Domain Admin' },
      { value: 'org_admin', label: 'Organization Admin' },
      { value: 'super_admin', label: 'Super Admin' },
    ];
  }
  
  if (currentUserRole === 'org_admin') {
    return [
      { value: 'application_user', label: 'Application User' },
      { value: 'domain_admin', label: 'Domain Admin' },
    ];
  }
  
  if (currentUserRole === 'domain_admin') {
    return [
      { value: 'application_user', label: 'Application User' },
    ];
  }
  
  // Default fallback
  return [
    { value: 'application_user', label: 'Application User' },
  ];
};

export const defaultUser = {
  id: 1,
  name: 'John Doe',
  email: 'john.doe@sanctityferme.com',
  role: 'super_admin',
  organizationId: 1,
  domainId: null,
  plotId: null,
  joinDate: '2024-01-01',
  avatar: null,
};

export const userProfiles = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@sanctityferme.com',
    role: 'super_admin',
    organizationId: 1,
    domainId: null,
    plotId: null,
    joinDate: '2024-01-01',
    avatar: null,
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane.smith@sanctityferme.com',
    role: 'org_admin',
    organizationId: 1,
    domainId: null,
    plotId: null,
    joinDate: '2024-01-15',
    avatar: null,
  },
  {
    id: 3,
    name: 'Mike Johnson',
    email: 'mike.johnson@sanctityferme.com',
    role: 'domain_admin',
    organizationId: 1,
    domainId: 1,
    plotId: null,
    joinDate: '2023-12-01',
    avatar: null,
  },
  {
    id: 4,
    name: 'Sarah Wilson',
    email: 'sarah.wilson@sanctityferme.com',
    role: 'application_user',
    organizationId: 1,
    domainId: 1,
    plotId: 1,
    joinDate: '2024-02-01',
    avatar: null,
  },
]; 