import postgres from "postgres"

// Server-side only — used in API routes for marketing tables
const sql = postgres(process.env.SUPABASE_URL!, { max: 3, idle_timeout: 20 })

export { sql }
