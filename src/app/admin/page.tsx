import type { Metadata } from "next";
import AdminDashboardView from "@/components/admin-dashboard";

export const metadata: Metadata = {
  title: "Admin Dashboard — ApplyForge",
  description: "Placement Officer admin dashboard for managing jobs and tracking applications.",
};

export default function AdminDashboardPage() {
  return <AdminDashboardView />;
}
