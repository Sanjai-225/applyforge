import { createClient } from "@supabase/supabase-js";

const DEPARTMENTS = ["CSE", "IT", "AI&DS", "ECE", "EEE", "MECH", "CIVIL"] as const;

const SAMPLE_STUDENTS = [
  { name: "Arun Kumar S", roll: "711523BCS001", dept: "CSE", phone: "9876500001" },
  { name: "Priya Dharshini M", roll: "711523BCS002", dept: "CSE", phone: "9876500002" },
  { name: "Karthik Rajan V", roll: "711523BIT003", dept: "IT", phone: "9876500003" },
  { name: "Divya Lakshmi R", roll: "711523BAD004", dept: "AI&DS", phone: "9876500004" },
  { name: "Surya Prakash N", roll: "711523BEC005", dept: "ECE", phone: "9876500005" },
  { name: "Meena Kumari P", roll: "711523BEE006", dept: "EEE", phone: "9876500006" },
  { name: "Vijay Anand K", roll: "711523BME007", dept: "MECH", phone: "9876500007" },
  { name: "Kavitha Rani J", roll: "711523BCE008", dept: "CIVIL", phone: "9876500008" },
  { name: "Rajesh Kumar T", roll: "711523BCS009", dept: "CSE", phone: "9876500009" },
  { name: "Nithya Sree L", roll: "711523BIT010", dept: "IT", phone: "9876500010" },
];

const SAMPLE_GROUPS = [
  { name: "CSE Placements", department_tag: "CSE", invite_link: "https://chat.whatsapp.com/abc123" },
  { name: "IT Placements", department_tag: "IT", invite_link: "https://chat.whatsapp.com/def456" },
  { name: "All Branches Placements", department_tag: "ALL", invite_link: "https://chat.whatsapp.com/ghi789" },
  { name: "AI&DS Placements", department_tag: "AI&DS", invite_link: "https://chat.whatsapp.com/jkl012" },
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Seed WhatsApp groups
  console.log("⏳ Seeding WhatsApp groups...");
  for (const group of SAMPLE_GROUPS) {
    const { error } = await supabase.from("whatsapp_groups").insert(group);
    if (error) console.warn(`  ⚠️ Group "${group.name}": ${error.message}`);
    else console.log(`  ✅ ${group.name}`);
  }

  // Seed sample students
  console.log("\n⏳ Seeding sample students...");
  for (const s of SAMPLE_STUDENTS) {
    const email = `${s.roll.toLowerCase()}@college.edu`;
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password: "Student@123",
      email_confirm: true,
    });

    if (authErr) {
      console.warn(`  ⚠️ Auth for ${s.name}: ${authErr.message}`);
      continue;
    }

    const { error: profileErr } = await supabase.from("profiles").insert({
      id: authData.user.id,
      role: "student",
      full_name: s.name,
      email,
      phone: s.phone,
      roll_number: s.roll,
      department: s.dept,
      is_active: true,
    });

    if (profileErr) console.warn(`  ⚠️ Profile for ${s.name}: ${profileErr.message}`);
    else console.log(`  ✅ ${s.name} (${s.roll})`);
  }

  // Seed sample jobs
  console.log("\n⏳ Seeding sample jobs...");

  // Get admin ID
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .limit(1)
    .single();

  const adminId = adminProfile?.id;

  const jobs = [
    {
      title: "Software Engineer - Full Stack",
      company_name: "TCS Digital",
      application_url: "https://nextstep.tcs.com/campus",
      priority: "URGENT",
      package_ctc: "7.5 LPA",
      location: "Chennai / Hyderabad",
      description: "Full Stack Developer role. Apply via TCS NextStep portal.",
      eligible_departments: ["CSE", "IT", "AI&DS"],
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: adminId,
    },
    {
      title: "Associate Engineer",
      company_name: "Infosys",
      application_url: "https://infosys.com/careers",
      priority: "HIGH",
      package_ctc: "6.25 LPA",
      location: "Mysore / Pune",
      description: "Power Programmer and SP roles. All branches eligible.",
      eligible_departments: ["ALL"],
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: adminId,
    },
    {
      title: "Data Analyst Intern",
      company_name: "Zoho Corporation",
      application_url: "https://zoho.com/careers",
      priority: "NORMAL",
      package_ctc: "5 LPA + Benefits",
      location: "Chennai",
      description: "6-month internship converting to full-time. CSE and AI&DS preferred.",
      eligible_departments: ["CSE", "AI&DS", "IT"],
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: adminId,
    },
  ];

  for (const job of jobs) {
    const { error } = await supabase.from("jobs").insert(job);
    if (error) console.warn(`  ⚠️ Job "${job.title}": ${error.message}`);
    else console.log(`  ✅ ${job.company_name} — ${job.title}`);
  }

  console.log("\n🎉 Seeding complete!");
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
