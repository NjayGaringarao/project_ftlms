import { InitializeAdminForm } from "@/components/auth/initialize-admin-form";
import { isAdminExists } from "@/lib/auth/utils";
import { redirect } from "next/navigation";

export default async function Page() {
  if (await isAdminExists()) {
    redirect("/auth/login");
  }
  return <InitializeAdminForm />;
}
