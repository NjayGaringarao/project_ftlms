import { LoginForm } from "@/components/login-form";
import { getCurrentUser, isAdminExists } from "@/lib/auth/utils";
import { redirect } from "next/navigation";

export default async function Page() {
  if (await getCurrentUser()) redirect("/home");

  if (!(await isAdminExists())) {
    redirect("/auth/sign-up");
  }
  return <LoginForm />;
}
