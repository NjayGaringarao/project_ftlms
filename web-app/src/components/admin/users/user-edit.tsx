"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle,
  Trash2,
  Mail,
  Lock,
  Briefcase,
  Edit,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UserDetail } from "@/lib/users/users";
import {
  updateUserPersonalInfo,
  updateUserProfessional,
  changeUserEmail,
  changeUserPassword,
} from "@/lib/users/actions";
import { DesignationAddForm } from "@/components/admin/users/designation-add-form";
import AdminPanel from "../admin-panel";
import {
  UserInitialForm,
  UserInitialFormState,
} from "@/components/admin/users/user-initial-form";

type UserEditProps = {
  user: UserDetail;
  ranks?: Array<{ id: string; title: string }>;
};

type ProfessionalFormState = {
  academicRankId: string | null;
  employmentStatus: string;
  designations: Array<{
    id?: string;
    campus_id?: string | null;
    job_title: string;
    department_id?: string | null;
    program_offering_id?: string | null;
    room_id?: string | null;
    load?: number | null;
  }>;
};

type NewDesignationInput = {
  department_id: string | null;
  program_offering_id: string | null;
  campus_id: string | null;
  room_id: string | null;
  job_title: string;
  load: number;
};

type SecurityFormState = {
  newEmail: string;
  newPassword: string;
  confirmPassword: string;
};

const userToPersonalFormState = (user: UserDetail): UserInitialFormState => ({
  email: "",
  password: "",
  firstName: user.identity?.first_name ?? "",
  middleName: user.identity?.middle_name ?? "",
  lastName: user.identity?.last_name ?? "",
  extension: user.identity?.extension ?? "",
  birthDate: user.identity?.birth_date ?? "",
  address: user.identity?.address ?? "",
  zipCode: user.identity?.zip_code ?? "",
  contactNumber: user.identity?.contact_number ?? "",
  employmentStatus: "",
});

const userToProfessionalFormState = (
  user: UserDetail,
): ProfessionalFormState => ({
  academicRankId: user.rank?.id ?? null,
  employmentStatus: user.employment_status ?? "",
  designations:
    user.designations?.map((d) => ({
      id: d.id,
      campus_id: d.campus_id,
      job_title: d.job_title,
      department_id: d.department_id,
      program_offering_id: d.program_offering_id,
      room_id: d.room_id,
      load: d.load,
    })) ?? [],
});

