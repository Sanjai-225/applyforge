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

  // Helper to fetch user's role
  async function getUserRole(userId: string): Promise<string> {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      return profile?.role || "student";
    } catch {
      return "student";
    }
  }

  // 1. Guard /admin routes (except /admin/login)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!user) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    const role = await getUserRole(user.id);
    if (role !== "admin") {
      // Role mismatch: Non-admin trying to access admin portal
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return supabaseResponse;
  }

  // 2. Guard student /dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const role = await getUserRole(user.id);
    if (role === "admin") {
      // Role mismatch: Admin trying to access student portal
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return supabaseResponse;
  }

  // 3. Redirect logged-in users away from auth pages
  if (user && AUTH_PAGES.some((p) => pathname === p)) {
    const role = await getUserRole(user.id);
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
