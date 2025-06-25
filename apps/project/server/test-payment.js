const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

async function testPaymentIntegration() {
  console.log('🧪 Testing Payment Integration...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health Check:', healthData);
    console.log('');

    // Test 2: Create Payment Intent
    console.log('2. Testing Payment Intent Creation...');
    const intentResponse = await fetch(`${BASE_URL}/payments/create-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 25.99,
        currency: 'usd'
      }),
    });
    
    if (intentResponse.ok) {
      const intentData = await intentResponse.json();
      console.log('✅ Payment Intent Created:', {
        id: intentData.id,
        amount: intentData.amount,
        currency: intentData.currency,
        status: intentData.status
      });
    } else {
      const errorData = await intentResponse.json();
      console.log('❌ Payment Intent Failed:', errorData);
    }
    console.log('');

    // Test 3: Test Card Payment
    console.log('3. Testing Card Payment Processing...');
    const cardResponse = await fetch(`${BASE_URL}/payments/process-card`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cardNumber: '4242424242424242', // Stripe test card
        expiryMonth: 12,
        expiryYear: 25,
        cvc: '123',
        amount: 15.50
      }),
    });
    
    if (cardResponse.ok) {
      const cardData = await cardResponse.json();
      console.log('✅ Card Payment Processed:', {
        success: cardData.success,
        transactionId: cardData.transactionId,
        amount: cardData.amount,
        cardLast4: cardData.cardLast4
      });
    } else {
      const errorData = await cardResponse.json();
      console.log('❌ Card Payment Failed:', errorData);
    }
    console.log('');

    // Test 4: Test Digital Wallet Payment
    console.log('4. Testing Digital Wallet Payment...');
    const walletResponse = await fetch(`${BASE_URL}/payments/process-wallet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletType: 'apple_pay',
        amount: 10.00
      }),
    });
    
    if (walletResponse.ok) {
      const walletData = await walletResponse.json();
      console.log('✅ Wallet Payment Processed:', {
        success: walletData.success,
        transactionId: walletData.transactionId,
        amount: walletData.amount,
        walletType: walletData.walletType
      });
    } else {
      const errorData = await walletResponse.json();
      console.log('❌ Wallet Payment Failed:', errorData);
    }
    console.log('');

    // Test 5: Test Products API
    console.log('5. Testing Products API...');
    const productsResponse = await fetch(`${BASE_URL}/products`);
    if (productsResponse.ok) {
      const products = await productsResponse.json();
      console.log('✅ Products Retrieved:', products.length, 'products');
    } else {
      console.log('❌ Products API Failed');
    }
    console.log('');

    // Test 6: Test Settings API
    console.log('6. Testing Settings API...');
    const settingsResponse = await fetch(`${BASE_URL}/settings`);
    if (settingsResponse.ok) {
      const settings = await settingsResponse.json();
      console.log('✅ Settings Retrieved:', {
        currency: settings.currency?.code,
        storeName: settings.storeInfo?.name
      });
    } else {
      console.log('❌ Settings API Failed');
    }
    console.log('');

    console.log('🎉 Payment Integration Test Complete!');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('1. Update Stripe API keys in payment-server.js');
    console.log('2. Start the payment server: npm run payment');
    console.log('3. Test the frontend payment modal');
    console.log('4. Check the documentation: docs/PAYMENT_INTEGRATION.md');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Make sure the payment server is running');
    console.log('2. Check if port 3000 is available');
    console.log('3. Verify all dependencies are installed');
  }
}

// Run the test
testPaymentIntegration(); 