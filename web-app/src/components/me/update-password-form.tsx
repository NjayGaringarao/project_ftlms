"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Lock, AlertCircle, CheckCircle } from "lucide-react";
import { updatePassword } from "@/lib/auth/actions";
import { SecurityActionCard } from "./security-action-card";

const UpdatePasswordForm = () => {
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const handlePasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string,
  ) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
    setPasswordError("");
  };

  const handleUpdatePassword = async () => {
    if (!passwordData.newPassword) {
      setPasswordError("New password is required");
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    const { error } = await updatePassword(passwordData.newPassword);
    if (!error) setShowSuccess(true);

    // Clear form
    setPasswordData({
      newPassword: "",
      confirmPassword: "",
    });

    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <SecurityActionCard
      title="Update Password"
      icon={Lock}
      infoTitle="Password Security"
      infoDescription="Choose a strong password with at least 8 characters. For better security, include a mix of uppercase letters, lowercase letters, numbers, and special characters."
    >
      {showSuccess && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">
                  Password Updated Successfully
                </p>
                <p className="text-sm text-green-800">
                  Your password has been changed successfully.
                </p>
              </div>
            </div>
          )}

          {passwordError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-900">{passwordError}</p>
            </div>
          )}

          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Enter your new password"
              value={passwordData.newPassword}
              onChange={(e) => handlePasswordChange(e, "newPassword")}
              className="mt-1"
            />
            <p className="text-xs text-foreground/60 mt-1">
              Must be at least 8 characters long
            </p>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your new password"
              value={passwordData.confirmPassword}
              onChange={(e) => handlePasswordChange(e, "confirmPassword")}
              className="mt-1"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() =>
                setPasswordData({
                  newPassword: "",
                  confirmPassword: "",
                })
              }
            >
              Clear
            </Button>
            <Button onClick={handleUpdatePassword}>Update Password</Button>
          </div>
    </SecurityActionCard>
  );
};

export default UpdatePasswordForm;
