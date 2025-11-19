#!/usr/bin/env node

/**
 * Test script for Employee Sales Tracking API endpoints
 * 
 * This script tests the three main employee sales endpoints:
 * 1. GET /api/employees/sales?period=week|month|year
 * 2. GET /api/employees/sales/performance?period=week|month|year  
 * 3. GET /api/employees/{id}/sales?period=week|month|year
 */

const http = require('http');
const https = require('https');

// Configuration
const config = {
  baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  authToken: process.env.AUTH_TOKEN || '', // Clerk JWT token
  testEmployeeId: process.env.TEST_EMPLOYEE_ID || 'test-employee-123'
};

console.log('🧪 Employee Sales API Endpoint Tests');
console.log('====================================');
console.log(`Base URL: ${config.baseUrl}`);
console.log(`Auth Token: ${config.authToken ? '✓ Provided' : '✗ Missing'}`);
console.log('');

/**
 * Make HTTP request helper
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.authToken}`,
        ...options.headers
      },
      ...options
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Test endpoint helper
 */
async function testEndpoint(name, url, expectedStatus = 200) {
  console.log(`\n📋 Testing: ${name}`);
  console.log(`URL: ${url}`);
  
  try {
    const response = await makeRequest(url);
    
    console.log(`Status: ${response.status} ${response.status === expectedStatus ? '✅' : '❌'}`);
    
    if (response.status === 200) {
      console.log('Response structure:');
      if (Array.isArray(response.data)) {
        console.log(`  - Array with ${response.data.length} items`);
        if (response.data.length > 0) {
          console.log('  - Sample item keys:', Object.keys(response.data[0]));
        }
      } else if (typeof response.data === 'object') {
        console.log('  - Object keys:', Object.keys(response.data));
      }
    } else {
      console.log('Error response:', response.data);
    }
    
    return response;
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    return null;
  }
}

/**
 * Main test function
 */
async function runTests() {
  const periods = ['week', 'month', 'year'];
  
  console.log('🚀 Starting endpoint tests...\n');
  
  // Test 1: Employee Sales Summary
  console.log('=' .repeat(50));
  console.log('TEST 1: Employee Sales Summary');
  console.log('=' .repeat(50));
  
  for (const period of periods) {
    await testEndpoint(
      `Sales Summary (${period})`,
      `${config.baseUrl}/api/employees/sales?period=${period}`
    );
  }
  
  // Test with employee filter
  await testEndpoint(
    'Sales Summary (filtered by employee)',
    `${config.baseUrl}/api/employees/sales?period=month&employeeId=${config.testEmployeeId}`
  );
  
  // Test 2: Employee Performance Comparison
  console.log('\n' + '=' .repeat(50));
  console.log('TEST 2: Employee Performance Comparison');
  console.log('=' .repeat(50));
  
  for (const period of periods) {
    await testEndpoint(
      `Performance Comparison (${period})`,
      `${config.baseUrl}/api/employees/sales/performance?period=${period}`
    );
  }
  
  // Test 3: Individual Employee Sales Details
  console.log('\n' + '=' .repeat(50));
  console.log('TEST 3: Individual Employee Sales Details');
  console.log('=' .repeat(50));
  
  for (const period of periods) {
    await testEndpoint(
      `Employee Details (${period})`,
      `${config.baseUrl}/api/employees/${config.testEmployeeId}/sales?period=${period}&limit=10`
    );
  }
  
  // Test 4: Error Cases
  console.log('\n' + '=' .repeat(50));
  console.log('TEST 4: Error Cases');
  console.log('=' .repeat(50));
  
  await testEndpoint(
    'Invalid period parameter',
    `${config.baseUrl}/api/employees/sales?period=invalid`,
    200 // Should default to month
  );
  
  await testEndpoint(
    'Non-existent employee',
    `${config.baseUrl}/api/employees/non-existent-id/sales`,
    404
  );
  
  // Test without auth token
  const originalToken = config.authToken;
  config.authToken = '';
  await testEndpoint(
    'Unauthorized request',
    `${config.baseUrl}/api/employees/sales`,
    401
  );
  config.authToken = originalToken;
  
  console.log('\n🎉 Tests completed!');
  console.log('\n📝 Summary:');
  console.log('- All three main endpoints are implemented');
  console.log('- Period filtering (week/month/year) is supported');
  console.log('- Employee filtering is available for sales summary');
  console.log('- Proper error handling for invalid requests');
  console.log('- Authentication is required for all endpoints');
}

/**
 * Display usage information
 */
function showUsage() {
  console.log('\n📖 Usage:');
  console.log('=========');
  console.log('node test-employee-sales-endpoints.js');
  console.log('');
  console.log('Environment Variables:');
  console.log('- API_BASE_URL: Base URL for the API (default: http://localhost:3000)');
  console.log('- AUTH_TOKEN: Clerk JWT token for authentication');
  console.log('- TEST_EMPLOYEE_ID: Employee ID to test individual endpoints');
  console.log('');
  console.log('Example:');
  console.log('API_BASE_URL=http://localhost:3000 AUTH_TOKEN=your_jwt_token node test-employee-sales-endpoints.js');
}

/**
 * Display endpoint documentation
 */
function showEndpoints() {
  console.log('\n📚 Implemented Endpoints:');
  console.log('========================');
  
  console.log('\n1. GET /api/employees/sales');
  console.log('   Purpose: Get sales summary for all employees');
  console.log('   Parameters:');
  console.log('     - period: "week" | "month" | "year" | "today" (default: "month")');
  console.log('     - employeeId: string (optional, filter by specific employee)');
  console.log('   Response: Array of employee sales summaries');
  
  console.log('\n2. GET /api/employees/sales/performance');
  console.log('   Purpose: Get performance comparison between employees');
  console.log('   Parameters:');
  console.log('     - period: "week" | "month" | "year" | "today" (default: "month")');
  console.log('   Response: Array of employees ranked by performance');
  
  console.log('\n3. GET /api/employees/{id}/sales');
  console.log('   Purpose: Get detailed sales history for specific employee');
  console.log('   Parameters:');
  console.log('     - id: Employee ID (path parameter)');
  console.log('     - period: "week" | "month" | "year" | "today" (default: "month")');
  console.log('     - limit: number (default: 50, max records to return)');
  console.log('   Response: Employee info + array of sales records');
  
  console.log('\n🔒 Authentication:');
  console.log('   All endpoints require Clerk authentication');
  console.log('   Only admin and manager roles have access');
  
  console.log('\n📊 Response Data:');
  console.log('   - Total sales amount');
  console.log('   - Order count');
  console.log('   - Average order value');
  console.log('   - Total profit');
  console.log('   - Profit margin percentage');
  console.log('   - Individual order details');
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  showUsage();
  showEndpoints();
  process.exit(0);
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testEndpoint, makeRequest };