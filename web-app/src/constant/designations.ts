export const DESIGNATION_TITLE_ENUM_VALUES = [
  "University President",
  "Director for Instruction",
  "College Dean",
  "Campus Director",
  "Program Chairperson",
  "Assistant Director-Graduate Studies",
  "Extension Program",
  "Research",
  "CAA Coordinator",
  "Campus Climate Change Coordinator",
  "Campus Computer Laboratory in Charge",
  "Campus Cultural and Arts Affairs Coordinator",
  "Campus Document Control Officer",
  "Campus Extension Coordinator",
  "Campus NSTP Coordinator",
  "Campus Gender and Development Coordinator",
  "Campus Guidance Counselor",
  "Campus HRMO Coordinator",
  "Campus International Linkages Coordinator",
  "College Research Coordinator",
  "Campus Nurse",
  "Campus School Publication Coordinator",
  "Campus Student Affairs Coordinator",
  "Campus SSG Adviser",
  "Campus Student Conduct Coordinator",
  "Campus Discipline Coordinator",
  "Campus Sports Coordinator",
  "Campus Student Organization Coordinator",
  "Campus CADO Coordinator",
  "Campus CCI Coordinator",
  "Campus IGP Coordinator",
  "Quality Assurance",
  "Head",
  "Network Administrator",
  "Programmer",
  "Secretary",
  "Vice President for Academic Affairs",
  "Website Administrator",
] as const;

export const DESIGNATION_PRIMARY_OPTIONS = [
  { value: "University President", label: "University President" },
  { value: "Director for Instruction", label: "Director for Instruction" },
  { value: "College Dean", label: "College Dean" },
  { value: "Campus Director", label: "Campus Director" },
  { value: "Program Chairperson", label: "Program Chairperson" },
  {
    value: "Vice President for Academic Affairs",
    label: "Vice President for Academic Affairs",
  },
  { value: "Quality Assurance", label: "Quality Assurance" },
  { value: "Other", label: "Other" },
] as const;

export type DesignationSelectionSet = "A" | "B" | "C" | "D" | "E";

const PRIMARY_TITLES_EXCLUDING_OTHER: ReadonlyArray<string> = DESIGNATION_PRIMARY_OPTIONS.filter(
  (option) => option.value !== "Other",
).map((option) => option.value);

export const OTHER_DESIGNATION_OPTIONS = DESIGNATION_TITLE_ENUM_VALUES.filter(
  (title) => !PRIMARY_TITLES_EXCLUDING_OTHER.includes(title),
).map((title) => ({ value: title, label: title }));

export const getDesignationSelectionSet = (
  selectedPrimaryTitle: string,
): DesignationSelectionSet | null => {
  if (!selectedPrimaryTitle) {
    return null;
  }

  if (selectedPrimaryTitle === "Other") {
    return "E";
  }

  if (selectedPrimaryTitle === "College Dean") {
    return "B";
  }

  if (selectedPrimaryTitle === "Campus Director") {
    return "C";
  }

  if (selectedPrimaryTitle === "Program Chairperson") {
    return "D";
  }

  return "A";
};

export const resolveDesignationTitle = (
  selectedPrimaryTitle: string,
  selectedOtherTitle: string,
): string => {
  if (selectedPrimaryTitle === "Other") {
    return selectedOtherTitle.trim();
  }

  return selectedPrimaryTitle.trim();
};

type ValidateDesignationSelectionInput = {
  selectedPrimaryTitle: string;
  selectedOtherTitle?: string;
  campusId?: string;
  collegeId?: string;
  programOfferingId?: string;
};

export const validateDesignationSelection = ({
  selectedPrimaryTitle,
  selectedOtherTitle,
  campusId,
  collegeId,
  programOfferingId,
}: ValidateDesignationSelectionInput): {
  valid: boolean;
  missing: string[];
} => {
  const missing: string[] = [];
  const set = getDesignationSelectionSet(selectedPrimaryTitle);

  if (!selectedPrimaryTitle) {
    missing.push("designation");
    return { valid: false, missing };
  }

  if (set === "B" && !collegeId?.trim()) {
    missing.push("college");
  }

  if (set === "C" && !campusId?.trim()) {
    missing.push("campus");
  }

  if (set === "D" && !programOfferingId?.trim()) {
    missing.push("program offering");
  }

  if (set === "E") {
    if (!selectedOtherTitle?.trim()) {
      missing.push("designation title");
    }

    const hasContext =
      Boolean(campusId?.trim()) ||
      Boolean(collegeId?.trim()) ||
      Boolean(programOfferingId?.trim());

    if (!hasContext) {
      missing.push(
        "at least one context (campus, college, or program offering)",
      );
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
};

export const isDesignationEnumTitle = (title: string): boolean =>
  DESIGNATION_TITLE_ENUM_VALUES.some((enumTitle) => enumTitle === title);
