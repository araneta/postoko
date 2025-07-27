import express from 'express';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import cors from 'cors';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import { fileURLToPath } from 'url';
import 'dotenv/config';
import { clerkMiddleware,requireAuth } from '@clerk/express';
import Stripe from 'stripe';

import productsRoutes from './routes/products';
import ordersRoutes from './routes/orders';
import authRoutes from './routes/auth';
import settingsRoutes from './routes/settings';
import customersRoutes from './routes/customers';
import loyaltyRoutes from './routes/loyalty';
import employeesRoutes from './routes/employees';
import rolesRoutes from './routes/roles';
import stripeRoutes from './routes/stripe';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.json());
//app.use(bodyParser.urlencoded(
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(cors());

app.use(clerkMiddleware());



app.use('/api/auth',authRoutes);
app.use('/api/products',productsRoutes);
app.use('/api/orders',ordersRoutes);
app.use('/api/settings',settingsRoutes);
app.use('/api/customers',customersRoutes);
app.use('/api/loyalty',loyaltyRoutes);
app.use('/api/employees',employeesRoutes);
app.use('/api/roles',rolesRoutes);
app.use('/api/stripe',stripeRoutes);

//imagekit auth endpoint
// This endpoint is used to generate a signature for ImageKit uploads

// ImageKit configuration
const IMAGEKIT_CONFIG = {
  privateKey: 'private_hIjBXnO9Y9NTuoDbYMBHPt7NRuQ=',
  publicKey: "public_WAJvDiOf18kQ94w+cwl80i7SPcU=",
  urlEndpoint: "https://ik.imagekit.io/mbp4i7p96",
};

// ImageKit authentication endpoint
app.post('/api/imagekit/auth', (req, res) => {
  try {
    // Generate timestamp in SECONDS (not milliseconds) - this is crucial!
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Generate expire time (40 minutes from now in seconds)
    const expire = req.query.expire || parseInt(Date.now()/1000)+2400;

    
    // Generate token
    const token = req.query.token || uuidv4();
    
    // Generate signature using HMAC-SHA1 with timestamp in seconds
	const signature = crypto.createHmac('sha1', IMAGEKIT_CONFIG.privateKey).update(token+expire).digest('hex');


    console.log('Generated auth:', {
      timestamp,
      expire,
      token,
      signature: signature.substring(0, 10) + '...' // Log partial signature for security
    });

    res.json({
      signature,
      expire,
      token: token
    });
  } catch (error) {
    console.error('Error generating ImageKit auth:', error);
    res.status(500).json({ error: 'Failed to generate authentication' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'ImageKit auth server is running' });
});
// Create checkout session
function convertToLineItems(products) {
  return products.map(item => ({
    price_data: {
      currency: 'usd',
      product_data: {
        name: item.name,
        description: item.description,
        images: [item.image],
      },
      unit_amount: item.price, // Stripe expects amount in cents
    },
    quantity: item.quantity || 1,
  }));
}

app.post('/api/create-checkout-session', async (req, res) => {
	const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

	const linex = convertToLineItems(req.body);
	console.log('linex',linex);
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: linex,
    mode: 'payment',
    success_url: 'http://localhost:3000/success.html',
    cancel_url: 'http://localhost:3000/cancel.html',
  });

  res.json({ url: session.url }); // preferred: redirect via URL
});
export default app;
