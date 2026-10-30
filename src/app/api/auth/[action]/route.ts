import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { ok, err } from "@/lib/http";
import { RegisterSchema, LoginSchema } from "@/lib/validation";
import { badRequest, unauthorized } from "@/lib/errors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  try {
    const { action } = await params;
    const body = await request.json();

    switch (action) {
      case "register":
        return handleRegister(body);
      case "login":
        return handleLogin(body);
      case "logout":
        return handleLogout();
      default:
        throw badRequest(`Unknown auth action: ${action}`);
    }
  } catch (error) {
    return err(error);
  }
}

async function handleRegister(body: unknown) {
  const data = RegisterSchema.parse(body);
  const supabase = await createServerSupabase();
  const admin = createAdminSupabase();

  // Try creating with admin API first (which auto-confirms email)
  let userId: string;
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
  });

  if (authErr) {
    console.warn("⚠️ admin.createUser failed, falling back to signUp:", authErr.message);
    const { data: fallbackAuth, error: fallbackErr } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });
    if (fallbackErr) {
      console.error("❌ signUp failed:", fallbackErr.message);
      throw badRequest(fallbackErr.message);
    }
    if (!fallbackAuth.user) throw badRequest("Failed to create user account");
    userId = fallbackAuth.user.id;
  } else {
    userId = authData.user.id;
  }

  // Create or upsert profile
  const { error: profileErr } = await admin.from("profiles").upsert({
    id: userId,
    role: "student",
    full_name: data.fullName,
    email: data.email,
    phone: data.phone,
    roll_number: data.rollNumber || null,
    department: data.department,
    is_active: true,
  });

  if (profileErr) {
    console.error("❌ Profile insertion failed:", profileErr.message);
    throw badRequest(profileErr.message);
  }

  // Establish session cookies so user is immediately logged in
  await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  const cookieStore = await cookies();
  cookieStore.set("user_role", "student", {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  });

  return ok({ redirect: "/dashboard" });
}

async function handleLogin(body: unknown) {
  const data = LoginSchema.parse(body);
  const supabase = await createServerSupabase();

  const { data: authData, error: authErr } =
    await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

  if (authErr) {
    console.error("❌ Login failed for", data.email, ":", authErr.message);
    if (authErr.message.toLowerCase().includes("email not confirmed")) {
      throw unauthorized("Email not confirmed. Please check your inbox or ask placement officer to confirm.");
    }
    throw unauthorized("Invalid email or password");
  }

  // Get profile to determine role
  const admin = createAdminSupabase();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .single();

  const role = profile?.role || "student";
  const redirect = role === "admin" ? "/admin" : "/dashboard";

  const cookieStore = await cookies();
  cookieStore.set("user_role", role, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  });

  return ok({ redirect, role });
}

async function handleLogout() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete("user_role");
  return ok({ redirect: "/" });
}
