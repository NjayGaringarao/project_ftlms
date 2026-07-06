"use server";

import type {
  CampusCollegeLoadStatus,
  CampusCollegeLoadStep,
} from "@/features/shared/types/models/campus_college_load";
import { createClient } from "@/utils/supabase/server";
import { FTL_STEP_LABEL } from "./ftl-status";
import { getEmploymentMix, getSectionRollup } from "./shared-queries";
import { ExecutiveInsights } from "./types";

const PIPELINE_STEPS: CampusCollegeLoadStep[] = [
  "PROGRAM_CHAIR",
  "CAMPUS_DIRECTOR",
  "DIRECTOR_FOR_INSTRUCTION",
  "VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS",
  "COMPLETED",
];

type RawLoadRow = {
  id: string;
  status: CampusCollegeLoadStatus;
  current_step: CampusCollegeLoadStep;
  campus: { code?: string | null; name?: string | null } | null;
  college: { code?: string | null; name?: string | null } | null;
  campus_college_load_revision: Array<{
    revision_number: number | null;
    submitted_at: string | null;
  }> | null;
};

const scopeLabel = (row: RawLoadRow): string => {
  const campus = Array.isArray(row.campus) ? row.campus[0] : row.campus;
  const college = Array.isArray(row.college) ? row.college[0] : row.college;
  return `${campus?.code ?? campus?.name ?? "?"} — ${college?.code ?? college?.name ?? "?"}`;
};

const latestSubmittedAt = (row: RawLoadRow): string | null => {
  const revisions = row.campus_college_load_revision ?? [];
  const latest = [...revisions].sort(
    (left, right) =>
      Number(right.revision_number ?? 0) - Number(left.revision_number ?? 0),
  )[0];
  return latest?.submitted_at ?? null;
};

export const getExecutiveInsights = async (
  academicTermId: string,
  evaluationStep: CampusCollegeLoadStep,
): Promise<ExecutiveInsights> => {
  const supabase = await createClient();

  const [loadsResult, sections, employmentMix] = await Promise.all([
    supabase
      .from("campus_college_load")
      .select(
        `
        id,
        status,
        current_step,
        campus:campus_id(code, name),
        college:college_id(code, name),
        campus_college_load_revision(revision_number, submitted_at)
        `,
      )
      .eq("academic_term_id", academicTermId),
    getSectionRollup(academicTermId),
    getEmploymentMix(),
  ]);

  if (loadsResult.error) {
    console.error(
      "lib.home.executive-queries.getExecutiveInsights ::",
      loadsResult.error,
    );
  }

  const loads = ((loadsResult.data ?? []) as unknown as RawLoadRow[]);

  const statusCounts = {
    draft: loads.filter((row) => row.status === "DRAFT").length,
    submitted: loads.filter((row) => row.status === "SUBMITTED").length,
    returned: loads.filter((row) => row.status === "RETURNED").length,
    approved: loads.filter((row) => row.status === "APPROVED").length,
  };

  const stepCounts = PIPELINE_STEPS.map((step) => ({
    label: FTL_STEP_LABEL[step],
    value: loads.filter((row) => row.current_step === step).length,
  }));

  const awaitingEvaluation = loads
    .filter(
      (row) => row.status === "SUBMITTED" && row.current_step === evaluationStep,
    )
    .map((row) => ({
      loadId: row.id,
      scopeLabel: scopeLabel(row),
      submittedAt: latestSubmittedAt(row),
    }))
    .sort((left, right) =>
      (left.submittedAt ?? "").localeCompare(right.submittedAt ?? ""),
    );

  const campusTotals = new Map<
    string,
    { label: string; sections: number; students: number }
  >();
  sections.forEach((section) => {
    const key = section.campusId ?? section.campusLabel;
    const entry = campusTotals.get(key) ?? {
      label: section.campusLabel,
      sections: 0,
      students: 0,
    };
    entry.sections += 1;
    entry.students += section.studentCount;
    campusTotals.set(key, entry);
  });

  return {
    statusCounts,
    stepCounts,
    awaitingEvaluation,
    campusComparison: Array.from(campusTotals.values()).sort(
      (left, right) => right.students - left.students,
    ),
    employmentMix,
  };
};
