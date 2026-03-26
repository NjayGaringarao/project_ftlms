"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CheckSquare, Square, User } from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ListItemSmall from "@/components/ui/list-item-small";
import ProposalStatusFilterChips from "@/components/ui/proposal-status-filter-chips";
import { useProposalListController } from "@/components/proposal/list/use-proposal-list-controller";
import { submitBulkCreateProposalAction } from "@/lib/proposal/actions";
import type { FacultyProposalListItem } from "@/lib/proposal/types";

type FacultyListProps = {
  facultyList: FacultyProposalListItem[];
  academicTermId: string;
};

const toFixed = (v: number) => v.toFixed(2);

const isBulkCreateEligible = (faculty: FacultyProposalListItem): boolean =>
  faculty.proposal_filter_status === "NO_PROPOSAL" ||
  faculty.proposal_filter_status === "INVALIDATED";

export const FacultyList = ({ facultyList, academicTermId }: FacultyListProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isBulkCreateDialogOpen, setIsBulkCreateDialogOpen] = useState(false);

  const selectedRouteFacultyId = useMemo(() => {
    const match = pathname.match(/\/faculty-teaching-load\/[^/]+\/([^/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  const {
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    isSelectionMode,
    selectedIds,
    selectedIdSet,
    statusCounts,
    filteredItems,
    selectableFilteredIds,
    clearLongPressTimer,
    exitSelectionMode,
    onItemClick,
    onItemPointerDown,
    selectAllFiltered,
  } = useProposalListController({
    items: facultyList,
    defaultStatus: "NO_PROPOSAL",
    isSelectable: isBulkCreateEligible,
  });

  const selectedFacultyIdsValue = selectedIds.join(",");

  const exitSelectionModeAndDialogs = () => {
    setIsBulkCreateDialogOpen(false);
    exitSelectionMode();
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
            onClick={() => setIsBulkCreateDialogOpen(true)}
            disabled={selectedIds.length === 0}
          >
            Create proposal
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
            isSelectionMode && isBulkCreateEligible(faculty);
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
                  router.push(`/faculty-teaching-load/${academicTermId}/${faculty.id}`),
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
        open={isBulkCreateDialogOpen}
        onOpenChange={setIsBulkCreateDialogOpen}
        title="Create Proposals"
        description={`Selected eligible faculty (No proposal / Invalidated): ${selectedIds.length}`}
        contentClassName="w-full max-w-md"
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setIsBulkCreateDialogOpen(false)}>
            Cancel
          </Button>
          <form action={handleBulkCreateSubmit}>
            <input type="hidden" name="academicTermId" value={academicTermId} />
            <input type="hidden" name="facultyIds" value={selectedFacultyIdsValue} />
            <Button type="submit" disabled={selectedIds.length === 0}>
              Confirm create
            </Button>
          </form>
        </div>
      </AppDialog>
    </div>
  );
};
