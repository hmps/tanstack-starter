import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './src/schema';

const sqlite = new Database('../../data/app.sqlite');
export const db = drizzle(sqlite, { schema });

export * from './src/schema';

export * from 'drizzle-orm';
