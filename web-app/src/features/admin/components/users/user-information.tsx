"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Trash2 } from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { UserDetail } from "@/features/admin/lib/users/types";
import {
  addUserDesignation,
  changeUserEmail,
  changeUserPassword,
  deleteUser,
  removeUserDesignation,
  updateUserPersonalInfo,
  updateUserProfessional,
} from "@/features/admin/lib/users/actions";
import PersonalEditForm from "@/features/shared/components/user/personal-edit-form";
import SecurityEmailForm from "@/features/shared/components/user/security-email-form";
import SecurityPasswordForm from "@/features/shared/components/user/security-password-form";
import DesignationSection, {
  NewDesignationInput,
} from "@/features/shared/components/user/designation-section";
import AccountInformation from "@/features/shared/components/user/account-information";
import WorkingLoadMetrics from "@/features/shared/components/user/working-load-metrics";
import CampusPickerDialog from "@/features/shared/components/pickers/campus-picker-dialog";
import CollegePickerDialog from "@/features/shared/components/pickers/college-picker-dialog";
import type { CampusListItem } from "@/features/admin/lib/campuses";
import type { CollegeListItem } from "@/features/admin/lib/colleges";
import type { ProgramCampusOffering } from "@/features/admin/lib/programs";
import FormStatusBanner from "../form-status-banner";
import { formatFullName } from "@/features/shared/lib/format-name";

type UserInformationProps = {
  user: UserDetail;
  ranks?: Array<{ id: string; title: string }>;
  campuses: CampusListItem[];
  colleges: CollegeListItem[];
  programOfferings: ProgramCampusOffering[];
  currentUserId: string | null;
};

type ProfessionalFormState = {
  academicRankId: string | null;
  employmentStatus: string;
  campusId: string | null;
  collegeId: string | null;
};

type PersonalFormValues = {
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  professionalExtension: string;
  birthDate: string;
  address: string;
  contactNumber: string;
};

const userToPersonalFormValues = (user: UserDetail): PersonalFormValues => ({
  firstName: user.identity?.first_name ?? "",
  middleName: user.identity?.middle_name ?? "",
  lastName: user.identity?.last_name ?? "",
  suffix: user.identity?.suffix ?? "",
  professionalExtension: user.identity?.professional_extension ?? "",
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
});

