#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Pre-Deployment Testing Suite...\n');

const testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

function runTest(testName, command, description = '') {
  console.log(`\n🧪 Running: ${testName}`);
  if (description) console.log(`   ${description}`);
  
  try {
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      timeout: 300000 // 5 minutes timeout
    });
    
    console.log(`✅ ${testName} - PASSED`);
    testResults.passed++;
    testResults.total++;
    
    return { success: true, output };
  } catch (error) {
    console.log(`❌ ${testName} - FAILED`);
    console.log(`   Error: ${error.message}`);
    if (error.stdout) console.log(`   Output: ${error.stdout}`);
    if (error.stderr) console.log(`   Error Output: ${error.stderr}`);
    
    testResults.failed++;
    testResults.total++;
    
    return { success: false, error: error.message };
  }
}

function checkEnvironment() {
  console.log('🔍 Checking Environment...');
  
  const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'NODE_ENV'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log(`❌ Missing environment variables: ${missingVars.join(', ')}`);
    return false;
  }
  
  console.log('✅ Environment variables are set');
  return true;
}

function checkDependencies() {
  console.log('\n📦 Checking Dependencies...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    console.log(`✅ Found ${Object.keys(dependencies).length} dependencies`);
    return true;
  } catch (error) {
    console.log(`❌ Error reading package.json: ${error.message}`);
    return false;
  }
}

function runSecurityAudit() {
  return runTest(
    'Security Audit',
    'npm audit --audit-level=moderate',
    'Checking for security vulnerabilities in dependencies'
  );
}

function runLinting() {
  return runTest(
    'Code Linting',
    'npx eslint . --ext .js --ignore-pattern "node_modules/*" --ignore-pattern "coverage/*"',
    'Checking code quality and style'
  );
}

function runUnitTests() {
  return runTest(
    'Unit Tests',
    'npm run test:api',
    'Running API endpoint tests'
  );
}

function runSecurityTests() {
  return runTest(
    'Security Tests',
    'npm run test:security',
    'Running security vulnerability tests'
  );
}

function runPerformanceTests() {
  return runTest(
    'Performance Tests',
    'npm run test:performance',
    'Running performance and load tests'
  );
}

function runIntegrationTests() {
  return runTest(
    'Integration Tests',
    'npm run test:all',
    'Running all integration tests'
  );
}

function checkTestCoverage() {
  return runTest(
    'Test Coverage',
    'npm run test:coverage',
    'Checking test coverage percentage'
  );
}

function runDatabaseTests() {
  return runTest(
    'Database Tests',
    'node testDatabaseConnection.js',
    'Testing database connectivity and operations'
  );
}

function checkBuildProcess() {
  return runTest(
    'Build Process',
    'npm run build',
    'Testing production build process'
  );
}

function generateReport() {
  console.log('\n📊 Test Results Summary:');
  console.log(`   Total Tests: ${testResults.total}`);
  console.log(`   Passed: ${testResults.passed} ✅`);
  console.log(`   Failed: ${testResults.failed} ❌`);
  console.log(`   Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n🚨 DEPLOYMENT BLOCKED: Some tests failed!');
    console.log('   Please fix the failing tests before deploying to production.');
    process.exit(1);
  } else {
    console.log('\n🎉 ALL TESTS PASSED! Ready for deployment.');
  }
}

// Main execution
async function main() {
  console.log('='.repeat(60));
  console.log('   SANCTITY FERME PLANT TRACKER');
  console.log('   PRE-DEPLOYMENT TESTING SUITE');
  console.log('='.repeat(60));
  
  // Environment checks
  const envOk = checkEnvironment();
  const depsOk = checkDependencies();
  
  if (!envOk || !depsOk) {
    console.log('\n❌ Environment or dependency checks failed. Exiting.');
    process.exit(1);
  }
  
  // Run all tests
  const tests = [
    runSecurityAudit,
    runLinting,
    runUnitTests,
    runSecurityTests,
    runPerformanceTests,
    runIntegrationTests,
    checkTestCoverage,
    runDatabaseTests,
    checkBuildProcess
  ];
  
  for (const test of tests) {
    const result = test();
    if (!result.success) {
      console.log(`\n⚠️  Test failed, but continuing with other tests...`);
    }
  }
  
  // Generate final report
  generateReport();
}

// Handle script execution
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Pre-deployment test suite failed:', error);
    process.exit(1);
  });
}

module.exports = { runTest, checkEnvironment, checkDependencies };
