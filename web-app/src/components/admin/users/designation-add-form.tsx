"use client";

import { useEffect, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddTile } from "@/components/ui/add-tile";
import { AppDialog } from "@/components/ui/app-dialog";
import {
  DESIGNATION_PRIMARY_OPTIONS,
  OTHER_DESIGNATION_OPTIONS,
  getDesignationSelectionSet,
  resolveDesignationTitle,
  validateDesignationSelection,
} from "@/constant/designations";
import { getCollegesList } from "@/lib/admin/colleges";
import {
  getProgramCampusOfferings,
  ProgramCampusOffering,
} from "@/lib/admin/programs";
import { CampusListItem, getCampusesList } from "@/lib/admin/campuses";
import { CollegeListItem } from "@/lib/admin/colleges";
import DesignationProgramOfferingPicker from "./designation-program-offering-picker";

type NewDesignation = {
  college_id: string | null;
  program_offering_id: string | null;
  campus_id: string | null;
  room_id: string | null;
  job_title: string;
  load: number;
  campus?: CampusListItem | null;
  college?: CollegeListItem | null;
  program_offering?: ProgramCampusOffering | null;
  program?: ProgramCampusOffering["program"] | null;
};

type DesignationFormProps = {
  onAdd: (designation: NewDesignation) => void;
  isLoading: boolean;
  error?: string;
};

const selectClass =
  "mt-1 w-full px-3 py-2 border border-foreground/20 rounded-md bg-background text-foreground text-sm";

