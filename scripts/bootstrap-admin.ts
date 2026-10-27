import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Placement Officer";
  const phone = process.env.ADMIN_PHONE || "9876543210";

  if (!url || !serviceKey || !email || !password) {
    console.error("❌ Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`⏳ Creating admin account: ${email}...`);

  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authErr) {
    console.error("❌ Auth error:", authErr.message);
    process.exit(1);
  }

  const userId = authData.user.id;

  const { error: profileErr } = await supabase.from("profiles").insert({
    id: userId,
    role: "admin",
    full_name: name,
    email,
    phone,
    roll_number: null,
    department: "ADMIN",
    batch_year: null,
    cgpa: null,
    is_active: true,
  });

  if (profileErr) {
    console.error("❌ Profile error:", profileErr.message);
    process.exit(1);
  }

  console.log(`✅ Admin created: ${email} (${userId})`);
}

main().catch((err) => {
  console.error("❌ Bootstrap failed:", err);
  process.exit(1);
});
