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
  getMajorOfferingsByProgramOffering,
  MajorOfferingListItem,
} from "@/lib/admin/major-offerings";
import { updateBlock } from "@/lib/admin/actions";
import { BlockListItem } from "@/lib/admin/blocks";
import { getTermsList, TermListItem } from "@/lib/admin/terms";
import {
  getProgramOfferingsByCampus,
  getProgramOfferingsList,
  ProgramOfferingListItem,
} from "@/lib/admin/program-offerings";

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
  const [programOfferings, setProgramOfferings] = useState<
    ProgramOfferingListItem[]
  >([]);
  const [majorOfferings, setMajorOfferings] = useState<MajorOfferingListItem[]>(
    [],
  );
  const [terms, setTerms] = useState<TermListItem[]>([]);
  const [programOfferingId, setProgramOfferingId] = useState(
    block.major_offering?.program_offering_id ?? "",
  );
  const [majorOfferingId, setMajorOfferingId] = useState(
    block.major_offering_id,
  );
  const [academicTermId, setAcademicTermId] = useState(block.academic_term_id);
  const [yearLevel, setYearLevel] = useState(block.year_level.toString());
  const [section, setSection] = useState(block.section);
  const [studentCount, setStudentCount] = useState(
    block.student_count !== null ? block.student_count.toString() : "",
  );
  const [savedState, setSavedState] = useState({
    programOfferingId: block.major_offering?.program_offering_id ?? "",
    majorOfferingId: block.major_offering_id,
    academicTermId: block.academic_term_id,
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
      const [offerings, termsData] = await Promise.all([
        fixedCampusId
          ? getProgramOfferingsByCampus(fixedCampusId)
          : getProgramOfferingsList(),
        getTermsList(),
      ]);
      setProgramOfferings(offerings);
      setTerms(termsData);
      setIsLoadingData(false);
    };

    load();
  }, [fixedCampusId]);

  useEffect(() => {
    const loadMajorOfferings = async () => {
      if (!programOfferingId) {
        setMajorOfferings([]);
        return;
      }
      const offerings = await getMajorOfferingsByProgramOffering(
        programOfferingId,
      );
      setMajorOfferings(offerings);
    };

    loadMajorOfferings();
  }, [programOfferingId]);

  const selectedOffering = useMemo(
    () => majorOfferings.find((item) => item.id === majorOfferingId),
    [majorOfferingId, majorOfferings],
  );
  const programOfferingOptions = useMemo(() => {
    return programOfferings.map((offering) => ({
      id: offering.id,
      programName: offering.program?.name ?? "Unknown Program",
      campusName: offering.campus?.name ?? "Unknown Campus",
    }));
  }, [programOfferings]);

  const availableMajorOfferings = useMemo(() => {
    return majorOfferings;
  }, [majorOfferings]);

  const handleSave = async () => {
    const parsedYearLevel = Number(yearLevel);
    const parsedStudentCount = studentCount.trim()
      ? Number(studentCount)
      : null;

    if (!programOfferingId) return setError("Program offering is required");
    if (!majorOfferingId) return setError("Major offering is required");
    if (!academicTermId) return setError("Academic term is required");
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
      major_offering_id: majorOfferingId,
      academic_term_id: academicTermId,
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
      programOfferingId,
      majorOfferingId,
      academicTermId,
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
              <Label className="text-xs" htmlFor="program-offering-id">
                Program Offering *
              </Label>
              <select
                id="program-offering-id"
                className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                value={programOfferingId}
                onChange={(event) => {
                  setProgramOfferingId(event.target.value);
                  setMajorOfferingId("");
                  setMajorOfferings([]);
                  setError("");
                }}
                disabled={isSaving || isLoadingData}
              >
                <option value="">Select program offering...</option>
                {programOfferingOptions.map((offering) => (
                  <option key={offering.id} value={offering.id}>
                    {offering.programName}
                  </option>
                ))}
              </select>
            </div>

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
                disabled={isSaving || isLoadingData || !programOfferingId}
              >
                <option value="">Select major offering...</option>
                {availableMajorOfferings.map((offering) => (
                  <option key={offering.id} value={offering.id}>
                    {offering.major?.name} -{" "}
                    {offering.program_offering?.program?.name}
                  </option>
                ))}
              </select>
              {selectedOffering && (
                <p className="text-xs text-foreground/60 mt-1">
                  Selected: {selectedOffering.major?.code} (
                  {selectedOffering.program_offering?.program?.code})
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label className="text-xs" htmlFor="academic-term-id">
                Academic Term *
              </Label>
              <select
                id="academic-term-id"
                className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                value={academicTermId}
                onChange={(event) => {
                  setAcademicTermId(event.target.value);
                  setError("");
                }}
                disabled={isSaving || isLoadingData}
              >
                <option value="">Select academic term...</option>
                {terms.map((term) => (
                  <option key={term.id} value={term.id}>
                    {term.code}
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
                setProgramOfferingId(savedState.programOfferingId);
                setMajorOfferingId(savedState.majorOfferingId);
                setAcademicTermId(savedState.academicTermId);
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
