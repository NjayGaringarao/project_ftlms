"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CampusPickerDialog from "@/features/shared/components/pickers/campus-picker-dialog";
import CollegePickerDialog from "@/features/shared/components/pickers/college-picker-dialog";
import { createUser } from "@/features/admin/lib/users/actions";
import type { CampusListItem } from "@/features/admin/lib/campuses";
import type { CollegeListItem } from "@/features/admin/lib/colleges";
import type { ProgramCampusOffering } from "@/features/admin/lib/programs";
import FormStatusBanner from "../form-status-banner";

type UserInitialFormState = {
  email: string;
  password: string;
  name: string;
  birthDate: string;
  address: string;
  contactNumber: string;
  employmentStatus: string;
  campusId: string;
  collegeId: string;
};

const initialFormState: UserInitialFormState = {
  email: "",
  password: "",
  name: "",
  birthDate: "",
  address: "",
  contactNumber: "",
  employmentStatus: "Regular",
  campusId: "",
  collegeId: "",
};

type UserCreateProps = {
  campuses: CampusListItem[];
  colleges: CollegeListItem[];
  programOfferings: ProgramCampusOffering[];
  onCreated?: (id: string) => void;
  onCancel?: () => void;
};

export const UserCreate = ({
  campuses,
  colleges,
  programOfferings,
  onCreated,
  onCancel,
}: UserCreateProps) => {
  const router = useRouter();
  const [formData, setFormData] =
    useState<UserInitialFormState>(initialFormState);
  const [isSaving, setIsSaving] = useState(false);
  const [createAsAdmin, setCreateAsAdmin] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [campusDialogOpen, setCampusDialogOpen] = useState(false);
  const [collegeDialogOpen, setCollegeDialogOpen] = useState(false);
  const [campusQuery, setCampusQuery] = useState("");
  const [collegeQuery, setCollegeQuery] = useState("");

  const selectedCampus =
    campuses.find((campus) => campus.id === formData.campusId) ?? null;
  const availableCollegeIds = useMemo(
    () =>
      new Set(
        programOfferings
          .filter((offering) => offering.campus_id === formData.campusId)
          .map((offering) => offering.program.college_id),
      ),
    [formData.campusId, programOfferings],
  );
  const availableColleges = useMemo(
    () =>
      formData.campusId
        ? colleges.filter((college) => availableCollegeIds.has(college.id))
        : [],
    [availableCollegeIds, colleges, formData.campusId],
  );
  const selectedCollege =
    availableColleges.find((college) => college.id === formData.collegeId) ??
    null;

  const hasChanges = useMemo(
    () =>
      JSON.stringify(formData) !== JSON.stringify(initialFormState) ||
      createAsAdmin,
    [createAsAdmin, formData],
  );

  const handleChange = (field: keyof UserInitialFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setCreateAsAdmin(false);
    setError("");
    setShowSuccess(false);
  };

  const handleCreate = async () => {
    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }

    if (!formData.password.trim()) {
      setError("Password is required");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!formData.name.trim()) {
      setError("Full name is required");
      return;
    }

    if (!formData.birthDate.trim()) {
      setError("Birth date is required");
      return;
    }

    if (!formData.campusId.trim()) {
      setError("Campus is required");
      return;
    }

    if (!formData.collegeId.trim()) {
      setError("College is required");
      return;
    }

    setIsSaving(true);
    setError("");
    setShowSuccess(false);

    const { data, error: createError } = await createUser({
      email: formData.email.trim(),
      password: formData.password.trim(),
      is_admin: createAsAdmin,
      name: formData.name.trim(),
      birth_date: formData.birthDate,
      address: formData.address.trim() || null,
      contact_number: formData.contactNumber.trim() || null,
      employment_status: formData.employmentStatus.trim() || null,
      campus_id: formData.campusId.trim(),
      college_id: formData.collegeId.trim(),
    });

    setIsSaving(false);

    if (createError) {
      setError(createError);
      return;
    }

    setShowSuccess(true);

    setTimeout(() => {
      if (data?.id) {
        if (onCreated) {
          onCreated(data.id);
        } else {
          router.push(`/users?id=${data.id}`);
        }
        return;
      }

      if (onCancel) {
        onCancel();
      } else {
        router.push("/users");
      }
    }, 1500);
  };

  return (
    <>
      <div className="space-y-8">
        <FormStatusBanner
          variant="compact"
          success={
            showSuccess
              ? { title: "Account created successfully. Redirecting..." }
              : undefined
          }
          error={error}
        />

        <section className="space-y-4">
          <div className="border-b pb-2">
            <h3 className="font-semibold">Authentication Credentials</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs" htmlFor="email">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(event) => handleChange("email", event.target.value)}
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label className="text-xs" htmlFor="password">
                Password *
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password (min 6 characters)"
                value={formData.password}
                onChange={(event) =>
                  handleChange("password", event.target.value)
                }
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div className="md:col-span-2 rounded-md border border-input bg-background/50 p-3">
              <div className="flex items-start gap-3">
                <input
                  id="createAsAdmin"
                  type="checkbox"
                  checked={createAsAdmin}
                  onChange={(event) => {
                    setCreateAsAdmin(event.target.checked);
                    setError("");
                  }}
                  className="mt-0.5 h-4 w-4 accent-foreground"
                  disabled={isSaving}
                />
                <div className="space-y-1">
                  <Label htmlFor="createAsAdmin" className="text-xs font-medium">
                    Create as Admin Account
                  </Label>
                  <p className="text-xs text-foreground/60">
                    When enabled, this account must confirm an email address and
                    receives administrative privileges.
                  </p>
                  {createAsAdmin && (
                    <div className="inline-flex items-center gap-1 text-xs text-foreground/80">
                      <Shield className="h-3.5 w-3.5" />
                      Role metadata:{" "}
                      <span className="font-mono">user_role=ADMIN</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="border-b pb-2">
            <h3 className="font-semibold">Personal Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label className="text-xs" htmlFor="name">
                Full Name *
              </Label>
              <Input
                id="name"
                placeholder="Enter full name"
                value={formData.name}
                onChange={(event) => handleChange("name", event.target.value)}
                onBlur={(event) =>
                  handleChange("name", event.target.value.trim())
                }
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label className="text-xs" htmlFor="birthDate">
                Birth Date *
              </Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(event) =>
                  handleChange("birthDate", event.target.value)
                }
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label className="text-xs" htmlFor="contactNumber">
                Contact Number
              </Label>
              <Input
                id="contactNumber"
                placeholder="Enter contact number"
                value={formData.contactNumber}
                onChange={(event) =>
                  handleChange("contactNumber", event.target.value)
                }
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div className="md:col-span-2">
              <Label className="text-xs" htmlFor="address">
                Address
              </Label>
              <Input
                id="address"
                placeholder="Enter address"
                value={formData.address}
                onChange={(event) => handleChange("address", event.target.value)}
                onBlur={(event) =>
                  handleChange("address", event.target.value.trim())
                }
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label className="text-xs" htmlFor="employmentStatus">
                Employment Status
              </Label>
              <select
                id="employmentStatus"
                value={formData.employmentStatus}
                onChange={(event) =>
                  handleChange("employmentStatus", event.target.value)
                }
                className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                disabled={isSaving}
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
                disabled={isSaving}
              >
                <span className="truncate">
                  {selectedCampus ? selectedCampus.name : "Select campus..."}
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
                disabled={isSaving || !formData.campusId}
              >
                <span className="truncate">
                  {!formData.campusId
                    ? "Select campus first"
                    : selectedCollege
                      ? selectedCollege.name
                      : "Select college..."}
                </span>
                <ChevronDown className="h-4 w-4 text-foreground/60" />
              </Button>
            </div>
          </div>
        </section>

        {hasChanges && (
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleReset} disabled={isSaving}>
              Reset
            </Button>
            <Button onClick={handleCreate} disabled={isSaving}>
              {isSaving ? "Creating..." : "Create User"}
            </Button>
          </div>
        )}
      </div>

      <CampusPickerDialog
        open={campusDialogOpen}
        onOpenChange={setCampusDialogOpen}
        campuses={campuses}
        selectedCampusId={formData.campusId}
        query={campusQuery}
        onQueryChange={setCampusQuery}
        onSelect={(nextCampusId) => {
          const nextAvailableCollegeIds = new Set(
            programOfferings
              .filter((offering) => offering.campus_id === nextCampusId)
              .map((offering) => offering.program.college_id),
          );
          setFormData((prev) => ({
            ...prev,
            campusId: nextCampusId,
            collegeId: nextAvailableCollegeIds.has(prev.collegeId)
              ? prev.collegeId
              : "",
          }));
          setError("");
          setCampusDialogOpen(false);
        }}
        emptyState="No campuses found."
      />

      <CollegePickerDialog
        open={collegeDialogOpen}
        onOpenChange={setCollegeDialogOpen}
        colleges={availableColleges}
        selectedCollegeId={formData.collegeId}
        query={collegeQuery}
        onQueryChange={setCollegeQuery}
        onSelect={(nextCollegeId) => {
          handleChange("collegeId", nextCollegeId);
          setCollegeDialogOpen(false);
        }}
        emptyState="No colleges are available for this campus."
      />
    </>
  );
};
