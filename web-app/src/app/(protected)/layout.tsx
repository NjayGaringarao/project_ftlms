import { SidebarNav } from "@/features/app-shell/components/sidebar-nav";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/lib/utils";
import { createClient } from "@/utils/supabase/server";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) redirect("/auth/login");

  if (!user.user_metadata.email_verified) {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/auth/create-admin-success");
  }

  return (
    <div className="h-screen flex flex-col-reverse md:flex-row">
      <SidebarNav />

      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
