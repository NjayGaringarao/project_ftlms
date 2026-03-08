"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Mail, AlertCircle, CheckCircle } from "lucide-react";
import { updateEmail } from "@/lib/auth/actions";
import { SecurityActionCard } from "./security-action-card";

interface UpdateEmailCardProps {
  currentEmail: string;
}

const UpdateEmailForm = ({ currentEmail }: UpdateEmailCardProps) => {
  const [newEmail, setNewEmail] = useState("");
  const [repeatEmail, setRepeatEmail] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const hasChanges = newEmail.length > 0 || repeatEmail.length > 0;

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleUpdateEmail = async () => {
    // Validation
    if (!newEmail) {
      setEmailError("New email address is required");
      return;
    }
    if (!validateEmail(newEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    if (newEmail === currentEmail) {
      setEmailError("New email must be different from current email");
      return;
    }
    if (newEmail !== repeatEmail) {
      setEmailError("Email addresses do not match");
      return;
    }

    setIsLoading(true);
    setEmailError("");

    const { error } = await updateEmail(newEmail);

    setIsLoading(false);

    if (error) {
      setEmailError(error);
      return;
    }

    setShowSuccess(true);
    setNewEmail("");
    setRepeatEmail("");

    setTimeout(() => setShowSuccess(false), 10000);
  };

  return (
    <SecurityActionCard
      title="Change Email Address"
      icon={Mail}
      infoTitle="Email Verification Required"
      infoDescription="After submitting your new email, you will receive confirmation emails at both your current and new email addresses. You must click the confirmation links in both emails to complete the change."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="newEmail">New Email Address</Label>
          <Input
            id="newEmail"
            type="email"
            placeholder="Enter your new email address"
            value={newEmail}
            onChange={(e) => {
              setNewEmail(e.target.value);
              setEmailError("");
            }}
            className="mt-1"
            disabled={isLoading}
          />
        </div>

        <div>
          <Label htmlFor="repeatEmail">Repeat New Email</Label>
          <Input
            id="repeatEmail"
            type="email"
            placeholder="Confirm your new email address"
            value={repeatEmail}
            onChange={(e) => {
              setRepeatEmail(e.target.value);
              setEmailError("");
            }}
            className="mt-1"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-between items-center pt-2">
        <div className="flex flex-1">
          {showSuccess && (
            <div className="w-full px-4 py-2 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">
                Please check both your current and new email addresses for
                confirmation links.
              </p>
            </div>
          )}

          {emailError && (
            <div className="w-full px-4 py-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-red-900">{emailError}</p>
            </div>
          )}
        </div>

        {hasChanges && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setNewEmail("");
                setRepeatEmail("");
                setEmailError("");
                setShowSuccess(false);
              }}
              disabled={isLoading}
            >
              Clear
            </Button>
            <Button onClick={handleUpdateEmail} disabled={isLoading}>
              {isLoading ? "Sending..." : "Change Email"}
            </Button>
          </div>
        )}
      </div>
    </SecurityActionCard>
  );
};

export default UpdateEmailForm;
