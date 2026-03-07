/**
 * Primary designation type options (user selects first)
 */
export const DESIGNATION_TYPE_OPTIONS = [
  { value: "academic", label: "Academic" },
  { value: "administrative", label: "Administrative" },
  { value: "student_services", label: "Student Services" },
  { value: "extension_services", label: "Extension Services" },
] as const;

/**
 * Academic sub-types
 */
export const ACADEMIC_SUBTYPES = [
  { value: "program_chair", label: "Program Chair" },
  { value: "dean", label: "Dean" },
] as const;

/**
 * Administrative sub-types
 */
export const ADMINISTRATIVE_SUBTYPES = [
  { value: "higher_ups", label: "Higher-ups" },
  { value: "campus_director", label: "Campus Director" },
  { value: "other", label: "Other" },
] as const;

/**
 * Higher-ups job title options
 */
export const HIGHER_UPS_JOB_TITLES = [
  { value: "University President", label: "University President" },
  { value: "Director for Instruction", label: "Director for Instruction" },
] as const;

/**
 * Field requirements by designation path
 * Returns what fields must be filled for each workflow combination
 */
export const getDesignationRequirements = (
  designationType: string,
  subType?: string,
): {
  requiresCampus: boolean;
  requiresCollege: boolean;
  requiresProgram: boolean;
  requiresJobTitle: boolean;
  jobTitleOptions?: readonly { value: string; label: string }[];
  jobTitlePreset?: string;
  departmentTypeFilter?: string;
  allowCustomJobTitle: boolean;
} => {
  // ACADEMIC workflows
  if (designationType === "academic") {
    if (subType === "program_chair") {
      return {
        requiresCampus: true,
        requiresCollege: false, // Will be derived from program
        requiresProgram: true,
        requiresJobTitle: true,
        jobTitlePreset: "Program Chairperson",
        allowCustomJobTitle: false,
      };
    }
    if (subType === "dean") {
      return {
        requiresCampus: false,
        requiresCollege: true,
        requiresProgram: false,
        requiresJobTitle: true,
        jobTitlePreset: "College Dean",
        departmentTypeFilter: "ACADEMIC",
        allowCustomJobTitle: false,
      };
    }
  }

  // ADMINISTRATIVE workflows
  if (designationType === "administrative") {
    if (subType === "higher_ups") {
      return {
        requiresCampus: false,
        requiresCollege: false,
        requiresProgram: false,
        requiresJobTitle: true,
        jobTitleOptions: HIGHER_UPS_JOB_TITLES,
        allowCustomJobTitle: false,
      };
    }
    if (subType === "campus_director") {
      return {
        requiresCampus: true,
        requiresCollege: false,
        requiresProgram: false,
        requiresJobTitle: true,
        jobTitlePreset: "Campus Director",
        allowCustomJobTitle: false,
      };
    }
    if (subType === "other") {
      return {
        requiresCampus: true,
        requiresCollege: true,
        requiresProgram: false,
        requiresJobTitle: true,
        departmentTypeFilter: "ADMINISTRATIVE",
        allowCustomJobTitle: true,
      };
    }
  }

  // STUDENT SERVICES workflow
  if (designationType === "student_services") {
    return {
      requiresCampus: true,
      requiresCollege: true,
      requiresProgram: false,
      requiresJobTitle: true,
      departmentTypeFilter: "STUDENT_SERVICES",
      allowCustomJobTitle: true,
    };
  }

  // EXTENSION SERVICES workflow
  if (designationType === "extension_services") {
    return {
      requiresCampus: true,
      requiresCollege: true,
      requiresProgram: false,
      requiresJobTitle: true,
      departmentTypeFilter: "EXTENSION_SERVICES",
      allowCustomJobTitle: true,
    };
  }

  // Default (shouldn't reach here)
  return {
    requiresCampus: false,
    requiresCollege: false,
    requiresProgram: false,
    requiresJobTitle: false,
    allowCustomJobTitle: false,
  };
};

/**
 * Validates that a designation has the required fields populated
 */
export const validateDesignation = (
  designationType: string,
  subType: string | null,
  context: {
    campus_id?: string | null;
    college_id?: string | null;
    program_offering_id?: string | null;
    job_title?: string | null;
  },
): { valid: boolean; missing: string[] } => {
  const requirements = getDesignationRequirements(
    designationType,
    subType || undefined,
  );
  const missing: string[] = [];

  if (!designationType) {
    missing.push("designation type");
  }

  // Check sub-type for workflows that need it
  if (
    (designationType === "academic" || designationType === "administrative") &&
    !subType
  ) {
    missing.push("role type");
  }

  if (requirements.requiresCampus && !context.campus_id?.trim()) {
    missing.push("campus");
  }

  if (requirements.requiresCollege && !context.college_id?.trim()) {
    missing.push("college");
  }

  if (requirements.requiresProgram && !context.program_offering_id?.trim()) {
    missing.push("program offering");
  }

  if (requirements.requiresJobTitle && !context.job_title?.trim()) {
    missing.push("job title");
  }

  return {
    valid: missing.length === 0,
    missing,
  };
};
