"use client";

import { Lock } from "lucide-react";
import { updatePassword } from "@/lib/auth/actions";
import { SecurityActionCard } from "./security-action-card";
import SecurityPasswordForm from "@/components/user/security-password-form";

const UpdatePasswordForm = () => {
  return (
    <SecurityActionCard
      title="Update Password"
      icon={Lock}
      infoTitle="Password Security"
      infoDescription="Choose a strong password with at least 8 characters. For better security, include a mix of uppercase letters, lowercase letters, numbers, and special characters."
    >
      <SecurityPasswordForm
        minLength={8}
        submitText="Update Password"
        loadingText="Updating..."
        successMessage="Your password has been changed successfully."
        onSubmit={async (newPassword) => {
          const { error } = await updatePassword(newPassword);
          return { error };
        }}
      />
    </SecurityActionCard>
  );
};

export default UpdatePasswordForm;
