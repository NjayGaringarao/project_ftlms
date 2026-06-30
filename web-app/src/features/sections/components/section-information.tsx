"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CampusPickerDialog from "@/features/shared/components/pickers/campus-picker-dialog";
import ProgramOfferingPickerDialog from "@/features/shared/components/pickers/program-offering-picker-dialog";
import FacultyPickerDialog from "@/features/shared/components/pickers/faculty-picker-dialog";
import DangerZone from "@/features/admin/components/danger-zone";
import DeleteConfirmModal from "@/features/admin/components/delete-confirm-modal";
import FormStatusBanner from "@/features/admin/components/form-status-banner";
import { createSection, deleteSection, updateSection } from "@/features/admin/lib/actions";
import type { SectionListItem } from "@/features/admin/lib/sections";
import type { CampusListItem } from "@/features/admin/lib/campuses";
import {
  getMajorOfferingsByProgramOffering,
  type MajorOfferingListItem,
} from "@/features/admin/lib/major-offerings";
import type { ProgramOfferingListItem } from "@/features/admin/lib/program-offerings";
import type { TermListItem } from "@/features/admin/lib/terms";
import type { FacultyListItem } from "@/features/course-loading/lib/types";
import SectionCoursePlanner from "@/features/sections/components/section-course-planner";
import { formatAcademicTermLabel } from "@/utils/string";
import { cn } from "@/utils/style";

type SectionInformationProps = {
  section: SectionListItem | null;
  academicTerm: TermListItem;
  campuses: CampusListItem[];
  programOfferings: ProgramOfferingListItem[];
  faculty: FacultyListItem[];
  isCreating: boolean;
  fixedCampusId?: string;
  onCreated: (id: string) => void;
  onDeleted: () => void;
  onRefresh: () => void;
};

type SectionFormState = {
  campusId: string;
  programOfferingId: string;
  majorOfferingId: string;
  yearLevel: string;
  name: string;
  classification: "regular" | "irregular";
  studentCount: string;
  advisoryFacultyId: string | null;
};

const emptyForm: SectionFormState = {
  campusId: "",
  programOfferingId: "",
  majorOfferingId: "",
  yearLevel: "",
  name: "",
  classification: "regular",
  studentCount: "",
  advisoryFacultyId: null,
};

const toForm = (
  section: SectionListItem | null,
  fixedCampusId?: string,
): SectionFormState =>
  section
    ? {
        campusId:
          fixedCampusId ??
          section.major_offering?.program_offering?.campus_id ??
          "",
        programOfferingId:
          section.major_offering?.program_offering_id ??
          "",
        majorOfferingId: section.major_offering_id,
        yearLevel: section.year_level.toString(),
        name: section.name,
        classification: section.classification,
        studentCount:
          section.student_count !== null ? section.student_count.toString() : "",
        advisoryFacultyId: section.advisory_faculty_id ?? null,
      }
    : {
        ...emptyForm,
        campusId: fixedCampusId ?? "",
      };

