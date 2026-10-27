"use client";

import { createBrowserClient } from "@supabase/ssr";

function getCleanUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return url.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "").trim();
}

function getCleanKey(key?: string): string {
  if (!key) return "";
  return key.trim().replace(/^['"]|['"]$/g, "");
}

export function createBrowserSupabase() {
  return createBrowserClient(
    getCleanUrl(),
    getCleanKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}
