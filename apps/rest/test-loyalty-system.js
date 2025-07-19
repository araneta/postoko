// Test script for Loyalty Points System
// This script demonstrates the basic functionality of the loyalty system

const BASE_URL = 'http://localhost:3000/api'; // Adjust to your server URL
const AUTH_TOKEN = 'your-auth-token-here'; // Replace with actual token

// Test data
const testCustomerId = 'test-customer-123';
const testOrderId = 'test-order-456';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            ...options.headers
        },
        ...options
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${data.message || 'Unknown error'}`);
        }
        
        return data;
    } catch (error) {
        console.error(`API call failed: ${error.message}`);
        throw error;
    }
}

// Test functions
async function testLoyaltySystem() {
    console.log('🧪 Testing Loyalty Points System\n');

    try {
        // 1. Get loyalty settings
        console.log('1. Getting loyalty settings...');
        const settings = await apiCall('/loyalty/settings');
        console.log('✅ Settings retrieved:', settings);
        console.log('');

        // 2. Get customer points (should create new record)
        console.log('2. Getting customer points...');
        const points = await apiCall(`/loyalty/customers/${testCustomerId}/points`);
        console.log('✅ Customer points:', points);
        console.log('');

        // 3. Earn points from a purchase
        console.log('3. Earning points from purchase...');
        const earnResult = await apiCall('/loyalty/earn', {
            method: 'POST',
            body: JSON.stringify({
                customerId: testCustomerId,
                orderId: testOrderId,
                amount: '50.00'
            })
        });
        console.log('✅ Points earned:', earnResult);
        console.log('');

        // 4. Check updated points balance
        console.log('4. Checking updated points balance...');
        const updatedPoints = await apiCall(`/loyalty/customers/${testCustomerId}/points`);
        console.log('✅ Updated points:', updatedPoints);
        console.log('');

        // 5. Get transaction history
        console.log('5. Getting transaction history...');
        const transactions = await apiCall(`/loyalty/customers/${testCustomerId}/transactions`);
        console.log('✅ Transactions:', transactions);
        console.log('');

        // 6. Redeem points for discount
        console.log('6. Redeeming points for discount...');
        const redeemResult = await apiCall('/loyalty/redeem', {
            method: 'POST',
            body: JSON.stringify({
                customerId: testCustomerId,
                pointsToRedeem: 25,
                orderId: 'test-order-789'
            })
        });
        console.log('✅ Points redeemed:', redeemResult);
        console.log('');

        // 7. Check final points balance
        console.log('7. Checking final points balance...');
        const finalPoints = await apiCall(`/loyalty/customers/${testCustomerId}/points`);
        console.log('✅ Final points:', finalPoints);
        console.log('');

        // 8. Update loyalty settings
        console.log('8. Updating loyalty settings...');
        const updatedSettings = await apiCall('/loyalty/settings', {
            method: 'PUT',
            body: JSON.stringify({
                pointsPerDollar: '2.00',
                redemptionRate: '0.02',
                minimumRedemption: 50,
                enabled: true
            })
        });
        console.log('✅ Settings updated:', updatedSettings);
        console.log('');

        console.log('🎉 All tests completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Test error scenarios
async function testErrorScenarios() {
    console.log('\n🧪 Testing Error Scenarios\n');

    try {
        // Test insufficient points
        console.log('1. Testing insufficient points redemption...');
        await apiCall('/loyalty/redeem', {
            method: 'POST',
            body: JSON.stringify({
                customerId: testCustomerId,
                pointsToRedeem: 10000 // More than available
            })
        });
    } catch (error) {
        console.log('✅ Expected error caught:', error.message);
    }

    try {
        // Test missing required fields
        console.log('2. Testing missing required fields...');
        await apiCall('/loyalty/earn', {
            method: 'POST',
            body: JSON.stringify({
                customerId: testCustomerId
                // Missing orderId and amount
            })
        });
    } catch (error) {
        console.log('✅ Expected error caught:', error.message);
    }

    console.log('\n🎉 Error scenario tests completed!');
}

// Run tests
async function runTests() {
    console.log('🚀 Starting Loyalty Points System Tests\n');
    
    await testLoyaltySystem();
    await testErrorScenarios();
    
    console.log('\n✨ All tests finished!');
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testLoyaltySystem,
        testErrorScenarios,
        runTests,
        apiCall
    };
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
    runTests();
} 