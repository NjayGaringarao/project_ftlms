"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AdminPanel from "@/features/admin/components/admin-panel";
import FormStatusBanner from "@/features/admin/components/form-status-banner";
import {
  getMajorOfferingsByProgramOffering,
  MajorOfferingListItem,
} from "@/features/admin/lib/major-offerings";
import { getTermsList, type TermListItem } from "@/features/admin/lib/terms";
import { createBlock } from "@/features/admin/lib/actions";
import { getCampusesList, CampusListItem } from "@/features/admin/lib/campuses";
import {
  getProgramOfferingsByCampus,
  ProgramOfferingListItem,
} from "@/features/admin/lib/program-offerings";
import { formatAcademicTermLabel } from "@/utils/string";
import CampusPickerDialog from "@/features/shared/components/pickers/campus-picker-dialog";
import ProgramOfferingPickerDialog from "@/features/shared/components/pickers/program-offering-picker-dialog";
import { cn } from "@/utils/style";

type BlockCreateProps = {
  academic_term_id: string;
  basePath?: string;
  fixedCampusId?: string;
};

export const BlockCreate = ({
  academic_term_id,
  basePath = "/blocks",
  fixedCampusId,
}: BlockCreateProps) => {
  const router = useRouter();
  const [pathBase, queryString] = basePath.split("?");
  const withQuery = (suffix: string) =>
    queryString ? `${pathBase}${suffix}?${queryString}` : `${pathBase}${suffix}`;
  const [programOfferings, setProgramOfferings] = useState<
    ProgramOfferingListItem[]
  >([]);
  const [majorOfferings, setMajorOfferings] = useState<MajorOfferingListItem[]>(
    [],
  );
  const [terms, setTerms] = useState<TermListItem[]>([]);
  const [campuses, setCampuses] = useState<CampusListItem[]>([]);
  const [campusId, setCampusId] = useState(fixedCampusId ?? "");
  const [programOfferingId, setProgramOfferingId] = useState("");
  const [majorOfferingId, setMajorOfferingId] = useState("");
  const [academicTermId, setAcademicTermId] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [section, setSection] = useState("");
  const [studentCount, setStudentCount] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [campusDialogOpen, setCampusDialogOpen] = useState(false);
  const [campusQuery, setCampusQuery] = useState("");
  const [programOfferingDialogOpen, setProgramOfferingDialogOpen] =
    useState(false);
  const [programOfferingQuery, setProgramOfferingQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoadingData(true);
      const [campusRows, termsData] = await Promise.all([
        getCampusesList(),
        getTermsList(),
      ]);
      setCampuses(campusRows);
      setTerms(termsData);
      setIsLoadingData(false);
    };

    load();
  }, [fixedCampusId]);

  useEffect(() => {
    const loadOfferings = async () => {
      if (!campusId) {
        setProgramOfferings([]);
        setProgramOfferingId("");
        setMajorOfferingId("");
        setMajorOfferings([]);
        return;
      }

      const offerings = await getProgramOfferingsByCampus(campusId);
      setProgramOfferings(offerings);
      setProgramOfferingId("");
      setMajorOfferingId("");
      setMajorOfferings([]);
    };

    loadOfferings();
  }, [campusId]);

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
  const selectedCampus = useMemo(
    () => campuses.find((campus) => campus.id === campusId) ?? null,
    [campusId, campuses],
  );
  const selectedProgramOffering = useMemo(
    () =>
      programOfferings.find((offering) => offering.id === programOfferingId) ??
      null,
    [programOfferingId, programOfferings],
  );
  const selectedTerm = useMemo(
    () => terms.find((term) => term.id === academicTermId) ?? null,
    [academicTermId, terms],
  );
  const availableMajorOfferings = useMemo(() => {
    return majorOfferings;
  }, [majorOfferings]);

  const programOfferingsForCampus = useMemo(() => {
    if (!campusId) return [];
    return programOfferings.filter(
      (offering) => offering.campus_id === campusId,
    );
  }, [campusId, programOfferings]);

  const programOfferingOptions = useMemo(
    () =>
      programOfferingsForCampus.map((offering) => ({
        id: offering.id,
        campus_id: offering.campus_id,
        campus_code: offering.campus?.code ?? "",
        campus_name: offering.campus?.name ?? "",
        program_code: offering.program?.code ?? "",
        program_name: offering.program?.name ?? "",
      })),
    [programOfferingsForCampus],
  );

  useEffect(() => {
    setAcademicTermId(academic_term_id);
  }, [academic_term_id]);

  const handleCreate = async () => {
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
    setShowSuccess(false);

    const { data, error: createError } = await createBlock({
      major_offering_id: majorOfferingId,
      academic_term_id: academicTermId,
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
        router.push(withQuery(`/${data.id}`));
      } else {
        router.push(basePath);
      }
    }, 1200);
  };

  return (
    <AdminPanel
      title="Create Block"
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

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs" htmlFor="academic-term-id">
                Academic Term *
              </Label>
              <Button
                id="academic-term-id"
                type="button"
                variant="outline"
                className="mt-1 w-full justify-between text-sm"
                disabled
              >
                <span className="truncate">
                  {selectedTerm
                    ? formatAcademicTermLabel(selectedTerm)
                    : "Select academic term..."}
                </span>
              </Button>
            </div>
            <div>
              <Label className="text-xs" htmlFor="campus-id">
                Campus *
              </Label>
              <Button
                id="campus-id"
                type="button"
                variant="outline"
                className={cn(
                  "mt-1 w-full justify-between text-sm",
                  !selectedCampus && "text-foreground/60",
                )}
                onClick={() => setCampusDialogOpen(true)}
                disabled={isSaving || isLoadingData}
              >
                <span className="truncate">
                  {selectedCampus ? selectedCampus.name : "Select campus..."}
                </span>
                <ChevronDown className="h-4 w-4 text-foreground/60" />
              </Button>
            </div>

            

            <div>
              <Label className="text-xs" htmlFor="program-offering-id">
                Program Offering *
              </Label>
              <Button
                id="program-offering-id"
                type="button"
                variant="outline"
                className={cn(
                  "mt-1 w-full justify-between text-sm",
                  !selectedProgramOffering && "text-foreground/60",
                )}
                onClick={() => setProgramOfferingDialogOpen(true)}
                disabled={isSaving || isLoadingData || !campusId}
              >
                <span className="truncate">
                  {selectedProgramOffering
                    ? selectedProgramOffering.program?.name ?? "Unknown Program"
                    : "Select program offering..."}
                </span>
                <ChevronDown className="h-4 w-4 text-foreground/60" />
              </Button>
            </div>

            <div>
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
                disabled={isSaving || isLoadingData || !campusId || !programOfferingId}
              >
                <option value="">Select major offering...</option>
                {availableMajorOfferings.map((offering) => (
                  <option key={offering.id} value={offering.id}>
                    {offering.major?.name}
                 
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
                setCampusId(fixedCampusId ?? "");
                setProgramOfferingId("");
                setMajorOfferingId("");
                setAcademicTermId(academicTermId);
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

      <CampusPickerDialog
        open={campusDialogOpen}
        onOpenChange={setCampusDialogOpen}
        campuses={campuses}
        selectedCampusId={campusId}
        query={campusQuery}
        onQueryChange={setCampusQuery}
        onSelect={(nextCampusId) => {
          setCampusId(nextCampusId);
          setProgramOfferings([]);
          setProgramOfferingId("");
          setMajorOfferingId("");
          setMajorOfferings([]);
          setError("");
          setCampusDialogOpen(false);
        }}
      />

      <ProgramOfferingPickerDialog
        open={programOfferingDialogOpen}
        onOpenChange={setProgramOfferingDialogOpen}
        programOfferings={programOfferingOptions}
        selectedProgramOfferingId={programOfferingId}
        query={programOfferingQuery}
        onQueryChange={setProgramOfferingQuery}
        onSelect={(offeringId) => {
          setProgramOfferingId(offeringId);
          setMajorOfferingId("");
          setMajorOfferings([]);
          setError("");
          setProgramOfferingDialogOpen(false);
        }}
      />
    </AdminPanel>
  );
};
