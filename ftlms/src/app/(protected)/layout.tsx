import { SidebarNav } from "@/components/ui/sidebar-nav";
import { UserRole } from "@/types/navigation";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) redirect("/auth/login");

  // This array is dynamically fetched from your database based on the AUTH.USER ID
  const userActiveRoles: UserRole[] = [
    "FACULTY",
    "CHAIR",
    "EVALUATOR",
    "DIRECTOR",
    "ADMIN",
  ];

  return (
    <div className="h-screen flex flex-row">
      <SidebarNav userActiveRoles={userActiveRoles} />
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
