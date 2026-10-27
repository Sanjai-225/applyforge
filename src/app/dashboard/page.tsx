import type { Metadata } from "next";
import StudentDashboardView from "@/components/student-dashboard";

export const metadata: Metadata = {
  title: "Dashboard — ApplyForge",
  description: "Your personal placement application tracker.",
};

export default function DashboardPage() {
  return <StudentDashboardView />;
}
