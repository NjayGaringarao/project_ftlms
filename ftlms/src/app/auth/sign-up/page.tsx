import { SignUpForm } from "@/components/sign-up-form";
import { isAdminExists } from "@/lib/auth/utils";
import { redirect } from "next/navigation";

export default async function Page() {
  if (await isAdminExists()) {
    redirect("/auth/login");
  }
  return <SignUpForm />;
}