export const UserInformation = ({
  user,
  ranks = [],
  campuses,
  colleges,
  programOfferings,
  currentUserId,
}: UserInformationProps) => {
  const router = useRouter();
  const [professionalData, setProfessionalData] =
    useState<ProfessionalFormState>(() => userToProfessionalFormState(user));
  const [savedProfessionalData, setSavedProfessionalData] =
    useState<ProfessionalFormState>(() => userToProfessionalFormState(user));

  const [isPersonalSaving, setIsPersonalSaving] = useState(false);
  const [isProfessionalSaving, setIsProfessionalSaving] = useState(false);
  const [isDesignationMutating, setIsDesignationMutating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [professionalError, setProfessionalError] = useState("");
  const [professionalSuccess, setProfessionalSuccess] = useState(false);
  const [designationError, setDesignationError] = useState("");
  const [designationSuccess, setDesignationSuccess] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const [campusDialogOpen, setCampusDialogOpen] = useState(false);
  const [collegeDialogOpen, setCollegeDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campusQuery, setCampusQuery] = useState("");
  const [collegeQuery, setCollegeQuery] = useState("");

  const hasProfessionalChanges = useMemo(
    () =>
      JSON.stringify(professionalData) !==
      JSON.stringify(savedProfessionalData),
    [professionalData, savedProfessionalData],
  );

  const designationLoad = (user.designations ?? []).reduce(
    (sum, designation) => sum + (designation.load ?? 0),
    0,
  );
  const actualTeachingLoad = user.actual_teaching_load ?? 0;
  const totalWorkingLoad =
    user.total_working_load ?? actualTeachingLoad + designationLoad;
  const isCurrentUser = currentUserId === user.id;
  const availableCollegeIds = useMemo(
    () =>
      new Set(
        programOfferings
          .filter(
            (offering) => offering.campus_id === professionalData.campusId,
          )
          .map((offering) => offering.program.college_id),
      ),
    [professionalData.campusId, programOfferings],
  );
  const availableColleges = useMemo(
    () =>
      professionalData.campusId
        ? colleges.filter((college) => availableCollegeIds.has(college.id))
        : [],
    [availableCollegeIds, colleges, professionalData.campusId],
  );

  const handleProfessionalChange = (
    field: keyof ProfessionalFormState,
    value: string | null,
  ) => {
    setProfessionalData((prev) => ({ ...prev, [field]: value }));
    setProfessionalError("");
  };

  const handleCampusChange = (nextCampusId: string) => {
    const nextAvailableCollegeIds = new Set(
      programOfferings
        .filter((offering) => offering.campus_id === nextCampusId)
        .map((offering) => offering.program.college_id),
    );

    setProfessionalData((prev) => ({
      ...prev,
      campusId: nextCampusId,
      collegeId:
        prev.collegeId && nextAvailableCollegeIds.has(prev.collegeId)
          ? prev.collegeId
          : null,
    }));
    setProfessionalError("");
  };

  const handleSavePersonal = async (values: PersonalFormValues) => {
    setIsPersonalSaving(true);

    try {
      const { error } = await updateUserPersonalInfo({
        user_id: user.id,
        first_name: values.firstName,
        middle_name: values.middleName || null,
        last_name: values.lastName,
        suffix: values.suffix || null,
        professional_extension: values.professionalExtension || null,
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
      });

      if (error) {
        setProfessionalError(error);
        return;
      }

      setSavedProfessionalData({ ...professionalData });
      setProfessionalSuccess(true);
      router.refresh();
      setTimeout(() => setProfessionalSuccess(false), 3000);
    } finally {
      setIsProfessionalSaving(false);
    }
  };

  const handleAddDesignation = async (designation: NewDesignationInput) => {
    setIsDesignationMutating(true);
    setDesignationError("");
    setDesignationSuccess("");

    try {
      const { error } = await addUserDesignation({
        user_id: user.id,
        designation,
      });

      if (error) {
        setDesignationError(error);
        return { error };
      }

      setDesignationSuccess("Designation added successfully.");
      router.refresh();
      setTimeout(() => setDesignationSuccess(""), 3000);
      return {};
    } finally {
      setIsDesignationMutating(false);
    }
  };

  const handleRemoveDesignation = async (index: number) => {
    const designation = user.designations?.[index];
    if (!designation?.id) {
      setDesignationError("Designation ID is required");
      return;
    }

    setIsDesignationMutating(true);
    setDesignationError("");
    setDesignationSuccess("");

    try {
      const { error } = await removeUserDesignation({
        user_id: user.id,
        designation_id: designation.id,
      });

      if (error) {
        setDesignationError(error);
        return;
      }

      setDesignationSuccess("Designation removed successfully.");
      router.refresh();
      setTimeout(() => setDesignationSuccess(""), 3000);
    } finally {
      setIsDesignationMutating(false);
    }
  };

  const handleChangeEmail = async (newEmail: string) => {
    const { error: emailError } = await changeUserEmail({
      user_id: user.id,
      new_email: newEmail,
    });

    if (!emailError) router.refresh();
    return { error: emailError };
  };

  const handleChangePassword = async (newPassword: string) => {
    const { error: passwordError } = await changeUserPassword({
      user_id: user.id,
      new_password: newPassword,
    });

    return { error: passwordError };
  };

  const handleDelete = async () => {
    if (isCurrentUser) {
      setDeleteError("You cannot delete your own administrator account.");
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      const { error, deletedCurrentUser } = await deleteUser(user.id);

      if (error) {
        setDeleteError(error);
        return;
      }

      setDeleteDialogOpen(false);
      router.replace(deletedCurrentUser ? "/auth/login" : "/users");
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <WorkingLoadMetrics
        designationLoad={designationLoad}
        actualTeachingLoad={actualTeachingLoad}
        totalWorkingLoad={totalWorkingLoad}
        size="Large"
      />

      <section className="space-y-4">
        <div className="border-b pb-2">
          <h3 className="font-semibold">Personal Information</h3>
        </div>
        <PersonalEditForm
          initialValues={userToPersonalFormValues(user)}
          onSave={handleSavePersonal}
          isSaving={isPersonalSaving}
          submitText="Save Changes"
          savingText="Saving..."
        />
      </section>

      <section className="space-y-4">
        <div className="border-b pb-2">
          <h3 className="font-semibold">Professional Information</h3>
        </div>

        <FormStatusBanner
          variant="compact"
          success={
            professionalSuccess
              ? { title: "Professional information saved successfully" }
              : undefined
          }
          error={professionalError}
        />
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="academicRank" className="text-xs">
                Academic Rank
              </Label>
              <select
                id="academicRank"
                value={professionalData.academicRankId ?? ""}
                onChange={(event) =>
                  handleProfessionalChange(
                    "academicRankId",
                    event.target.value || null,
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
                onChange={(event) =>
                  handleProfessionalChange(
                    "employmentStatus",
                    event.target.value,
                  )
                }
                disabled={isProfessionalSaving}
                onBlur={(event) => {
                  handleProfessionalChange(
                    "employmentStatus",
                    event.target.value.trim(),
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
                className="mt-1 h-10 w-full justify-between px-3 text-sm font-normal"
                onClick={() => setCampusDialogOpen(true)}
                disabled={isProfessionalSaving}
              >
                <span className="truncate">
                  {professionalData.campusId
                    ? (campuses.find(
                        (campus) => campus.id === professionalData.campusId,
                      )?.name ?? "Select campus...")
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
                className="mt-1 h-10 w-full justify-between px-3 text-sm font-normal"
                onClick={() => setCollegeDialogOpen(true)}
                disabled={isProfessionalSaving || !professionalData.campusId}
              >
                <span className="truncate">
                  {!professionalData.campusId
                    ? "Select campus first"
                    : professionalData.collegeId
                      ? (availableColleges.find(
                          (college) =>
                            college.id === professionalData.collegeId,
                        )?.name ?? "Select college...")
                      : "Select college..."}
                </span>
                <ChevronDown className="h-4 w-4 text-foreground/60" />
              </Button>
            </div>
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
      </section>

      <section className="space-y-4">
        <div className="border-b pb-2">
          <h3 className="font-semibold">Designations</h3>
        </div>
        <FormStatusBanner
          variant="compact"
          success={
            designationSuccess ? { title: designationSuccess } : undefined
          }
          error={designationError}
        />
        <DesignationSection
          mode="edit"
          designations={user.designations ?? []}
          onAddDesignation={handleAddDesignation}
          onRemoveDesignation={handleRemoveDesignation}
          isMutating={isDesignationMutating}
        />
      </section>

      <section className="space-y-4">
        <div className="border-b pb-2">
          <h3 className="font-semibold">Security Settings</h3>
        </div>
        <AccountInformation
          userId={user.id}
          email={user.email ?? null}
          emailStatus={user.email_confirmed_at ? "Verified" : "Not verified"}
          accountType={user.account_type ?? "User"}
          accountCreatedAt={user.account_created_at}
          lastSignInAt={user.last_sign_in_at}
        />
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
      </section>

      <section className="space-y-4">
        <div className="border-b pb-2">
          <h3 className="font-semibold text-destructive">Danger Zone</h3>
        </div>
        <p className="text-xs text-foreground/60">
          {isCurrentUser
            ? "You cannot delete the administrator account currently signed in."
            : "Permanently delete this user and all associated profile data."}
        </p>
        <div className="flex justify-end">
          <Button
            type="button"
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isDeleting || isCurrentUser}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete User
          </Button>
        </div>
      </section>

      <CampusPickerDialog
        open={campusDialogOpen}
        onOpenChange={setCampusDialogOpen}
        campuses={campuses}
        selectedCampusId={professionalData.campusId ?? ""}
        query={campusQuery}
        onQueryChange={setCampusQuery}
        onSelect={(nextCampusId) => {
          handleCampusChange(nextCampusId);
          setCampusDialogOpen(false);
        }}
        emptyState="No campuses found."
      />

      <CollegePickerDialog
        open={collegeDialogOpen}
        onOpenChange={setCollegeDialogOpen}
        colleges={availableColleges}
        selectedCollegeId={professionalData.collegeId ?? ""}
        query={collegeQuery}
        onQueryChange={setCollegeQuery}
        onSelect={(nextCollegeId) => {
          handleProfessionalChange("collegeId", nextCollegeId);
          setCollegeDialogOpen(false);
        }}
        emptyState="No colleges are available for this campus."
      />

      <AppDialog
        open={deleteDialogOpen && !isCurrentUser}
        onOpenChange={setDeleteDialogOpen}
        title="Delete User"
        description="This action cannot be undone."
      >
        <div className="space-y-4 p-4">
          <FormStatusBanner variant="compact" error={deleteError} />
          <p className="text-sm text-foreground/70">
            Are you sure you want to delete{" "}
            <strong>{formatFullName(user.identity) ?? "this user"}</strong>?
          </p>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || isCurrentUser}
            >
              {isDeleting ? "Deleting..." : "Delete User"}
            </Button>
          </div>
        </div>
      </AppDialog>
    </div>
  );
};
