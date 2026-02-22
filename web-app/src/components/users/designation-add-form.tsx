"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  DESIGNATION_TYPE_OPTIONS,
  ACADEMIC_SUBTYPES,
  ADMINISTRATIVE_SUBTYPES,
  HIGHER_UPS_JOB_TITLES,
  getDesignationRequirements,
  validateDesignation,
} from "@/constant/designations";
import { getDepartmentsList } from "@/lib/university/departments";
import { getPrograms } from "@/lib/university/programs";
import { getCampusesList } from "@/lib/university/campuses";
import { DepartmentListItem } from "@/lib/university/departments";
import { ExtendedProgram } from "@/models/program";
import { Campus } from "@/models/campus";

type DesignationFormProps = {
  onAdd: (designation: any) => void;
  isLoading: boolean;
  error?: string;
};

export const DesignationAddForm = ({
  onAdd,
  isLoading,
  error,
}: DesignationFormProps) => {
  const [departments, setDepartments] = useState<DepartmentListItem[]>([]);
  const [programs, setPrograms] = useState<ExtendedProgram[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Form state
  const [designationType, setDesignationType] = useState<string>("");
  const [subType, setSubType] = useState<string>("");
  const [campusId, setCampusId] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [programId, setProgramId] = useState<string>("");
  const [jobTitle, setJobTitle] = useState<string>("");
  const [load, setLoad] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(true);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const [deptsData, campusesData, programsData] = await Promise.all([
          getDepartmentsList(),
          getCampusesList(),
          getPrograms(),
        ]);
        setDepartments(deptsData);
        setCampuses(campusesData);
        setPrograms(programsData);
      } catch (err) {
        console.error("Error fetching designation form data:", err);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, []);

  // Reset form when designation type changes
  const handleDesignationTypeChange = (type: string) => {
    setDesignationType(type);
    setSubType("");
    setCampusId("");
    setDepartmentId("");
    setProgramId("");
    setJobTitle("");
  };

  // Handle sub-type change
  const handleSubTypeChange = (st: string) => {
    setSubType(st);
    const requirements = getDesignationRequirements(designationType, st);

    // Auto-set job title if preset
    if (requirements.jobTitlePreset) {
      setJobTitle(requirements.jobTitlePreset);
    } else {
      setJobTitle("");
    }
  };

  // When program changes, auto-fill department from program
  const handleProgramChange = (progId: string) => {
    setProgramId(progId);
    const prog = programs.find((p) => p.id === progId);
    if (prog) {
      setDepartmentId(prog.department_id);
    }
  };

  // Handle form submission
  const handleAddDesignation = () => {
    const validation = validateDesignation(designationType, subType, {
      campus_id: campusId,
      department_id: departmentId,
      program_id: programId,
      job_title: jobTitle,
    });

    if (!validation.valid) {
      console.error("Missing required fields:", validation.missing);
      return;
    }

    if (!load || parseInt(load) < 0) {
      console.error("Load must be a positive number");
      return;
    }

    // Build designation object
    const designation = {
      department_id: departmentId || null,
      program_id: programId || null,
      campus_id: campusId || null,
      room_id: null,
      job_title: jobTitle.trim(),
      load: parseInt(load),
      is_active: isActive,
    };

    onAdd(designation);

    // Reset form
    setDesignationType("");
    setSubType("");
    setCampusId("");
    setDepartmentId("");
    setProgramId("");
    setJobTitle("");
    setLoad("");
    setIsActive(true);
  };

  if (isLoadingData) {
    return <div className="text-xs text-foreground/60">Loading options...</div>;
  }

  const requirements = getDesignationRequirements(designationType, subType);

  // Filter departments by type if needed
  const filteredDepartments = requirements.departmentTypeFilter
    ? departments.filter((d) => d.type === requirements.departmentTypeFilter)
    : departments;

  // Filter programs by campus if campus is selected
  const filteredPrograms = campusId
    ? programs.filter((p) => p.campus_id === campusId)
    : programs;

  return (
    <div className="border rounded-lg p-4 bg-foreground/2 grid grid-cols-1 md:grid-cols-2 gap-4">
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
          className="mt-1 w-full px-3 py-2 border border-foreground/20 rounded-md bg-background text-foreground text-sm"
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
              className="mt-1 w-full px-3 py-2 border border-foreground/20 rounded-md bg-background text-foreground text-sm"
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
                  onChange={(e) => setCampusId(e.target.value)}
                  disabled={isLoading}
                  className="mt-1 w-full px-3 py-2 border border-foreground/20 rounded-md bg-background text-foreground text-sm"
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
                    Program *
                  </Label>
                  <select
                    id="program"
                    value={programId}
                    onChange={(e) => handleProgramChange(e.target.value)}
                    disabled={isLoading}
                    className="mt-1 w-full px-3 py-2 border border-foreground/20 rounded-md bg-background text-foreground text-sm"
                  >
                    <option value="">Select program...</option>
                    {filteredPrograms.map((prog) => (
                      <option key={prog.id} value={prog.id}>
                        {prog.name}
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
                className="mt-1 w-full px-3 py-2 border border-foreground/20 rounded-md bg-background text-foreground text-sm"
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
              className="mt-1 w-full px-3 py-2 border border-foreground/20 rounded-md bg-background text-foreground text-sm"
            >
              <option value="">Select role...</option>
              {ADMINISTRATIVE_SUBTYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Higher-ups: Job Title dropdown only */}
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
                className="mt-1 w-full px-3 py-2 border border-foreground/20 rounded-md bg-background text-foreground text-sm"
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
                onChange={(e) => setCampusId(e.target.value)}
                disabled={isLoading}
                className="mt-1 w-full px-3 py-2 border border-foreground/20 rounded-md bg-background text-foreground text-sm"
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
                  onChange={(e) => setCampusId(e.target.value)}
                  disabled={isLoading}
                  className="mt-1 w-full px-3 py-2 border border-foreground/20 rounded-md bg-background text-foreground text-sm"
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
                  className="mt-1 w-full px-3 py-2 border border-foreground/20 rounded-md bg-background text-foreground text-sm"
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
              onChange={(e) => setCampusId(e.target.value)}
              disabled={isLoading}
              className="mt-1 w-full px-3 py-2 border border-foreground/20 rounded-md bg-background text-foreground text-sm"
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
              className="mt-1 w-full px-3 py-2 border border-foreground/20 rounded-md bg-background text-foreground text-sm"
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
              onChange={(e) => setCampusId(e.target.value)}
              disabled={isLoading}
              className="mt-1 w-full px-3 py-2 border border-foreground/20 rounded-md bg-background text-foreground text-sm"
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
              className="mt-1 w-full px-3 py-2 border border-foreground/20 rounded-md bg-background text-foreground text-sm"
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

      {/* Load field (shown for all types once subtype is selected) */}
      {designationType &&
        (subType ||
          designationType === "student_services" ||
          designationType === "extension_services") && (
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

      {/* is_active checkbox */}
      {designationType &&
        (subType ||
          designationType === "student_services" ||
          designationType === "extension_services") && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={isLoading}
              className="w-4 h-4"
            />
            <span className="text-xs">Active</span>
          </label>
        )}

      {/* Add Button */}
      {designationType &&
        (subType ||
          designationType === "student_services" ||
          designationType === "extension_services") && (
          <div className="pt-2">
            <Button
              onClick={handleAddDesignation}
              disabled={isLoading}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Designation
            </Button>
          </div>
        )}
    </div>
  );
};
