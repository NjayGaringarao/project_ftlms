import { SidebarNav } from "@/components/ui/sidebar-nav";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { TopBarNav } from "@/components/ui/topbar-nav";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) redirect("/auth/login");

  return (
    <div className="h-screen flex flex-col-reverse md:flex-row">
      <SidebarNav />

      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
