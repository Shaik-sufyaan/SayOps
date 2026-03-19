import postgres, { type Sql } from "postgres"

let sql: Sql | null = null

// Delay client creation until a request uses the route so builds do not
// require runtime-only secrets.
export function getMarketingDb() {
  if (!sql) {
    const connectionString = process.env.SUPABASE_URL

    if (!connectionString) {
      throw new Error("SUPABASE_URL is not set")
    }

    sql = postgres(connectionString, { max: 3, idle_timeout: 20 })
  }

  return sql
}
