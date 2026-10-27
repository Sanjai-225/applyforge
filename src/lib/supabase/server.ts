import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getCleanUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return url.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "").trim();
}

function getCleanKey(key?: string): string {
  if (!key) return "";
  return key.trim().replace(/^['"]|['"]$/g, "");
}

export async function createServerSupabase() {
  const cookieStore = await cookies();
  const url = getCleanUrl();
  const anonKey = getCleanKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as never)
            );
          } catch {
            // Can be called from Server Component where cookies can't be set
          }
        },
      },
    }
  );
}
