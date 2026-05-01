"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CheckSquare, Square, User } from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ListItemSmall from "@/components/ui/list-item-small";
import ProposalStatusFilterChips from "@/components/ui/proposal-status-filter-chips";
import RejectionCommentDialog from "@/features/ftl-evaluation/components/faculty-load/rejection-comment-dialog";
import FacultyLoadScopeExportActions from "@/features/ftl-evaluation/components/shared/faculty-load-scope-export-actions";
import { useLoadProposalListController } from "@/features/ftl-evaluation/components/load-proposal/list/use-load-proposal-list-controller";
import { submitBulkEvaluationAction } from "@/features/ftl-evaluation/lib/load-proposal/actions";
import type { FacultyProposalListItem } from "@/features/ftl-evaluation/lib/load-proposal/types";
import type { FacultyListExportScope } from "@/features/document-export/lib/faculty-load-export/scope";

type FacultyEvaluationListProps = {
  facultyList: FacultyProposalListItem[];
  academicTermId: string;
};

const toFixed = (v: number) => v.toFixed(2);

const isPendingProposal = (faculty: FacultyProposalListItem): boolean =>
  faculty.proposal_filter_status === "PENDING" && !!faculty.latest_faculty_load_proposal_id;

const isBulkExportEligible = (faculty: FacultyProposalListItem): boolean =>
  faculty.proposal_filter_status !== "NO_PROPOSAL" &&
  !!faculty.latest_faculty_load_proposal_id;

