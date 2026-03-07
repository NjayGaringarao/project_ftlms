"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  BookOpen,
  AlertCircle,
  Trash2,
  AlertTriangle,
  WeightTilde,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserDetail } from "@/lib/users/users";
import { deleteUser } from "@/lib/users/actions";
import { formatDate, calculateAge } from "@/utils/time";
import AdminPanel from "../admin-panel";

type UserViewProps = {
  user: UserDetail;
};

export const UserView = ({ user }: UserViewProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError("");

    const { error } = await deleteUser(user.id);

    if (error) {
      setDeleteError(error);
      setIsDeleting(false);
      return;
    }

    setShowDeleteConfirm(false);
    router.push("/users");
  };

  const fullName =
    `${user.identity?.first_name || ""} ${user.identity?.middle_name || ""} ${user.identity?.last_name || ""} ${user.identity?.extension || ""}`.trim();

  const birthDate = user.identity?.birth_date
    ? new Date(user.identity.birth_date)
    : null;
  const age = birthDate ? calculateAge(birthDate) : null;

  return (
    <AdminPanel
      title="User Information"
      icon={Info}
      onClose={() => router.push("/users/")}
      onEdit={() => router.push(`/users/${user?.id}/edit`)}
    >
      {/* Personal Information */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <User className="w-5 h-5" />
          <h3 className="text-base font-semibold">Personal Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-foreground/60 mt-0.5" />
            <div>
              <p className="text-xs text-foreground/60">Full Name</p>
              <p className="font-medium text">{fullName || "Not provided"}</p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-foreground/60 mt-0.5" />
            <div>
              <p className="text-xs text-foreground/60">Email Address</p>
              <p className="font-medium break-all">{user.email || "Not set"}</p>
            </div>
          </div>

          {/* Contact Number */}
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-foreground/60 mt-0.5" />
            <div>
              <p className="text-xs text-foreground/60">Contact Number</p>
              <p className="font-medium">
                {user.identity?.contact_number || "Not provided"}
              </p>
            </div>
          </div>

          {/* Birth Date & Age */}
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-foreground/60 mt-0.5" />
            <div>
              <p className="text-xs text-foreground/60">Birth Date & Age</p>
              <p className="font-medium">
                {birthDate ? formatDate(birthDate) : "Not provided"}
                {age !== null && age !== undefined && (
                  <span className="text-foreground/60 ml-2">
                    ({age} years old)
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Address */}
          <div className="md:col-span-2 flex items-start gap-3">
            <MapPin className="w-5 h-5 text-foreground/60 mt-0.5" />
            <div className="w-full">
              <p className="text-xs text-foreground/60">Address</p>
              <p className="font-medium">
                {user.identity?.address || "Not provided"}{" "}
                {user.identity?.zip_code || ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <Briefcase className="w-5 h-5" />
          <h3 className="font-semibold">Professional Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Academic Rank */}
          <div className="flex items-start gap-3">
            <Briefcase className="w-5 h-5 text-foreground/60 mt-0.5" />
            <div>
              <p className="text-xs text-foreground/60">Academic Rank</p>
              <p className="font-medium">
                {user.rank?.title || "Not assigned"}
              </p>
              {user.rank?.description && (
                <p className="text-xs text-foreground/50 mt-1">
                  {user.rank.description}
                </p>
              )}
            </div>
          </div>

          {/* Employment Status */}
          <div className="flex items-start gap-3">
            <Briefcase className="w-5 h-5 text-foreground/60 mt-0.5" />
            <div>
              <p className="text-xs text-foreground/60">Employment Status</p>
              <span className="inline-block px-3 py-1 bg-blue-50 text-blue-900 text-xs rounded-full border border-blue-200 font-medium">
                {user.employment_status || "Not specified"}
              </span>
            </div>
          </div>

          {/* Designations */}
          <div className="md:col-span-2">
            <div className="flex flex-row items-center gap-2 mb-1">
              <Briefcase className="w-5 h-5 text-foreground/60 mt-0.5" />
              <p className="text-xs text-foreground/60">Designations</p>
            </div>
            {user.designations && user.designations.length > 0 ? (
              <div className="md:col-span-2 grid grid-cols-1 lg:grid-cols-3 gap-4">
                {user.designations.map((designation) => (
                  <div
                    key={designation.id}
                    className="p-3 border rounded-lg bg-foreground/5"
                  >
                    <div className="flex flex-row gap-2 items-center">
                      <p className="font-medium">{designation.job_title}</p>
                      <div className="flex flex-row items-center text-foreground/60 gap-1">
                        <p className="text-sm">{designation.load}</p>
                        <WeightTilde className="w-4" />
                      </div>
                    </div>

                    {/** CAMPUS */}
                    {designation.campus && (
                      <p className="text-xs text-foreground/60">
                        {designation.campus.name || "Unnamed"} Campus
                      </p>
                    )}

                    {/** COLLEGE */}
                    {designation.college?.name && (
                      <p className="text-xs text-foreground/60">
                        {designation.college.name || "Unnamed College"}
                      </p>
                    )}

                    {/** PROGRAM */}
                    {designation.program?.name && (
                      <p className="text-xs text-foreground/60">
                        {designation.program.name || "Unnamed Program"}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-foreground/60">No designations assigned</p>
            )}
          </div>
        </div>
      </div>

      {/* Education */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <BookOpen className="w-5 h-5" />
          <h3 className=" font-semibold">Education</h3>
        </div>
        {user.degrees && user.degrees.length > 0 ? (
          <div className="space-y-4">
            {user.degrees.map((degree) => (
              <div
                key={degree.id}
                className="p-4 border rounded-lg bg-foreground/5"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-foreground/60">Academic Level</p>
                    <p className="font-medium">{degree.academic_level}</p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground/60">Degree Type</p>
                    <p className="font-medium">{degree.degree_type}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-foreground/60">Field of Study</p>
                    <p className="font-medium">{degree.field_of_study}</p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground/60">Institution</p>
                    <p className="font-medium">{degree.institution}</p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground/60">Year Graduated</p>
                    <p className="font-medium">
                      {degree.year_graduated || "In progress"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground/60">Country</p>
                    <p className="font-medium">{degree.country_code}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-foreground/60">No education records available</p>
        )}
      </div>

      {/* Working Load */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <Briefcase className="w-5 h-5" />
          <h3 className=" font-semibold">Working Load</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 border rounded-lg bg-foreground/5">
            <p className="text-xs text-foreground/60 mb-2">Total Load</p>
            <p className="text-2xl font-bold">24</p>
            <p className="text-xs text-foreground/50 mt-1">hours per week</p>
          </div>
          <div className="p-4 border rounded-lg bg-foreground/5">
            <p className="text-xs text-foreground/60 mb-2">Teaching Load</p>
            <p className="text-2xl font-bold">18</p>
            <p className="text-xs text-foreground/50 mt-1">hours per week</p>
          </div>
          <div className="p-4 border rounded-lg bg-foreground/5">
            <p className="text-xs text-foreground/60 mb-2">Designation Load</p>
            <p className="text-2xl font-bold">6</p>
            <p className="text-xs text-foreground/50 mt-1">hours per week</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h3 className=" font-semibold text-red-600">Danger Zone</h3>
        </div>
        <p className="text-xs text-foreground/60">
          This section contains actions that may permanently delete user data.
        </p>
        <Button
          variant="destructive"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isDeleting}
          className="self-end"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete User
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                Delete User
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground/80">
                Are you sure you want to delete <strong>{fullName}</strong>?
                This action cannot be undone. All associated data will be
                permanently deleted.
              </p>

              {deleteError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-900">{deleteError}</p>
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete User"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AdminPanel>
  );
};
