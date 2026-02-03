import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { getCurrentUser } from "@/lib/auth/utils";
import { redirect } from "next/navigation";

export default async function Page() {
  if (!(await getCurrentUser())) {
    redirect("/auth/login");
  }
  return <UpdatePasswordForm />;
}
