export default {
  schema: './src/db/schema.ts', // path to your Drizzle schema
  out: './drizzle/migrations', // migrations folder
  dbCredentials: { url: process.env.DATABASE_URL }, // the actual Postgres client instance
  dialect: 'postgresql', // required
};