const FacultyEvaluationList = ({
  facultyList,
  academicTermId,
}: FacultyEvaluationListProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [isBulkRejectDialogOpen, setIsBulkRejectDialogOpen] = useState(false);

  const selectedRouteFacultyId = useMemo(() => {
    const match = pathname.match(
      /\/ftl-evaluation\/[^/]+\/campus-load\/faculty-load\/([^/]+)/,
    );
    return match ? match[1] : null;
  }, [pathname]);

  const {
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    isSelectionMode,
    selectedIdSet,
    statusCounts,
    filteredItems,
    selectableFilteredIds,
    clearLongPressTimer,
    exitSelectionMode,
    onItemClick,
    onItemPointerDown,
    selectAllFiltered,
  } = useLoadProposalListController({
    items: facultyList,
    defaultStatus: "PENDING",
    isSelectable: isPendingProposal,
  });

  const selectedProposalIds = useMemo(() => {
    const proposalIdSet = new Set<string>();
    for (const faculty of facultyList) {
      if (!selectedIdSet.has(faculty.id)) continue;
      if (!isPendingProposal(faculty) || !faculty.latest_faculty_load_proposal_id) continue;
      proposalIdSet.add(faculty.latest_faculty_load_proposal_id);
    }
    return Array.from(proposalIdSet);
  }, [facultyList, selectedIdSet]);

  const selectedProposalIdsValue = selectedProposalIds.join(",");
  const exportableFilteredFacultyIds = useMemo(
    () => filteredItems.filter(isBulkExportEligible).map((faculty) => faculty.id),
    [filteredItems],
  );
  const bulkExportCount = exportableFilteredFacultyIds.length;
  const canBulkExport = bulkExportCount > 0;
  const bulkExportDisabledMessage =
    statusFilter === "NO_PROPOSAL"
      ? "Bulk export is unavailable for the No proposal filter."
      : "No exportable faculty found for the current filter.";

  const exportScope = useMemo<FacultyListExportScope>(
    () => ({
      kind: "faculty_list",
      statusFilter,
      searchQuery: query,
      campusId: null,
      collegeId: null,
    }),
    [query, statusFilter],
  );

  const exitSelectionModeAndDialogs = () => {
    setIsBulkDialogOpen(false);
    setIsBulkRejectDialogOpen(false);
    exitSelectionMode();
  };

  const handleBulkApproveSubmit = async (formData: FormData) => {
    const result = await submitBulkEvaluationAction(formData);
    setIsBulkDialogOpen(false);
    if (result.success) {
      exitSelectionMode();
    }
  };

  const handleBulkRejectSubmit = async (formData: FormData) => {
    const result = await submitBulkEvaluationAction(formData);
    setIsBulkRejectDialogOpen(false);
    if (result.success) {
      exitSelectionMode();
    }
  };

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      <ProposalStatusFilterChips
        activeStatus={statusFilter}
        counts={statusCounts}
        onChange={setStatusFilter}
      />

      <Input
        placeholder="Search faculty..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="shrink-0"
      />

      <div className="flex shrink-0 items-center gap-2">
        <FacultyLoadScopeExportActions
          academicTermId={academicTermId}
          scope={exportScope}
          exportableCount={bulkExportCount}
          disabledReason={canBulkExport ? undefined : bulkExportDisabledMessage}
        />
      </div>

      {isSelectionMode && (
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            onClick={selectAllFiltered}
            disabled={selectableFilteredIds.length === 0}
          >
            Select all
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            onClick={exitSelectionModeAndDialogs}
          >
            Cancel selection
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setIsBulkDialogOpen(true)}
            disabled={selectedProposalIds.length === 0}
          >
            Evaluate multiple
          </Button>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {filteredItems.length === 0 && (
          <p className="p-4 text-center text-sm text-foreground/70">
            No faculty found.
          </p>
        )}

        {filteredItems.map((faculty) => {
          const isSelectableInSelectionMode =
            isSelectionMode && isPendingProposal(faculty);
          const isSelected = isSelectionMode
            ? selectedIdSet.has(faculty.id)
            : selectedRouteFacultyId === faculty.id;

          return (
            <ListItemSmall
              key={faculty.id}
              title={faculty.name}
              subtitle={[
                `${faculty.campus_name?.concat(" Campus") ?? "Campus not assigned"}${
                  faculty.college_code ? " | ".concat(faculty.college_code) : ""
                }`,
              ]}
              isSelected={isSelected}
              onClick={() =>
                onItemClick(faculty, () =>
                  router.push(
                    `/ftl-evaluation/${academicTermId}/campus-load/faculty-load/${faculty.id}`,
                  ),
                )
              }
              onPointerDown={() => onItemPointerDown(faculty)}
              onPointerUp={clearLongPressTimer}
              onPointerLeave={clearLongPressTimer}
              onPointerCancel={clearLongPressTimer}
              icon={<User className="h-6 w-6 text-background/70" />}
              annotations={
                <span className="rounded-md bg-foreground/10 px-1 py-1 text-xs text-foreground">
                  TWL: {toFixed(faculty.total_working_load)}
                </span>
              }
              indicator={
                isSelectionMode ? (
                  isSelected ? (
                    <CheckSquare className="mt-1 h-4 w-4 text-foreground/80" />
                  ) : (
                    <Square
                      className={`mt-1 h-4 w-4 ${
                        isSelectableInSelectionMode
                          ? "text-foreground/70"
                          : "text-foreground/30"
                      }`}
                    />
                  )
                ) : undefined
              }
              className={
                isSelectionMode && !isSelectableInSelectionMode
                  ? "opacity-75"
                  : undefined
              }
            />
          );
        })}
      </div>

      <AppDialog
        open={isBulkDialogOpen}
        onOpenChange={setIsBulkDialogOpen}
        title="Evaluate Multiple Faculty Proposals"
        description={`Selected pending proposals: ${selectedProposalIds.length}`}
        contentClassName="w-full max-w-md"
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setIsBulkDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsBulkDialogOpen(false);
              setIsBulkRejectDialogOpen(true);
            }}
            disabled={selectedProposalIds.length === 0}
          >
            Reject selected
          </Button>
          <form action={handleBulkApproveSubmit}>
            <input type="hidden" name="academicTermId" value={academicTermId} />
            <input type="hidden" name="proposalIds" value={selectedProposalIdsValue} />
            <input type="hidden" name="status" value="APPROVED" />
            <Button type="submit" disabled={selectedProposalIds.length === 0}>
              Approve selected
            </Button>
          </form>
        </div>
      </AppDialog>

      <RejectionCommentDialog
        open={isBulkRejectDialogOpen}
        onOpenChange={setIsBulkRejectDialogOpen}
        title="Reject Selected Faculty Proposals"
        description={`Provide rejection reason for ${selectedProposalIds.length} selected proposal(s).`}
        action={handleBulkRejectSubmit}
        hiddenFields={[
          { name: "academicTermId", value: academicTermId },
          { name: "proposalIds", value: selectedProposalIdsValue },
          { name: "status", value: "REJECTED" },
        ]}
      />
    </div>
  );
};

export default FacultyEvaluationList;
