import { test, expect } from "@playwright/test";

// Test data
const testUsers = {
  applicationUser: {
    firstName: "App",
    lastName: "User",
    username: "appuser",
    email: "appuser@sanctityferme.com",
    password: "Password123!",
    phone: "9876543210",
    role: "application_user"
  },
  domainAdmin: {
    firstName: "Domain",
    lastName: "Admin",
    username: "domainadmin",
    email: "domainadmin@sanctityferme.com",
    password: "SecurePass123!",
    phone: "9876500001",
    role: "domain_admin"
  },
  appUser2: {
    firstName: "App",
    lastName: "User2",
    username: "appuser2",
    email: "appuser2@sanctityferme.com",
    password: "SecurePass123!",
    phone: "9876500002",
    role: "application_user"
  }
};

// Helper function to login
async function login(page: any, email: string, password: string) {
  await page.goto("http://localhost:3000/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button:has-text("Login")');
  await page.waitForURL("http://localhost:3000/**");
}

// Helper function to wait for success message
async function waitForSuccessMessage(page: any) {
  await expect(page.locator(".success-message, [data-testid='success-message']")).toContainText("successfully");
}

test.describe("User Management Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Login as super admin for all tests
    await login(page, "superadmin@sanctityferme.com", "1234567");
  });

  test.describe("Application User Management", () => {
    test("Edit Application User with domain and plot selection", async ({ page }) => {
      await page.goto("http://localhost:3000/users");

      // Open Edit User modal for application user
      await page.click('text=appuser@sanctityferme.com >> .. >> button:has-text("Edit")');

      // Wait for modal to appear
      await page.waitForSelector('h2:has-text("Edit User")');

      // Fill personal information
      await page.fill('input[name="firstName"]', testUsers.applicationUser.firstName);
      await page.fill('input[name="lastName"]', testUsers.applicationUser.lastName);
      await page.fill('input[name="username"]', testUsers.applicationUser.username);
      await page.fill('input[name="email"]', testUsers.applicationUser.email);
      await page.fill('input[name="password"]', testUsers.applicationUser.password);
      await page.fill('input[name="phone"]', testUsers.applicationUser.phone);

      // Select role
      await page.selectOption('select[name="role"]', testUsers.applicationUser.role);

      // Organization should be auto-selected and locked for non-super admins
      const orgSelect = page.locator('select[name="organizationId"]');
      await expect(orgSelect).toHaveValue(/.*/); // Should have a value

      // Select domain (should be populated with domains from the organization)
      await page.waitForSelector('select[name="domainId"] option:not([value=""])');
      await page.selectOption('select[name="domainId"]', /.*/); // Select any available domain

      // Select plot (should be populated with plots from the domain)
      await page.waitForSelector('select[name="plotId"] option:not([value=""])');
      await page.selectOption('select[name="plotId"]', /.*/); // Select any available plot

      // Submit the form
      await page.click('button:has-text("Update User")');

      // Verify success message
      await waitForSuccessMessage(page);

      // Verify user list refreshes
      await page.waitForURL("http://localhost:3000/users");
      await expect(page.locator('text=appuser@sanctityferme.com')).toBeVisible();
    });

    test("Create new Application User", async ({ page }) => {
      await page.goto("http://localhost:3000/users");

      // Click Add User button
      await page.click('button:has-text("Add User")');

      // Wait for modal to appear
      await page.waitForSelector('h2:has-text("Add New User")');

      // Fill personal information
      await page.fill('input[name="firstName"]', "New");
      await page.fill('input[name="lastName"]', "AppUser");
      await page.fill('input[name="username"]', "newappuser");
      await page.fill('input[name="email"]', "newappuser@sanctityferme.com");
      await page.fill('input[name="password"]', "NewPass123!");
      await page.fill('input[name="phone"]', "9876543211");

      // Select role first
      await page.selectOption('select[name="role"]', "application_user");

      // Select organization
      await page.selectOption('select[name="organizationId"]', /.*/);

      // Wait for domain dropdown to be populated
      await page.waitForSelector('select[name="domainId"] option:not([value=""])');
      await page.selectOption('select[name="domainId"]', /.*/);

      // Wait for plot dropdown to be populated
      await page.waitForSelector('select[name="plotId"] option:not([value=""])');
      await page.selectOption('select[name="plotId"]', /.*/);

      // Submit the form
      await page.click('button:has-text("Add User")');

      // Verify success message
      await waitForSuccessMessage(page);

      // Verify new user appears in list
      await page.waitForURL("http://localhost:3000/users");
      await expect(page.locator('text=newappuser@sanctityferme.com')).toBeVisible();
    });
  });

  test.describe("Organization Admin Flows", () => {
    test("Org Admin creates Domain Admin - org auto-selected, must pick domain", async ({ page }) => {
      // Login as org admin
      await page.goto("http://localhost:3000/login");
      await login(page, "orgadmin@sanctityferme.com", "1234567");

      await page.goto("http://localhost:3000/users");

      // Click Add User button
      await page.click('button:has-text("Add User")');

      // Wait for modal to appear
      await page.waitForSelector('h2:has-text("Add New User")');

      // Fill personal information
      await page.fill('input[name="firstName"]', testUsers.domainAdmin.firstName);
      await page.fill('input[name="lastName"]', testUsers.domainAdmin.lastName);
      await page.fill('input[name="username"]', testUsers.domainAdmin.username);
      await page.fill('input[name="email"]', testUsers.domainAdmin.email);
      await page.fill('input[name="password"]', testUsers.domainAdmin.password);
      await page.fill('input[name="phone"]', testUsers.domainAdmin.phone);

      // Select role
      await page.selectOption('select[name="role"]', "domain_admin");

      // Organization should be auto-selected and locked for org admin
      const orgSelect = page.locator('select[name="organizationId"]');
      await expect(orgSelect).toBeDisabled();
      await expect(orgSelect).toHaveValue(/.*/); // Should have a value

      // Domain field should be visible for domain_admin role
      await expect(page.locator('select[name="domainId"]')).toBeVisible();

      // Select domain
      await page.waitForSelector('select[name="domainId"] option:not([value=""])');
      await page.selectOption('select[name="domainId"]', /.*/);

      // Plot field should not be visible for domain_admin role
      await expect(page.locator('select[name="plotId"]')).not.toBeVisible();

      // Submit the form
      await page.click('button:has-text("Add User")');

      // Verify success message
      await waitForSuccessMessage(page);

      // Verify new user appears in list
      await page.waitForURL("http://localhost:3000/users");
      await expect(page.locator('text=domainadmin@sanctityferme.com')).toBeVisible();
    });

    test("Org Admin edits user - org auto-selected, must pick domain", async ({ page }) => {
      // Login as org admin
      await page.goto("http://localhost:3000/login");
      await login(page, "orgadmin@sanctityferme.com", "1234567");

      await page.goto("http://localhost:3000/users");

      // Open Edit User modal for an existing user
      await page.click('text=appuser@sanctityferme.com >> .. >> button:has-text("Edit")');

      // Wait for modal to appear
      await page.waitForSelector('h2:has-text("Edit User")');

      // Update personal information
      await page.fill('input[name="firstName"]', "Updated");
      await page.fill('input[name="lastName"]', "AppUser");
      await page.fill('input[name="phone"]', "9876543212");

      // Organization should be auto-selected and locked
      const orgSelect = page.locator('select[name="organizationId"]');
      await expect(orgSelect).toBeDisabled();

      // Domain must be selected
      await page.waitForSelector('select[name="domainId"] option:not([value=""])');
      await page.selectOption('select[name="domainId"]', /.*/);

      // Submit the form
      await page.click('button:has-text("Update User")');

      // Verify success message
      await waitForSuccessMessage(page);
    });
  });

  test.describe("Domain Admin Flows", () => {
    test("Domain Admin creates Application User - org & domain auto-selected, must pick plot", async ({ page }) => {
      // Login as domain admin
      await page.goto("http://localhost:3000/login");
      await login(page, "domadmin1@sanctityferme.com", "1234567");

      await page.goto("http://localhost:3000/users");

      // Click Add User button
      await page.click('button:has-text("Add User")');

      // Wait for modal to appear
      await page.waitForSelector('h2:has-text("Add New User")');

      // Fill personal information
      await page.fill('input[name="firstName"]', testUsers.appUser2.firstName);
      await page.fill('input[name="lastName"]', testUsers.appUser2.lastName);
      await page.fill('input[name="username"]', testUsers.appUser2.username);
      await page.fill('input[name="email"]', testUsers.appUser2.email);
      await page.fill('input[name="password"]', testUsers.appUser2.password);
      await page.fill('input[name="phone"]', testUsers.appUser2.phone);

      // Role should be restricted to Application User only
      const roleSelect = page.locator('select[name="role"]');
      await expect(roleSelect).toHaveValue("application_user");
      await expect(roleSelect).toBeDisabled();

      // Organization should be auto-selected and locked
      const orgSelect = page.locator('select[name="organizationId"]');
      await expect(orgSelect).toBeDisabled();
      await expect(orgSelect).toHaveValue(/.*/);

      // Domain should be auto-selected and locked
      const domainSelect = page.locator('select[name="domainId"]');
      await expect(domainSelect).toBeDisabled();
      await expect(domainSelect).toHaveValue(/.*/);

      // Plot field should be visible and required for application_user role
      await expect(page.locator('select[name="plotId"]')).toBeVisible();

      // Select plot
      await page.waitForSelector('select[name="plotId"] option:not([value=""])');
      await page.selectOption('select[name="plotId"]', /.*/);

      // Submit the form
      await page.click('button:has-text("Add User")');

      // Verify success message
      await waitForSuccessMessage(page);

      // Verify new user appears in list
      await page.waitForURL("http://localhost:3000/users");
      await expect(page.locator('text=appuser2@sanctityferme.com')).toBeVisible();
    });

    test("Domain Admin edits user - org & domain auto-selected, must pick plot", async ({ page }) => {
      // Login as domain admin
      await page.goto("http://localhost:3000/login");
      await login(page, "domadmin1@sanctityferme.com", "1234567");

      await page.goto("http://localhost:3000/users");

      // Open Edit User modal for an existing user
      await page.click('text=appuser@sanctityferme.com >> .. >> button:has-text("Edit")');

      // Wait for modal to appear
      await page.waitForSelector('h2:has-text("Edit User")');

      // Update personal information
      await page.fill('input[name="firstName"]', "Domain");
      await page.fill('input[name="lastName"]', "Managed");
      await page.fill('input[name="phone"]', "9876543213");

      // Org & Domain are auto-filled and locked
      await expect(page.locator('select[name="organizationId"]')).toBeDisabled();
      await expect(page.locator('select[name="domainId"]')).toBeDisabled();

      // Must select plot
      await page.waitForSelector('select[name="plotId"] option:not([value=""])');
      await page.selectOption('select[name="plotId"]', /.*/);

      // Submit the form
      await page.click('button:has-text("Update User")');

      // Verify success message
      await waitForSuccessMessage(page);
    });
  });

  test.describe("Field Validation and UI Behavior", () => {
    test("Last name field is optional", async ({ page }) => {
      await page.goto("http://localhost:3000/users");

      // Open Add User modal
      await page.click('button:has-text("Add User")');
      await page.waitForSelector('h2:has-text("Add New User")');

      // Check that Last Name field doesn't have required attribute
      const lastNameField = page.locator('input[name="lastName"]');
      await expect(lastNameField).not.toHaveAttribute("required");

      // Check that label doesn't have asterisk
      const lastNameLabel = page.locator('label:has-text("Last Name")');
      await expect(lastNameLabel).not.toContainText("*");
    });

    test("Role-based field visibility", async ({ page }) => {
      await page.goto("http://localhost:3000/users");

      // Open Add User modal
      await page.click('button:has-text("Add User")');
      await page.waitForSelector('h2:has-text("Add New User")');

      // Test Application User role
      await page.selectOption('select[name="role"]', "application_user");
      await expect(page.locator('select[name="domainId"]')).toBeVisible();
      await expect(page.locator('select[name="plotId"]')).toBeVisible();

      // Test Domain Admin role
      await page.selectOption('select[name="role"]', "domain_admin");
      await expect(page.locator('select[name="domainId"]')).toBeVisible();
      await expect(page.locator('select[name="plotId"]')).not.toBeVisible();

      // Test Organization Admin role
      await page.selectOption('select[name="role"]', "org_admin");
      await expect(page.locator('select[name="domainId"]')).not.toBeVisible();
      await expect(page.locator('select[name="plotId"]')).not.toBeVisible();
    });

    test("Self-editing restrictions", async ({ page }) => {
      // Login as domain admin
      await page.goto("http://localhost:3000/login");
      await login(page, "domadmin1@sanctityferme.com", "1234567");

      await page.goto("http://localhost:3000/users");

      // Try to edit own profile
      await page.click('text=domadmin1@sanctityferme.com >> .. >> button:has-text("Edit")');
      await page.waitForSelector('h2:has-text("Edit User")');

      // Role should be disabled when editing own profile
      await expect(page.locator('select[name="role"]')).toBeDisabled();

      // Organization should be disabled for domain admin editing own profile
      await expect(page.locator('select[name="organizationId"]')).toBeDisabled();

      // Domain should be disabled for domain admin editing own profile
      await expect(page.locator('select[name="domainId"]')).toBeDisabled();
    });
  });
});
