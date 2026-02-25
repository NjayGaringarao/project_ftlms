"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import AdminPanel from "./admin-panel";
import FormStatusBanner from "./form-status-banner";
import { getProgramOfferingsList } from "@/lib/admin/program-offerings";
import { getMajorsList } from "@/lib/admin/majors";
import { createMajorOffering } from "@/lib/admin/actions";
import { MajorListItem } from "@/lib/admin/majors";
import { ProgramOfferingListItem } from "@/lib/admin/program-offerings";

type MajorOfferingCreateProps = {
  basePath?: string;
  fixedProgramOfferingId?: string;
};

export const MajorOfferingCreate = ({
  basePath = "/major-offerings",
  fixedProgramOfferingId,
}: MajorOfferingCreateProps) => {
  const router = useRouter();
  const [programOfferings, setProgramOfferings] = useState<
    ProgramOfferingListItem[]
  >([]);
  const [majors, setMajors] = useState<MajorListItem[]>([]);
  const [programOfferingId, setProgramOfferingId] = useState(
    fixedProgramOfferingId ?? "",
  );
  const [majorId, setMajorId] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoadingData(true);
      const [offeringsList, majorsList] = await Promise.all([
        getProgramOfferingsList(),
        getMajorsList(),
      ]);
      setProgramOfferings(offeringsList);
      setMajors(majorsList);
      setIsLoadingData(false);
    };

    load();
  }, []);

  const selectedProgramOffering = useMemo(
    () =>
      programOfferings.find((offering) => offering.id === programOfferingId),
    [programOfferings, programOfferingId],
  );

  const filteredMajors = useMemo(() => {
    const programId = selectedProgramOffering?.program_id;
    if (!programId) return majors;
    return majors.filter((major) => major.program_id === programId);
  }, [majors, selectedProgramOffering]);

  const handleCreate = async () => {
    if (!programOfferingId) {
      setError("Program offering is required");
      return;
    }
    if (!majorId) {
      setError("Major is required");
      return;
    }

    setIsSaving(true);
    setError("");
    setShowSuccess(false);

    const { data, error: createError } = await createMajorOffering({
      program_campus_id: programOfferingId,
      major_id: majorId,
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
      title="Major Offering"
      icon={Plus}
      onClose={() => router.push(basePath)}
    >
      <div className="space-y-4">
        <FormStatusBanner
          success={
            showSuccess
              ? {
                  title: "Major offering created",
                  message: "Record created successfully. Redirecting...",
                }
              : undefined
          }
          error={error}
        />

        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <h3 className="font-semibold">Major Offering Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!fixedProgramOfferingId && (
              <div>
                <Label className="text-xs" htmlFor="program-offering-id">
                  Program Offering *
                </Label>
                <select
                  id="program-offering-id"
                  className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                  value={programOfferingId}
                  onChange={(event) => {
                    setProgramOfferingId(event.target.value);
                    setMajorId("");
                    setError("");
                  }}
                  disabled={isSaving || isLoadingData}
                >
                  <option value="">Select program offering...</option>
                  {programOfferings.map((offering) => (
                    <option key={offering.id} value={offering.id}>
                      {offering.program?.name} - {offering.campus?.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <Label className="text-xs" htmlFor="major-id">
                Major *
              </Label>
              <select
                id="major-id"
                className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                value={majorId}
                onChange={(event) => {
                  setMajorId(event.target.value);
                  setError("");
                }}
                disabled={isSaving || isLoadingData}
              >
                <option value="">Select major...</option>
                {filteredMajors.map((major) => (
                  <option key={major.id} value={major.id}>
                    {major.name} ({major.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setProgramOfferingId(fixedProgramOfferingId ?? "");
                setMajorId("");
                setError("");
                setShowSuccess(false);
              }}
              disabled={isSaving}
            >
              Reset
            </Button>
            <Button onClick={handleCreate} disabled={isSaving || isLoadingData}>
              {isSaving ? "Creating..." : "Create Major Offering"}
            </Button>
          </div>
        </div>
      </div>
    </AdminPanel>
  );
};
