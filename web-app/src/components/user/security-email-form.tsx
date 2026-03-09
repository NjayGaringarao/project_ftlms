"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateEmailFormat } from "@/lib/user-edit/validators";

type SecurityEmailFormProps = {
  currentEmail?: string;
  requireConfirmation?: boolean;
  onSubmit: (newEmail: string) => Promise<{ error?: string }>;
  submitText?: string;
  loadingText?: string;
};

const SecurityEmailForm = ({
  currentEmail,
  requireConfirmation = true,
  onSubmit,
  submitText = "Change Email",
  loadingText = "Sending...",
}: SecurityEmailFormProps) => {
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const hasChanges = newEmail.length > 0 || confirmEmail.length > 0;

  const handleReset = () => {
    setNewEmail("");
    setConfirmEmail("");
    setError("");
    setShowSuccess(false);
  };

  const handleSubmit = async () => {
    const normalized = newEmail.trim();

    if (!normalized) {
      setError("New email address is required");
      return;
    }
    if (!validateEmailFormat(normalized)) {
      setError("Please enter a valid email address");
      return;
    }
    if (currentEmail && normalized === currentEmail) {
      setError("New email must be different from current email");
      return;
    }
    if (requireConfirmation && normalized !== confirmEmail.trim()) {
      setError("Email addresses do not match");
      return;
    }

    setIsLoading(true);
    setError("");

    const { error: submitError } = await onSubmit(normalized);

    setIsLoading(false);

    if (submitError) {
      setError(submitError);
      return;
    }

    setError("");
    setShowSuccess(true);
    setNewEmail("");
    setConfirmEmail("");
    setTimeout(() => setShowSuccess(false), 10000);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="newEmail">New Email Address</Label>
          <Input
            id="newEmail"
            type="email"
            placeholder="Enter your new email address"
            value={newEmail}
            onChange={(event) => {
              setNewEmail(event.target.value);
              setError("");
            }}
            className="mt-1"
            disabled={isLoading}
          />
        </div>

        {requireConfirmation && (
          <div>
            <Label htmlFor="confirmEmail">Repeat New Email</Label>
            <Input
              id="confirmEmail"
              type="email"
              placeholder="Confirm your new email address"
              value={confirmEmail}
              onChange={(event) => {
                setConfirmEmail(event.target.value);
                setError("");
              }}
              className="mt-1"
              disabled={isLoading}
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 justify-between items-center pt-2">
        <div className="flex flex-1">
          {showSuccess && (
            <div className="w-full px-4 py-2 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">
                Email update request sent successfully.
              </p>
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

export default SecurityEmailForm;
