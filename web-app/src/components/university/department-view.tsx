"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Edit,
  FileText,
  Trash2,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Department } from "@/models/department";
import { deleteDepartment } from "@/lib/university/actions";

type DepartmentViewProps = {
  department: Department;
};

export const DepartmentView = ({ department }: DepartmentViewProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError("");

    const { error } = await deleteDepartment(department.id);

    if (error) {
      setDeleteError(error);
      setIsDeleting(false);
      return;
    }

    setShowDeleteConfirm(false);
    router.push("/university/departments");
  };

  return (
    <Card className="mt-4 mr-4 overflow-hidden gap-0 py-0">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-foreground/10 py-6">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Department Information
        </CardTitle>
        <div className="flex flex-row items-center gap-4">
          <Link
            href={`/university/departments/${department.id}/edit`}
            className="text-foreground"
          >
            <Edit />
          </Link>
          <Link href="/university/departments" className="text-foreground">
            <X />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="overflow-y-auto flex flex-col gap-8 py-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Building2 className="w-5 h-5" />
            <h3 className="text-base font-semibold">Department Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-foreground/60 mt-0.5" />
              <div>
                <p className="text-xs text-foreground/60">Code</p>
                <p className="font-medium">{department.code}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-foreground/60 mt-0.5" />
              <div>
                <p className="text-xs text-foreground/60">Name</p>
                <p className="font-medium">{department.name}</p>
              </div>
            </div>

            <div className="md:col-span-2 flex items-start gap-3">
              <FileText className="w-5 h-5 text-foreground/60 mt-0.5" />
              <div>
                <p className="text-xs text-foreground/60">Description</p>
                <p className="font-medium">
                  {department.description || "No description provided"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-600">Danger Zone</h3>
          </div>

          <p className="text-xs text-foreground/60">
            Deleting this department detaches linked colleges by setting their
            department reference to empty.
          </p>

          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
            className="self-end"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Department
          </Button>
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-96">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  Delete Department
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-foreground/80">
                  Are you sure you want to delete{" "}
                  <strong>{department.name}</strong>? This action cannot be
                  undone.
                </p>

                <p className="text-xs text-foreground/60">
                  Colleges assigned to this department will remain but their
                  department assignment will be removed.
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
                    {isDeleting ? "Deleting..." : "Delete Department"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
