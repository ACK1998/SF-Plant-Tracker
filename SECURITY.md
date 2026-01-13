# Security Guidelines

## ⚠️ CRITICAL: Never Commit Credentials

**NEVER commit the following to GitHub:**
- Passwords (plain text or hashed)
- API keys
- Secret keys
- Database connection strings with credentials
- Email addresses with associated passwords
- Private keys
- Access tokens

## Environment Variables

All sensitive data must be stored in environment variables and loaded from `.env` files, which are already in `.gitignore`.

### Required Environment Variables

#### Backend Setup (`backend/setupDatabase.js`)
- `SUPERADMIN_EMAIL` - Super admin email address
- `SUPERADMIN_PASSWORD` - Super admin password
- `ORGADMIN_EMAIL` - Organization admin email
- `ORGADMIN_PASSWORD` - Organization admin password
- `DOMAINADMIN_EMAIL` - Domain admin email
- `DOMAINADMIN_PASSWORD` - Domain admin password
- `APPUSER_EMAIL` - Application user email
- `APPUSER_PASSWORD` - Application user password

#### Testing (`tests/user-management.spec.ts`)
- `TEST_SUPERADMIN_EMAIL` - Test super admin email
- `TEST_SUPERADMIN_PASSWORD` - Test super admin password
- `TEST_ORGADMIN_EMAIL` - Test org admin email
- `TEST_ORGADMIN_PASSWORD` - Test org admin password
- `TEST_DOMAINADMIN_EMAIL` - Test domain admin email
- `TEST_DOMAINADMIN_PASSWORD` - Test domain admin password

## Pre-Commit Checklist

Before committing code, verify:
- [ ] No hardcoded passwords
- [ ] No hardcoded API keys
- [ ] No database connection strings with credentials
- [ ] All sensitive data uses environment variables
- [ ] `.env` files are not staged for commit

## If Credentials Are Accidentally Committed

If credentials are accidentally committed:

1. **Immediately rotate/change all exposed credentials**
2. Remove the credentials from git history:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch path/to/file" \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. Force push (coordinate with team):
   ```bash
   git push origin --force --all
   ```
4. Consider using tools like `git-secrets` or `git-hooks` to prevent future commits

## Best Practices

1. Always use environment variables for sensitive data
2. Use `.env.example` files to document required variables (without values)
3. Review code changes before committing
4. Use pre-commit hooks to scan for secrets
5. Never share credentials in chat, email, or documentation

## Tools to Prevent Secret Exposure

- `git-secrets` - AWS tool to prevent committing secrets
- `truffleHog` - Scans git history for secrets
- `detect-secrets` - Detects secrets in codebase
- GitHub Secret Scanning - Automatically enabled on GitHub repos
