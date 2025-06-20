import express from 'express';
import bodyParser from 'body-parser';

import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

import productsRoutes from './routes/products';
import ordersRoutes from './routes/orders';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.json());
//app.use(bodyParser.urlencoded(
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(cors());

app.use('/api/products',productsRoutes);
app.use('/api/orders',ordersRoutes);
export default app;
