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
import { setupSwagger } from './swagger.js';

import productsRoutes from './routes/products.js';
import categoriesRoutes from './routes/categories.js';
import ordersRoutes from './routes/orders.js';
import authRoutes from './routes/auth.js';
import settingsRoutes from './routes/settings.js';
import customersRoutes from './routes/customers.js';
import supplierRoutes from './routes/suppliers.js';
import loyaltyRoutes from './routes/loyalty.js';
import employeesRoutes from './routes/employees.js';
import rolesRoutes from './routes/roles.js';
import stripeRoutes from './routes/stripe.js';
import paypalRoutes from './routes/paypal.js';
import promotionsRoutes from './routes/promotions.js';
import taxratesRoutes from './routes/taxrates.js';
import inventoriesRoutes from './routes/inventories.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.json());
//app.use(bodyParser.urlencoded(
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(cors());

app.use(clerkMiddleware());

// Setup Swagger documentation
setupSwagger(app);

app.use('/api/auth',authRoutes);
app.use('/api/products',productsRoutes);
app.use('/api/categories',categoriesRoutes);
app.use('/api/orders',ordersRoutes);
app.use('/api/settings',settingsRoutes);
app.use('/api/customers',customersRoutes);
app.use('/api/suppliers',supplierRoutes);
app.use('/api/loyalty',loyaltyRoutes);
app.use('/api/employees',employeesRoutes);
app.use('/api/roles',rolesRoutes);
app.use('/api/stripe',stripeRoutes);
app.use('/api/paypal',paypalRoutes);
app.use('/api/promotions',promotionsRoutes);
app.use('/api/tax-rates', taxratesRoutes);
app.use('/api/inventory', inventoriesRoutes);
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
    const expire = req.query.expire || parseInt((Date.now()/1000).toString(), 10) + 2400;

    
    // Generate token
    const token = req.query.token || uuidv4();
    
    // Generate signature using HMAC-SHA1 with timestamp in seconds
  const signature = crypto.createHmac('sha1', IMAGEKIT_CONFIG.privateKey).update(String(token) + String(expire)).digest('hex');


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
setInterval(() => {
  const used = process.memoryUsage();
  console.log(
    `Memory: RSS ${(used.rss / 1024 / 1024).toFixed(2)} MB, Heap ${(used.heapUsed / 1024 / 1024).toFixed(2)} MB`
  );
}, 10000); // every 10 seconds
export default app;