export const DesignationAddForm = ({
  onAdd,
  isLoading,
  error,
}: DesignationFormProps) => {
  const [departments, setDepartments] = useState<CollegeListItem[]>([]);
  const [programOfferings, setProgramOfferings] = useState<
    ProgramCampusOffering[]
  >([]);
  const [campuses, setCampuses] = useState<CampusListItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const [selectedPrimaryDesignation, setSelectedPrimaryDesignation] =
    useState<string>("");
  const [selectedOtherDesignation, setSelectedOtherDesignation] =
    useState<string>("");
  const [campusId, setCampusId] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [programOfferingId, setProgramOfferingId] = useState<string>("");
  const [load, setLoad] = useState<string>("");
  const [formError, setFormError] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const [deptsData, campusesData, programsData] = await Promise.all([
          getCollegesList(),
          getCampusesList(),
          getProgramCampusOfferings(),
        ]);
        setDepartments(deptsData);
        setCampuses(campusesData);
        setProgramOfferings(programsData);
      } catch (fetchError) {
        console.error("Error fetching designation form data:", fetchError);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const selectionSet = getDesignationSelectionSet(selectedPrimaryDesignation);

  const resolvedDesignationTitle = resolveDesignationTitle(
    selectedPrimaryDesignation,
    selectedOtherDesignation,
  );

  const selectedProgramOffering = useMemo(
    () =>
      programOfferings.find((offering) => offering.id === programOfferingId) ??
      null,
    [programOfferings, programOfferingId],
  );

  const resetForm = () => {
    setSelectedPrimaryDesignation("");
    setSelectedOtherDesignation("");
    setCampusId("");
    setDepartmentId("");
    setProgramOfferingId("");
    setLoad("");
    setFormError("");
  };

  const handleCancel = () => {
    resetForm();
    setIsOpen(false);
  };

  const handlePrimaryDesignationChange = (nextValue: string) => {
    setSelectedPrimaryDesignation(nextValue);
    setSelectedOtherDesignation("");
    setCampusId("");
    setDepartmentId("");
    setProgramOfferingId("");
    setFormError("");
  };

  const handleProgramOfferingChange = (offeringId: string) => {
    setProgramOfferingId(offeringId);
    setFormError("");
  };

  const handleAddDesignation = () => {
    setFormError("");

    const validation = validateDesignationSelection({
      selectedPrimaryTitle: selectedPrimaryDesignation,
      selectedOtherTitle: selectedOtherDesignation,
      campusId,
      collegeId: departmentId,
      programOfferingId,
    });

    if (!validation.valid) {
      setFormError(`Missing required fields: ${validation.missing.join(", ")}`);
      return;
    }

    const parsedLoad = Number.parseInt(load, 10);
    if (!load || Number.isNaN(parsedLoad) || parsedLoad < 0) {
      setFormError("Load must be a non-negative number");
      return;
    }

    let nextCampusId = campusId.trim() || null;
    let nextCollegeId = departmentId.trim() || null;
    let nextProgramOfferingId = programOfferingId.trim() || null;

    if (selectionSet === "A") {
      nextCampusId = null;
      nextCollegeId = null;
      nextProgramOfferingId = null;
    }

    if (selectionSet === "B") {
      nextCampusId = null;
      nextProgramOfferingId = null;
    }

    if (selectionSet === "C") {
      nextCollegeId = null;
      nextProgramOfferingId = null;
    }

    if (selectionSet === "D") {
      nextCampusId = null;
      nextCollegeId = null;
    }

    const designation: NewDesignation = {
      college_id: nextCollegeId,
      program_offering_id: nextProgramOfferingId,
      campus_id: nextCampusId,
      room_id: null,
      job_title: resolvedDesignationTitle,
      load: parsedLoad,
      campus: campuses.find((campus) => campus.id === nextCampusId) ?? null,
      college:
        departments.find((college) => college.id === nextCollegeId) ?? null,
      program_offering:
        programOfferings.find(
          (offering) => offering.id === nextProgramOfferingId,
        ) ?? null,
      program:
        programOfferings.find(
          (offering) => offering.id === nextProgramOfferingId,
        )?.program ?? null,
    };

    onAdd(designation);
    resetForm();
    setIsOpen(false);
  };

  return (
    <>
      <AddTile
        title="Add Designation"
        description="Assign a role, department, campus, or program to this user"
        onClick={() => setIsOpen(true)}
        disabled={isLoading}
      />

      <AppDialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            resetForm();
          }
        }}
        title="Add Designation"
        description="Select a designation and provide required context."
      >
        {isLoadingData ? (
          <div className="text-xs text-foreground/60">Loading options...</div>
        ) : (
          <div className="space-y-4">
            <select
              id="designation-step-1"
              value={selectedPrimaryDesignation}
              onChange={(event) =>
                handlePrimaryDesignationChange(event.target.value)
              }
              disabled={isLoading}
              className={selectClass}
            >
              <option value="">Select designation...</option>
              {DESIGNATION_PRIMARY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {Boolean(selectionSet) && (
              <>
                {selectionSet === "A" && (
                  <p className="text-xs text-foreground/70">
                    No additional selection is required for this designation.
                  </p>
                )}

                {selectionSet === "B" && (
                  <div>
                    <Label htmlFor="designation-college" className="text-xs">
                      College *
                    </Label>
                    <select
                      id="designation-college"
                      value={departmentId}
                      onChange={(event) => {
                        setDepartmentId(event.target.value);
                        setFormError("");
                      }}
                      disabled={isLoading}
                      className={selectClass}
                    >
                      <option value="">Select college...</option>
                      {departments.map((college) => (
                        <option key={college.id} value={college.id}>
                          {college.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectionSet === "C" && (
                  <div>
                    <Label htmlFor="designation-campus" className="text-xs">
                      Campus *
                    </Label>
                    <select
                      id="designation-campus"
                      value={campusId}
                      onChange={(event) => {
                        setCampusId(event.target.value);
                        setFormError("");
                      }}
                      disabled={isLoading}
                      className={selectClass}
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

                {selectionSet === "D" && (
                  <DesignationProgramOfferingPicker
                    offerings={programOfferings}
                    value={programOfferingId}
                    onChange={handleProgramOfferingChange}
                    disabled={isLoading}
                    label="Program Offering *"
                  />
                )}

                {selectionSet === "E" && (
                  <div className="space-y-3">
                    <div>
                      <Label
                        htmlFor="designation-other-title"
                        className="text-xs"
                      >
                        Designation Title *
                      </Label>
                      <select
                        id="designation-other-title"
                        value={selectedOtherDesignation}
                        onChange={(event) => {
                          setSelectedOtherDesignation(event.target.value);
                          setFormError("");
                        }}
                        disabled={isLoading}
                        className={selectClass}
                      >
                        <option value="">Select designation title...</option>
                        {OTHER_DESIGNATION_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label
                          htmlFor="designation-other-campus"
                          className="text-xs"
                        >
                          Campus (Optional)
                        </Label>
                        <select
                          id="designation-other-campus"
                          value={campusId}
                          onChange={(event) => {
                            setCampusId(event.target.value);
                            setFormError("");
                          }}
                          disabled={isLoading}
                          className={selectClass}
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
                        <Label
                          htmlFor="designation-other-college"
                          className="text-xs"
                        >
                          College (Optional)
                        </Label>
                        <select
                          id="designation-other-college"
                          value={departmentId}
                          onChange={(event) => {
                            setDepartmentId(event.target.value);
                            setFormError("");
                          }}
                          disabled={isLoading}
                          className={selectClass}
                        >
                          <option value="">Select college...</option>
                          {departments.map((college) => (
                            <option key={college.id} value={college.id}>
                              {college.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <DesignationProgramOfferingPicker
                      offerings={programOfferings}
                      value={programOfferingId}
                      onChange={handleProgramOfferingChange}
                      disabled={isLoading}
                      label="Program Offering (Optional)"
                    />
                  </div>
                )}
              </>
            )}

            {selectedPrimaryDesignation && (
              <div className="space-y-2">
                <div>
                  <Label htmlFor="load" className="text-xs">
                    Load (hours) *
                  </Label>
                  <Input
                    id="load"
                    type="number"
                    min="0"
                    placeholder="Enter teaching/work load"
                    value={load}
                    onChange={(event) => {
                      setLoad(event.target.value);
                      setFormError("");
                    }}
                    disabled={isLoading}
                    className="mt-1"
                  />
                </div>

                {selectedProgramOffering && selectionSet === "D" && (
                  <p className="text-xs text-foreground/70">
                    Selected: {selectedProgramOffering.campus.name} -{" "}
                    {selectedProgramOffering.program.name}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddDesignation}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Add Designation
                  </Button>
                </div>

                {(formError || error) && (
                  <p className="text-xs text-destructive">
                    {formError || error}
                  </p>
                )}
              </div>
            )}

            {!selectedPrimaryDesignation && (formError || error) && (
              <p className="text-xs text-destructive">{formError || error}</p>
            )}
          </div>
        )}
      </AppDialog>
    </>
  );
};
