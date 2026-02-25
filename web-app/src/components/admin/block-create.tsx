"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AdminPanel from "./admin-panel";
import FormStatusBanner from "./form-status-banner";
import {
  getMajorOfferingsList,
  MajorOfferingListItem,
} from "@/lib/admin/major-offerings";
import { createBlock } from "@/lib/admin/actions";

type BlockCreateProps = {
  basePath?: string;
  fixedCampusId?: string;
};

export const BlockCreate = ({
  basePath = "/blocks",
  fixedCampusId,
}: BlockCreateProps) => {
  const router = useRouter();
  const [majorOfferings, setMajorOfferings] = useState<MajorOfferingListItem[]>(
    [],
  );
  const [majorOfferingId, setMajorOfferingId] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [section, setSection] = useState("");
  const [studentCount, setStudentCount] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoadingData(true);
      const offerings = await getMajorOfferingsList();
      setMajorOfferings(offerings);
      setIsLoadingData(false);
    };

    load();
  }, []);

  const selectedOffering = useMemo(
    () => majorOfferings.find((item) => item.id === majorOfferingId),
    [majorOfferingId, majorOfferings],
  );
  const scopedOfferings = useMemo(() => {
    if (!fixedCampusId) return majorOfferings;
    return majorOfferings.filter(
      (offering) => offering.program_campus?.campus_id === fixedCampusId,
    );
  }, [fixedCampusId, majorOfferings]);

  const handleCreate = async () => {
    const parsedYearLevel = Number(yearLevel);
    const parsedStudentCount = studentCount.trim()
      ? Number(studentCount)
      : null;

    if (!majorOfferingId) return setError("Major offering is required");
    if (!Number.isFinite(parsedYearLevel) || parsedYearLevel <= 0) {
      return setError("Year level must be a positive number");
    }
    if (!section.trim()) return setError("Section is required");
    if (
      parsedStudentCount !== null &&
      (!Number.isFinite(parsedStudentCount) || parsedStudentCount < 0)
    ) {
      return setError("Student count must be zero or greater");
    }

    setIsSaving(true);
    setError("");
    setShowSuccess(false);

    const { data, error: createError } = await createBlock({
      major_p_c_id: majorOfferingId,
      year_level: parsedYearLevel,
      section,
      student_count: parsedStudentCount,
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
      title="Block Information"
      icon={Plus}
      onClose={() => router.push(basePath)}
    >
      <div className="space-y-4">
        <FormStatusBanner
          success={
            showSuccess
              ? {
                  title: "Block created",
                  message: "Record created successfully. Redirecting...",
                }
              : undefined
          }
          error={error}
        />

        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <h3 className="font-semibold">Block Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label className="text-xs" htmlFor="major-offering-id">
                Major Offering *
              </Label>
              <select
                id="major-offering-id"
                className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                value={majorOfferingId}
                onChange={(event) => {
                  setMajorOfferingId(event.target.value);
                  setError("");
                }}
                disabled={isSaving || isLoadingData}
              >
                <option value="">Select major offering...</option>
                {scopedOfferings.map((offering) => (
                  <option key={offering.id} value={offering.id}>
                    {offering.major?.name} -{" "}
                    {offering.program_campus?.program?.name} -{" "}
                    {offering.program_campus?.campus?.name}
                  </option>
                ))}
              </select>
              {selectedOffering && (
                <p className="text-xs text-foreground/60 mt-1">
                  Selected: {selectedOffering.major?.code} (
                  {selectedOffering.program_campus?.program?.code})
                </p>
              )}
            </div>

            <div>
              <Label className="text-xs" htmlFor="year-level">
                Year Level *
              </Label>
              <Input
                id="year-level"
                type="number"
                min="1"
                value={yearLevel}
                onChange={(event) => {
                  setYearLevel(event.target.value);
                  setError("");
                }}
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label className="text-xs" htmlFor="section">
                Section *
              </Label>
              <Input
                id="section"
                value={section}
                onChange={(event) => {
                  setSection(event.target.value);
                  setError("");
                }}
                onBlur={(event) =>
                  setSection(event.target.value.trim().toUpperCase())
                }
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label className="text-xs" htmlFor="student-count">
                Student Count
              </Label>
              <Input
                id="student-count"
                type="number"
                min="0"
                value={studentCount}
                onChange={(event) => {
                  setStudentCount(event.target.value);
                  setError("");
                }}
                className="mt-1"
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setMajorOfferingId("");
                setYearLevel("");
                setSection("");
                setStudentCount("");
                setError("");
                setShowSuccess(false);
              }}
              disabled={isSaving}
            >
              Reset
            </Button>
            <Button onClick={handleCreate} disabled={isSaving || isLoadingData}>
              {isSaving ? "Creating..." : "Create Block"}
            </Button>
          </div>
        </div>
      </div>
    </AdminPanel>
  );
};
