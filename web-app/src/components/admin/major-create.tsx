"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import AdminPanel from "./admin-panel";
import FormStatusBanner from "./form-status-banner";
import { getPrograms } from "@/lib/admin/programs";
import { createMajor } from "@/lib/admin/actions";
import { ExtendedProgram } from "@/models";

export const MajorCreate = () => {
  const router = useRouter();
  const [programs, setPrograms] = useState<ExtendedProgram[]>([]);
  const [programId, setProgramId] = useState("");
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
      const programList = await getPrograms();
      setPrograms(programList);
      setIsLoadingData(false);
    };

    load();
  }, []);

  const handleCreate = async () => {
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
    setShowSuccess(false);

    const { data, error: createError } = await createMajor({
      program_id: programId,
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
        router.push(`/majors/${data.id}`);
      } else {
        router.push("/majors");
      }
    }, 1200);
  };

  return (
    <AdminPanel
      title="Major Information"
      icon={Plus}
      onClose={() => router.push("/majors")}
    >
      <div className="space-y-4">
        <FormStatusBanner
          success={
            showSuccess
              ? {
                  title: "Major created",
                  message: "Record created successfully. Redirecting...",
                }
              : undefined
          }
          error={error}
        />

        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <h3 className="font-semibold">Major Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                setProgramId("");
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
              {isSaving ? "Creating..." : "Create Major"}
            </Button>
          </div>
        </div>
      </div>
    </AdminPanel>
  );
};
