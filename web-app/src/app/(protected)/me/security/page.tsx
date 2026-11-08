import UpdatePasswordForm from "@/features/profile/components/me/security/update-password-form";
import { redirect } from "next/navigation";
import { getCurrentUser, getUserRole } from "@/features/auth/lib/utils";
import SecurityInformation from "@/features/profile/components/me/security/security-information";
import EmailChangeReminder from "@/features/profile/components/me/security/email-change-reminder";
import EmailChangeStatusBanner from "@/features/profile/components/me/security/email-change-status-banner";
import UpdateEmailForm from "@/features/profile/components/me/security/update-email-form";

const getSingleParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const SecurityPage = async ({
  searchParams,
}: {
  searchParams?: Promise<{
    email_change_status?: string | string[];
    message?: string | string[];
    confirmed_email?: string | string[];
    error?: string | string[];
    error_code?: string | string[];
    error_description?: string | string[];
  }>;
}) => {
  const [user, userRoles, params] = await Promise.all([
    getCurrentUser(),
    getUserRole(),
    searchParams,
  ]);

  if (!user) {
    redirect("/auth/login");
  }

  const accountType: "Admin" | "User" = userRoles.includes("Admin")
    ? "Admin"
    : "User";
  const error =
    getSingleParam(params?.error) || getSingleParam(params?.error_code);
  const errorDescription = getSingleParam(params?.error_description);
  const hasError = Boolean(error || errorDescription);
  const message = getSingleParam(params?.message);

  return (
    <div className="p-4 bg-background w-full flex flex-col gap-6 overflow-y-auto">
      <EmailChangeStatusBanner
        initialStatus={
          hasError ? "error" : getSingleParam(params?.email_change_status)
        }
        initialMessage={hasError ? errorDescription || message || error : message}
        initialConfirmedEmail={getSingleParam(params?.confirmed_email)}
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
