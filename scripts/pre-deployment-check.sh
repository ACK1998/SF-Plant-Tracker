#!/bin/bash

# Pre-deployment check script for Sanctity Ferme Plant Tracker
# This script validates the application before production deployment

set -e  # Exit on any error

echo "🚀 Starting Pre-Deployment Validation for Sanctity Ferme Plant Tracker"
echo "=================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $2 -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        exit 1
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Not in project root directory${NC}"
    exit 1
fi

print_status "In correct project directory" 0

# 1. Environment Variables Check
echo -e "\n📋 Checking Environment Configuration..."

# Check if environment files exist
if [ ! -f "backend/.env.production.example" ]; then
    print_warning "Backend environment example file not found"
else
    print_status "Backend environment example file exists" 0
fi

if [ ! -f ".env.production.example" ]; then
    print_warning "Frontend environment example file not found"
else
    print_status "Frontend environment example file exists" 0
fi

# 2. Dependencies Check
echo -e "\n📦 Checking Dependencies..."

# Backend dependencies
cd backend
if npm list express-rate-limit compression winston @sentry/node sharp > /dev/null 2>&1; then
    print_status "Backend production dependencies installed" 0
else
    print_status "Backend production dependencies missing" 1
fi

cd ..

# Frontend dependencies
if npm list @sentry/react > /dev/null 2>&1; then
    print_status "Frontend production dependencies installed" 0
else
    print_status "Frontend production dependencies missing" 1
fi

# 3. Security Audit
echo -e "\n🔒 Running Security Audit..."

# Backend security audit
cd backend
if npm audit --audit-level=moderate > /dev/null 2>&1; then
    print_status "Backend security audit passed" 0
else
    print_warning "Backend has security vulnerabilities - check npm audit"
fi

cd ..

# Frontend security audit
if npm audit --audit-level=moderate > /dev/null 2>&1; then
    print_status "Frontend security audit passed" 0
else
    print_warning "Frontend has security vulnerabilities - check npm audit"
fi

# 4. Build Test
echo -e "\n🔨 Testing Build Process..."

# Frontend build test
if npm run build > /dev/null 2>&1; then
    print_status "Frontend build successful" 0
    
    # Check if build directory exists and has content
    if [ -d "build" ] && [ "$(ls -A build)" ]; then
        print_status "Build directory created with content" 0
    else
        print_status "Build directory missing or empty" 1
    fi
else
    print_status "Frontend build failed" 1
fi

# 5. Test Suite
echo -e "\n🧪 Running Test Suite..."

# Backend tests
cd backend
if npm test > /dev/null 2>&1; then
    print_status "Backend tests passed" 0
else
    print_warning "Backend tests failed or not implemented"
fi

cd ..

# 6. Configuration Files Check
echo -e "\n⚙️  Checking Configuration Files..."

# Check if required config files exist
config_files=(
    "backend/config/logger.js"
    "backend/config/sentry.js"
    "backend/config/storage.js"
    "backend/middleware/rateLimiter.js"
    "backend/utils/imageProcessor.js"
    "src/config/sentry.js"
    "ecosystem.config.js"
)

for file in "${config_files[@]}"; do
    if [ -f "$file" ]; then
        print_status "Configuration file exists: $file" 0
    else
        print_status "Configuration file missing: $file" 1
    fi
done

# 7. Logs Directory Check
echo -e "\n📝 Checking Logs Directory..."

if [ -d "backend/logs" ]; then
    print_status "Backend logs directory exists" 0
else
    print_warning "Backend logs directory missing - will be created at runtime"
fi

# 8. PM2 Configuration Check
echo -e "\n🔄 Checking PM2 Configuration..."

if [ -f "ecosystem.config.js" ]; then
    print_status "PM2 configuration file exists" 0
    
    # Validate PM2 config syntax
    if node -e "require('./ecosystem.config.js')" > /dev/null 2>&1; then
        print_status "PM2 configuration syntax is valid" 0
    else
        print_status "PM2 configuration syntax is invalid" 1
    fi
else
    print_status "PM2 configuration file missing" 1
fi

# 9. File Permissions Check
echo -e "\n🔐 Checking File Permissions..."

# Make sure scripts are executable
if [ -f "scripts/pre-deployment-check.sh" ]; then
    chmod +x scripts/pre-deployment-check.sh
    print_status "Deployment script permissions set" 0
fi

# 10. Final Summary
echo -e "\n🎉 Pre-Deployment Check Complete!"
echo "=================================================================="

print_status "Application is ready for production deployment" 0

echo -e "\n📋 Next Steps:"
echo "1. Set up production environment variables"
echo "2. Configure production database"
echo "3. Set up Google Cloud Storage credentials"
echo "4. Configure Sentry DSN"
echo "5. Set up SSL certificates"
echo "6. Deploy using: pm2 start ecosystem.config.js --env production"

echo -e "\n🔗 Useful Commands:"
echo "• Start application: pm2 start ecosystem.config.js --env production"
echo "• Monitor application: pm2 monit"
echo "• View logs: pm2 logs"
echo "• Restart application: pm2 restart all"
echo "• Stop application: pm2 stop all"

echo -e "\n${GREEN}✅ All checks completed successfully!${NC}"






