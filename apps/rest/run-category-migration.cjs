const { drizzle } = require('drizzle-orm/node-postgres');
const { Client } = require('pg');
const fs = require('fs');
require('dotenv/config');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
}

const client = new Client({ connectionString });
const db = drizzle(client);

async function runMigration() {
    try {
        console.log('Running category refactor migration...');
        
        // Connect to database
        await client.connect();
        
        // Read and execute the migration SQL
        const migrationSQL = fs.readFileSync('./drizzle/0002_refactor_categories.sql', 'utf8');
        await client.query(migrationSQL);
        
        console.log('Migration completed successfully!');
        console.log('Categories table created and products updated to use categoryId');
        
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();