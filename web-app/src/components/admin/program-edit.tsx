"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import AdminPanel from "./admin-panel";
import FormStatusBanner from "./form-status-banner";
import {
  DepartmentListItem,
  getDepartmentsList,
} from "@/lib/admin/departments";
import { updateProgram } from "@/lib/admin/actions";
import { ExtendedProgram } from "@/models";

type ProgramEditProps = {
  program: ExtendedProgram;
};

export const ProgramEdit = ({ program }: ProgramEditProps) => {
  const router = useRouter();
  const [departments, setDepartments] = useState<DepartmentListItem[]>([]);
  const [departmentId, setDepartmentId] = useState(program.department_id);
  const [code, setCode] = useState(program.code);
  const [name, setName] = useState(program.name);
  const [description, setDescription] = useState(program.description ?? "");
  const [savedState, setSavedState] = useState({
    departmentId: program.department_id,
    code: program.code,
    name: program.name,
    description: program.description ?? "",
  });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoadingData(true);
      const items = await getDepartmentsList();
      setDepartments(items);
      setIsLoadingData(false);
    };

    load();
  }, []);

  const handleSave = async () => {
    if (!departmentId) return setError("Department is required");
    if (!code.trim()) return setError("Program code is required");
    if (!name.trim()) return setError("Program name is required");

    setIsSaving(true);
    setError("");
    setSuccess(false);

    const { error: updateError } = await updateProgram({
      id: program.id,
      department_id: departmentId,
      code,
      name,
      description,
    });

    setIsSaving(false);

    if (updateError) {
      setError(updateError);
      return;
    }

    setSavedState({
      departmentId,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim(),
    });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <AdminPanel
      title="Edit Program"
      icon={Save}
      onClose={() => router.push(`/programs/${program.id}`)}
    >
      <div className="space-y-4">
        <FormStatusBanner
          variant="compact"
          success={
            success ? { title: "Program updated successfully" } : undefined
          }
          error={error}
        />

        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <h3 className="font-semibold">Program Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                setDepartmentId(savedState.departmentId);
                setCode(savedState.code);
                setName(savedState.name);
                setDescription(savedState.description);
                setError("");
                setSuccess(false);
              }}
              disabled={isSaving}
            >
              Reset
            </Button>
            <Button onClick={handleSave} disabled={isSaving || isLoadingData}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </AdminPanel>
  );
};
