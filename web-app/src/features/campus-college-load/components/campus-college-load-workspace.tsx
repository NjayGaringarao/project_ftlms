import Link from "next/link";
import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  CampusCollegeLoadDetail,
  CampusCollegeLoadListItem,
} from "@/features/campus-college-load/lib/queries";
import {
  CampusCollegeLoadEvaluationForm,
  SubmitCampusCollegeLoadForm,
} from "@/features/campus-college-load/components/action-forms";
import { formatDateTime } from "@/utils/time";

const statusClass: Record<string, string> = {
  DRAFT: "border-slate-200 bg-slate-100 text-slate-700",
  SUBMITTED: "border-sky-200 bg-sky-100 text-sky-800",
  RETURNED: "border-amber-200 bg-amber-100 text-amber-900",
  APPROVED: "border-emerald-200 bg-emerald-100 text-emerald-800",
};

const stepLabel: Record<string, string> = {
  PROGRAM_CHAIR: "Program Chairperson",
  CAMPUS_DIRECTOR: "Campus Director",
  DIRECTOR_FOR_INSTRUCTION: "Director for Instruction",
  VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS: "VPAA",
  COMPLETED: "Completed",
};

const evaluationStepLabel: Record<string, string> = {
  CAMPUS_DIRECTOR: "Campus Director",
  DIRECTOR_FOR_INSTRUCTION: "Director for Instruction",
  VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS: "VPAA",
};

const numberFormat = new Intl.NumberFormat("en", {
  maximumFractionDigits: 2,
});

