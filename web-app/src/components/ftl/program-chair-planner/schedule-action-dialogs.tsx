import { useMemo } from "react";
import { AlertCircle, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppDialog } from "@/components/ui/app-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FTLClass, FTLRoom, SessionConflict } from "@/lib/ftl/types";
import { DAY_OPTIONS, typeLabelMap } from "./constants";
import { dayLabel, toDisplayTime } from "./utils";
import { ConfirmDialogState, SessionDraft } from "./types";

type ScheduleActionDialogsProps = {
  isSessionDialogOpen: boolean;
  setIsSessionDialogOpen: (open: boolean) => void;
  sessionDraft: SessionDraft | null;
  setSessionDraft: (draft: SessionDraft) => void;
  rooms: FTLRoom[];
  onSaveSession: () => void;

  isMergeDialogOpen: boolean;
  setIsMergeDialogOpen: (open: boolean) => void;
  mergeSourceClass: FTLClass | null;
  mergeSourceClassId: string | null;
  mergeTargetClassId: string | null;
  setMergeTargetClassId: (value: string | null) => void;
  mergeTargetOptions: FTLClass[];
  onCancelMerge: () => void;
  onMergeClasses: () => void;

  isUnmergeDialogOpen: boolean;
  setIsUnmergeDialogOpen: (open: boolean) => void;
  unmergeSourceClass: FTLClass | null;
  unmergeSourceClassId: string | null;
  unmergeBlockId: string | null;
  setUnmergeBlockId: (value: string | null) => void;
  onCancelUnmerge: () => void;
  onUnmergeClass: () => void;

  isConflictDialogOpen: boolean;
  setIsConflictDialogOpen: (open: boolean) => void;
  conflicts: SessionConflict[];
  onSaveAnyway: () => void;

  confirmDialogState: ConfirmDialogState | null;
  setConfirmDialogState: (state: ConfirmDialogState | null) => void;

  isSaving: boolean;
};