export const UserEdit = ({ user, ranks = [] }: UserEditProps) => {
  const router = useRouter();

  const [personalData, setPersonalData] = useState<UserInitialFormState>(() =>
    userToPersonalFormState(user),
  );
  const [savedPersonalData, setSavedPersonalData] =
    useState<UserInitialFormState>(() => userToPersonalFormState(user));

  const [professionalData, setProfessionalData] =
    useState<ProfessionalFormState>(() => userToProfessionalFormState(user));
  const [savedProfessionalData, setSavedProfessionalData] =
    useState<ProfessionalFormState>(() => userToProfessionalFormState(user));

  const [securityData, setSecurityData] = useState<SecurityFormState>({
    newEmail: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isPersonalSaving, setIsPersonalSaving] = useState(false);
  const [personalError, setPersonalError] = useState("");
  const [personalSuccess, setPersonalSuccess] = useState(false);

  const [isProfessionalSaving, setIsProfessionalSaving] = useState(false);
  const [professionalError, setProfessionalError] = useState("");
  const [professionalSuccess, setProfessionalSuccess] = useState(false);

  const [isSecuritySaving, setIsSecuritySaving] = useState(false);

  const handlePersonalChange = (
    field: keyof UserInitialFormState,
    value: string,
  ) => {
    setPersonalData((prev) => ({ ...prev, [field]: value }));
    setPersonalError("");
  };

  const handleProfessionalChange = (
    field: keyof Omit<ProfessionalFormState, "designations">,
    value: string | null,
  ) => {
    setProfessionalData((prev) => ({ ...prev, [field]: value }));
    setProfessionalError("");
  };

  const handleAddDesignation = (designation: NewDesignationInput) => {
    setProfessionalData((prev) => ({
      ...prev,
      designations: [
        ...prev.designations,
        {
          job_title: designation.job_title,
          department_id: designation.department_id || null,
          program_offering_id: designation.program_offering_id || null,
          campus_id: designation.campus_id || null,
          room_id: designation.room_id || null,
          load: designation.load,
        },
      ],
    }));
    setProfessionalError("");
  };

  const handleRemoveDesignation = (index: number) => {
    setProfessionalData((prev) => ({
      ...prev,
      designations: prev.designations.filter((_, i) => i !== index),
    }));
  };

  const handleResetPersonal = () => {
    setPersonalData(savedPersonalData);
    setPersonalError("");
    setPersonalSuccess(false);
  };

  const handleSavePersonal = async () => {
    if (!personalData.firstName.trim()) {
      setPersonalError("First name is required");
      return;
    }
    if (!personalData.lastName.trim()) {
      setPersonalError("Last name is required");
      return;
    }
    if (!personalData.birthDate.trim()) {
      setPersonalError("Birth date is required");
      return;
    }

    setIsPersonalSaving(true);
    setPersonalError("");
    setPersonalSuccess(false);

    try {
      const { error } = await updateUserPersonalInfo({
        user_id: user.id,
        first_name: personalData.firstName.trim(),
        middle_name: personalData.middleName.trim() || null,
        last_name: personalData.lastName.trim(),
        extension: personalData.extension.trim() || null,
        birth_date: personalData.birthDate,
        address: personalData.address.trim() || null,
        zip_code: personalData.zipCode.trim() || null,
        contact_number: personalData.contactNumber.trim() || null,
      });

      if (error) {
        setPersonalError(error);
        return;
      }

      setSavedPersonalData({ ...personalData });
      setPersonalSuccess(true);
      setTimeout(() => setPersonalSuccess(false), 3000);
    } finally {
      setIsPersonalSaving(false);
    }
  };

  const handleResetProfessional = () => {
    setProfessionalData(savedProfessionalData);
    setProfessionalError("");
    setProfessionalSuccess(false);
  };

  const handleSaveProfessional = async () => {
    setIsProfessionalSaving(true);
    setProfessionalError("");
    setProfessionalSuccess(false);

    try {
      const { error } = await updateUserProfessional({
        user_id: user.id,
        academic_rank_id: professionalData.academicRankId,
        employment_status: professionalData.employmentStatus.trim() || null,
        designations: professionalData.designations,
      });

      if (error) {
        setProfessionalError(error);
        return;
      }

      setSavedProfessionalData({ ...professionalData });
      setProfessionalSuccess(true);
      setTimeout(() => setProfessionalSuccess(false), 3000);
    } finally {
      setIsProfessionalSaving(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!securityData.newEmail.trim()) {
      setProfessionalError("New email is required");
      return;
    }

    setIsSecuritySaving(true);
    setProfessionalError("");

    const { error: emailError } = await changeUserEmail({
      user_id: user.id,
      new_email: securityData.newEmail.trim(),
    });

    setIsSecuritySaving(false);

    if (emailError) {
      setProfessionalError(emailError);
      return;
    }

    setSecurityData((prev) => ({ ...prev, newEmail: "" }));
    setProfessionalSuccess(true);
    setTimeout(() => setProfessionalSuccess(false), 3000);
  };

  const handleChangePassword = async () => {
    if (!securityData.newPassword.trim()) {
      setProfessionalError("New password is required");
      return;
    }

    if (securityData.newPassword !== securityData.confirmPassword) {
      setProfessionalError("Passwords do not match");
      return;
    }

    if (securityData.newPassword.length < 6) {
      setProfessionalError("Password must be at least 6 characters");
      return;
    }

    setIsSecuritySaving(true);
    setProfessionalError("");

    const { error: passwordError } = await changeUserPassword({
      user_id: user.id,
      new_password: securityData.newPassword.trim(),
    });

    setIsSecuritySaving(false);

    if (passwordError) {
      setProfessionalError(passwordError);
      return;
    }

    setSecurityData((prev) => ({
      ...prev,
      newPassword: "",
      confirmPassword: "",
    }));
    setProfessionalSuccess(true);
    setTimeout(() => setProfessionalSuccess(false), 3000);
  };

  return (
    <AdminPanel
      title="User Information"
      icon={Edit}
      onClose={() => router.back()}
    >
      <UserInitialForm
        formData={personalData}
        onChange={handlePersonalChange}
        onReset={handleResetPersonal}
        onSubmit={handleSavePersonal}
        isSaving={isPersonalSaving}
        error={personalError}
        success={personalSuccess}
        successMessage="Personal information saved successfully"
        submitText="Save Changes"
        savingText="Saving..."
      />

      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <Briefcase className="w-5 h-5" />
          <h3 className=" font-semibold">Professional Information</h3>
        </div>

        {professionalSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
            <p className="text-xs text-green-900">
              Professional information saved successfully
            </p>
          </div>
        )}

        {professionalError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-900">{professionalError}</p>
          </div>
        )}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="academicRank" className="text-xs">
                Academic Rank
              </Label>
              <select
                id="academicRank"
                value={professionalData.academicRankId ?? ""}
                onChange={(e) =>
                  handleProfessionalChange(
                    "academicRankId",
                    e.target.value || null,
                  )
                }
                disabled={isProfessionalSaving}
                className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
              >
                <option value="">No Rank Assigned</option>
                {ranks.map((rank) => (
                  <option key={rank.id} value={rank.id}>
                    {rank.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="employmentStatus" className="text-xs">
                Employment Status
              </Label>
              <select
                id="employmentStatus"
                className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                value={professionalData.employmentStatus}
                onChange={(e) =>
                  handleProfessionalChange("employmentStatus", e.target.value)
                }
                disabled={isProfessionalSaving}
                onBlur={(e) => {
                  handleProfessionalChange(
                    "employmentStatus",
                    e.target.value.trim().toUpperCase(),
                  );
                }}
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs">Designations</Label>

            {professionalData.designations.length > 0 && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
                {professionalData.designations.map((designation, idx) => (
                  <div
                    key={idx}
                    className="p-3 border rounded-lg bg-foreground/5 flex items-start justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{designation.job_title}</p>
                      </div>
                      <div className="space-y-1 mt-1">
                        {designation.department_id && (
                          <p className="text-xs text-foreground/60">
                            Department: {designation.department_id}
                          </p>
                        )}
                        {designation.program_offering_id && (
                          <p className="text-xs text-foreground/60">
                            Program Offering: {designation.program_offering_id}
                          </p>
                        )}
                        {designation.campus_id && (
                          <p className="text-xs text-foreground/60">
                            Campus: {designation.campus_id}
                          </p>
                        )}
                        {designation.room_id && (
                          <p className="text-xs text-foreground/60">
                            Room: {designation.room_id}
                          </p>
                        )}
                        {designation.load !== null &&
                          designation.load !== undefined && (
                            <p className="text-xs text-foreground/60">
                              Load: {designation.load} hours
                            </p>
                          )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDesignation(idx)}
                      disabled={isProfessionalSaving}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <DesignationAddForm
              onAdd={handleAddDesignation}
              isLoading={isProfessionalSaving}
              error={professionalError}
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={handleResetProfessional}
            disabled={isProfessionalSaving}
          >
            Reset
          </Button>
          <Button
            onClick={handleSaveProfessional}
            disabled={isProfessionalSaving}
          >
            {isProfessionalSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <Lock className="w-5 h-5" />
          <h3 className=" font-semibold">Security Settings</h3>
        </div>
        <p className="text-xs text-foreground/60">
          Update email and password without sending verification emails to the
          user.
        </p>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5" />
              <Label className="text-base">Change Email</Label>
            </div>

            {professionalSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2 mb-4">
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <p className="text-xs text-green-900">
                  Email updated successfully
                </p>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <Label htmlFor="newEmail" className="text-xs">
                  New Email Address
                </Label>
                <Input
                  id="newEmail"
                  type="email"
                  placeholder="Enter new email"
                  value={securityData.newEmail}
                  onChange={(e) =>
                    setSecurityData((prev) => ({
                      ...prev,
                      newEmail: e.target.value,
                    }))
                  }
                  className="mt-1"
                  disabled={isSecuritySaving}
                />
              </div>
              <Button
                onClick={handleChangeEmail}
                disabled={isSecuritySaving || !securityData.newEmail.trim()}
                className="w-full"
                variant="outline"
              >
                {isSecuritySaving ? "Updating..." : "Update Email"}
              </Button>
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5" />
              <Label className="text-base">Change Password</Label>
            </div>

            {professionalSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2 mb-4">
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <p className="text-xs text-green-900">
                  Password updated successfully
                </p>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <Label htmlFor="newPassword" className="text-xs">
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={securityData.newPassword}
                  onChange={(e) =>
                    setSecurityData((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  className="mt-1"
                  disabled={isSecuritySaving}
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-xs">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={securityData.confirmPassword}
                  onChange={(e) =>
                    setSecurityData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  className="mt-1"
                  disabled={isSecuritySaving}
                />
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={
                  isSecuritySaving ||
                  !securityData.newPassword.trim() ||
                  !securityData.confirmPassword.trim()
                }
                className="w-full"
                variant="outline"
              >
                {isSecuritySaving ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AdminPanel>
  );
};
