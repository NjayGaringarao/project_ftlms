import { LoginForm } from "@/features/auth/components/login-form";
import { getCurrentUser, isAdminExists } from "@/features/auth/lib/utils";
import { redirect } from "next/navigation";

export default async function Page() {
  if (await getCurrentUser()) redirect("/home");

  if (!(await isAdminExists())) {
    redirect("/auth/create-admin");
  }
  return <LoginForm />;
}