export const ScheduleActionDialogs = ({
  isSessionDialogOpen,
  setIsSessionDialogOpen,
  sessionDraft,
  setSessionDraft,
  rooms,
  onSaveSession,
  isMergeDialogOpen,
  setIsMergeDialogOpen,
  mergeSourceClass,
  mergeSourceClassId,
  mergeTargetClassId,
  setMergeTargetClassId,
  mergeTargetOptions,
  onCancelMerge,
  onMergeClasses,
  isUnmergeDialogOpen,
  setIsUnmergeDialogOpen,
  unmergeSourceClass,
  unmergeSourceClassId,
  unmergeBlockId,
  setUnmergeBlockId,
  onCancelUnmerge,
  onUnmergeClass,
  isConflictDialogOpen,
  setIsConflictDialogOpen,
  conflicts,
  onSaveAnyway,
  confirmDialogState,
  setConfirmDialogState,
  isSaving,
}: ScheduleActionDialogsProps) => {
  const groupedConflicts = useMemo(
    () => ({
      FACULTY: conflicts.filter((item) => item.type === "FACULTY"),
      ROOM: conflicts.filter((item) => item.type === "ROOM"),
      BLOCK: conflicts.filter((item) => item.type === "BLOCK"),
    }),
    [conflicts],
  );

  const conflictBadgeClass = (type: "FACULTY" | "ROOM" | "BLOCK") => {
    if (type === "FACULTY") return "border-red-300 bg-red-50 text-red-700";
    if (type === "ROOM") return "border-amber-300 bg-amber-50 text-amber-700";
    return "border-orange-300 bg-orange-50 text-orange-700";
  };

  const severityBadgeClass = (severity: SessionConflict["severity"]) => {
    if (severity === "HIGH") return "border-red-300 bg-red-50 text-red-700";
    return "border-amber-300 bg-amber-50 text-amber-700";
  };

  return (
    <>
      <AppDialog
        open={isSessionDialogOpen}
        onOpenChange={setIsSessionDialogOpen}
        title={sessionDraft?.session_id ? "Edit Session" : "Add Session"}
        description="Conflict check runs before every session save"
      >
        {sessionDraft ? (
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs text-foreground/70">Day</p>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={sessionDraft.day}
                  onChange={(event) =>
                    setSessionDraft({
                      ...sessionDraft,
                      day: event.target.value as SessionDraft["day"],
                    })
                  }
                >
                  {DAY_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-foreground/70">Room</p>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={sessionDraft.room_id}
                  onChange={(event) =>
                    setSessionDraft({
                      ...sessionDraft,
                      room_id: event.target.value,
                    })
                  }
                >
                  <option value="">Select room</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.code} {room.name ? `- ${room.name}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs text-foreground/70">Start Time</p>
                <Input
                  type="time"
                  value={sessionDraft.start_time}
                  onChange={(event) =>
                    setSessionDraft({
                      ...sessionDraft,
                      start_time: event.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-foreground/70">End Time</p>
                <Input
                  type="time"
                  value={sessionDraft.end_time}
                  onChange={(event) =>
                    setSessionDraft({
                      ...sessionDraft,
                      end_time: event.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsSessionDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={onSaveSession} disabled={isSaving}>
                Save Session
              </Button>
            </div>
          </div>
        ) : null}
      </AppDialog>

      <AppDialog
        open={isMergeDialogOpen}
        onOpenChange={setIsMergeDialogOpen}
        title="Merge Classes"
        description="Choose the class row to merge into. Only same course code classes are eligible."
        contentClassName="w-full max-w-2xl"
      >
        <div className="space-y-3">
          <div className="rounded-md border bg-muted/30 p-3 text-sm text-foreground/80">
            <p>
              Source: {mergeSourceClass?.course_code ?? "N/A"} (
              {mergeSourceClass?.year_section ?? "No Block"})
            </p>
            <p className="text-xs text-foreground/70">
              Source blocks are added to target for scheduling. Step 2 rows stay
              separate, and existing source sessions are removed.
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-foreground/70">Merge into</p>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={mergeTargetClassId ?? ""}
              onChange={(event) => setMergeTargetClassId(event.target.value)}
            >
              {mergeTargetOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.course_code} ({item.year_section ?? "No Block"})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onCancelMerge}>
              Cancel
            </Button>
            <Button
              onClick={onMergeClasses}
              disabled={isSaving || !mergeSourceClassId || !mergeTargetClassId}
            >
              Merge Selected
            </Button>
          </div>
        </div>
      </AppDialog>

      <AppDialog
        open={isUnmergeDialogOpen}
        onOpenChange={setIsUnmergeDialogOpen}
        title="Unmerge Class"
        description="Select the block to split into a new class row."
      >
        <div className="space-y-3">
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            <p className="font-medium">Session impact warning</p>
            <p>
              Unmerging will remove all existing sessions from this merged class
              because session ownership per block is ambiguous.
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-foreground/70">Block to unmerge</p>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={unmergeBlockId ?? ""}
              onChange={(event) => setUnmergeBlockId(event.target.value)}
            >
              {(unmergeSourceClass?.blocks ?? []).map((block) => (
                <option key={block.id} value={block.id}>
                  {block.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onCancelUnmerge}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onUnmergeClass}
              disabled={isSaving || !unmergeSourceClassId || !unmergeBlockId}
            >
              Unmerge and Remove Sessions
            </Button>
          </div>
        </div>
      </AppDialog>

      <AppDialog
        open={isConflictDialogOpen}
        onOpenChange={setIsConflictDialogOpen}
        title="Conflict Review"
        description="Conflicts were found. You can return to edit or save anyway."
        contentClassName="flex flex-col max-h-11/12 w-full max-w-7xl overflow-hidden"
      >
        <div className="flex-1 overflow-y-hidden flex flex-col gap-4 ">
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            <p className="font-medium flex items-center gap-2">
              <TriangleAlert className="h-4 w-4" />
              {conflicts.length} conflict(s) detected
            </p>
            <p>Conflict prompts appear for every session create/edit.</p>
          </div>

          <div className="flex flex-col md:grid md:grid-cols-3 gap-4 flex-1 overflow-y-auto  ">
            {(["FACULTY", "ROOM", "BLOCK"] as const)
              .filter((type) => groupedConflicts[type].length > 0)
              .map((type) => (
                <div key={type} className="space-y-2">
                  <div
                    className={`flex items-center gap-2 border p-3 rounded-md ${conflictBadgeClass(type)}`}
                  >
                    <span className={`text-sm font-medium`}>
                      {typeLabelMap[type]}
                    </span>
                    <span className="text-xs text-foreground/70">
                      {groupedConflicts[type].length} issue(s)
                    </span>
                  </div>

                  {groupedConflicts[type].map((conflict, index) => (
                    <div
                      key={`${conflict.conflicting_session_id}-${type}-${index}`}
                      className="rounded-md border p-3"
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${severityBadgeClass(
                            conflict.severity,
                          )}`}
                        >
                          {conflict.severity === "HIGH" ? (
                            <TriangleAlert className="h-3.5 w-3.5" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5" />
                          )}
                          {conflict.severity}
                        </span>
                        <span className="rounded-full border px-2 py-0.5 text-xs font-medium">
                          State {conflict.conflicting_schedule_state}
                        </span>
                      </div>

                      <p className="text-sm font-medium">
                        {conflict.conflicting_course_code} -{" "}
                        {conflict.conflicting_course_title}
                      </p>
                      <p className="text-xs text-foreground/70">
                        Faculty: {conflict.conflicting_faculty_name} • Room:{" "}
                        {conflict.conflicting_room_code ?? "TBA"}
                      </p>
                      <p className="text-xs text-foreground/70">
                        {dayLabel(conflict.day)} •{" "}
                        {toDisplayTime(conflict.start_time)}-
                        {toDisplayTime(conflict.end_time)}
                        {conflict.conflicting_block
                          ? ` • ${conflict.conflicting_block}`
                          : ""}
                      </p>
                    </div>
                  ))}
                </div>
              ))}
          </div>

          <div className="flex justify-end gap-2  min-h-0">
            <Button
              variant="outline"
              onClick={() => setIsConflictDialogOpen(false)}
            >
              Back to Edit
            </Button>
            <Button onClick={onSaveAnyway} disabled={isSaving}>
              Save Anyway
            </Button>
          </div>
        </div>
      </AppDialog>

      <ConfirmDialog
        open={confirmDialogState !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDialogState(null);
          }
        }}
        title={confirmDialogState?.title ?? "Confirm action"}
        description={confirmDialogState?.description}
        confirmLabel={confirmDialogState?.confirmLabel}
        cancelLabel={confirmDialogState?.cancelLabel}
        confirmVariant={confirmDialogState?.confirmVariant}
        onConfirm={async () => {
          if (!confirmDialogState) return;
          await confirmDialogState.onConfirm();
        }}
        isLoading={isSaving}
      />
    </>
  );
};
