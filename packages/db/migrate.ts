import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';

const databasePath = process.env.DATABASE_PATH || '../../data/app.sqlite';
const sqlite = new Database(databasePath);
const db = drizzle(sqlite);

migrate(db, { migrationsFolder: './drizzle' });

console.log('Migrations completed!');
