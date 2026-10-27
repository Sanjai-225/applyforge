import "server-only";

import { createClient } from "@supabase/supabase-js";

function getCleanUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return url.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "").trim();
}

function getCleanKey(key?: string): string {
  if (!key) return "";
  return key.trim().replace(/^['"]|['"]$/g, "");
}

export function createAdminSupabase() {
  const url = getCleanUrl();
  const serviceKey = getCleanKey(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!url || !serviceKey) {
    console.error("❌ createAdminSupabase: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
