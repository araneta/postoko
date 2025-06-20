import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
//import postRoutes from './routes/posts.js';
//import userRoutes from './routes/user.js';
const app = express();
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
}
const db = drizzle(databaseUrl);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(bodyParser.json());
//app.use(bodyParser.urlencoded(
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(cors());
/*
app.use((req,res,next)=>{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, authorization');
    res.setHeader('Access-Control-Allow-Methods', 'HEAD, GET, POST, PATCH, DELETE, OPTIONS, PUT');
    next();
});*/
//app.use('/api/posts',postRoutes);
//app.use('/api/user',userRoutes);
export default app;
