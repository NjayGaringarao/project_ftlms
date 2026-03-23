"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUp, BookOpen, GitMerge, Link2Off, Merge, Split } from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Input } from "@/components/ui/input";
import ListItemSmall from "@/components/ui/list-item-small";
import { numberToHourDuration } from "@/utils/time";
import type { SchedulerCourseOfferingItem } from "@/lib/schedule/course-offerings";
import {
  detachOtherCourseUtilizations,
  getMergeCandidatesForCourseUtilization,
  getUnmergeCandidatesForCourseUtilization,
  mergeCourseUtilizations,
  unmergeCourseUtilization,
  type CourseUtilizationMergeCandidate,
  type CourseUtilizationUnmergeCandidate,
} from "@/lib/schedule/merge";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/style";

type SelectCourseOfferingDialogProps = {
  academicTermId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offerings: SchedulerCourseOfferingItem[];
  selectedOfferingId: string | null;
  onSelectOffering: (id: string) => void;
  onOfferingsChanged: () => void;
};

const SelectCourseOfferingDialog = ({
  academicTermId,
  open,
  onOpenChange,
  offerings,
  selectedOfferingId,
  onSelectOffering,
  onOfferingsChanged,
}: SelectCourseOfferingDialogProps) => {
  const [query, setQuery] = useState("");
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [mergeOffering, setMergeOffering] =
    useState<SchedulerCourseOfferingItem | null>(null);
  const [mergeCandidates, setMergeCandidates] = useState<
    CourseUtilizationMergeCandidate[]
  >([]);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(
    () => new Set(),
  );
  const [mergeError, setMergeError] = useState("");
  const [isMerging, setIsMerging] = useState(false);
  const [unmergeDialogOpen, setUnmergeDialogOpen] = useState(false);
  const [unmergeMode, setUnmergeMode] = useState<"self" | "other">("self");
  const [unmergeCandidates, setUnmergeCandidates] = useState<
    CourseUtilizationUnmergeCandidate[]
  >([]);
  const [selectedUnmergeCandidates, setSelectedUnmergeCandidates] = useState<
    Set<string>
  >(() => new Set());
  const [detachMode, setDetachMode] = useState<"per_block" | "single_class">(
    "single_class",
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return offerings;
    return offerings.filter((item) =>
      item.course_code.toLowerCase().includes(q),
    );
  }, [offerings, query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
  }, [open]);

  useEffect(() => {
    if (!mergeDialogOpen || !mergeOffering) return;
    let cancelled = false;

    const loadCandidates = async () => {
      setMergeLoading(true);
      const rows = await getMergeCandidatesForCourseUtilization(
        academicTermId,
        mergeOffering.id,
      );
      if (cancelled) return;
      setMergeCandidates(rows);
      setMergeLoading(false);
    };

    void loadCandidates();

    return () => {
      cancelled = true;
    };
  }, [mergeDialogOpen, mergeOffering, academicTermId]);

  useEffect(() => {
    if (!unmergeDialogOpen || !mergeOffering) return;
    let cancelled = false;

    const loadCandidates = async () => {
      const rows = await getUnmergeCandidatesForCourseUtilization(
        academicTermId,
        mergeOffering.id,
      );
      if (cancelled) return;
      setUnmergeCandidates(rows);
    };

    void loadCandidates();

    return () => {
      cancelled = true;
    };
  }, [unmergeDialogOpen, mergeOffering, academicTermId]);

  const candidateMap = useMemo(() => {
    return new Map(
      mergeCandidates.map((candidate) => [candidate.utilization_id, candidate]),
    );
  }, [mergeCandidates]);

  const selectedCandidateRows = useMemo(() => {
    return Array.from(selectedCandidates)
      .map((id) => candidateMap.get(id))
      .filter(
        (item): item is CourseUtilizationMergeCandidate => item !== undefined,
      );
  }, [selectedCandidates, candidateMap]);

  const totalStudents = useMemo(() => {
    const base = mergeOffering?.student_count ?? 0;
    return (
      base +
      selectedCandidateRows.reduce(
        (sum, row) => sum + (row.student_count ?? 0),
        0,
      )
    );
  }, [mergeOffering, selectedCandidateRows]);

  const selectedUnmergeRows = useMemo(() => {
    const map = new Map(
      unmergeCandidates.map((candidate) => [
        candidate.utilization_id,
        candidate,
      ]),
    );
    return Array.from(selectedUnmergeCandidates)
      .map((id) => map.get(id))
      .filter(
        (item): item is CourseUtilizationUnmergeCandidate => item !== undefined,
      );
  }, [unmergeCandidates, selectedUnmergeCandidates]);

  const unmergeCurrentClassTotal = useMemo(() => {
    const base = mergeOffering?.student_count ?? 0;
    const others = unmergeCandidates.reduce(
      (sum, row) => sum + (row.student_count ?? 0),
      0,
    );
    return base + others;
  }, [mergeOffering, unmergeCandidates]);

  const unmergeResultingTotal = useMemo(() => {
    const base = mergeOffering?.student_count ?? 0;
    if (unmergeMode === "self") return base;
    const selected = selectedUnmergeRows.reduce(
      (sum, row) => sum + (row.student_count ?? 0),
      0,
    );
    return Math.max(unmergeCurrentClassTotal - selected, 0);
  }, [mergeOffering, selectedUnmergeRows, unmergeMode, unmergeCurrentClassTotal]);

  const openMergeDialog = (offering: SchedulerCourseOfferingItem) => {
    setMergeOffering(offering);
    setSelectedCandidates(new Set());
    setMergeError("");
    setMergeDialogOpen(true);
  };

  const openUnmergeDialog = (offering: SchedulerCourseOfferingItem) => {
    setMergeOffering(offering);
    setMergeError("");
    setUnmergeMode("self");
    setSelectedUnmergeCandidates(new Set());
    setDetachMode("single_class");
    setUnmergeDialogOpen(true);
  };

  const closeMergeDialogs = () => {
    setMergeDialogOpen(false);
    setUnmergeDialogOpen(false);
    setSelectedCandidates(new Set());
    setMergeCandidates([]);
    setUnmergeCandidates([]);
    setMergeOffering(null);
    setMergeError("");
    setSelectedUnmergeCandidates(new Set());
    setDetachMode("single_class");
    setUnmergeMode("self");
  };

  const handleToggleCandidate = (id: string) => {
    setSelectedCandidates((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleUnmergeCandidate = (id: string) => {
    setSelectedUnmergeCandidates((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleJoinToThem = async () => {
    if (!mergeOffering) return;
    if (selectedCandidateRows.length === 0) {
      setMergeError("Select at least one candidate block.");
      return;
    }
    const targetClassId = selectedCandidateRows[0]?.class_id;
    const distinctTargets = new Set(
      selectedCandidateRows.map((row) => row.class_id),
    );
    if (!targetClassId || distinctTargets.size > 1) {
      setMergeError("Select candidates from a single class to join.");
      return;
    }

    setIsMerging(true);
    const result = await mergeCourseUtilizations({
      targetClassId,
      sourceUtilizationIds: [mergeOffering.id],
      academicTermId,
    });
    setIsMerging(false);

    if (result.error) {
      setMergeError(result.error);
      return;
    }
    closeMergeDialogs();
    onOfferingsChanged();
  };

  const handleGetThemJoin = async () => {
    if (!mergeOffering) return;
    if (selectedCandidateRows.length === 0) {
      setMergeError("Select at least one candidate block.");
      return;
    }
    if (!mergeOffering.class_id) {
      setMergeError("Current class not found.");
      return;
    }

    setIsMerging(true);
    const result = await mergeCourseUtilizations({
      targetClassId: mergeOffering.class_id,
      sourceUtilizationIds: selectedCandidateRows.map(
        (candidate) => candidate.utilization_id,
      ),
      academicTermId,
    });
    setIsMerging(false);

    if (result.error) {
      setMergeError(result.error);
      return;
    }
    closeMergeDialogs();
    onOfferingsChanged();
  };

  const handleUnmerge = async () => {
    if (!mergeOffering) return;
    setIsMerging(true);
    const result =
      unmergeMode === "self"
        ? await unmergeCourseUtilization({
            courseUtilizationId: mergeOffering.id,
            academicTermId,
          })
        : await detachOtherCourseUtilizations({
            courseUtilizationId: mergeOffering.id,
            otherUtilizationIds: Array.from(selectedUnmergeCandidates),
            academicTermId,
            mode: detachMode,
          });
    setIsMerging(false);
    if (result.error) {
      setMergeError(result.error);
      return;
    }
    closeMergeDialogs();
    onOfferingsChanged();
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Select Course Offering"
      description="Choose a course offering to schedule."
      contentClassName="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden"
    >
      <div className="flex h-full flex-col gap-3 overflow-hidden">
        <Input
          placeholder="Search course code"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="p-4 text-center text-sm text-foreground/70">
              No course offerings found.
            </p>
          )}

          {filtered.map((item) => (
            <ListItemSmall
              key={item.id}
              title={item.course_code.concat(" - ").concat(item.course_title)}
              subtitle={[
               
                `Faculty: ${item.faculty_name ?? "Unassigned"} | Unscheduled: Lec ${numberToHourDuration(item.unscheduled_lecture_hours,)} Lab ${numberToHourDuration(item.unscheduled_laboratory_hours)}`,
            
                
              ]}
              isSelected={item.id === selectedOfferingId}
              onClick={() => onSelectOffering(item.id)}
              icon={<BookOpen className="h-5 w-5 text-background/80" />}
              annotations={
                <div className="flex flex-col gap-1">
                  {item.merged_blocks.length > 0 ? (
                    <Button
                      size="sm"
                      title="Unmerge from other class"
                      variant="outline"
                      onClick={(event) => {
                        event.stopPropagation();
                        openUnmergeDialog(item);
                      }}
                    >
                      <Split className="h-6 w-6" />
                    
                    </Button>
                  ) : null}
                  {item.merge_candidate_count > 0 ? (
                    <Button
                      size="sm"
                      title="Merge with other class"
                      variant="outline"
                      onClick={(event) => {
                        event.stopPropagation();
                        openMergeDialog(item);
                      }}
                    >
                      <Merge className="h-6 w-6" />
                
                    </Button>
                  ) : null}
                </div>
              }
            />
          ))}
        </div>
      </div>

      <AppDialog
        open={mergeDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeMergeDialogs();
        }}
        title="Merge Blocks"
        description="Select blocks to merge with the current block."
        contentClassName="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden"
      >
        <div className="flex flex-col gap-3 overflow-hidden">
          {mergeOffering && (
            <div className="rounded-md border bg-background/60 p-3 text-xs">
              <p>
                Current block: {mergeOffering.block_code} • Students:{" "}
                {mergeOffering.student_count}
              </p>
            </div>
          )}

          {mergeLoading && (
            <p className="text-xs text-foreground/60">Loading candidates...</p>
          )}
          {!mergeLoading && mergeCandidates.length === 0 && (
            <p className="text-xs text-foreground/60">
              No merge candidates found.
            </p>
          )}

          <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
            {mergeCandidates.map((candidate) => {
              const isSelected = selectedCandidates.has(
                candidate.utilization_id,
              );
              return (
                <button
                  key={candidate.utilization_id}
                  type="button"
                  onClick={() => handleToggleCandidate(candidate.utilization_id)}
                  className={cn(
                    "flex items-center gap-2 rounded border px-2 py-1.5 text-left text-xs",
                    isSelected
                      ? "border-foreground bg-foreground/10 font-semibold"
                      : "border-foreground/10",
                  )}
                >
                  <div className="flex h-4 w-4 items-center justify-center rounded border">
                    {isSelected ? <GitMerge className="h-3 w-3" /> : null}
                  </div>
                  <div className="flex-1">
                    <p>
                      {candidate.block_code} • Students:{" "}
                      {candidate.student_count}
                    </p>
                    <p className="text-[10px] text-foreground/60">
                      Faculty: {candidate.faculty_name ?? "Unassigned"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div
            title={
              totalStudents > 50
                ? "Too many student in a class. Less than 50 is ideal"
                : ""
            }
            className="text-xs text-foreground/70 flex flex-row items-center"
          >
            Total students (selected blocks): {totalStudents}{" "}
            {totalStudents > 50 && <ArrowUp className="h-4 w-4 text-red-400" />}
          </div>

          {mergeError ? (
            <p className="text-xs text-red-700">{mergeError}</p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={closeMergeDialogs}
              disabled={isMerging}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleJoinToThem}
              disabled={isMerging || selectedCandidateRows.length === 0}
            >
              Join to Them
            </Button>
            <Button
              size="sm"
              onClick={handleGetThemJoin}
              disabled={isMerging || selectedCandidateRows.length === 0}
            >
              Get Them Join
            </Button>
          </div>
        </div>
      </AppDialog>

      <AppDialog
        open={unmergeDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeMergeDialogs();
        }}
        title="Unmerge Block"
        description="Detach blocks from the merged class."
        contentClassName="flex max-h-[75vh] w-full max-w-md flex-col overflow-hidden"
      >
        <div className="flex flex-col gap-3">
          {mergeOffering && (
            <div className="rounded-md border bg-background/60 p-3 text-xs">
              <p>
                Block: {mergeOffering.block_code} • Students:{" "}
                {mergeOffering.student_count}
              </p>
            </div>
          )}
          <div className="flex gap-2 text-xs">
            <Button
              size="xs"
              variant={unmergeMode === "self" ? "default" : "outline"}
              onClick={() => setUnmergeMode("self")}
            >
              Detach This Block
            </Button>
            <Button
              size="xs"
              variant={unmergeMode === "other" ? "default" : "outline"}
              onClick={() => setUnmergeMode("other")}
              disabled={unmergeCandidates.length === 0}
            >
              Detach Other
            </Button>
          </div>

          {unmergeMode === "other" ? (
            <div className="flex flex-col gap-2">
              {unmergeCandidates.length === 0 ? (
                <p className="text-xs text-foreground/60">
                  No other blocks found to detach.
                </p>
              ) : (
                <>
                  <div className="flex max-h-48 flex-col gap-2 overflow-y-auto">
                    {unmergeCandidates.map((candidate) => {
                      const isSelected = selectedUnmergeCandidates.has(
                        candidate.utilization_id,
                      );
                      return (
                        <button
                          key={candidate.utilization_id}
                          type="button"
                          onClick={() =>
                            handleToggleUnmergeCandidate(
                              candidate.utilization_id,
                            )
                          }
                          className={cn(
                            "flex items-center gap-2 rounded border px-2 py-1.5 text-left text-xs",
                            isSelected
                              ? "border-foreground bg-foreground/10 font-semibold"
                              : "border-foreground/10",
                          )}
                        >
                          <div className="flex h-4 w-4 items-center justify-center rounded border">
                            {isSelected ? (
                              <Link2Off className="h-3 w-3" />
                            ) : null}
                          </div>
                          <div className="flex-1">
                            <p>
                              {candidate.block_code} â€¢ Students:{" "}
                              {candidate.student_count}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-col gap-1 text-xs">
                    <p className="text-foreground/60">Detach mode</p>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="detach-mode"
                        checked={detachMode === "single_class"}
                        onChange={() => setDetachMode("single_class")}
                      />
                      Single new class for all selected
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="detach-mode"
                        checked={detachMode === "per_block"}
                        onChange={() => setDetachMode("per_block")}
                      />
                      New class per block
                    </label>
                  </div>

                </>
              )}
            </div>
          ) : null}

          <div
            title={
              unmergeResultingTotal > 50
                ? "Too many student in a class. Less than 50 is ideal"
                : ""
            }
            className="flex flex-row items-center text-xs text-foreground/70"
          >
            Resulting total (current class): {unmergeResultingTotal}{" "}
            {unmergeResultingTotal > 50 && (
              <ArrowUp className="h-4 w-4 text-red-400" />
            )}
          </div>

          {mergeError ? (
            <p className="text-xs text-red-700">{mergeError}</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={closeMergeDialogs}
              disabled={isMerging}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleUnmerge}
              disabled={
                isMerging ||
                (unmergeMode === "other" &&
                  (selectedUnmergeCandidates.size === 0 ||
                    unmergeCandidates.length === 0))
              }
            >
              {isMerging ? "Saving..." : "Confirm"}
            </Button>
          </div>
        </div>
      </AppDialog>
    </AppDialog>
  );
};

export default SelectCourseOfferingDialog;
