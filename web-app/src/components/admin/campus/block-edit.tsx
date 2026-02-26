"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Edit } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AdminPanel from "../admin-panel";
import FormStatusBanner from "../form-status-banner";
import {
  getMajorOfferingsList,
  MajorOfferingListItem,
} from "@/lib/admin/major-offerings";
import { updateBlock } from "@/lib/admin/actions";
import { BlockListItem } from "@/lib/admin/blocks";
import {
  CurriculumListItem,
  getCurriculumsByMajor,
} from "@/lib/admin/curriculums";

type BlockEditProps = {
  block: BlockListItem;
  basePath?: string;
  fixedCampusId?: string;
};

export const BlockEdit = ({
  block,
  basePath = "/blocks",
  fixedCampusId,
}: BlockEditProps) => {
  const router = useRouter();
  const [majorOfferings, setMajorOfferings] = useState<MajorOfferingListItem[]>(
    [],
  );
  const [curriculums, setCurriculums] = useState<CurriculumListItem[]>([]);
  const [majorOfferingId, setMajorOfferingId] = useState(block.major_p_c_id);
  const [curriculumId, setCurriculumId] = useState(block.curriculum_id);
  const [yearLevel, setYearLevel] = useState(block.year_level.toString());
  const [section, setSection] = useState(block.section);
  const [studentCount, setStudentCount] = useState(
    block.student_count !== null ? block.student_count.toString() : "",
  );
  const [savedState, setSavedState] = useState({
    majorOfferingId: block.major_p_c_id,
    curriculumId: block.curriculum_id,
    yearLevel: block.year_level.toString(),
    section: block.section,
    studentCount:
      block.student_count !== null ? block.student_count.toString() : "",
  });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoadingData(true);
      const offerings = await getMajorOfferingsList();
      setMajorOfferings(offerings);
      const uniqueMajorIds = Array.from(
        new Set(offerings.map((offering) => offering.major_id).filter(Boolean)),
      );
      const curriculumGroups = await Promise.all(
        uniqueMajorIds.map((majorId) => getCurriculumsByMajor(majorId)),
      );
      setCurriculums(curriculumGroups.flat());
      setIsLoadingData(false);
    };

    load();
  }, []);

  const selectedOffering = useMemo(
    () => majorOfferings.find((item) => item.id === majorOfferingId),
    [majorOfferingId, majorOfferings],
  );
  const availableCurriculums = useMemo(() => {
    const majorId = selectedOffering?.major_id;
    if (!majorId) return [];
    return curriculums.filter((curriculum) => curriculum.major_id === majorId);
  }, [curriculums, selectedOffering]);
  const scopedOfferings = useMemo(() => {
    if (!fixedCampusId) return majorOfferings;
    return majorOfferings.filter(
      (offering) => offering.program_campus?.campus_id === fixedCampusId,
    );
  }, [fixedCampusId, majorOfferings]);

  const handleSave = async () => {
    const parsedYearLevel = Number(yearLevel);
    const parsedStudentCount = studentCount.trim()
      ? Number(studentCount)
      : null;

    if (!majorOfferingId) return setError("Major offering is required");
    if (!curriculumId) return setError("Curriculum is required");
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
    setSuccess(false);

    const { error: updateError } = await updateBlock({
      id: block.id,
      major_p_c_id: majorOfferingId,
      curriculum_id: curriculumId,
      year_level: parsedYearLevel,
      section,
      student_count: parsedStudentCount,
    });

    setIsSaving(false);

    if (updateError) {
      setError(updateError);
      return;
    }

    setSavedState({
      majorOfferingId,
      curriculumId,
      yearLevel: parsedYearLevel.toString(),
      section: section.trim().toUpperCase(),
      studentCount:
        parsedStudentCount !== null ? parsedStudentCount.toString() : "",
    });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <AdminPanel
      title="Edit Block"
      icon={Edit}
      onClose={() => router.push(`${basePath}/${block.id}`)}
    >
      <div className="space-y-4">
        <FormStatusBanner
          variant="compact"
          success={
            success ? { title: "Block updated successfully" } : undefined
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
                  setCurriculumId("");
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

            <div className="md:col-span-2">
              <Label className="text-xs" htmlFor="curriculum-id">
                Curriculum *
              </Label>
              <select
                id="curriculum-id"
                className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                value={curriculumId}
                onChange={(event) => {
                  setCurriculumId(event.target.value);
                  setError("");
                }}
                disabled={isSaving || isLoadingData || !selectedOffering}
              >
                <option value="">Select curriculum...</option>
                {availableCurriculums.map((curriculum) => (
                  <option key={curriculum.id} value={curriculum.id}>
                    {curriculum.title} ({curriculum.series_year})
                  </option>
                ))}
              </select>
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
                setMajorOfferingId(savedState.majorOfferingId);
                setCurriculumId(savedState.curriculumId);
                setYearLevel(savedState.yearLevel);
                setSection(savedState.section);
                setStudentCount(savedState.studentCount);
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
