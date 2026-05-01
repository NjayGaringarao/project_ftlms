"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import AdminPanel from "../admin-panel";
import FormStatusBanner from "../form-status-banner";
import { getCampusesList } from "@/features/admin/lib/campuses";
import { getPrograms } from "@/features/admin/lib/programs";
import { createProgramOffering } from "@/features/admin/lib/actions";
import { Campus, ExtendedProgram } from "@/features/shared/types/models";

type ProgramOfferingCreateProps = {
  basePath?: string;
  fixedCampusId?: string;
};

export const ProgramOfferingCreate = ({
  basePath = "/program-offerings",
  fixedCampusId,
}: ProgramOfferingCreateProps) => {
  const router = useRouter();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [programs, setPrograms] = useState<ExtendedProgram[]>([]);
  const [campusId, setCampusId] = useState(fixedCampusId ?? "");
  const [programId, setProgramId] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoadingData(true);
      const [campusList, programList] = await Promise.all([
        getCampusesList(),
        getPrograms(),
      ]);
      setCampuses(campusList);
      setPrograms(programList);
      setIsLoadingData(false);
    };

    load();
  }, []);

  const handleCreate = async () => {
    if (!campusId) {
      setError("Campus is required");
      return;
    }
    if (!programId) {
      setError("Program is required");
      return;
    }

    setIsSaving(true);
    setError("");
    setShowSuccess(false);

    const { data, error: createError } = await createProgramOffering({
      campus_id: campusId,
      program_id: programId,
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
      title="Program Offering"
      icon={Plus}
      onClose={() => router.push(basePath)}
    >
      <div className="space-y-4">
        <FormStatusBanner
          success={
            showSuccess
              ? {
                  title: "Program offering created",
                  message: "Record created successfully. Redirecting...",
                }
              : undefined
          }
          error={error}
        />

        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <h3 className="font-semibold">Program Offering Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!fixedCampusId && (
              <div>
                <Label className="text-xs" htmlFor="campus-id">
                  Campus *
                </Label>
                <select
                  id="campus-id"
                  className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                  value={campusId}
                  onChange={(event) => {
                    setCampusId(event.target.value);
                    setError("");
                  }}
                  disabled={isSaving || isLoadingData}
                >
                  <option value="">Select campus...</option>
                  {campuses.map((campus) => (
                    <option key={campus.id} value={campus.id}>
                      {campus.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

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
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setCampusId(fixedCampusId ?? "");
                setProgramId("");
                setError("");
                setShowSuccess(false);
              }}
              disabled={isSaving}
            >
              Reset
            </Button>
            <Button onClick={handleCreate} disabled={isSaving || isLoadingData}>
              {isSaving ? "Creating..." : "Create Program Offering"}
            </Button>
          </div>
        </div>
      </div>
    </AdminPanel>
  );
};
