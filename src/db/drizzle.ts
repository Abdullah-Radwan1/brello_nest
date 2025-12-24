// db/drizzle.ts
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config(); // <-- load .env here
// 1. First, create the postgres.js client
const sql = postgres(process.env.DATABASE_URL!, {
  ssl: 'require', // This is the key parameter
  // You can also use an object for more control:
  // ssl: { rejectUnauthorized: false } // Use with caution, only for development with self-signed certs
});

// 2. Then, pass the client to drizzle
export const db = drizzle(sql, { schema });
const result = db.execute('select 1');

// import { Pool } from 'pg';
// import { drizzle } from 'drizzle-orm/node-postgres';
// import * as schema from './schema';

// export const pool = new Pool({
//   connectionString: 'postgresql://postgres:Beedo@localhost:5432/postgres',
// });

// export const db = drizzle(pool, { schema });
