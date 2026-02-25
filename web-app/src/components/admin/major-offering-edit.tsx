"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import AdminPanel from "./admin-panel";
import FormStatusBanner from "./form-status-banner";
import { getProgramOfferingsList } from "@/lib/admin/program-offerings";
import { getMajorsList } from "@/lib/admin/majors";
import { updateMajorOffering } from "@/lib/admin/actions";
import { MajorListItem } from "@/lib/admin/majors";
import { ProgramOfferingListItem } from "@/lib/admin/program-offerings";
import { MajorOfferingListItem } from "@/lib/admin/major-offerings";

type MajorOfferingEditProps = {
  offering: MajorOfferingListItem;
};

export const MajorOfferingEdit = ({ offering }: MajorOfferingEditProps) => {
  const router = useRouter();
  const [programOfferings, setProgramOfferings] = useState<
    ProgramOfferingListItem[]
  >([]);
  const [majors, setMajors] = useState<MajorListItem[]>([]);
  const [programOfferingId, setProgramOfferingId] = useState(
    offering.program_campus_id,
  );
  const [majorId, setMajorId] = useState(offering.major_id);
  const [savedState, setSavedState] = useState({
    programOfferingId: offering.program_campus_id,
    majorId: offering.major_id,
  });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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
    () => programOfferings.find((item) => item.id === programOfferingId),
    [programOfferings, programOfferingId],
  );

  const filteredMajors = useMemo(() => {
    const programId = selectedProgramOffering?.program_id;
    if (!programId) return majors;
    return majors.filter((major) => major.program_id === programId);
  }, [majors, selectedProgramOffering]);

  const handleSave = async () => {
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
    setSuccess(false);

    const { error: updateError } = await updateMajorOffering({
      id: offering.id,
      program_campus_id: programOfferingId,
      major_id: majorId,
    });

    setIsSaving(false);

    if (updateError) {
      setError(updateError);
      return;
    }

    setSavedState({
      programOfferingId,
      majorId,
    });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <AdminPanel
      title="Edit Major Offering"
      icon={Save}
      onClose={() => router.push(`/major-offerings/${offering.id}`)}
    >
      <div className="space-y-4">
        <FormStatusBanner
          variant="compact"
          success={
            success
              ? { title: "Major offering updated successfully" }
              : undefined
          }
          error={error}
        />

        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <h3 className="font-semibold">Major Offering Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                {programOfferings.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.program?.name} - {item.campus?.name}
                  </option>
                ))}
              </select>
            </div>

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
                setProgramOfferingId(savedState.programOfferingId);
                setMajorId(savedState.majorId);
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
