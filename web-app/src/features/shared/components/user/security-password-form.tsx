"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validatePassword } from "@/features/profile/lib/user-edit/validators";

type SecurityPasswordFormProps = {
  minLength?: number;
  onSubmit: (newPassword: string) => Promise<{ error?: string }>;
  submitText?: string;
  loadingText?: string;
  successMessage?: string;
};

const SecurityPasswordForm = ({
  minLength = 8,
  onSubmit,
  submitText = "Update Password",
  loadingText = "Updating...",
  successMessage = "Your password has been changed successfully.",
}: SecurityPasswordFormProps) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const hasChanges = newPassword.length > 0 || confirmPassword.length > 0;

  const handleReset = () => {
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setShowSuccess(false);
  };

  const handleSubmit = async () => {
    const validationError = validatePassword(
      newPassword,
      confirmPassword,
      minLength,
    );

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError("");

    const { error: submitError } = await onSubmit(newPassword.trim());

    setIsLoading(false);

    if (submitError) {
      setError(submitError);
      return;
    }

    setShowSuccess(true);
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="newPassword">New Password</Label>
          <Input
            id="newPassword"
            type="password"
            placeholder="Enter your new password"
            value={newPassword}
            onChange={(event) => {
              setNewPassword(event.target.value);
              setError("");
            }}
            className="mt-1"
            disabled={isLoading}
          />
          <p className="text-xs text-foreground/60 mt-1">
            Must be at least {minLength} characters long
          </p>
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your new password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setError("");
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
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}

          {error && (
            <div className="w-full px-4 py-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-red-900">{error}</p>
            </div>
          )}
        </div>

        {hasChanges && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isLoading}
            >
              Clear
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? loadingText : submitText}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityPasswordForm;
