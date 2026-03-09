"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle,
  Trash2,
  Lock,
  Briefcase,
  Edit,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { UserDetail } from "@/lib/users/types";
import {
  updateUserPersonalInfo,
  updateUserProfessional,
  changeUserEmail,
  changeUserPassword,
} from "@/lib/users/actions";
import { DesignationAddForm } from "@/components/admin/users/designation-add-form";
import AdminPanel from "../admin-panel";
import PersonalEditForm from "@/components/user/personal-edit-form";
import SecurityEmailForm from "@/components/user/security-email-form";
import SecurityPasswordForm from "@/components/user/security-password-form";

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
    college_id?: string | null;
    program_offering_id?: string | null;
    room_id?: string | null;
    load?: number | null;
  }>;
};

type NewDesignationInput = {
  college_id: string | null;
  program_offering_id: string | null;
  campus_id: string | null;
  room_id: string | null;
  job_title: string;
  load: number;
};

type PersonalFormValues = {
  name: string;
  birthDate: string;
  address: string;
  contactNumber: string;
};

const userToPersonalFormValues = (user: UserDetail): PersonalFormValues => ({
  name: user.identity?.name ?? "",
  birthDate: user.identity?.birth_date ?? "",
  address: user.identity?.address ?? "",
  contactNumber: user.identity?.contact_number ?? "",
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
      college_id: d.college_id,
      program_offering_id: d.program_offering_id,
      room_id: d.room_id,
      load: d.load,
    })) ?? [],
});

export const UserEdit = ({ user, ranks = [] }: UserEditProps) => {
  const router = useRouter();

  const [professionalData, setProfessionalData] =
    useState<ProfessionalFormState>(() => userToProfessionalFormState(user));
  const [savedProfessionalData, setSavedProfessionalData] =
    useState<ProfessionalFormState>(() => userToProfessionalFormState(user));

  const [isPersonalSaving, setIsPersonalSaving] = useState(false);
  const [isProfessionalSaving, setIsProfessionalSaving] = useState(false);
  const [professionalError, setProfessionalError] = useState("");
  const [professionalSuccess, setProfessionalSuccess] = useState(false);

  const [isSecuritySaving, setIsSecuritySaving] = useState(false);

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
          college_id: designation.college_id || null,
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

  const handleSavePersonal = async (values: PersonalFormValues) => {
    setIsPersonalSaving(true);

    try {
      const { error } = await updateUserPersonalInfo({
        user_id: user.id,
        name: values.name,
        birth_date: values.birthDate,
        address: values.address || null,
        contact_number: values.contactNumber || null,
      });

      return { error };
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

  const handleChangeEmail = async (newEmail: string) => {
    setIsSecuritySaving(true);

    const { error: emailError } = await changeUserEmail({
      user_id: user.id,
      new_email: newEmail,
    });

    setIsSecuritySaving(false);

    return { error: emailError };
  };

  const handleChangePassword = async (newPassword: string) => {
    setIsSecuritySaving(true);

    const { error: passwordError } = await changeUserPassword({
      user_id: user.id,
      new_password: newPassword,
    });

    setIsSecuritySaving(false);

    return { error: passwordError };
  };

  return (
    <AdminPanel
      title="User Information"
      icon={Edit}
      onClose={() => router.back()}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <Edit className="w-5 h-5" />
          <h3 className="font-semibold">Personal Information</h3>
        </div>
        <PersonalEditForm
          initialValues={userToPersonalFormValues(user)}
          onSave={handleSavePersonal}
          isSaving={isPersonalSaving}
          submitText="Save Changes"
          savingText="Saving..."
        />
      </div>

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
                        {designation.college_id && (
                          <p className="text-xs text-foreground/60">
                            Department: {designation.college_id}
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
            <div className="space-y-3">
              <Label className="text-base">Change Email</Label>
              <SecurityEmailForm
                currentEmail={user.email ?? undefined}
                requireConfirmation
                submitText="Update Email"
                loadingText="Updating..."
                onSubmit={handleChangeEmail}
              />
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="space-y-3">
              <Label className="text-base">Change Password</Label>
              <SecurityPasswordForm
                minLength={8}
                submitText="Update Password"
                loadingText="Updating..."
                onSubmit={handleChangePassword}
              />
            </div>
          </div>
        </div>
      </div>
    </AdminPanel>
  );
};
