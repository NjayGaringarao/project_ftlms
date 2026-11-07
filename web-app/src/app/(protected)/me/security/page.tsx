import UpdatePasswordForm from "@/features/profile/components/me/security/update-password-form";
import { redirect } from "next/navigation";
import { getCurrentUser, getUserRole } from "@/features/auth/lib/utils";
import SecurityInformation from "@/features/profile/components/me/security/security-information";
import EmailChangeReminder from "@/features/profile/components/me/security/email-change-reminder";
import EmailChangeStatusBanner from "@/features/profile/components/me/security/email-change-status-banner";
import UpdateEmailForm from "@/features/profile/components/me/security/update-email-form";

const SecurityPage = async ({
  searchParams,
}: {
  searchParams?: {
    email_change_status?: string;
    message?: string;
    confirmed_email?: string;
  };
}) => {
  const [user, userRoles] = await Promise.all([getCurrentUser(), getUserRole()]);

  if (!user) {
    redirect("/auth/login");
  }

  const accountType: "Admin" | "User" = userRoles.includes("Admin")
    ? "Admin"
    : "User";

  return (
    <div className="p-4 bg-background w-full flex flex-col gap-6 overflow-y-auto">
      <EmailChangeStatusBanner
        initialStatus={searchParams?.email_change_status}
        initialMessage={searchParams?.message}
        initialConfirmedEmail={searchParams?.confirmed_email}
      />

      <EmailChangeReminder user={user} />

      <SecurityInformation user={user} accountType={accountType} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpdatePasswordForm key="change-password" />
        <UpdateEmailForm key="change-email" currentEmail={user.email ?? ""} />
      </div>
    </div>
  );
};

export default SecurityPage;
