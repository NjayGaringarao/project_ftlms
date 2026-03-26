"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CheckSquare, Square, User } from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ListItemSmall from "@/components/ui/list-item-small";
import ProposalStatusFilterChips from "@/components/ui/proposal-status-filter-chips";
import { submitBulkCreateProposalAction } from "@/lib/faculty-load/actions";
import type {
  FacultyEvaluationListItem,
  FacultyProposalApprovalFilterStatus,
} from "@/lib/course-loading/types";

type FacultyListProps = {
  facultyList: FacultyEvaluationListItem[];
  academicTermId: string;
};

const toFixed = (v: number) => v.toFixed(2);
const longPressDelayMs = 450;

const isBulkCreateEligible = (faculty: FacultyEvaluationListItem): boolean =>
  faculty.proposal_filter_status === "NO_PROPOSAL" ||
  faculty.proposal_filter_status === "INVALIDATED";

export const FacultyList = ({ facultyList, academicTermId }: FacultyListProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<FacultyProposalApprovalFilterStatus>("NO_PROPOSAL");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedFacultyIds, setSelectedFacultyIds] = useState<string[]>([]);
  const [isBulkCreateDialogOpen, setIsBulkCreateDialogOpen] = useState(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressedClickFacultyIdRef = useRef<string | null>(null);

  const selectedId = useMemo(() => {
    const match = pathname.match(/\/faculty-teaching-load\/[^/]+\/([^/]+)/);
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
    () => filteredFaculty.filter(isBulkCreateEligible).map((faculty) => faculty.id),
    [filteredFaculty],
  );

  const selectedFacultyIdsValue = selectedFacultyIds.join(",");

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
    setIsBulkCreateDialogOpen(false);
    suppressedClickFacultyIdRef.current = null;
  };

  const toggleFacultySelection = (facultyId: string) => {
    setSelectedFacultyIds((previous) => {
      const next = previous.includes(facultyId)
        ? previous.filter((id) => id !== facultyId)
        : [...previous, facultyId];

      if (next.length === 0) {
        setIsSelectionMode(false);
        setIsBulkCreateDialogOpen(false);
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
      if (!isBulkCreateEligible(faculty)) return;
      toggleFacultySelection(faculty.id);
      return;
    }

    router.push(`/faculty-teaching-load/${academicTermId}/${faculty.id}`);
  };

  const handleLongPressStart = (faculty: FacultyEvaluationListItem) => {
    if (isSelectionMode || !isBulkCreateEligible(faculty)) return;
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

  const handleBulkCreateSubmit = async (formData: FormData) => {
    const result = await submitBulkCreateProposalAction(formData);
    setIsBulkCreateDialogOpen(false);
    if (result.success) {
      exitSelectionMode();
      router.refresh();
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
        onChange={(e) => setQuery(e.target.value)}
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
            onClick={() => setIsBulkCreateDialogOpen(true)}
            disabled={selectedFacultyIds.length === 0}
          >
            Create proposal
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
            isSelectionMode && isBulkCreateEligible(faculty);
          const isSelected = isSelectionMode
            ? selectedFacultyIdSet.has(faculty.id)
            : selectedId === faculty.id;

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
        open={isBulkCreateDialogOpen}
        onOpenChange={setIsBulkCreateDialogOpen}
        title="Create Proposals"
        description={`Selected eligible faculty (No proposal / Invalidated): ${selectedFacultyIds.length}`}
        contentClassName="w-full max-w-md"
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setIsBulkCreateDialogOpen(false)}>
            Cancel
          </Button>
          <form action={handleBulkCreateSubmit}>
            <input type="hidden" name="academicTermId" value={academicTermId} />
            <input type="hidden" name="facultyIds" value={selectedFacultyIdsValue} />
            <Button type="submit" disabled={selectedFacultyIds.length === 0}>
              Confirm create
            </Button>
          </form>
        </div>
      </AppDialog>
    </div>
  );
};
