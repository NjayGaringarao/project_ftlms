"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import AdminPanel from "./admin-panel";
import FormStatusBanner from "./form-status-banner";
import { getCampusesList } from "@/lib/admin/campuses";
import { getPrograms } from "@/lib/admin/programs";
import { updateProgramOffering } from "@/lib/admin/actions";
import { Campus, ExtendedProgram } from "@/models";
import { ProgramOfferingListItem } from "@/lib/admin/program-offerings";

type ProgramOfferingEditProps = {
  offering: ProgramOfferingListItem;
};

export const ProgramOfferingEdit = ({ offering }: ProgramOfferingEditProps) => {
  const router = useRouter();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [programs, setPrograms] = useState<ExtendedProgram[]>([]);
  const [campusId, setCampusId] = useState(offering.campus_id);
  const [programId, setProgramId] = useState(offering.program_id);
  const [savedCampusId, setSavedCampusId] = useState(offering.campus_id);
  const [savedProgramId, setSavedProgramId] = useState(offering.program_id);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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

  const handleSave = async () => {
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
    setSuccess(false);

    const { error: updateError } = await updateProgramOffering({
      id: offering.id,
      campus_id: campusId,
      program_id: programId,
    });

    setIsSaving(false);

    if (updateError) {
      setError(updateError);
      return;
    }

    setSavedCampusId(campusId);
    setSavedProgramId(programId);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <AdminPanel
      title="Edit Program Offering"
      icon={Save}
      onClose={() => router.push(`/program-offerings/${offering.id}`)}
    >
      <div className="space-y-4">
        <FormStatusBanner
          variant="compact"
          success={
            success
              ? { title: "Program offering updated successfully" }
              : undefined
          }
          error={error}
        />

        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <h3 className="font-semibold">Program Offering Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                setCampusId(savedCampusId);
                setProgramId(savedProgramId);
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
