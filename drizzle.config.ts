import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./lib/db/schema.ts",
  dialect: "postgresql",
  //   driver: "pg",
  dbCredentials: {
    url: process.env.DATABASE_URI!,
  },
});
