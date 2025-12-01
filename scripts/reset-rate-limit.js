#!/usr/bin/env node

/**
 * Simple script to reset rate limiting by restarting the server
 * This clears the in-memory rate limit store
 */

console.log('🔄 Rate limiting will be reset when the server restarts...');
console.log('📝 Current rate limits:');
console.log('   - Auth endpoints: 5 requests per 15 minutes');
console.log('   - General API: 100 requests per 15 minutes');
console.log('   - File uploads: 10 requests per hour');
console.log('');
console.log('💡 To avoid rate limiting:');
console.log('   - Wait 15 minutes between failed login attempts');
console.log('   - Use correct credentials');
console.log('   - Check network connectivity');
console.log('');
console.log('🚀 Restart the server to clear rate limits immediately');


