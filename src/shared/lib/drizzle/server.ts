import { loadEnvConfig } from "@next/env";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import * as schema from "@/shared/lib/drizzle/schema";

loadEnvConfig(process.cwd());

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
export const db = drizzle(pool, { schema });
