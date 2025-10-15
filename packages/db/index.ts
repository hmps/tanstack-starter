import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './src/schema';

const databasePath = process.env.DATABASE_PATH || '../../data/app.sqlite';
const sqlite = new Database(databasePath);
export const db = drizzle(sqlite, { schema });

export * from 'drizzle-orm';
export * from './src/schema';
