"use client";

import { type ReactNode, useState } from "react";
import { FileText, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import type { CampusCollegeLoadDetail } from "@/features/campus-college-load/lib/queries";
import { CampusCollegeLoadEvaluationForm } from "@/features/campus-college-load/components/action-forms";
import type {
  CampusCollegeLoadSnapshotClass,
  CampusCollegeLoadSnapshotFaculty,
} from "@/features/shared/types/models";
import { normalizeCampusCollegeLoadSnapshot } from "@/features/shared/types/models";
import { formatDateTime } from "@/utils/time";

export const statusClass: Record<string, string> = {
  DRAFT: "border-slate-200 bg-slate-100 text-slate-700",
  SUBMITTED: "border-sky-200 bg-sky-100 text-sky-800",
  RETURNED: "border-amber-200 bg-amber-100 text-amber-900",
  APPROVED: "border-emerald-200 bg-emerald-100 text-emerald-800",
};

export const stepLabel: Record<string, string> = {
  PROGRAM_CHAIR: "Program Chairperson",
  CAMPUS_DIRECTOR: "Campus Director",
  DIRECTOR_FOR_INSTRUCTION: "Director for Instruction",
  VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS: "VPAA",
  COMPLETED: "Completed",
};

export const evaluationStepLabel: Record<string, string> = {
  CAMPUS_DIRECTOR: "Campus Director",
  DIRECTOR_FOR_INSTRUCTION: "Director for Instruction",
  VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS: "VPAA",
};

const numberFormat = new Intl.NumberFormat("en", {
  maximumFractionDigits: 2,
});

const employmentStatusOrder = [
  "Regular",
  "Contract of Service",
  "Part-time",
  "Temporary",
];

const formatNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return numberFormat.format(Number.isFinite(parsed) ? parsed : 0);
};

const getFacultySummaryRow = (faculty: CampusCollegeLoadSnapshotFaculty) => {
  const lectureHours =
    faculty.lecture_hours ??
    faculty.classes.reduce(
      (sum, classRow) => sum + Number(classRow.lecture_unit ?? 0),
      0,
    );
  const laboratoryHours =
    faculty.laboratory_hours ??
    faculty.classes.reduce(
      (sum, classRow) => sum + Number(classRow.laboratory_unit ?? 0) * 3,
      0,
    );
  const preparationCount = faculty.preparation_count ?? faculty.classes.length;
  const equivalentUnits = faculty.equivalent_units ?? 0;
  const equivalentTeachingLoad = Number(faculty.equivalent_teaching_load ?? 0);
  const actualTeachingLoad = Number(faculty.actual_teaching_load ?? 0);
  const totalWorkingLoad =
    faculty.total_working_load ??
    equivalentTeachingLoad + actualTeachingLoad + equivalentUnits;

  return {
    designation_summary: faculty.designation_summary?.trim() || "N/A",
    lecture_hours: lectureHours,
    laboratory_hours: laboratoryHours,
    preparation_count: preparationCount,
    equivalent_units: equivalentUnits,
    equivalent_teaching_load: equivalentTeachingLoad,
    actual_teaching_load: actualTeachingLoad,
    total_working_load: totalWorkingLoad,
  };
};

const groupSnapshotFaculty = (faculty: CampusCollegeLoadSnapshotFaculty[]) => {
  const grouped = new Map<string, CampusCollegeLoadSnapshotFaculty[]>();
  faculty.forEach((row) => {
    const status = row.employment_status?.trim() || "Unspecified";
    grouped.set(status, [...(grouped.get(status) ?? []), row]);
  });

  return [
    ...employmentStatusOrder
      .filter((status) => grouped.has(status))
      .map((status) => ({ status, faculty: grouped.get(status) ?? [] })),
    ...Array.from(grouped.entries())
      .filter(([status]) => !employmentStatusOrder.includes(status))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([status, rows]) => ({ status, faculty: rows })),
  ];
};

