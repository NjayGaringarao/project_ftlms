import UpdatePasswordForm from "@/components/me/update-password-form";
import UpdateEmailCard from "@/components/me/update-email-card";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import SecurityInformation from "@/components/me/security-information";
import EmailChangeReminder from "@/components/me/email-change-reminder";
import EmailChangeStatusBanner from "@/components/me/email-change-status-banner";

const SecurityPage = async ({
  searchParams,
}: {
  searchParams?: {
    email_change_status?: string;
    message?: string;
    confirmed_email?: string;
  };
}) => {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="p-6 bg-background w-full flex flex-col gap-6 overflow-y-auto">
      <EmailChangeStatusBanner
        initialStatus={searchParams?.email_change_status}
        initialMessage={searchParams?.message}
        initialConfirmedEmail={searchParams?.confirmed_email}
      />

      <EmailChangeReminder user={user} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpdatePasswordForm key="change-password" />
        <UpdateEmailCard key="change-email" currentEmail={user.email ?? ""} />
      </div>

      <SecurityInformation user={user} />
    </div>
  );
};

export default SecurityPage;
