import express from 'express';
import bodyParser from 'body-parser';

import { drizzle } from 'drizzle-orm/node-postgres';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { eq } from 'drizzle-orm';
import { usersTable } from './db/schema';
import 'dotenv/config';

//import postRoutes from './routes/posts.js';
//import userRoutes from './routes/user.js';

const app = express();


const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	throw new Error("DATABASE_URL environment variable is not set");
}
const db = drizzle(databaseUrl);
//testing

const user: typeof usersTable.$inferInsert = {
    name: 'John',
    age: 30,
    email: 'john@example.com',
  };
  await db.insert(usersTable).values(user);
  console.log('New user created!')
  const users = await db.select().from(usersTable);
  console.log('Getting all users from the database: ', users)
  /*
  const users: {
    id: number;
    name: string;
    age: number;
    email: string;
  }[]
  */
  await db
    .update(usersTable)
    .set({
      age: 31,
    })
    .where(eq(usersTable.email, user.email));
  console.log('User info updated!')
  await db.delete(usersTable).where(eq(usersTable.email, user.email));
  console.log('User deleted!')

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
