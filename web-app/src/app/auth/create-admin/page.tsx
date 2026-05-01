import { CreateAdminForm } from "@/features/auth/components/create-admin-form";
import { isAdminExists } from "@/features/auth/lib/utils";
import { redirect } from "next/navigation";

export default async function Page() {
  if (await isAdminExists()) {
    redirect("/auth/login");
  }
  return <CreateAdminForm />;
}
