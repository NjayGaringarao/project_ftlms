"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import AdminPanel from "./admin-panel";
import FormStatusBanner from "./form-status-banner";
import {
  DepartmentListItem,
  getDepartmentsList,
} from "@/lib/admin/departments";
import { createProgram } from "@/lib/admin/actions";

type ProgramCreateProps = {
  basePath?: string;
  fixedDepartmentId?: string;
};

export const ProgramCreate = ({
  basePath = "/programs",
  fixedDepartmentId,
}: ProgramCreateProps) => {
  const router = useRouter();
  const [departments, setDepartments] = useState<DepartmentListItem[]>([]);
  const [departmentId, setDepartmentId] = useState(fixedDepartmentId ?? "");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoadingData(true);
      const items = await getDepartmentsList();
      setDepartments(items);
      setIsLoadingData(false);
    };

    load();
  }, []);

  const handleCreate = async () => {
    if (!departmentId) return setError("Department is required");
    if (!code.trim()) return setError("Program code is required");
    if (!name.trim()) return setError("Program name is required");

    setIsSaving(true);
    setError("");
    setShowSuccess(false);

    const { data, error: createError } = await createProgram({
      department_id: departmentId,
      code,
      name,
      description,
    });

    setIsSaving(false);

    if (createError) {
      setError(createError);
      return;
    }

    setShowSuccess(true);

    setTimeout(() => {
      if (data?.id) {
        router.push(`${basePath}/${data.id}`);
      } else {
        router.push(basePath);
      }
    }, 1200);
  };

  return (
    <AdminPanel
      title="Program Information"
      icon={Plus}
      onClose={() => router.push(basePath)}
    >
      <div className="space-y-4">
        <FormStatusBanner
          success={
            showSuccess
              ? {
                  title: "Program created",
                  message: "Record created successfully. Redirecting...",
                }
              : undefined
          }
          error={error}
        />

        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <h3 className="font-semibold">Program Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!fixedDepartmentId && (
              <div>
                <Label className="text-xs" htmlFor="department-id">
                  Department *
                </Label>
                <select
                  id="department-id"
                  className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                  value={departmentId}
                  onChange={(event) => {
                    setDepartmentId(event.target.value);
                    setError("");
                  }}
                  disabled={isSaving || isLoadingData}
                >
                  <option value="">Select department...</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name} ({department.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <Label className="text-xs" htmlFor="code">
                Program Code *
              </Label>
              <Input
                id="code"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                  setError("");
                }}
                onBlur={(event) =>
                  setCode(event.target.value.trim().toUpperCase())
                }
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label className="text-xs" htmlFor="name">
                Program Name *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError("");
                }}
                onBlur={(event) => setName(event.target.value.trim())}
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label className="text-xs" htmlFor="description">
                Description
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                onBlur={(event) => setDescription(event.target.value.trim())}
                className="mt-1"
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setDepartmentId(fixedDepartmentId ?? "");
                setCode("");
                setName("");
                setDescription("");
                setError("");
                setShowSuccess(false);
              }}
              disabled={isSaving}
            >
              Reset
            </Button>
            <Button onClick={handleCreate} disabled={isSaving || isLoadingData}>
              {isSaving ? "Creating..." : "Create Program"}
            </Button>
          </div>
        </div>
      </div>
    </AdminPanel>
  );
};
