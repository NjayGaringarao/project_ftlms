"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Trash2, AlertTriangle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserDetail } from "@/lib/users/users";
import { deleteUser } from "@/lib/users/actions";
import AdminPanel from "../admin-panel";
import WorkingLoadMetrics from "@/components/user/working-load-metrics";
import DesignationInformationContent from "@/components/user/designation-information-content";
import PersonalInformation from "@/components/user/personal-information";
import EducationInformation from "@/components/user/education-information";
import EmploymentInformation from "@/components/user/employment-information";
import AccountInformation from "@/components/user/account-information";

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

  const fullName = user.identity?.name || "this user";

  const designationLoad = (user.designations ?? []).reduce(
    (sum, designation) => sum + (designation.load ?? 0),
    0,
  );

  const actualTeachingLoad = 0;
  const totalWorkingLoad = actualTeachingLoad + designationLoad;

  return (
    <AdminPanel
      title="User Information"
      icon={Info}
      onClose={() => router.push("/users/")}
      onEdit={() => router.push(`/users/${user?.id}/edit`)}
    >
      <WorkingLoadMetrics
        designationLoad={designationLoad}
        actualTeachingLoad={actualTeachingLoad}
        totalWorkingLoad={totalWorkingLoad}
      />
      <PersonalInformation identity={user.identity} />
      <EducationInformation degrees={user.degrees ?? []} />
      <EmploymentInformation
        employmentStatus={user.employment_status}
        academicRank={user.rank}
      />
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/70">
          Designation
        </h3>
        <DesignationInformationContent designations={user.designations ?? []} />
      </div>

      <AccountInformation
        userId={user.id}
        email={user.email ?? null}
        emailStatus="Not available"
        accountType="User"
        accountCreatedAt={null}
        lastSignInAt={null}
      />

      {/* Working Load */}

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