const ClassScheduleTable = ({
  classes,
  collegeCode,
  legacy,
}: {
  classes: CampusCollegeLoadSnapshotClass[];
  collegeCode: string | null;
  legacy: boolean;
}) => {
  if (legacy) {
    return (
      <div className="rounded-md border border-dashed p-4 text-sm text-foreground/70">
        Class schedule data is not available for this older revision.
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-4 text-sm text-foreground/70">
        No classes recorded for this scope.
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-semibold mb-2">Class Schedule</h3>
      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-[860px] w-full text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase text-slate-700">
            <tr>
              <th className="px-3 py-2">Class Code</th>
              <th className="px-3 py-2">Course</th>
              <th className="px-3 py-2">Section</th>
              <th className="px-3 py-2">Instructor</th>
              <th className="px-3 py-2 text-right">Lecture Hours</th>
              <th className="px-3 py-2 text-right">Lab Hours</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((classRow) => (
              <tr key={classRow.class_id} className="border-t">
                <td className="px-3 py-2">{classRow.class_code}</td>
                <td className="px-3 py-2">
                  {classRow.course_code} — {classRow.course_title}
                </td>
                <td className="px-3 py-2">{classRow.section_code ?? "N/A"}</td>
                <td className="px-3 py-2">
                  {classRow.instructor_name ?? (
                    <span className="text-foreground/50">Unassigned</span>
                  )}
                  {classRow.instructor_name &&
                  classRow.instructor_college_code &&
                  classRow.instructor_college_code !== collegeCode ? (
                    <span className="ml-2 rounded border border-amber-200 bg-amber-100 px-1 py-0.5 text-[10px] text-amber-900">
                      Other College
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2 text-right">
                  {formatNumber(classRow.lecture_hours)}
                </td>
                <td className="px-3 py-2 text-right">
                  {formatNumber(classRow.laboratory_hours)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const SnapshotSummary = ({
  detail,
}: {
  detail: CampusCollegeLoadDetail;
}) => {
  const normalized = normalizeCampusCollegeLoadSnapshot(
    detail.viewed_revision?.snapshot ?? null,
  );

  if (!normalized) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-foreground/70">
          No submitted revision yet.
        </CardContent>
      </Card>
    );
  }

  const { metadata, faculty_load, class_schedule, legacy } = normalized;
  const groups = groupSnapshotFaculty(faculty_load.faculty);
  const totals = faculty_load.totals;
  const academicTermText = [
    metadata.academic_term_name,
    metadata.academic_year_code,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-foreground">Faculty Load</h3>
        <div className="hidden overflow-x-auto rounded-md border md:block">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-slate-100 text-left text-xs uppercase text-slate-700">
              <tr>
                <th className="w-12 px-3 py-2 text-center">No.</th>
                <th className="px-3 py-2">Name of Faculty</th>
                <th className="px-3 py-2">Designation</th>
                <th className="px-3 py-2 text-right">ETL</th>
                <th className="px-3 py-2 text-right">Lecture Hours</th>
                <th className="px-3 py-2 text-right">Lab Hours</th>
                <th className="px-3 py-2 text-right">No. of Preparation</th>
                <th className="px-3 py-2 text-right">Equivalent Units</th>
                <th className="px-3 py-2 text-right">ATL</th>
                <th className="px-3 py-2 text-right">TWL</th>
              </tr>
            </thead>
            {groups.map((group) => {
              const groupTotals = group.faculty.reduce(
                (sum, faculty) => {
                  const row = getFacultySummaryRow(faculty);
                  return {
                    equivalent_teaching_load:
                      sum.equivalent_teaching_load +
                      row.equivalent_teaching_load,
                    lecture_hours: sum.lecture_hours + row.lecture_hours,
                    laboratory_hours:
                      sum.laboratory_hours + row.laboratory_hours,
                    preparation_count:
                      sum.preparation_count + row.preparation_count,
                    equivalent_units:
                      sum.equivalent_units + row.equivalent_units,
                    actual_teaching_load:
                      sum.actual_teaching_load + row.actual_teaching_load,
                    total_working_load:
                      sum.total_working_load + row.total_working_load,
                  };
                },
                {
                  equivalent_teaching_load: 0,
                  lecture_hours: 0,
                  laboratory_hours: 0,
                  preparation_count: 0,
                  equivalent_units: 0,
                  actual_teaching_load: 0,
                  total_working_load: 0,
                },
              );
              return (
                <tbody key={group.status}>
                  <tr className="border-t bg-slate-50">
                    <td colSpan={10} className="px-3 py-2 font-medium">
                      {group.status}
                    </td>
                  </tr>
                  {group.faculty.map((faculty, index) => {
                    const row = getFacultySummaryRow(faculty);
                    return (
                      <tr key={faculty.faculty_id} className="border-t">
                        <td className="px-3 py-2 text-center">{index + 1}</td>
                        <td className="px-3 py-2 font-medium">
                          {faculty.faculty_name}
                        </td>
                        <td className="px-3 py-2">{row.designation_summary}</td>
                        <td className="px-3 py-2 text-right">
                          {formatNumber(row.equivalent_teaching_load)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {formatNumber(row.lecture_hours)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {formatNumber(row.laboratory_hours)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {formatNumber(row.preparation_count)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {formatNumber(row.equivalent_units)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {formatNumber(row.actual_teaching_load)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {formatNumber(row.total_working_load)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              );
            })}
          </table>
        </div>
      </div>
      <div className="space-y-3 md:hidden">
        {groups.map((group) => (
          <div key={group.status} className="space-y-2">
            <p className="text-sm font-semibold">{group.status}</p>
            {group.faculty.map((faculty, index) => {
              const row = getFacultySummaryRow(faculty);
              return (
                <div key={faculty.faculty_id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-foreground/50">
                        No. {index + 1}
                      </p>
                      <p className="font-medium">{faculty.faculty_name}</p>
                      <p className="text-xs text-foreground/60">
                        {row.designation_summary}
                      </p>
                    </div>
                    <p className="text-right text-sm font-semibold">
                      TWL {formatNumber(row.total_working_load)}
                    </p>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <p>ETL: {formatNumber(row.equivalent_teaching_load)}</p>
                    <p>ATL: {formatNumber(row.actual_teaching_load)}</p>
                    <p>Lecture: {formatNumber(row.lecture_hours)}</p>
                    <p>Lab: {formatNumber(row.laboratory_hours)}</p>
                    <p>Preparations: {formatNumber(row.preparation_count)}</p>
                    <p>Eq Units: {formatNumber(row.equivalent_units)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <ClassScheduleTable
        classes={class_schedule.classes}
        collegeCode={metadata.college_code}
        legacy={legacy}
      />

      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-foreground">Approval Status</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            detail.signatures.prepared,
            detail.signatures.recommending_approval,
            detail.signatures.approved,
          ].map((signature) => (
            <div
              key={signature.label}
              className="rounded-md border p-3 text-sm"
            >
              <p className="text-xs text-foreground/60">{signature.label}</p>
              <p className="mt-1 font-medium">{signature.role}</p>
              <p className="text-sm text-foreground/70">
                {signature.name ?? "Pending approval"}
              </p>
              {signature.decided_at ? (
                <p className="mt-1 text-xs text-foreground/50">
                  {formatDateTime(signature.decided_at)}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const LadderHistoryContent = ({
  detail,
}: {
  detail: CampusCollegeLoadDetail;
}) => (
  <div className="space-y-3">
    {detail.revisions.length > 0 ? (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Revision History</h3>
        {detail.revisions.map((revision) => (
          <div key={revision.id} className="rounded-md border p-3 text-sm">
            <p className="font-medium">Revision {revision.revision_number}</p>
            <p className="text-xs text-foreground/60">
              Submitted {formatDateTime(revision.submitted_at ?? undefined)}
            </p>
            <p className="text-xs text-foreground/60">
              By {revision.submitted_by_name ?? "Unknown submitter"}
            </p>
          </div>
        ))}
      </div>
    ) : null}

    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Ladder History</h3>
      {detail.evaluations.length === 0 ? (
        <p className="rounded-md border border-dashed p-4 text-sm text-foreground/70">
          No decisions yet.
        </p>
      ) : null}
      {detail.evaluations.map((evaluation) => (
        <div key={evaluation.id} className="rounded-md border p-3 text-sm">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium">
              {evaluation.system_generated
                ? "Automatic Return"
                : evaluationStepLabel[evaluation.step]}
            </p>
            <span
              className={`rounded border px-1.5 py-0.5 text-xs ${
                evaluation.status === "APPROVED"
                  ? "border-emerald-200 bg-emerald-100 text-emerald-800"
                  : "border-amber-200 bg-amber-100 text-amber-900"
              }`}
            >
              {evaluation.status}
            </span>
          </div>
          {evaluation.comment ? (
            <p className="mt-2 text-foreground/70">{evaluation.comment}</p>
          ) : null}
          {evaluation.system_generated ? (
            <p className="mt-2 text-xs text-foreground/50">
              Source schedule data changed after this revision was submitted.
            </p>
          ) : null}
          {evaluation.attachment_path ? (
            <a
              href={evaluation.attachment_signed_url ?? "#"}
              className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
              aria-disabled={!evaluation.attachment_signed_url}
            >
              <FileText className="h-3 w-3" />
              {evaluation.attachment_file_name ?? "PDF attachment"}
            </a>
          ) : null}
          <p className="mt-2 text-xs text-foreground/50">
            {formatDateTime(evaluation.created_at ?? undefined)}
          </p>
        </div>
      ))}
    </div>
  </div>
);

/**
 * Status row + History dialog + SnapshotSummary shared by both the Program
 * Chair and Evaluator views. Only the action button (Submit/Resubmit vs.
 * Evaluate) and the optional revision selector differ between the two.
 */
export const CampusCollegeLoadDetailPanel = ({
  detail,
  actionSlot,
  revisionSlot,
}: {
  detail: CampusCollegeLoadDetail;
  actionSlot?: ReactNode;
  revisionSlot?: ReactNode;
}) => {
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-md border p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div className="flex flex-col gap-1">
            <p className="text-base text-foreground ">
              Revision {detail.viewed_revision?.revision_number ?? 0} submitted{" "}
              {formatDateTime(
                detail.viewed_revision?.submitted_at ?? undefined,
              )}
            </p>

            <p className="text-sm text-foreground/60">
              {stepLabel[detail.load.current_step] !== "COMPLETED"
                ? `For approval by ${stepLabel[detail.load.current_step]}`
                : `Approval Complete`}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {revisionSlot}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setHistoryOpen(true)}
          >
            <History className="h-4 w-4" />
            History
          </Button>
          {actionSlot}
        </div>
      </div>

      <SnapshotSummary detail={detail} />

      <AppDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        title="Load History"
        variant="floating-medium"
        contentClassName="p-4"
      >
        <LadderHistoryContent detail={detail} />
      </AppDialog>
    </div>
  );
};

export const ActionContent = ({
  detail,
}: {
  detail: CampusCollegeLoadDetail | null;
}) => {
  const latestRevision = detail?.latest_revision ?? null;

  if (latestRevision && detail?.can_evaluate_step) {
    return (
      <div className="space-y-3">
        <CampusCollegeLoadEvaluationForm
          revisionId={latestRevision.id}
          step={detail.can_evaluate_step}
          status="APPROVED"
        />
        <CampusCollegeLoadEvaluationForm
          revisionId={latestRevision.id}
          step={detail.can_evaluate_step}
          status="RETURNED"
        />
      </div>
    );
  }

  return (
    <p className="rounded-md border border-dashed p-4 text-sm text-foreground/70">
      There is no available action for your role at the current step.
    </p>
  );
};

export const getActionLabel = ({
  detail,
}: {
  detail: CampusCollegeLoadDetail | null;
}): string | null => {
  if (detail?.can_submit_revision) {
    return detail.load.status === "RETURNED"
      ? "Resubmit Revision"
      : "Submit Load";
  }
  if (detail?.can_evaluate_step) return "Evaluate";
  return null;
};
