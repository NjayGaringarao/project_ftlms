"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BookCopy, ChevronDown } from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ListItemSmall from "@/components/ui/list-item-small";
import type {
  CampusCollegeLoadDetail,
  CampusCollegeLoadListItem,
} from "@/features/campus-college-load/lib/queries";
import { SubmitCampusCollegeLoadForm } from "@/features/campus-college-load/components/action-forms";
import {
  CampusCollegeLoadDetailPanel,
  statusClass,
} from "@/features/campus-college-load/components/campus-college-load-snapshot-summary";

const getScopeKey = (scope: CampusCollegeLoadListItem) =>
  `${scope.campus_id}:${scope.college_id}`;

const getScopeTitle = (scope: CampusCollegeLoadListItem) =>
  `${scope.college_code ?? "Department"} - ${scope.campus_name ?? "Campus"}`;

const CampusCollegeLoadProgramChair = ({
  items,
  detail,
  academicTermId,
  selectedCampusId,
  selectedCollegeId,
}: {
  items: CampusCollegeLoadListItem[];
  detail: CampusCollegeLoadDetail | null;
  academicTermId: string;
  selectedCampusId: string | null;
  selectedCollegeId: string | null;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [scopeDialogOpen, setScopeDialogOpen] = useState(false);
  const [scopeQuery, setScopeQuery] = useState("");
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);

  const navigateWithQuery = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams.toString());
      mutate(next);
      const queryString = next.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const selectedScope =
    items.find(
      (scope) =>
        scope.campus_id === selectedCampusId &&
        scope.college_id === selectedCollegeId,
    ) ??
    items[0] ??
    null;

  const openScope = (scope: CampusCollegeLoadListItem) =>
    navigateWithQuery((next) => {
      next.set("campus_id", scope.campus_id);
      next.set("college_id", scope.college_id);
      next.delete("revision_id");
    });

  const openRevision = (revisionId: string | null) =>
    navigateWithQuery((next) => {
      if (revisionId) {
        next.set("revision_id", revisionId);
      } else {
        next.delete("revision_id");
      }
    });

  const filteredScopes = items.filter((scope) => {
    const q = scopeQuery.trim().toLowerCase();
    if (!q) return true;
    return [scope.campus_code, scope.campus_name, scope.college_code, scope.college_name]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  if (!selectedScope) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-sm text-foreground/70">
        You have no Program Chairperson assignments for this academic term.
      </div>
    );
  }

  const isLatestRevisionViewed =
    !detail?.viewed_revision ||
    detail.viewed_revision.id === detail.latest_revision?.id;
  const actionLabel = detail?.can_submit_revision
    ? detail.load.status === "RETURNED"
      ? "Resubmit Revision"
      : "Submit Load"
    : null;

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <button
        type="button"
        disabled={items.length <= 1}
        onClick={() => setScopeDialogOpen(true)}
        className="flex w-fit items-center gap-1 text-base font-semibold disabled:cursor-default"
      >
        {getScopeTitle(selectedScope)}
        {items.length > 1 ? <ChevronDown className="h-4 w-4" /> : null}
      </button>

      {detail ? (
        <CampusCollegeLoadDetailPanel
          detail={detail}
          revisionSlot={
            detail.revisions.length > 1 ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setRevisionDialogOpen(true)}
              >
                Revision {detail.viewed_revision?.revision_number ?? 0}
                {isLatestRevisionViewed ? " (Latest)" : ""}
              </Button>
            ) : null
          }
          actionSlot={
            actionLabel ? (
              <SubmitCampusCollegeLoadForm
                academicTermId={academicTermId}
                campusId={selectedScope.campus_id}
                collegeId={selectedScope.college_id}
                label={actionLabel}
                className="flex flex-col gap-2 sm:items-end"
                buttonClassName="w-full sm:w-auto"
              />
            ) : null
          }
        />
      ) : (
        <div className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-foreground/70">
            Create the first frozen revision for this campus-college load.
          </p>
          <SubmitCampusCollegeLoadForm
            academicTermId={academicTermId}
            campusId={selectedScope.campus_id}
            collegeId={selectedScope.college_id}
            label="Submit Load"
            className="flex flex-col gap-2 sm:items-end"
            buttonClassName="w-full sm:w-auto"
          />
        </div>
      )}

      <AppDialog
        open={scopeDialogOpen}
        onOpenChange={setScopeDialogOpen}
        title="Select Campus-College Load"
        description="Search and switch between your assigned campus-college scopes."
        variant="floating-medium"
        contentClassName="flex max-h-[85vh] p-4 flex-col overflow-hidden"
      >
        <div className="flex h-full flex-col gap-3 overflow-hidden">
          <Input
            placeholder="Search scope"
            value={scopeQuery}
            onChange={(event) => setScopeQuery(event.target.value)}
          />
          <div className="grid flex-1 grid-cols-1 gap-2 overflow-y-auto md:grid-cols-2">
            {filteredScopes.map((scope) => {
              const scopeStatus = scope.load?.status ?? "DRAFT";
              return (
                <ListItemSmall
                  key={getScopeKey(scope)}
                  title={getScopeTitle(scope)}
                  subtitle={[scope.campus_code ?? "", scope.college_code ?? ""]}
                  isSelected={getScopeKey(scope) === getScopeKey(selectedScope)}
                  icon={<BookCopy className="h-6 w-6 text-background/70" />}
                  annotations={
                    <span
                      className={`rounded border px-2 py-1 text-xs ${statusClass[scopeStatus]}`}
                    >
                      {scopeStatus}
                    </span>
                  }
                  onClick={() => {
                    openScope(scope);
                    setScopeDialogOpen(false);
                  }}
                />
              );
            })}
          </div>
        </div>
      </AppDialog>

      {detail ? (
        <AppDialog
          open={revisionDialogOpen}
          onOpenChange={setRevisionDialogOpen}
          title="Select Revision"
          description="View a previously frozen snapshot."
          variant="floating-medium"
          contentClassName="flex max-h-[85vh] p-4 flex-col overflow-hidden"
        >
          <div className="grid flex-1 grid-cols-1 gap-2 overflow-y-auto">
            {detail.revisions.map((revision) => (
              <ListItemSmall
                key={revision.id}
                title={`Revision ${revision.revision_number}`}
                subtitle={[
                  revision.submitted_by_name ?? "Unknown submitter",
                  revision.id === detail.latest_revision?.id ? "Latest" : "",
                ].filter(Boolean)}
                isSelected={revision.id === detail.viewed_revision?.id}
                onClick={() => {
                  openRevision(
                    revision.id === detail.latest_revision?.id ? null : revision.id,
                  );
                  setRevisionDialogOpen(false);
                }}
              />
            ))}
          </div>
        </AppDialog>
      ) : null}
    </div>
  );
};

export default CampusCollegeLoadProgramChair;
