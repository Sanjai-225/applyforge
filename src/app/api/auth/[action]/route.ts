import { NextRequest } from "next/server";
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

  // Create auth user
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });

  if (authErr) throw badRequest(authErr.message);
  if (!authData.user) throw badRequest("Failed to create user");

  // Create profile using admin client to bypass RLS
  const admin = createAdminSupabase();
  const { error: profileErr } = await admin.from("profiles").insert({
    id: authData.user.id,
    role: "student",
    full_name: data.fullName,
    email: data.email,
    phone: data.phone,
    roll_number: data.rollNumber || null,
    department: data.department,
    batch_year: data.batchYear || null,
    cgpa: data.cgpa ?? 0,
    is_active: true,
  });

  if (profileErr) throw badRequest(profileErr.message);

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

  if (authErr) throw unauthorized("Invalid email or password");

  // Get profile to determine role
  const admin = createAdminSupabase();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .single();

  const redirect = profile?.role === "admin" ? "/admin" : "/dashboard";

  return ok({ redirect, role: profile?.role || "student" });
}

async function handleLogout() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  return ok({ redirect: "/" });
}
