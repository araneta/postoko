import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import 'dotenv/config';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool({
    connectionString: databaseUrl,
});

const db = drizzle(pool);

async function fixMigrations() {
    try {
        console.log('Creating __drizzle_migrations table if it doesn\'t exist...');
        
        // Create the __drizzle_migrations table if it doesn't exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
                "id" SERIAL PRIMARY KEY,
                "hash" VARCHAR(255) NOT NULL,
                "created_at" BIGINT NOT NULL
            );
        `);

        console.log('Checking existing migrations...');
        
        // Check what migrations are already recorded
        const existingMigrations = await pool.query('SELECT hash FROM "__drizzle_migrations"');
        const existingHashes = existingMigrations.rows.map(row => row.hash);
        
        console.log('Existing migration hashes:', existingHashes);

        // Define the migrations that should be marked as applied
        const migrations = [
            { hash: '0000_orange_dakota_north', created_at: 1752451049569 },
            { hash: '0001_add_min_stock', created_at: 1752451200000 },
            { hash: '0002_amused_abomination', created_at: 1752706626747 }
        ];

        // Insert missing migrations
        for (const migration of migrations) {
            if (!existingHashes.includes(migration.hash)) {
                console.log(`Marking migration ${migration.hash} as applied...`);
                await pool.query(
                    'INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES ($1, $2)',
                    [migration.hash, migration.created_at]
                );
            } else {
                console.log(`Migration ${migration.hash} already marked as applied`);
            }
        }

        console.log('Migration state fixed successfully!');
        console.log('You can now run "npx drizzle-kit migrate" without errors.');

    } catch (error) {
        console.error('Error fixing migrations:', error);
    } finally {
        await pool.end();
    }
}

fixMigrations(); 