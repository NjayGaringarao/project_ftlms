"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import AdminPanel from "./admin-panel";
import FormStatusBanner from "./form-status-banner";
import { getPrograms } from "@/lib/admin/programs";
import { updateMajor } from "@/lib/admin/actions";
import { ExtendedProgram } from "@/models";
import { MajorListItem } from "@/lib/admin/majors";

type MajorEditProps = {
  major: MajorListItem;
  basePath?: string;
  fixedProgramId?: string;
};

export const MajorEdit = ({
  major,
  basePath = "/majors",
  fixedProgramId,
}: MajorEditProps) => {
  const router = useRouter();
  const [programs, setPrograms] = useState<ExtendedProgram[]>([]);
  const [programId, setProgramId] = useState(
    fixedProgramId ?? major.program_id,
  );
  const [code, setCode] = useState(major.code);
  const [name, setName] = useState(major.name);
  const [description, setDescription] = useState(major.description ?? "");
  const [savedState, setSavedState] = useState({
    programId: major.program_id,
    code: major.code,
    name: major.name,
    description: major.description ?? "",
  });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoadingData(true);
      const programList = await getPrograms();
      setPrograms(programList);
      setIsLoadingData(false);
    };

    load();
  }, []);

  const handleSave = async () => {
    if (!programId) {
      setError("Program is required");
      return;
    }
    if (!code.trim()) {
      setError("Major code is required");
      return;
    }
    if (!name.trim()) {
      setError("Major name is required");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess(false);

    const { error: updateError } = await updateMajor({
      id: major.id,
      program_id: programId,
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
      programId,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim(),
    });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <AdminPanel
      title="Edit Major"
      icon={Save}
      onClose={() => router.push(`${basePath}/${major.id}`)}
    >
      <div className="space-y-4">
        <FormStatusBanner
          variant="compact"
          success={
            success ? { title: "Major updated successfully" } : undefined
          }
          error={error}
        />

        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <h3 className="font-semibold">Major Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!fixedProgramId && (
              <div>
                <Label className="text-xs" htmlFor="program-id">
                  Program *
                </Label>
                <select
                  id="program-id"
                  className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                  value={programId}
                  onChange={(event) => {
                    setProgramId(event.target.value);
                    setError("");
                  }}
                  disabled={isSaving || isLoadingData}
                >
                  <option value="">Select program...</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name} ({program.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <Label className="text-xs" htmlFor="code">
                Major Code *
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
                Major Name *
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
                setProgramId(fixedProgramId ?? savedState.programId);
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
