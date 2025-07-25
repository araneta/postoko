import { drizzle } from 'drizzle-orm/node-postgres';
import 'dotenv/config';
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
}
export const db = drizzle(databaseUrl);
