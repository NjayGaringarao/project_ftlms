"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle,
  User,
  X,
  Plus,
  Trash2,
  BookOpen,
  Mail,
  Lock,
  Briefcase,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import Link from "next/link";

type UserEditFormProps = {
  user: UserDetail;
  ranks?: Array<{ id: string; title: string }>;
};

type PersonalFormState = {
  firstName: string;
  middleName: string;
  lastName: string;
  extension: string;
  birthDate: string;
  address: string;
  zipCode: string;
  contactNumber: string;
};

type ProfessionalFormState = {
  academicRankId: string | null;
  employmentStatus: string;
  designations: Array<{
    id?: string;
    campus_id?: string | null;
    job_title: string;
    department_id?: string | null;
    program_campus_id?: string | null;
    room_id?: string | null;
    load?: number | null;
  }>;
};

type SecurityFormState = {
  newEmail: string;
  newPassword: string;
  confirmPassword: string;
};

const userToPersonalFormState = (user: UserDetail): PersonalFormState => ({
  firstName: user.identity?.first_name ?? "",
  middleName: user.identity?.middle_name ?? "",
  lastName: user.identity?.last_name ?? "",
  extension: user.identity?.extension ?? "",
  birthDate: user.identity?.birth_date ?? "",
  address: user.identity?.address ?? "",
  zipCode: user.identity?.zip_code ?? "",
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
      department_id: d.department_id,
      program_campus_id: d.program_campus_id,
      room_id: d.room_id,
      load: d.load,
    })) ?? [],
});

