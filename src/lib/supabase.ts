import { createClient } from "@supabase/supabase-js";
import type { Database } from "./supabase-types";

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Single client instance for the whole app. Anon key is safe to expose.
// Database generic is generated from the live schema via:
//   supabase gen types typescript --linked 2>/dev/null | sed -n '/^export/,$p' > src/lib/supabase-types.ts
// Regenerate when you add/change tables or columns.
export const supabase = createClient<Database>(url, anonKey, {
  auth: { persistSession: false }, // we don't use Supabase auth; skip the cookie noise
});

// Runtime sanity check: warn early if env vars missing (dev-time miss).
if (!url || !anonKey) {
  console.warn(
    "[supabase] PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY missing. Leaderboard features disabled.",
  );
}

export const supabaseReady = Boolean(url && anonKey);
