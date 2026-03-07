"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import AdminPanel from "../admin-panel";
import FormStatusBanner from "../form-status-banner";
import { CollegeListItem, getCollegesList } from "@/lib/admin/colleges";
import { updateProgram } from "@/lib/admin/actions";
import { ExtendedProgram } from "@/models";

type ProgramEditProps = {
  program: ExtendedProgram;
  basePath?: string;
  fixedCollegeId?: string;
};

export const ProgramEdit = ({
  program,
  basePath = "/programs",
  fixedCollegeId,
}: ProgramEditProps) => {
  const router = useRouter();
  const [colleges, setColleges] = useState<CollegeListItem[]>([]);
  const [collegeId, setCollegeId] = useState(
    fixedCollegeId ?? program.college_id,
  );
  const [code, setCode] = useState(program.code);
  const [name, setName] = useState(program.name);
  const [description, setDescription] = useState(program.description ?? "");
  const [savedState, setSavedState] = useState({
    collegeId: program.college_id,
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
      const items = await getCollegesList();
      setColleges(items);
      setIsLoadingData(false);
    };

    load();
  }, []);

  const handleSave = async () => {
    if (!collegeId) return setError("College is required");
    if (!code.trim()) return setError("Program code is required");
    if (!name.trim()) return setError("Program name is required");

    setIsSaving(true);
    setError("");
    setSuccess(false);

    const { error: updateError } = await updateProgram({
      id: program.id,
      college_id: collegeId,
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
      collegeId,
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
      icon={Edit}
      onClose={() => router.push(`${basePath}/${program.id}`)}
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

          <div className="flex flex-col gap-4">
            {!fixedCollegeId && (
              <div>
                <Label className="text-xs" htmlFor="college-id">
                  College *
                </Label>
                <select
                  id="college-id"
                  className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                  value={collegeId}
                  onChange={(event) => {
                    setCollegeId(event.target.value);
                    setError("");
                  }}
                  disabled={isSaving || isLoadingData}
                >
                  <option value="">Select college...</option>
                  {colleges.map((college) => (
                    <option key={college.id} value={college.id}>
                      {college.name} ({college.code})
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
                setCollegeId(fixedCollegeId ?? savedState.collegeId);
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
