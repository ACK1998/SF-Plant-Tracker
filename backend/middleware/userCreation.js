// Middleware for User Creation Validation
function canCreateUser(req, res, next) {
  const { role, organizationId, domainId } = req.user;
  const { role: newUserRole, organizationId: newUserOrgId, domainId: newUserDomainId } = req.body;

  // Super admin can create any user
  if (role === "super_admin") return next();

  // Org admin cannot create super admins
  if (role === "org_admin") {
    if (newUserRole === "super_admin") {
      return res.status(403).json({ 
        error: "Forbidden",
        message: "Organization admins cannot create super admin users"
      });
    }
    
    // Handle organizationId comparison (could be object or string)
    const userOrgId = organizationId?._id || organizationId;
    const newUserOrgIdStr = newUserOrgId?._id || newUserOrgId;
    
    // Org admin can only create users in their organization
    // If newUserOrgId is provided and not empty, it must match the user's organization
    // If not provided or empty, we'll set it to the user's organization in the route handler
    if (newUserOrgIdStr && newUserOrgIdStr !== '' && String(newUserOrgIdStr) !== String(userOrgId)) {
      return res.status(403).json({ 
        error: "Invalid org",
        message: "You can only create users in your organization"
      });
    }
    
    // Ensure organizationId is set in req.body for org_admin (will be used in route handler)
    if (!newUserOrgIdStr || newUserOrgIdStr === '') {
      req.body.organizationId = String(userOrgId);
    }
    
    return next();
  }

  // Domain admin can only create application users in their domain
  if (role === "domain_admin") {
    if (newUserRole !== "application_user") {
      return res.status(403).json({ 
        error: "Domain admin can only create application users",
        message: "Domain admins can only create application users"
      });
    }
    
    // Handle domainId comparison (could be object or string)
    const userDomainId = domainId?._id || domainId;
    const newUserDomainIdStr = newUserDomainId?._id || newUserDomainId;
    
    if (newUserDomainIdStr && String(newUserDomainIdStr) !== String(userDomainId)) {
      return res.status(403).json({ 
        error: "Invalid domain",
        message: "You can only create users in your domain"
      });
    }
    
    return next();
  }

  return res.status(403).json({ 
    error: "Forbidden",
    message: "You do not have permission to create users"
  });
}

// Middleware for Plant Creation Validation
function validatePlantCreation(req, res, next) {
  const { role, organizationId, domainId, plotIds } = req.user;
  const { organizationId: plantOrg, domainId: plantDomain, plotId: plantPlot } = req.body;

  console.log('validatePlantCreation - User:', {
    role,
    organizationId: organizationId?._id || organizationId,
    domainId: domainId?._id || domainId,
    plotIds: plotIds?.map(p => p._id || p) || plotIds
  });
  console.log('validatePlantCreation - Request body:', {
    plantOrg: plantOrg?._id || plantOrg,
    plantDomain,
    plantPlot
  });

  // Plot selection is always required
  if (!plantPlot) {
    return res.status(400).json({ 
      error: "Plot selection is required",
      message: "Plot selection is required for all plant creation"
    });
  }

  // Super admin can create plants anywhere
  if (role === "super_admin") return next();

  // Handle organizationId comparison (could be object or string)
  const userOrgId = organizationId?._id || organizationId;
  const plantOrgId = plantOrg?._id || plantOrg;

  // Org admin can create plants in their organization
  if (role === "org_admin" && String(plantOrgId) === String(userOrgId)) return next();

  // Handle domainId comparison (could be object or string)
  const userDomainId = domainId?._id || domainId;
  const plantDomainId = plantDomain;

  // Domain admin can create plants in their domain
  if (role === "domain_admin" && String(plantDomainId) === String(userDomainId)) return next();

  // Handle plotIds comparison (could be object or string)
  const userPlotIds = plotIds?.map(p => p._id || p) || plotIds;
  const plantPlotId = plantPlot;

  // Application user can create plants in any of their assigned plots
  if (role === "application_user" && userPlotIds && userPlotIds.some(userPlotId => String(userPlotId) === String(plantPlotId))) return next();

  console.log('validatePlantCreation - Permission denied. Comparisons:', {
    role,
    userOrgId: String(userOrgId),
    plantOrgId: String(plantOrgId),
    userDomainId: String(userDomainId),
    plantDomainId: String(plantDomainId),
    userPlotIds: userPlotIds?.map(String),
    plantPlotId: String(plantPlotId)
  });

  return res.status(403).json({ 
    error: "Forbidden",
    message: "You do not have permission to create plants in this location"
  });
}

module.exports = {
  canCreateUser,
  validatePlantCreation
};
