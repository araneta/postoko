const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for demo purposes
// In production, use a proper database
let orders = [];
let products = [];
let settings = {};

// Initialize with sample data
const initializeSampleData = () => {
  products = [
    {
      id: '1',
      name: 'Sample Product 1',
      price: 10.99,
      description: 'A sample product for testing',
      stock: 100,
      category: 'General',
      barcode: '123456789'
    },
    {
      id: '2',
      name: 'Sample Product 2',
      price: 15.50,
      description: 'Another sample product',
      stock: 50,
      category: 'General',
      barcode: '987654321'
    }
  ];

  settings = {
    currency: {
      code: 'USD',
      symbol: '$',
      name: 'US Dollar'
    },
    storeInfo: {
      name: 'Sample Store',
      address: '123 Main St',
      phone: '(555) 123-4567',
      email: 'store@example.com',
      website: 'www.samplestore.com',
      taxId: 'TAX123456'
    },
    payment: {
      stripePublishableKey: '',
      stripeSecretKey: '',
      paymentMethods: ['cash'],
      enabled: false
    }
  };
};

// Initialize sample data
initializeSampleData();

// Helper function to get Stripe instance with user's config
const getStripeInstance = (config) => {
  if (!config || !config.stripeSecretKey) {
    throw new Error('Stripe secret key not configured');
  }
  return require('stripe')(config.stripeSecretKey);
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Payment server is running' });
});

// Create Stripe payment intent
app.post('/api/payments/create-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', config } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!config || !config.enabled) {
      return res.status(400).json({ error: 'Payment processing is not enabled' });
    }

    const stripe = getStripeInstance(config);

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      id: paymentIntent.id,
      amount: paymentIntent.amount / 100, // Convert back to dollars
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      client_secret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Confirm payment
app.post('/api/payments/confirm', async (req, res) => {
  try {
    const { paymentIntentId, paymentMethodId, config } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID is required' });
    }

    if (!config || !config.enabled) {
      return res.status(400).json({ error: 'Payment processing is not enabled' });
    }

    const stripe = getStripeInstance(config);

    // Confirm the payment intent
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });

    res.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// Process card payment (simplified for demo)
app.post('/api/payments/process-card', async (req, res) => {
  try {
    const { cardNumber, expiryMonth, expiryYear, cvc, amount, config } = req.body;

    // Basic validation
    if (!cardNumber || !expiryMonth || !expiryYear || !cvc || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!config || !config.enabled) {
      return res.status(400).json({ error: 'Payment processing is not enabled' });
    }

    const stripe = getStripeInstance(config);

    // In a real implementation, you would use Stripe's payment methods API
    // For demo purposes, we'll simulate a successful payment
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      payment_method_data: {
        type: 'card',
        card: {
          number: cardNumber,
          exp_month: expiryMonth,
          exp_year: expiryYear,
          cvc: cvc,
        },
      },
      confirm: true,
    });

    res.json({
      success: true,
      transactionId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      status: paymentIntent.status,
      cardLast4: cardNumber.slice(-4),
    });
  } catch (error) {
    console.error('Error processing card payment:', error);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// Process digital wallet payment
app.post('/api/payments/process-wallet', async (req, res) => {
  try {
    const { walletType, amount, config } = req.body;

    if (!walletType || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!config || !config.enabled) {
      return res.status(400).json({ error: 'Payment processing is not enabled' });
    }

    const stripe = getStripeInstance(config);

    // In a real implementation, you would integrate with the specific wallet
    // For demo purposes, we'll simulate a successful payment
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      payment_method_types: ['card'], // Digital wallets typically use card networks
      confirm: true,
    });

    res.json({
      success: true,
      transactionId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      status: paymentIntent.status,
      walletType: walletType,
    });
  } catch (error) {
    console.error('Error processing wallet payment:', error);
    res.status(500).json({ error: 'Wallet payment processing failed' });
  }
});

// Products endpoints
app.get('/api/products', (req, res) => {
  res.json(products);
});

app.post('/api/products', (req, res) => {
  const newProduct = {
    id: Date.now().toString(),
    ...req.body,
  };
  products.push(newProduct);
  res.json(newProduct);
});

app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const index = products.findIndex(p => p.id === id);
  if (index !== -1) {
    products[index] = { ...products[index], ...req.body };
    res.json(products[index]);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const index = products.findIndex(p => p.id === id);
  if (index !== -1) {
    products.splice(index, 1);
    res.json({ message: 'Product deleted' });
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

// Orders endpoints
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const newOrder = {
    id: Date.now().toString(),
    ...req.body,
  };
  orders.push(newOrder);
  res.json(newOrder);
});

// Settings endpoints
app.get('/api/settings', (req, res) => {
  res.json(settings);
});

app.put('/api/settings', (req, res) => {
  settings = { ...settings, ...req.body };
  res.json(settings);
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Payment server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app; 