export function SectionInformation({
  section,
  academicTerm,
  campuses,
  programOfferings,
  faculty,
  isCreating,
  fixedCampusId,
  onCreated,
  onDeleted,
  onRefresh,
}: SectionInformationProps) {
  const initial = toForm(section, fixedCampusId);
  const [formData, setFormData] = useState<SectionFormState>(initial);
  const [savedFormData, setSavedFormData] = useState<SectionFormState>(initial);
  const [majorOfferings, setMajorOfferings] = useState<MajorOfferingListItem[]>(
    [],
  );
  const [isLoadingMajorOfferings, setIsLoadingMajorOfferings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [campusDialogOpen, setCampusDialogOpen] = useState(false);
  const [campusQuery, setCampusQuery] = useState("");
  const [programOfferingDialogOpen, setProgramOfferingDialogOpen] =
    useState(false);
  const [programOfferingQuery, setProgramOfferingQuery] = useState("");
  const [facultyDialogOpen, setFacultyDialogOpen] = useState(false);

  useEffect(() => {
    const loadMajorOfferings = async () => {
      if (!formData.programOfferingId) {
        setMajorOfferings([]);
        return;
      }

      setIsLoadingMajorOfferings(true);
      const offerings = await getMajorOfferingsByProgramOffering(
        formData.programOfferingId,
      );
      setMajorOfferings(offerings);
      setIsLoadingMajorOfferings(false);
    };

    void loadMajorOfferings();
  }, [formData.programOfferingId]);

  const selectedCampus = useMemo(
    () => campuses.find((campus) => campus.id === formData.campusId) ?? null,
    [campuses, formData.campusId],
  );
  const programOfferingsForCampus = useMemo(() => {
    if (!formData.campusId) return [];
    return programOfferings.filter(
      (offering) => offering.campus_id === formData.campusId,
    );
  }, [formData.campusId, programOfferings]);
  const selectedProgramOffering = useMemo(
    () =>
      programOfferingsForCampus.find(
        (offering) => offering.id === formData.programOfferingId,
      ) ?? null,
    [formData.programOfferingId, programOfferingsForCampus],
  );
  const selectedMajorOffering = useMemo(
    () =>
      majorOfferings.find(
        (offering) => offering.id === formData.majorOfferingId,
      ) ?? null,
    [formData.majorOfferingId, majorOfferings],
  );
  const selectedAdvisoryFaculty = useMemo(
    () => faculty.find((f) => f.id === formData.advisoryFacultyId) ?? null,
    [faculty, formData.advisoryFacultyId],
  );
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
  const hasChanges = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(savedFormData),
    [formData, savedFormData],
  );

  const setField = (field: keyof SectionFormState, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setError("");
    setSuccess("");
  };

  const validate = () => {
    const parsedYearLevel = Number(formData.yearLevel);
    const parsedStudentCount = formData.studentCount.trim()
      ? Number(formData.studentCount)
      : null;

    if (!formData.programOfferingId) return "Program offering is required";
    if (!formData.majorOfferingId) return "Major offering is required";
    if (!Number.isFinite(parsedYearLevel) || parsedYearLevel <= 0) {
      return "Year level must be a positive number";
    }
    if (!formData.name.trim()) return "Section is required";
    if (
      parsedStudentCount !== null &&
      (!Number.isFinite(parsedStudentCount) || parsedStudentCount < 0)
    ) {
      return "Student count must be zero or greater";
    }

    return null;
  };

  const getPayload = () => ({
    major_offering_id: formData.majorOfferingId,
    academic_term_id: academicTerm.id,
    year_level: Number(formData.yearLevel),
    name: formData.name,
    classification: formData.classification,
    student_count: formData.studentCount.trim()
      ? Number(formData.studentCount)
      : null,
    advisory_faculty_id: formData.advisoryFacultyId || null,
  });

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    const result =
      isCreating || !section
        ? await createSection(getPayload())
        : await updateSection({
            id: section.id,
            ...getPayload(),
          });

    setIsSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    const nextSaved = {
      ...formData,
      name: formData.name.trim().toUpperCase(),
    };
    setFormData(nextSaved);
    setSavedFormData(nextSaved);
    setSuccess(isCreating ? "Section created successfully" : "Section updated");
    onRefresh();

    if (
      isCreating &&
      result.data &&
      typeof result.data === "object" &&
      "id" in result.data
    ) {
      onCreated(result.data.id);
    }
  };

  const handleDelete = async () => {
    if (!section) return;
    setIsSaving(true);
    setError("");
    const result = await deleteSection(section.id);
    setIsSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setShowDeleteConfirm(false);
    onRefresh();
    onDeleted();
  };

  return (
    <div className="space-y-5">
      <FormStatusBanner
        variant="compact"
        success={success ? { title: success } : undefined}
        error={error}
      />

      <section className="space-y-4">
      

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <Label className="text-xs" htmlFor="section-academic-term">
              Academic Term *
            </Label>
            <Button
              id="section-academic-term"
              type="button"
              variant="outline"
              className="mt-1 w-full justify-between text-sm text-foreground/70"
              disabled
            >
              <span className="truncate">
                {formatAcademicTermLabel(academicTerm)}
              </span>
            </Button>
          </div>

          <div>
            <Label className="text-xs" htmlFor="section-campus">
              Campus *
            </Label>
            <Button
              id="section-campus"
              type="button"
              variant="outline"
              className={cn(
                "mt-1 w-full justify-between text-sm font-normal",
                !selectedCampus && "text-foreground/60",
              )}
              onClick={() => setCampusDialogOpen(true)}
              disabled={isSaving || Boolean(fixedCampusId)}
            >
              <span className="truncate">
                {selectedCampus ? selectedCampus.name : "Select campus..."}
              </span>
              <ChevronDown className="h-4 w-4 text-foreground/60" />
            </Button>
          </div>

          <div>
            <Label className="text-xs" htmlFor="section-program-offering">
              Program Offering *
            </Label>
            <Button
              id="section-program-offering"
              type="button"
              variant="outline"
              className={cn(
                "mt-1 w-full justify-between text-sm font-normal",
                !selectedProgramOffering && "text-foreground/60",
              )}
              onClick={() => setProgramOfferingDialogOpen(true)}
              disabled={isSaving || !formData.campusId}
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
            <Label className="text-xs" htmlFor="section-major-offering">
              Major Offering *
            </Label>
            <select
              id="section-major-offering"
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
              value={formData.majorOfferingId}
              onChange={(event) =>
                setField("majorOfferingId", event.target.value)
              }
              disabled={
                isSaving ||
                isLoadingMajorOfferings ||
                !formData.campusId ||
                !formData.programOfferingId
              }
            >
              <option value="">Select major offering...</option>
              {majorOfferings.map((offering) => (
                <option key={offering.id} value={offering.id}>
                  {offering.major?.name}
                </option>
              ))}
            </select>
            {selectedMajorOffering ? (
              <p className="mt-1 text-xs text-foreground/60">
                Selected: {selectedMajorOffering.major?.code}
              </p>
            ) : null}
          </div>

          <div>
            <Label className="text-xs" htmlFor="section-year-level">
              Year Level *
            </Label>
            <Input
              id="section-year-level"
              type="number"
              min="1"
              value={formData.yearLevel}
              onChange={(event) => setField("yearLevel", event.target.value)}
              className="mt-1"
              disabled={isSaving}
            />
          </div>

          <div>
            <Label className="text-xs" htmlFor="section-name">
              Name *
            </Label>
            <Input
              id="section-name"
              value={formData.name}
              onChange={(event) => setField("name", event.target.value)}
              onBlur={(event) =>
                setField("name", event.target.value.trim().toUpperCase())
              }
              className="mt-1"
              disabled={isSaving}
            />
          </div>

          <div>
            <Label className="text-xs" htmlFor="section-classification">
              Classification *
            </Label>
            <select
              id="section-classification"
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
              value={formData.classification}
              onChange={(event) =>
                setField(
                  "classification",
                  event.target.value as "regular" | "irregular",
                )
              }
              disabled={isSaving}
            >
              <option value="regular">Regular</option>
              <option value="irregular">Irregular</option>
            </select>
          </div>

          <div>
            <Label className="text-xs" htmlFor="section-student-count">
              Student Count
            </Label>
            <Input
              id="section-student-count"
              type="number"
              min="0"
              value={formData.studentCount}
              onChange={(event) =>
                setField("studentCount", event.target.value)
              }
              className="mt-1"
              disabled={isSaving}
            />
          </div>

          <div>
            <Label className="text-xs" htmlFor="section-advisory-faculty">
              Advisory Class Faculty
            </Label>
            <div className="mt-1 flex gap-1">
              <Button
                id="section-advisory-faculty"
                type="button"
                variant="outline"
                className={cn(
                  "flex-1 justify-between text-sm font-normal",
                  !selectedAdvisoryFaculty && "text-foreground/60",
                )}
                onClick={() => setFacultyDialogOpen(true)}
                disabled={isSaving || !formData.programOfferingId}
              >
                <span className="truncate">
                  {selectedAdvisoryFaculty
                    ? selectedAdvisoryFaculty.name
                    : "Select faculty..."}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-foreground/60" />
              </Button>
              {formData.advisoryFacultyId ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setFormData((current) => ({
                      ...current,
                      advisoryFacultyId: null,
                    }));
                    setError("");
                    setSuccess("");
                  }}
                  disabled={isSaving}
                  aria-label="Clear advisory faculty"
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        {isCreating || hasChanges ? (
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData(isCreating ? toForm(null, fixedCampusId) : savedFormData);
                setError("");
                setSuccess("");
              }}
              disabled={isSaving}
            >
              Reset
            </Button>
            <Button type="button" onClick={handleSave} disabled={isSaving}>
              {isSaving
                ? isCreating
                  ? "Creating..."
                  : "Saving..."
                : isCreating
                  ? "Create Section"
                  : "Save Changes"}
            </Button>
          </div>
        ) : null}
      </section>

      {!isCreating && section ? (
        <>
          <SectionCoursePlanner
            sectionId={section.id}
            academicTermId={academicTerm.id}
          />

          <DangerZone
            description="Deleting this section removes the assigned section from related class links."
            buttonLabel="Delete Section"
            onDeleteClick={() => setShowDeleteConfirm(true)}
            disabled={isSaving}
          />

          <DeleteConfirmModal
            isOpen={showDeleteConfirm}
            title="Delete Section"
            description={
              <p>
                Are you sure you want to delete <strong>{section.code}</strong>?
              </p>
            }
            confirmLabel="Delete Section"
            isDeleting={isSaving}
            error={error}
            onCancel={() => setShowDeleteConfirm(false)}
            onConfirm={handleDelete}
          />
        </>
      ) : null}

      <CampusPickerDialog
        open={campusDialogOpen}
        onOpenChange={setCampusDialogOpen}
        campuses={campuses}
        selectedCampusId={formData.campusId}
        query={campusQuery}
        onQueryChange={setCampusQuery}
        onSelect={(nextCampusId) => {
          setFormData((current) => ({
            ...current,
            campusId: nextCampusId,
            programOfferingId: "",
            majorOfferingId: "",
            advisoryFacultyId: null,
          }));
          setError("");
          setSuccess("");
          setCampusDialogOpen(false);
        }}
      />

      <ProgramOfferingPickerDialog
        open={programOfferingDialogOpen}
        onOpenChange={setProgramOfferingDialogOpen}
        programOfferings={programOfferingOptions}
        selectedProgramOfferingId={formData.programOfferingId}
        query={programOfferingQuery}
        onQueryChange={setProgramOfferingQuery}
        onSelect={(offeringId) => {
          setFormData((current) => ({
            ...current,
            programOfferingId: offeringId,
            majorOfferingId: "",
            advisoryFacultyId: null,
          }));
          setError("");
          setSuccess("");
          setProgramOfferingDialogOpen(false);
        }}
      />

      <FacultyPickerDialog
        open={facultyDialogOpen}
        onOpenChange={setFacultyDialogOpen}
        items={faculty}
        selectedId={formData.advisoryFacultyId}
        defaultCampusId={selectedProgramOffering?.campus_id ?? null}
        defaultCollegeId={selectedProgramOffering?.program?.college_id ?? null}
        onSelect={(facultyId) => {
          setFormData((current) => ({
            ...current,
            advisoryFacultyId: facultyId,
          }));
          setError("");
          setSuccess("");
          setFacultyDialogOpen(false);
        }}
      />
    </div>
  );
}
