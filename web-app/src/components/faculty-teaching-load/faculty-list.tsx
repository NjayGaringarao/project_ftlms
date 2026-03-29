"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CheckSquare, Square, User } from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import ListItemSmall from "@/components/ui/list-item-small";
import ProposalStatusFilterChips from "@/components/ui/proposal-status-filter-chips";
import FacultyLoadScopeExportActions from "@/components/ftl-evaluation/shared/faculty-load-scope-export-actions";
import { useLoadProposalListController } from "@/components/load-proposal/list/use-load-proposal-list-controller";
import { submitBulkCreateProposalAction } from "@/lib/load-proposal/actions";
import type { FacultyProposalListItem } from "@/lib/load-proposal/types";
import {
  CAMPUS_FILTER_UNASSIGNED,
  COLLEGE_FILTER_UNASSIGNED,
  type FacultyListExportScope,
} from "@/lib/faculty-load-export/scope";

type FacultyListProps = {
  facultyList: FacultyProposalListItem[];
  academicTermId: string;
};

const toFixed = (v: number) => v.toFixed(2);

const isBulkCreateEligible = (faculty: FacultyProposalListItem): boolean =>
  faculty.proposal_filter_status === "NO_PROPOSAL" ||
  faculty.proposal_filter_status === "INVALIDATED";

const isBulkExportEligible = (faculty: FacultyProposalListItem): boolean =>
  faculty.proposal_filter_status !== "NO_PROPOSAL" &&
  !!faculty.latest_faculty_load_proposal_id;

const ALL_FILTER_VALUE = "__ALL__";
type FilterOption = {
  value: string;
  label: string;
};

export const FacultyList = ({ facultyList, academicTermId }: FacultyListProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isBulkCreateDialogOpen, setIsBulkCreateDialogOpen] = useState(false);
  const [campusFilter, setCampusFilter] = useState(ALL_FILTER_VALUE);
  const [collegeFilter, setCollegeFilter] = useState(ALL_FILTER_VALUE);

  const selectedRouteFacultyId = useMemo(() => {
    const match = pathname.match(/\/faculty-teaching-load\/[^/]+\/([^/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  const campusOptions = useMemo<FilterOption[]>(() => {
    const optionsByValue = new Map<string, FilterOption>();

    for (const faculty of facultyList) {
      if (faculty.campus_id) {
        optionsByValue.set(faculty.campus_id, {
          value: faculty.campus_id,
          label: faculty.campus_name
            ? `${faculty.campus_name} Campus`
            : faculty.campus_code
              ? `${faculty.campus_code} Campus`
              : "Unnamed campus",
        });
        continue;
      }

      optionsByValue.set(CAMPUS_FILTER_UNASSIGNED, {
        value: CAMPUS_FILTER_UNASSIGNED,
        label: "Campus not assigned",
      });
    }

    return Array.from(optionsByValue.values()).sort((left, right) =>
      left.label.localeCompare(right.label),
    );
  }, [facultyList]);

  const campusScopedFacultyList = useMemo(() => {
    if (campusFilter === ALL_FILTER_VALUE) return facultyList;
    if (campusFilter === CAMPUS_FILTER_UNASSIGNED) {
      return facultyList.filter((faculty) => !faculty.campus_id);
    }

    return facultyList.filter((faculty) => faculty.campus_id === campusFilter);
  }, [campusFilter, facultyList]);

  const collegeOptions = useMemo<FilterOption[]>(() => {
    const optionsByValue = new Map<string, FilterOption>();

    for (const faculty of campusScopedFacultyList) {
      if (faculty.college_id) {
        optionsByValue.set(faculty.college_id, {
          value: faculty.college_id,
          label:
            faculty.college_code ??
            faculty.college_name ??
            "Unnamed college",
        });
        continue;
      }

      optionsByValue.set(COLLEGE_FILTER_UNASSIGNED, {
        value: COLLEGE_FILTER_UNASSIGNED,
        label: "College not assigned",
      });
    }

    return Array.from(optionsByValue.values()).sort((left, right) =>
      left.label.localeCompare(right.label),
    );
  }, [campusScopedFacultyList]);

  const effectiveCollegeFilter = useMemo(() => {
    if (collegeFilter === ALL_FILTER_VALUE) return ALL_FILTER_VALUE;
    const hasSelectedCollegeFilter = collegeOptions.some(
      (option) => option.value === collegeFilter,
    );
    return hasSelectedCollegeFilter ? collegeFilter : ALL_FILTER_VALUE;
  }, [collegeFilter, collegeOptions]);

  const campusCollegeScopedFacultyList = useMemo(() => {
    if (effectiveCollegeFilter === ALL_FILTER_VALUE) return campusScopedFacultyList;
    if (effectiveCollegeFilter === COLLEGE_FILTER_UNASSIGNED) {
      return campusScopedFacultyList.filter((faculty) => !faculty.college_id);
    }

    return campusScopedFacultyList.filter(
      (faculty) => faculty.college_id === effectiveCollegeFilter,
    );
  }, [campusScopedFacultyList, effectiveCollegeFilter]);

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
  } = useLoadProposalListController({
    items: campusCollegeScopedFacultyList,
    defaultStatus: "NO_PROPOSAL",
    isSelectable: isBulkCreateEligible,
  });

  const selectedFacultyIdsValue = selectedIds.join(",");
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
      campusId: campusFilter === ALL_FILTER_VALUE ? null : campusFilter,
      collegeId:
        effectiveCollegeFilter === ALL_FILTER_VALUE
          ? null
          : effectiveCollegeFilter,
    }),
    [campusFilter, effectiveCollegeFilter, query, statusFilter],
  );

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

      <div className="grid shrink-0 grid-cols-2 gap-2">
        <Select
          value={campusFilter}
          onChange={(event) => setCampusFilter(event.target.value)}
          className="h-8 text-xs"
          aria-label="Filter faculty by campus"
        >
          <option value={ALL_FILTER_VALUE}>All campuses</option>
          {campusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Select
          value={effectiveCollegeFilter}
          onChange={(event) => setCollegeFilter(event.target.value)}
          className="h-8 text-xs"
          aria-label="Filter faculty by college"
        >
          <option value={ALL_FILTER_VALUE}>All colleges</option>
          {collegeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

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