const LoadList = ({
  items,
  selectedId,
  academicTermId,
}: {
  items: CampusCollegeLoadListItem[];
  selectedId: string | null;
  academicTermId: string;
}) => (
  <div className="flex h-full min-w-80 flex-col overflow-y-auto border-r bg-background">
    <div className="border-b p-4">
      <h2 className="text-base font-semibold">Campus College Loads</h2>
      <p className="text-sm text-foreground/60">
        Select a campus-college scope to review or submit.
      </p>
    </div>
    <div className="flex flex-col gap-2 p-3">
      {items.length === 0 ? (
        <div className="rounded-md border border-dashed p-4 text-sm text-foreground/70">
          No campus-college load scopes are available for your current roles.
        </div>
      ) : null}
      {items.map((item) => {
        const href = item.load
          ? `/campus-college-load?academic_term_id=${academicTermId}&id=${item.load.id}`
          : `/campus-college-load?academic_term_id=${academicTermId}&campus_id=${item.campus_id}&college_id=${item.college_id}`;
        const isSelected =
          selectedId === item.load?.id ||
          (!selectedId && !item.load && items.indexOf(item) === 0);
        return (
          <Link
            key={`${item.campus_id}:${item.college_id}`}
            href={href}
            className={`rounded-md border p-3 text-sm transition hover:bg-foreground/5 ${
              isSelected ? "border-primary bg-primary/5" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">
                  {item.campus_code ?? "Campus"} / {item.college_code ?? "College"}
                </p>
                <p className="text-xs text-foreground/60">
                  {item.campus_name ?? "Campus"} - {item.college_name ?? "College"}
                </p>
              </div>
              <span
                className={`rounded border px-1.5 py-0.5 text-xs ${
                  statusClass[item.load?.status ?? "DRAFT"]
                }`}
              >
                {item.load?.status ?? "DRAFT"}
              </span>
            </div>
            <p className="mt-2 text-xs text-foreground/60">
              Step: {stepLabel[item.load?.current_step ?? "PROGRAM_CHAIR"]}
            </p>
          </Link>
        );
      })}
    </div>
  </div>
);

const SnapshotSummary = ({ detail }: { detail: CampusCollegeLoadDetail }) => {
  const snapshot = detail.latest_revision?.snapshot ?? null;
  if (!snapshot) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-foreground/70">
          No submitted revision yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Frozen Load Snapshot</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-md border p-3">
            <p className="text-xs text-foreground/60">Faculty</p>
            <p className="text-lg font-semibold">{snapshot.totals.faculty_count}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-foreground/60">ETL</p>
            <p className="text-lg font-semibold">
              {numberFormat.format(snapshot.totals.equivalent_teaching_load)}
            </p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-foreground/60">ATL</p>
            <p className="text-lg font-semibold">
              {numberFormat.format(snapshot.totals.actual_teaching_load)}
            </p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-foreground/60">TWL</p>
            <p className="text-lg font-semibold">
              {numberFormat.format(snapshot.totals.total_working_load)}
            </p>
          </div>
        </div>
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-foreground/5 text-left">
              <tr>
                <th className="px-3 py-2">Faculty</th>
                <th className="px-3 py-2">Classes</th>
                <th className="px-3 py-2 text-right">ETL</th>
                <th className="px-3 py-2 text-right">ATL</th>
                <th className="px-3 py-2 text-right">TWL</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.faculty.map((faculty) => (
                <tr key={faculty.faculty_id} className="border-t">
                  <td className="px-3 py-2">{faculty.faculty_name}</td>
                  <td className="px-3 py-2">{faculty.classes.length}</td>
                  <td className="px-3 py-2 text-right">
                    {numberFormat.format(faculty.equivalent_teaching_load)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {numberFormat.format(faculty.actual_teaching_load)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {numberFormat.format(faculty.total_working_load)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

const DetailPanel = ({
  detail,
  selectedDraftScope,
  academicTermId,
}: {
  detail: CampusCollegeLoadDetail | null;
  selectedDraftScope: CampusCollegeLoadListItem | null;
  academicTermId: string;
}) => {
  if (!detail && selectedDraftScope) {
    return (
      <div className="flex-1 overflow-y-auto p-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDraftScope.campus_code ?? "Campus"} /{" "}
              {selectedDraftScope.college_code ?? "College"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-foreground/70">
              Create the first frozen revision for this campus-college load.
            </p>
            <SubmitCampusCollegeLoadForm
              academicTermId={academicTermId}
              campusId={selectedDraftScope.campus_id}
              collegeId={selectedDraftScope.college_id}
              label="Submit Load"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-sm text-foreground/70">
        Select a campus-college load to begin.
      </div>
    );
  }

  const latestRevision = detail.latest_revision;
  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">
            {detail.load.campus?.code ?? "Campus"} /{" "}
            {detail.load.college?.code ?? "College"} Load
          </h1>
          <p className="text-sm text-foreground/60">
            Current step: {stepLabel[detail.load.current_step]}
          </p>
        </div>
        <span
          className={`rounded border px-2 py-1 text-xs ${statusClass[detail.load.status]}`}
        >
          {detail.load.status}
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <SnapshotSummary detail={detail} />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revision History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {detail.revisions.map((revision) => (
                <div key={revision.id} className="rounded-md border p-3 text-sm">
                  <p className="font-medium">Revision {revision.revision_number}</p>
                  <p className="text-xs text-foreground/60">
                    Submitted {formatDateTime(revision.submitted_at ?? undefined)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {detail.can_submit_revision ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Program Chair Action</CardTitle>
              </CardHeader>
              <CardContent>
                <SubmitCampusCollegeLoadForm
                  academicTermId={detail.load.academic_term_id}
                  campusId={detail.load.campus_id}
                  collegeId={detail.load.college_id}
                  label={
                    detail.load.status === "RETURNED"
                      ? "Resubmit Revision"
                      : "Submit Load"
                  }
                />
              </CardContent>
            </Card>
          ) : null}

          {latestRevision && detail.can_evaluate_step ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {evaluationStepLabel[detail.can_evaluate_step]} Action
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ladder History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {detail.evaluations.length === 0 ? (
                <p className="text-sm text-foreground/70">No decisions yet.</p>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const CampusCollegeLoadWorkspace = ({
  items,
  detail,
  selectedId,
  selectedDraftScope,
  academicTermId,
}: {
  items: CampusCollegeLoadListItem[];
  detail: CampusCollegeLoadDetail | null;
  selectedId: string | null;
  selectedDraftScope: CampusCollegeLoadListItem | null;
  academicTermId: string;
}) => (
  <div className="flex min-h-0 flex-1 overflow-hidden">
    <LoadList
      items={items}
      selectedId={selectedId}
      academicTermId={academicTermId}
    />
    <DetailPanel
      detail={detail}
      selectedDraftScope={selectedDraftScope}
      academicTermId={academicTermId}
    />
  </div>
);

export default CampusCollegeLoadWorkspace;