export const UserEditForm = ({ user, ranks = [] }: UserEditFormProps) => {
  const router = useRouter();

  // Personal Information State
  const [personalData, setPersonalData] = useState<PersonalFormState>(() =>
    userToPersonalFormState(user),
  );
  const [savedPersonalData, setSavedPersonalData] = useState<PersonalFormState>(
    () => userToPersonalFormState(user),
  );

  // Professional Information State
  const [professionalData, setProfessionalData] =
    useState<ProfessionalFormState>(() => userToProfessionalFormState(user));
  const [savedProfessionalData, setSavedProfessionalData] =
    useState<ProfessionalFormState>(() => userToProfessionalFormState(user));

  // Security State
  const [securityData, setSecurityData] = useState<SecurityFormState>({
    newEmail: "",
    newPassword: "",
    confirmPassword: "",
  });

  // UI States - Personal
  const [isPersonalSaving, setIsPersonalSaving] = useState(false);
  const [personalError, setPersonalError] = useState("");
  const [personalSuccess, setPersonalSuccess] = useState(false);

  // UI States - Professional
  const [isProfessionalSaving, setIsProfessionalSaving] = useState(false);
  const [professionalError, setProfessionalError] = useState("");
  const [professionalSuccess, setProfessionalSuccess] = useState(false);

  // UI States - Security
  const [isSecuritySaving, setIsSecuritySaving] = useState(false);

  // Handle Personal Data Change
  const handlePersonalChange = (
    field: keyof PersonalFormState,
    value: string,
  ) => {
    setPersonalData((prev) => ({ ...prev, [field]: value }));
    setPersonalError("");
  };

  // Handle Professional Data Change
  const handleProfessionalChange = (
    field: keyof Omit<ProfessionalFormState, "designations">,
    value: string | null,
  ) => {
    setProfessionalData((prev) => ({ ...prev, [field]: value }));
    setProfessionalError("");
  };

  // Handle Designation Addition (from DesignationAddForm)
  const handleAddDesignation = (designation: any) => {
    setProfessionalData((prev) => ({
      ...prev,
      designations: [
        ...prev.designations,
        {
          job_title: designation.job_title,
          department_id: designation.department_id || null,
          program_campus_id: designation.program_campus_id || null,
          campus_id: designation.campus_id || null,
          room_id: designation.room_id || null,
          load: designation.load,
        },
      ],
    }));
    setProfessionalError("");
  };

  // Handle Designation Removal
  const handleRemoveDesignation = (index: number) => {
    setProfessionalData((prev) => ({
      ...prev,
      designations: prev.designations.filter((_, i) => i !== index),
    }));
  };

  // PERSONAL INFORMATION HANDLERS
  const handleResetPersonal = () => {
    setPersonalData(savedPersonalData);
    setPersonalError("");
    setPersonalSuccess(false);
  };

  const handleSavePersonal = async () => {
    // Validate personal data
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

  // PROFESSIONAL INFORMATION HANDLERS
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

  // Handle Email Change
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

  // Handle Password Change
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
    <Card className="mt-4 mr-4 mb-4 overflow-hidden gap-0 py-0">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-foreground/10 py-6">
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Edit User Profile
        </CardTitle>
        <div className="flex flex-row items-center gap-4">
          <Link href={`/users/${user?.id}`} className="text-foreground">
            <X />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="overflow-y-auto h-full flex flex-col gap-6 py-4">
        {/* Personal Information Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <User className="w-5 h-5" />
            <h3 className=" font-semibold">Personal Information</h3>
          </div>

          {personalSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <p className="text-xs text-green-900">
                Personal information saved successfully
              </p>
            </div>
          )}

          {personalError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-900">{personalError}</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="text-xs">
                First Name *
              </Label>
              <Input
                id="firstName"
                placeholder="Enter first name"
                value={personalData.firstName}
                onChange={(e) =>
                  handlePersonalChange("firstName", e.target.value)
                }
                className="mt-1"
                disabled={isPersonalSaving}
                onBlur={(e) => {
                  handlePersonalChange(
                    "firstName",
                    e.target.value.trim().toUpperCase(),
                  );
                }}
              />
            </div>

            <div>
              <Label htmlFor="middleName" className="text-xs">
                Middle Name
              </Label>
              <Input
                id="middleName"
                placeholder="Enter middle name"
                value={personalData.middleName}
                onChange={(e) =>
                  handlePersonalChange("middleName", e.target.value)
                }
                className="mt-1"
                disabled={isPersonalSaving}
                onBlur={(e) => {
                  handlePersonalChange(
                    "middleName",
                    e.target.value.trim().toUpperCase(),
                  );
                }}
              />
            </div>

            <div>
              <Label htmlFor="lastName" className="text-xs">
                Last Name *
              </Label>
              <Input
                id="lastName"
                placeholder="Enter last name"
                value={personalData.lastName}
                onChange={(e) =>
                  handlePersonalChange("lastName", e.target.value)
                }
                className="mt-1"
                disabled={isPersonalSaving}
                onBlur={(e) => {
                  handlePersonalChange(
                    "lastName",
                    e.target.value.trim().toUpperCase(),
                  );
                }}
              />
            </div>

            <div>
              <Label htmlFor="extension" className="text-xs">
                Extension
              </Label>
              <Input
                id="extension"
                placeholder="e.g. JR., III"
                value={personalData.extension}
                onChange={(e) =>
                  handlePersonalChange("extension", e.target.value)
                }
                className="mt-1"
                disabled={isPersonalSaving}
                onBlur={(e) => {
                  handlePersonalChange(
                    "extension",
                    e.target.value.trim().toUpperCase(),
                  );
                }}
              />
            </div>

            <div>
              <Label htmlFor="birthDate" className="text-xs">
                Birth Date *
              </Label>
              <Input
                id="birthDate"
                type="date"
                value={personalData.birthDate}
                onChange={(e) =>
                  handlePersonalChange("birthDate", e.target.value)
                }
                className="mt-1"
                disabled={isPersonalSaving}
              />
            </div>

            <div>
              <Label htmlFor="contactNumber" className="text-xs">
                Contact Number
              </Label>
              <Input
                id="contactNumber"
                placeholder="Enter contact number"
                value={personalData.contactNumber}
                onChange={(e) =>
                  handlePersonalChange("contactNumber", e.target.value)
                }
                className="mt-1"
                disabled={isPersonalSaving}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address" className="text-xs">
                Address
              </Label>
              <Input
                id="address"
                placeholder="Enter address"
                value={personalData.address}
                onChange={(e) =>
                  handlePersonalChange("address", e.target.value)
                }
                className="mt-1"
                disabled={isPersonalSaving}
                onBlur={(e) => {
                  handlePersonalChange(
                    "address",
                    e.target.value.trim().toUpperCase(),
                  );
                }}
              />
            </div>

            <div>
              <Label htmlFor="zipCode" className="text-xs">
                ZIP Code
              </Label>
              <Input
                id="zipCode"
                placeholder="Enter ZIP code"
                value={personalData.zipCode}
                onChange={(e) =>
                  handlePersonalChange("zipCode", e.target.value)
                }
                className="mt-1"
                disabled={isPersonalSaving}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={handleResetPersonal}
              disabled={isPersonalSaving}
            >
              Reset
            </Button>
            <Button onClick={handleSavePersonal} disabled={isPersonalSaving}>
              {isPersonalSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Professional Information Section */}
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
            {/* Rank and Employment Status */}
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

            {/* Designations */}
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Designations</Label>

              {/* List of Current Designations */}
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
                          {designation.program_campus_id && (
                            <p className="text-xs text-foreground/60">
                              Program Offering: {designation.program_campus_id}
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

              {/* Add New Designation Form */}
              <DesignationAddForm
                onAdd={handleAddDesignation}
                isLoading={isProfessionalSaving}
                error={professionalError}
              />
            </div>
          </div>
          {/* Dedicated Save/Reset Buttons */}
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

        {/* Security Section */}
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
            {/* Change Email */}
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

            {/* Change Password */}
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
      </CardContent>
    </Card>
  );
};
