import express from 'express';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import cors from 'cors';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { clerkMiddleware } from '@clerk/express';
import productsRoutes from './routes/products';
import ordersRoutes from './routes/orders';
import authRoutes from './routes/auth';
import settingsRoutes from './routes/settings';
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(bodyParser.json());
//app.use(bodyParser.urlencoded(
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(cors());
app.use(clerkMiddleware());
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/settings', settingsRoutes);
//imagekit auth endpoint
// This endpoint is used to generate a signature for ImageKit uploads
app.post('/api/imagekit/auth', (req, res) => {
    const privateKey = 'private_hIjBXnO9Y9NTuoDbYMBHPt7NRuQ=';
    const timestamp = Date.now();
    const token = req.query.token || uuidv4();
    const signature = crypto
        .createHmac('sha1', privateKey)
        .update(timestamp.toString())
        .digest('hex');
    res.json({
        signature,
        expire: timestamp + 60000, // 1 minute expiry
        token: token
    });
});
export default app;
