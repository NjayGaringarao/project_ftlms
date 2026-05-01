import { UpdatePasswordForm } from "@/features/auth/components/update-password-form";
import { getCurrentUser } from "@/features/auth/lib/utils";
import { redirect } from "next/navigation";

export default async function Page() {
  if (!(await getCurrentUser())) {
    redirect("/auth/login");
  }
  return <UpdatePasswordForm />;
}
