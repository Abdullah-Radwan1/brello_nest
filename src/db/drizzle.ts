import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

// Neon/Postgres cloud يحتاج SSL صريح
const sql = postgres(
  'postgresql://neondb_owner:npg_rjy1htLqpoN9@ep-patient-moon-ad7ti7l3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  {
    ssl: { rejectUnauthorized: false }, // مهم
  },
);

export const db = drizzle(sql);

// import { Pool } from 'pg';
// import { drizzle } from 'drizzle-orm/node-postgres';
// import * as schema from './schema';

// export const pool = new Pool({
//   connectionString: 'postgresql://postgres:Beedo@localhost:5432/postgres',
// });

// export const db = drizzle(pool, { schema });
