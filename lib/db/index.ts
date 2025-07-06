// import * as dotenv from "dotenv";
// dotenv.config();
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

if (!process.env.DATABASE_URI) {
  throw new Error("DATABASE_URI is not defined");
}

const sql = neon(process.env.DATABASE_URI);
export const db = drizzle({ client: sql });
