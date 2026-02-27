"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { AddTile } from "@/components/ui/add-tile";
import {
  DESIGNATION_TYPE_OPTIONS,
  ACADEMIC_SUBTYPES,
  ADMINISTRATIVE_SUBTYPES,
  HIGHER_UPS_JOB_TITLES,
  getDesignationRequirements,
  validateDesignation,
} from "@/constant/designations";
import { getDepartmentsList } from "@/lib/admin/departments";
import {
  getProgramCampusOfferings,
  ProgramCampusOffering,
} from "@/lib/admin/programs";
import { getCampusesList } from "@/lib/admin/campuses";
import { DepartmentListItem } from "@/lib/admin/departments";
import { Campus } from "@/models/campus";

type NewDesignation = {
  department_id: string | null;
  program_campus_id: string | null;
  campus_id: string | null;
  room_id: string | null;
  job_title: string;
  load: number;
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
  const [departments, setDepartments] = useState<DepartmentListItem[]>([]);
  const [programOfferings, setProgramOfferings] = useState<
    ProgramCampusOffering[]
  >([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // Form state
  const [designationType, setDesignationType] = useState<string>("");
  const [subType, setSubType] = useState<string>("");
  const [campusId, setCampusId] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [programCampusId, setProgramCampusId] = useState<string>("");
  const [jobTitle, setJobTitle] = useState<string>("");
  const [load, setLoad] = useState<string>("");
  const [formError, setFormError] = useState<string>("");

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const [deptsData, campusesData, programsData] = await Promise.all([
          getDepartmentsList(),
          getCampusesList(),
          getProgramCampusOfferings(),
        ]);
        setDepartments(deptsData);
        setCampuses(campusesData);
        setProgramOfferings(programsData);
      } catch (err) {
        console.error("Error fetching designation form data:", err);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const resetForm = () => {
    setDesignationType("");
    setSubType("");
    setCampusId("");
    setDepartmentId("");
    setProgramCampusId("");
    setJobTitle("");
    setLoad("");
    setFormError("");
  };

  // Reset form when designation type changes
  const handleDesignationTypeChange = (type: string) => {
    setDesignationType(type);
    setSubType("");
    setCampusId("");
    setDepartmentId("");
    setProgramCampusId("");
    setJobTitle("");
    setFormError("");
  };

  // Handle sub-type change
  const handleSubTypeChange = (st: string) => {
    setSubType(st);
    setFormError("");
    const requirements = getDesignationRequirements(designationType, st);

    // Auto-set job title if preset
    if (requirements.jobTitlePreset) {
      setJobTitle(requirements.jobTitlePreset);
    } else {
      setJobTitle("");
    }
  };

  // When program offering changes, auto-fill related campus/department context
  const handleProgramOfferingChange = (offeringId: string) => {
    setFormError("");
    setProgramCampusId(offeringId);
    const offering = programOfferings.find((p) => p.id === offeringId);
    if (offering) {
      setCampusId(offering.campus_id);
      setDepartmentId(offering.program.department_id);
    }
  };

  const handleCampusChange = (nextCampusId: string) => {
    setFormError("");
    setCampusId(nextCampusId);
    if (programCampusId) {
      const selected = programOfferings.find(
        (offering) => offering.id === programCampusId,
      );
      if (selected && selected.campus_id !== nextCampusId) {
        setProgramCampusId("");
      }
    }
  };

  // Handle form submission
  const handleAddDesignation = () => {
    setFormError("");

    const validation = validateDesignation(designationType, subType, {
      campus_id: campusId,
      department_id: departmentId,
      program_campus_id: programCampusId,
      job_title: jobTitle,
    });

    if (!validation.valid) {
      setFormError(`Missing required fields: ${validation.missing.join(", ")}`);
      return;
    }

    if (!load || parseInt(load) < 0) {
      setFormError("Load must be a non-negative number");
      return;
    }

    // Build designation object
    const designation: NewDesignation = {
      department_id: departmentId || null,
      program_campus_id: programCampusId || null,
      campus_id: campusId || null,
      room_id: null,
      job_title: jobTitle.trim(),
      load: parseInt(load),
    };

    onAdd(designation);
    resetForm();
    setIsOpen(false);
  };

  const handleCancel = () => {
    resetForm();
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <AddTile
        title="Add Designation"
        description="Assign a role, department, campus, or program to this user"
        onClick={() => setIsOpen(true)}
        disabled={isLoading}
      />
    );
  }

  if (isLoadingData) {
    return <div className="text-xs text-foreground/60">Loading options...</div>;
  }

  const requirements = getDesignationRequirements(designationType, subType);

  // Filter departments by type if needed
  const filteredDepartments = requirements.departmentTypeFilter
    ? departments.filter((d) => d.type === requirements.departmentTypeFilter)
    : departments;

  // Filter program offerings by campus if campus is selected
  const filteredProgramOfferings = campusId
    ? programOfferings.filter((p) => p.campus_id === campusId)
    : programOfferings;

  const showFormFields =
    designationType &&
    (subType ||
      designationType === "student_services" ||
      designationType === "extension_services");

  return (
    <div className="rounded-md border border-foreground/20 bg-foreground/2 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">New Designation</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={isLoading}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Step 1: Select Designation Type */}
        <div>
          <Label htmlFor="designation-type" className="text-xs">
            Designation Type *
          </Label>
          <select
            id="designation-type"
            value={designationType}
            onChange={(e) => handleDesignationTypeChange(e.target.value)}
            disabled={isLoading}
            className={selectClass}
          >
            <option value="">Select designation type...</option>
            {DESIGNATION_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* ACADEMIC Tree */}
        {designationType === "academic" && (
          <>
            <div>
              <Label htmlFor="academic-subtype" className="text-xs">
                Role *
              </Label>
              <select
                id="academic-subtype"
                value={subType}
                onChange={(e) => handleSubTypeChange(e.target.value)}
                disabled={isLoading}
                className={selectClass}
              >
                <option value="">Select role...</option>
                {ACADEMIC_SUBTYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Program Chair: Campus → Program */}
            {subType === "program_chair" && (
              <>
                <div>
                  <Label htmlFor="campus" className="text-xs">
                    Campus *
                  </Label>
                  <select
                    id="campus"
                    value={campusId}
                    onChange={(e) => handleCampusChange(e.target.value)}
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

                {campusId && (
                  <div>
                    <Label htmlFor="program" className="text-xs">
                      Program Offering *
                    </Label>
                    <select
                      id="program"
                      value={programCampusId}
                      onChange={(e) =>
                        handleProgramOfferingChange(e.target.value)
                      }
                      disabled={isLoading}
                      className={selectClass}
                    >
                      <option value="">Select program offering...</option>
                      {filteredProgramOfferings.map((offering) => (
                        <option key={offering.id} value={offering.id}>
                          {offering.program.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-foreground/60 mt-1">
                      Job title: Program Chairperson
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Dean: Department (ACADEMIC type only) */}
            {subType === "dean" && (
              <div>
                <Label htmlFor="department" className="text-xs">
                  Department (Academic) *
                </Label>
                <select
                  id="department"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  disabled={isLoading}
                  className={selectClass}
                >
                  <option value="">Select department...</option>
                  {filteredDepartments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-foreground/60 mt-1">
                  Job title: College Dean
                </p>
              </div>
            )}
          </>
        )}

        {/* ADMINISTRATIVE Tree */}
        {designationType === "administrative" && (
          <>
            <div>
              <Label htmlFor="admin-subtype" className="text-xs">
                Role *
              </Label>
              <select
                id="admin-subtype"
                value={subType}
                onChange={(e) => handleSubTypeChange(e.target.value)}
                disabled={isLoading}
                className={selectClass}
              >
                <option value="">Select role...</option>
                {ADMINISTRATIVE_SUBTYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Higher-ups: Job Title dropdown only — no campus needed */}
            {subType === "higher_ups" && (
              <div>
                <Label htmlFor="job-title-higher-ups" className="text-xs">
                  Job Title *
                </Label>
                <select
                  id="job-title-higher-ups"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  disabled={isLoading}
                  className={selectClass}
                >
                  <option value="">Select job title...</option>
                  {HIGHER_UPS_JOB_TITLES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Campus Director: Campus only */}
            {subType === "campus_director" && (
              <div>
                <Label htmlFor="campus-director" className="text-xs">
                  Campus *
                </Label>
                <select
                  id="campus-director"
                  value={campusId}
                  onChange={(e) => handleCampusChange(e.target.value)}
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
                <p className="text-xs text-foreground/60 mt-1">
                  Job title: Campus Director
                </p>
              </div>
            )}

            {/* Other: Campus + Department (ADMINISTRATIVE) + Custom Job Title */}
            {subType === "other" && (
              <>
                <div>
                  <Label htmlFor="campus-other" className="text-xs">
                    Campus *
                  </Label>
                  <select
                    id="campus-other"
                    value={campusId}
                    onChange={(e) => handleCampusChange(e.target.value)}
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
                  <Label htmlFor="department-other" className="text-xs">
                    Department (Administrative) *
                  </Label>
                  <select
                    id="department-other"
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    disabled={isLoading}
                    className={selectClass}
                  >
                    <option value="">Select department...</option>
                    {filteredDepartments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="job-title-other" className="text-xs">
                    Job Title *
                  </Label>
                  <Input
                    id="job-title-other"
                    placeholder="Enter job title"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    disabled={isLoading}
                    className="mt-1"
                  />
                </div>
              </>
            )}
          </>
        )}

        {/* STUDENT SERVICES Tree */}
        {designationType === "student_services" && (
          <>
            <div>
              <Label htmlFor="campus-ss" className="text-xs">
                Campus *
              </Label>
              <select
                id="campus-ss"
                value={campusId}
                onChange={(e) => handleCampusChange(e.target.value)}
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
              <Label htmlFor="department-ss" className="text-xs">
                Department (Student Services) *
              </Label>
              <select
                id="department-ss"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                disabled={isLoading}
                className={selectClass}
              >
                <option value="">Select department...</option>
                {filteredDepartments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="job-title-ss" className="text-xs">
                Job Title *
              </Label>
              <Input
                id="job-title-ss"
                placeholder="Enter job title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                disabled={isLoading}
                className="mt-1"
              />
            </div>
          </>
        )}

        {/* EXTENSION SERVICES Tree */}
        {designationType === "extension_services" && (
          <>
            <div>
              <Label htmlFor="campus-ext" className="text-xs">
                Campus *
              </Label>
              <select
                id="campus-ext"
                value={campusId}
                onChange={(e) => handleCampusChange(e.target.value)}
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
              <Label htmlFor="department-ext" className="text-xs">
                Department (Extension Services) *
              </Label>
              <select
                id="department-ext"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                disabled={isLoading}
                className={selectClass}
              >
                <option value="">Select department...</option>
                {filteredDepartments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="job-title-ext" className="text-xs">
                Job Title *
              </Label>
              <Input
                id="job-title-ext"
                placeholder="Enter job title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                disabled={isLoading}
                className="mt-1"
              />
            </div>
          </>
        )}

        {/* Load field (shown once workflow is selected) */}
        {showFormFields && (
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
              onChange={(e) => setLoad(e.target.value)}
              disabled={isLoading}
              className="mt-1"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      {showFormFields && (
        <div className="flex flex-col gap-2">
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
            <p className="text-xs text-destructive">{formError || error}</p>
          )}
        </div>
      )}
    </div>
  );
};
