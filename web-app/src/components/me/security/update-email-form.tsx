"use client";

import { Mail } from "lucide-react";
import { updateEmail } from "@/lib/auth/actions";
import { SecurityActionCard } from "./security-action-card";
import SecurityEmailForm from "@/components/user/security-email-form";

interface UpdateEmailCardProps {
  currentEmail: string;
}

const UpdateEmailForm = ({ currentEmail }: UpdateEmailCardProps) => {
  return (
    <SecurityActionCard
      title="Change Email Address"
      icon={Mail}
      infoTitle="Email Verification Required"
      infoDescription="After submitting your new email, you will receive confirmation emails at both your current and new email addresses. You must click the confirmation links in both emails to complete the change."
    >
      <SecurityEmailForm
        currentEmail={currentEmail}
        requireConfirmation
        submitText="Change Email"
        loadingText="Sending..."
        onSubmit={async (newEmail) => {
          const { error } = await updateEmail(newEmail);
          return { error };
        }}
      />
    </SecurityActionCard>
  );
};

export default UpdateEmailForm;
