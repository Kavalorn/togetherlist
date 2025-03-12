import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Ініціалізація клієнта бази даних
const client = postgres(process.env.DATABASE_URL!, { prepare: false });

// Створення екземпляра Drizzle ORM
export const db = drizzle(client, { schema });