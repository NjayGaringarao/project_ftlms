"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CheckSquare, Square, User } from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ListItemSmall from "@/components/ui/list-item-small";
import ProposalStatusFilterChips from "@/components/ui/proposal-status-filter-chips";
import RejectionCommentDialog from "@/components/ftl-evaluation/faculty-load/rejection-comment-dialog";
import { submitBulkEvaluationAction } from "@/lib/faculty-load/actions";
import type {
  FacultyEvaluationListItem,
  FacultyProposalApprovalFilterStatus,
} from "@/lib/course-loading/types";

type FacultyEvaluationListProps = {
  facultyList: FacultyEvaluationListItem[];
  academicTermId: string;
};

const toFixed = (v: number) => v.toFixed(2);

const longPressDelayMs = 450;

const isPendingProposal = (faculty: FacultyEvaluationListItem): boolean =>
  faculty.proposal_filter_status === "PENDING" && !!faculty.latest_proposal_id;

const FacultyEvaluationList = ({
  facultyList,
  academicTermId,
}: FacultyEvaluationListProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<FacultyProposalApprovalFilterStatus>("PENDING");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedFacultyIds, setSelectedFacultyIds] = useState<string[]>([]);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [isBulkRejectDialogOpen, setIsBulkRejectDialogOpen] = useState(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressedClickFacultyIdRef = useRef<string | null>(null);

  const selectedRouteFacultyId = useMemo(() => {
    const match = pathname.match(
      /\/ftl-evaluation\/[^/]+\/campus-load\/faculty-load\/([^/]+)/,
    );
    return match ? match[1] : null;
  }, [pathname]);

  const selectedFacultyIdSet = useMemo(
    () => new Set(selectedFacultyIds),
    [selectedFacultyIds],
  );

  const searchMatchedFaculty = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return facultyList;
    return facultyList.filter((faculty) => faculty.name.toLowerCase().includes(q));
  }, [facultyList, query]);

  const statusCounts = useMemo(
    () =>
      searchMatchedFaculty.reduce(
        (acc, faculty) => {
          acc[faculty.proposal_filter_status] += 1;
          return acc;
        },
        {
          PENDING: 0,
          APPROVED: 0,
          REJECTED: 0,
          INVALIDATED: 0,
          NO_PROPOSAL: 0,
        } satisfies Record<FacultyProposalApprovalFilterStatus, number>,
      ),
    [searchMatchedFaculty],
  );

  const filteredFaculty = useMemo(
    () =>
      searchMatchedFaculty.filter(
        (faculty) => faculty.proposal_filter_status === statusFilter,
      ),
    [searchMatchedFaculty, statusFilter],
  );

  const selectableFilteredFacultyIds = useMemo(
    () => filteredFaculty.filter(isPendingProposal).map((faculty) => faculty.id),
    [filteredFaculty],
  );

  const selectedProposalIds = useMemo(() => {
    const proposalIdSet = new Set<string>();
    for (const faculty of facultyList) {
      if (!selectedFacultyIdSet.has(faculty.id)) continue;
      if (!isPendingProposal(faculty) || !faculty.latest_proposal_id) continue;
      proposalIdSet.add(faculty.latest_proposal_id);
    }
    return Array.from(proposalIdSet);
  }, [facultyList, selectedFacultyIdSet]);

  const selectedProposalIdsValue = selectedProposalIds.join(",");

  const clearLongPressTimer = () => {
    if (!longPressTimerRef.current) return;
    clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  };

  useEffect(
    () => () => {
      clearLongPressTimer();
    },
    [],
  );

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedFacultyIds([]);
    setIsBulkDialogOpen(false);
    setIsBulkRejectDialogOpen(false);
    suppressedClickFacultyIdRef.current = null;
  };

  const toggleFacultySelection = (facultyId: string) => {
    setSelectedFacultyIds((previous) => {
      const next = previous.includes(facultyId)
        ? previous.filter((id) => id !== facultyId)
        : [...previous, facultyId];

      if (next.length === 0) {
        setIsSelectionMode(false);
        setIsBulkDialogOpen(false);
        setIsBulkRejectDialogOpen(false);
      }

      return next;
    });
  };

  const handleFacultyClick = (faculty: FacultyEvaluationListItem) => {
    if (suppressedClickFacultyIdRef.current === faculty.id) {
      suppressedClickFacultyIdRef.current = null;
      return;
    }
    if (suppressedClickFacultyIdRef.current !== null) {
      suppressedClickFacultyIdRef.current = null;
    }

    if (isSelectionMode) {
      if (!isPendingProposal(faculty)) return;
      toggleFacultySelection(faculty.id);
      return;
    }

    router.push(
      `/ftl-evaluation/${academicTermId}/campus-load/faculty-load/${faculty.id}`,
    );
  };

  const handleLongPressStart = (faculty: FacultyEvaluationListItem) => {
    if (isSelectionMode || !isPendingProposal(faculty)) return;
    clearLongPressTimer();
    longPressTimerRef.current = setTimeout(() => {
      suppressedClickFacultyIdRef.current = faculty.id;
      setIsSelectionMode(true);
      setSelectedFacultyIds([faculty.id]);
      longPressTimerRef.current = null;
    }, longPressDelayMs);
  };

  const handleSelectAll = () => {
    setSelectedFacultyIds(selectableFilteredFacultyIds);
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

      {isSelectionMode && (
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            onClick={handleSelectAll}
            disabled={selectableFilteredFacultyIds.length === 0}
          >
            Select all
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            onClick={exitSelectionMode}
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
        {filteredFaculty.length === 0 && (
          <p className="p-4 text-center text-sm text-foreground/70">
            No faculty found.
          </p>
        )}

        {filteredFaculty.map((faculty) => {
          const isSelectableInSelectionMode =
            isSelectionMode && isPendingProposal(faculty);
          const isSelected = isSelectionMode
            ? selectedFacultyIdSet.has(faculty.id)
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
              onClick={() => handleFacultyClick(faculty)}
              onPointerDown={() => handleLongPressStart(faculty)}
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
          <form
            action={handleBulkApproveSubmit}
          >
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
