import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_PAGES = ["/login", "/register", "/admin/login"];

function getCleanUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return url.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "").trim();
}

function getCleanKey(key?: string): string {
  if (!key) return "";
  return key.trim().replace(/^['"]|['"]$/g, "");
}

async function getUserRole(userId: string, roleCookie?: string): Promise<string> {
  if (roleCookie === "admin" || roleCookie === "student") {
    return roleCookie;
  }
  const serviceKey = getCleanKey(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const url = getCleanUrl();
  if (serviceKey && url) {
    try {
      const res = await fetch(`${url}/rest/v1/profiles?id=eq.${userId}&select=role`, {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      });
      if (res.ok) {
        const rows = await res.json();
        if (rows && rows[0]?.role) {
          return rows[0].role;
        }
      }
    } catch {
      // Fallback
    }
  }
  return "student";
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    getCleanUrl(),
    getCleanKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as never)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const roleCookie = request.cookies.get("user_role")?.value;

  // ─── Strict Admin Route Protection ────────────────────
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!user) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    const role = await getUserRole(user.id, roleCookie);
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (!roleCookie) {
      supabaseResponse.cookies.set("user_role", role, { path: "/", sameSite: "lax" });
    }
  }

  // ─── Strict Student Route Protection ──────────────────
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const role = await getUserRole(user.id, roleCookie);
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (!roleCookie) {
      supabaseResponse.cookies.set("user_role", role, { path: "/", sameSite: "lax" });
    }
  }

  // ─── Redirect logged-in users away from auth pages ────
  if (user && AUTH_PAGES.some((p) => pathname === p)) {
    const role = await getUserRole(user.id, roleCookie);
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
