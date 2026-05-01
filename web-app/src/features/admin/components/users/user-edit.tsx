"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle,
  Lock,
  Briefcase,
  Edit,
  ChevronDown,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { UserDetail } from "@/features/admin/lib/users/types";
import {
  updateUserPersonalInfo,
  updateUserProfessional,
  changeUserEmail,
  changeUserPassword,
} from "@/features/admin/lib/users/actions";
import AdminPanel from "../admin-panel";
import PersonalEditForm from "@/features/shared/components/user/personal-edit-form";
import SecurityEmailForm from "@/features/shared/components/user/security-email-form";
import SecurityPasswordForm from "@/features/shared/components/user/security-password-form";
import { ExtendedDesignation } from "@/features/shared/types/models/designation";
import DesignationSection, {
  NewDesignationInput,
} from "@/features/shared/components/user/designation-section";
import CampusPickerDialog from "@/features/shared/components/pickers/campus-picker-dialog";
import CollegePickerDialog from "@/features/shared/components/pickers/college-picker-dialog";
import type { CampusListItem } from "@/features/admin/lib/campuses";
import type { CollegeListItem } from "@/features/admin/lib/colleges";

type UserEditProps = {
  user: UserDetail;
  ranks?: Array<{ id: string; title: string }>;
  campuses: CampusListItem[];
  colleges: CollegeListItem[];
  onClose?: () => void;
};

type ProfessionalFormState = {
  academicRankId: string | null;
  employmentStatus: string;
  campusId: string | null;
  collegeId: string | null;
  designations: Array<Omit<ExtendedDesignation, "user">>;
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
  campusId: user.campus_id ?? null,
  collegeId: user.college_id ?? null,
  designations: user.designations ?? [],
});

export const UserEdit = ({
  user,
  ranks = [],
  campuses,
  colleges,
  onClose,
}: UserEditProps) => {
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
  const [campusDialogOpen, setCampusDialogOpen] = useState(false);
  const [collegeDialogOpen, setCollegeDialogOpen] = useState(false);
  const [campusQuery, setCampusQuery] = useState("");
  const [collegeQuery, setCollegeQuery] = useState("");

  const hasProfessionalChanges = useMemo(
    () =>
      JSON.stringify(professionalData) !==
      JSON.stringify(savedProfessionalData),
    [professionalData, savedProfessionalData],
  );

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
          id: `new-${Date.now()}`,
          user_id: user.id,
          designated_at: new Date().toISOString(),
          job_title: designation.job_title,
          college_id: designation.college_id || null,
          program_offering_id: designation.program_offering_id || null,
          campus_id: designation.campus_id || null,
          room_id: designation.room_id || null,
          load: designation.load,
          campus: designation.campus ?? null,
          college: designation.college ?? null,
          program: designation.program ?? null,
          program_offering: designation.program_offering ?? null,
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
      if (!professionalData.campusId?.trim()) {
        setProfessionalError("Campus is required");
        return;
      }

      if (!professionalData.collegeId?.trim()) {
        setProfessionalError("College is required");
        return;
      }

      const { error } = await updateUserProfessional({
        user_id: user.id,
        academic_rank_id: professionalData.academicRankId,
        employment_status: professionalData.employmentStatus.trim() || null,
        campus_id: professionalData.campusId.trim(),
        college_id: professionalData.collegeId.trim(),
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
      onClose={onClose ?? (() => router.back())}
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
                    e.target.value.trim(),
                  );
                }}
              >
                <option value="Regular">Regular</option>
                <option value="Part-time">Part Time</option>
                <option value="Contract of Service">Contract of Service</option>
                <option value="Temporary">Temporary</option>
              </select>
            </div>

            <div>
              <Label className="text-xs">Campus *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-1 w-full justify-between"
                onClick={() => setCampusDialogOpen(true)}
                disabled={isProfessionalSaving}
              >
                <span className="truncate">
                  {professionalData.campusId
                    ? campuses.find((c) => c.id === professionalData.campusId)
                        ?.name ?? "Select campus..."
                    : "Select campus..."}
                </span>
                <ChevronDown className="h-4 w-4 text-foreground/60" />
              </Button>
            </div>

            <div>
              <Label className="text-xs">College *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-1 w-full justify-between"
                onClick={() => setCollegeDialogOpen(true)}
                disabled={isProfessionalSaving}
              >
                <span className="truncate">
                  {professionalData.collegeId
                    ? colleges.find((c) => c.id === professionalData.collegeId)
                        ?.name ?? "Select college..."
                    : "Select college..."}
                </span>
                <ChevronDown className="h-4 w-4 text-foreground/60" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs">Designations</Label>

            <DesignationSection
              mode="edit"
              designations={professionalData.designations}
              onAddDesignation={handleAddDesignation}
              onRemoveDesignation={handleRemoveDesignation}
              isMutating={isProfessionalSaving}
              error={professionalError}
            />
          </div>
        </div>
        {hasProfessionalChanges && (
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
        )}
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

      <CampusPickerDialog
        open={campusDialogOpen}
        onOpenChange={setCampusDialogOpen}
        campuses={campuses}
        selectedCampusId={professionalData.campusId ?? ""}
        query={campusQuery}
        onQueryChange={setCampusQuery}
        onSelect={(nextCampusId) => {
          handleProfessionalChange("campusId", nextCampusId);
          setCampusDialogOpen(false);
        }}
        emptyState="No campuses found."
      />

      <CollegePickerDialog
        open={collegeDialogOpen}
        onOpenChange={setCollegeDialogOpen}
        colleges={colleges}
        selectedCollegeId={professionalData.collegeId ?? ""}
        query={collegeQuery}
        onQueryChange={setCollegeQuery}
        onSelect={(nextCollegeId) => {
          handleProfessionalChange("collegeId", nextCollegeId);
          setCollegeDialogOpen(false);
        }}
        emptyState="No colleges found."
      />
    </AdminPanel>
  );
};
