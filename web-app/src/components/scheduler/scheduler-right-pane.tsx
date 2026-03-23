"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { SessionType } from "@/models";
import { numberToHourDuration } from "@/utils/time";
import { cn } from "@/utils/style";
import FacultyPickerDialog from "@/components/shared/faculty-picker-dialog";
import RoomPickerDialog from "@/components/shared/room-picker-dialog";
import {
  deleteClassSession,
  getRoomsForClass,
  getSessionSummariesByClass,
  replaceClassFaculty,
  updateSessionRoom,
  type SessionRoomOption,
  type SessionSummary,
} from "@/lib/schedule/session-actions";
import { dayLabel, toDisplayTime, toMinutes } from "@/lib/schedule/utils";
import { useScheduler } from "./scheduler-context";

const SchedulerRightPane = () => {
  const {
    selectedOffering,
    sessionType,
    setSessionType,
    selectedSessionId,
    selectedClassId,
    classRefreshKey,
    overlappingSessions,
    selectSession,
    clearSelection,
    facultyOptions,
    refreshSessions,
    errorMessage,
  } = useScheduler();
  const [showRoomEditDialog, setShowRoomEditDialog] = useState(false);
  const [showFacultyReplaceDialog, setShowFacultyReplaceDialog] =
    useState(false);
  const [roomEditSessionId, setRoomEditSessionId] = useState<string | null>(
    null,
  );
  const [roomOptions, setRoomOptions] = useState<SessionRoomOption[]>([]);
  const [actionError, setActionError] = useState("");
  const [isMutating, startMutation] = useTransition();
  const [classSessions, setClassSessions] = useState<SessionSummary[]>([]);
  const [classSessionsLoading, setClassSessionsLoading] = useState(false);
  const [classSessionsClassId, setClassSessionsClassId] = useState<
    string | null
  >(null);
  const selectedClassIdRef = useRef<string | null>(null);

  const selectedSession = useMemo(() => {
    if (!selectedSessionId) return null;
    const fromClass = classSessions.find(
      (session) => session.session_id === selectedSessionId,
    );
    if (fromClass) return fromClass;
    return (
      overlappingSessions.find(
        (session) => session.session_id === selectedSessionId,
      ) ?? null
    );
  }, [classSessions, overlappingSessions, selectedSessionId]);

  useEffect(() => {
    setActionError("");
  }, [selectedSession?.session_id]);

  useEffect(() => {
    if (!showRoomEditDialog || !selectedClassId) return;
    let cancelled = false;

    const loadRooms = async () => {
      const rows = await getRoomsForClass(selectedClassId);
      if (cancelled) return;
      setRoomOptions(rows);
    };

    void loadRooms();
    return () => {
      cancelled = true;
    };
  }, [showRoomEditDialog, selectedClassId]);

  useEffect(() => {
    if (!selectedClassId) {
      setClassSessions([]);
      setClassSessionsClassId(null);
      selectedClassIdRef.current = null;
      return;
    }

    const previousClassId = selectedClassIdRef.current;
    if (previousClassId !== selectedClassId) {
      setClassSessions([]);
      setClassSessionsClassId(null);
      selectedClassIdRef.current = selectedClassId;
    }
    let cancelled = false;

    const loadClassSessions = async () => {
      setClassSessionsLoading(true);
      const rows = await getSessionSummariesByClass(selectedClassId);
      if (cancelled) return;
      setClassSessions(rows);
      setClassSessionsClassId(selectedClassId);
      setClassSessionsLoading(false);
    };

    void loadClassSessions();
    return () => {
      cancelled = true;
    };
  }, [selectedClassId, classRefreshKey]);

  const handleUpdateRoom = (roomId: string | null) => {
    if (!roomEditSessionId) return;
    setActionError("");
    startMutation(async () => {
      const result = await updateSessionRoom(roomEditSessionId, roomId);
      if (result.error) {
        setActionError(result.error);
        return;
      }
      setShowRoomEditDialog(false);
      setRoomEditSessionId(null);
      refreshSessions();
    });
  };

  const handleReplaceFaculty = (facultyId: string) => {
    if (!selectedSession) return;
    setActionError("");
    startMutation(async () => {
      const result = await replaceClassFaculty(
        selectedSession.class_id,
        facultyId,
      );
      if (result.error) {
        setActionError(result.error);
        return;
      }
      setShowFacultyReplaceDialog(false);
      refreshSessions();
    });
  };

  const handleDeleteSession = (sessionId: string) => {
    if (!sessionId) return;
    setActionError("");
    startMutation(async () => {
      const result = await deleteClassSession(sessionId);
      if (result.error) {
        setActionError(result.error);
        return;
      }
      let remaining: SessionSummary[] = [];
      setClassSessions((prev) => {
        remaining = prev.filter((session) => session.session_id !== sessionId);
        return remaining;
      });
      if (selectedSessionId === sessionId) {
        if (remaining.length > 0) {
          selectSession(remaining[0].session_id, remaining[0].class_id);
        } else {
          clearSelection();
        }
      }
      refreshSessions();
    });
  };

  const offeringDetails = useMemo(() => {
    if (!selectedOffering) return null;
    const expectedHours =
      sessionType === "Lecture"
        ? selectedOffering.unscheduled_lecture_hours
        : selectedOffering.unscheduled_laboratory_hours;
    return {
      course: `${selectedOffering.course_code} - ${selectedOffering.course_title}`,
      unscheduled: `Lec ${numberToHourDuration(selectedOffering.unscheduled_lecture_hours)} | Lab ${numberToHourDuration(selectedOffering.unscheduled_laboratory_hours)}`,
      remaining: `Remaining ${sessionType}: ${numberToHourDuration(expectedHours)}`,
      faculty: selectedOffering.faculty_name ?? "Unassigned",
      merged:
        selectedOffering.merged_blocks.length > 0
          ? selectedOffering.merged_blocks.map((block) => block.code).join(", ")
          : "None",
    };
  }, [selectedOffering, sessionType]);

  const sortedClassSessions = useMemo(() => {
    if (!classSessions.length) return [];
    const dayOrder: Record<string, number> = {
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
      Sunday: 7,
    };
    return [...classSessions].sort((a, b) => {
      const dayDiff = (dayOrder[a.day] ?? 99) - (dayOrder[b.day] ?? 99);
      if (dayDiff !== 0) return dayDiff;
      return toMinutes(a.start_time) - toMinutes(b.start_time);
    });
  }, [classSessions]);

  const classCampusId = useMemo(() => {
    const source = classSessions.length
      ? classSessions
      : selectedSession
        ? [selectedSession]
        : [];
    const ids = new Set(
      source
        .map((session) => session.campus_id)
        .filter((id): id is string => Boolean(id)),
    );
    return ids.size === 1 ? Array.from(ids)[0] : null;
  }, [classSessions, selectedSession]);

  const classCollegeId = useMemo(() => {
    const source = classSessions.length
      ? classSessions
      : selectedSession
        ? [selectedSession]
        : [];
    const ids = new Set(
      source
        .map((session) => session.college_id)
        .filter((id): id is string => Boolean(id)),
    );
    return ids.size === 1 ? Array.from(ids)[0] : null;
  }, [classSessions, selectedSession]);

  const roomPickerItems = useMemo(
    () =>
      roomOptions.map((room) => ({
        id: room.id,
        code: room.code,
        name: room.name,
        capacity: room.capacity ?? null,
        campus_id: room.campus_id ?? "",
        campus: {
          id: room.campus_id ?? "",
          code: room.campus_code ?? "",
          name: room.campus_name ?? "Unknown Campus",
          address: null,
        },
      })),
    [roomOptions],
  );

  const roomPickerSelectedId = useMemo(() => {
    if (!roomEditSessionId) return null;
    const session = classSessions.find(
      (item) => item.session_id === roomEditSessionId,
    );
    return session?.room_id ?? null;
  }, [classSessions, roomEditSessionId]);

  useEffect(() => {
    if (!selectedClassId) return;
    if (classSessionsLoading) return;
    if (classSessionsClassId !== selectedClassId) return;
    if (classSessions.length === 0) {
      if (overlappingSessions.length === 0) {
        clearSelection();
      }
      return;
    }
    const exists = classSessions.some(
      (session) => session.session_id === selectedSessionId,
    );
    if (!exists) {
      selectSession(classSessions[0].session_id, classSessions[0].class_id);
    }
  }, [
    classSessions,
    classSessionsLoading,
    classSessionsClassId,
    selectedClassId,
    selectedSessionId,
    selectSession,
    clearSelection,
    overlappingSessions,
  ]);

  return (
    <div className="flex w-64 flex-col gap-3 border-l bg-background/80 text-sm">
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 space-y-2 p-4 overflow-y-auto">
          {selectedOffering?.course_code ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">
                  Scheduling {selectedOffering.class_code} (
                  {selectedOffering.course_code})
                </p>
              </div>
              {selectedOffering && offeringDetails && (
                <div className="space-y-1 text-xs text-foreground/70">
                  <div>
                    <p>Course</p>
                    <span className="text-sm text-foreground ">
                      {offeringDetails.course}
                    </span>
                  </div>

                  <div>
                    <p>Unscheduled</p>
                    <span className="text-sm text-foreground ">
                      {offeringDetails.unscheduled}
                    </span>
                  </div>

                  <div>
                      <p>Faculty</p>
                      <span className="text-sm text-foreground ">
                       {offeringDetails.faculty}
                      </span>
                    </div>

                  <div>
                      <p>Class Merge</p>
                      <span className="text-sm text-foreground ">
                        {offeringDetails.merged}
                      </span>
                    </div>
                 
                 
               
                </div>
              )}
              <p className="text-xs text-foreground/60">Session Type</p>
              <Select
                value={sessionType}
                onChange={(event) =>
                  setSessionType(event.target.value as SessionType)
                }
              >
                <option value="Lecture">
                  Lecture (
                  {numberToHourDuration(
                    selectedOffering.unscheduled_lecture_hours,
                  )}{" "}
                  Left)
                </option>
                <option value="Laboratory">
                  Laboratory (
                  {numberToHourDuration(
                    selectedOffering.unscheduled_laboratory_hours,
                  )}{" "}
                  Left)
                </option>
              </Select>
              {errorMessage ? (
                <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                  {errorMessage}
                </div>
              ) : null}
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-base text-foreground p-4 border border-dashed ">
                Select block and course on the Block column
              </p>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-4 border-t">
          {selectedClassId || overlappingSessions.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Selected Class</p>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={clearSelection}
                  title="Clear selection"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              {overlappingSessions.length > 1 && (
                <div className="flex flex-wrap gap-1">
                  {overlappingSessions.map((session) => (
                    <button
                      key={session.session_id}
                      type="button"
                      onClick={() =>
                        selectSession(session.session_id, session.class_id)
                      }
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px]",
                        selectedSession?.session_id === session.session_id
                          ? "border-foreground bg-foreground/10 font-semibold"
                          : "border-foreground/10",
                      )}
                    >
                      {dayLabel(session.day)}{" "}
                      {toDisplayTime(session.start_time)}-
                      {toDisplayTime(session.end_time)}
                    </button>
                  ))}
                </div>
              )}

              {selectedSession ? (
                <div className="flex flex-col gap-x-3 gap-y-1 text-xs text-foreground/70">
                  <div className="grid grid-cols-2">
                    <div>
                      <p>Class</p>
                      <span className="text-sm text-foreground ">
                        {selectedSession.class_code}
                      </span>
                    </div>

                    {selectedSession.course_code ? (
                      <div>
                        <p>Course</p>
                        <span className="text-sm text-foreground ">
                          {selectedSession.course_code}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <p>Instructor</p>
                    <div className="text-sm text-foreground flex items-center gap-1">
                      <p className="flex-1 truncate">
                        {selectedSession.faculty_name ?? "Unassigned"}
                      </p>

                      <Button
                        size="xs"
                        variant="outline"
                        disabled={!selectedSession || isMutating}
                        onClick={() => setShowFacultyReplaceDialog(true)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p>Block(s)</p>
                    <span className="text-sm text-foreground ">
                      {selectedSession.block_codes.join(", ")}
                    </span>
                  </div>

                  <div>
                    <p>Schedule</p>
                    {classSessionsLoading && (
                      <p className="text-xs text-foreground/60">
                        Loading schedule...
                      </p>
                    )}
                    {!classSessionsLoading &&
                      sortedClassSessions.length === 0 && (
                        <p className="text-xs text-foreground/60">
                          No sessions yet.
                        </p>
                      )}
                    {!classSessionsLoading &&
                      sortedClassSessions.length > 0 && (
                        <div className="flex flex-col gap-1 mt-1">
                          {sortedClassSessions.map((session) => (
                            <div
                              key={session.session_id}
                              onClick={() =>
                                selectSession(
                                  session.session_id,
                                  session.class_id,
                                )
                              }
                              className={cn(
                                "flex-col items-center gap-2 rounded border px-2 py-1 text-xs",
                                selectedSession.session_id ===
                                  session.session_id
                                  ? "border-foreground/40"
                                  : "border-foreground/10",
                              )}
                            >
                              <div className="flex justify-between">
                                <div className="flex flex-col">
                                  <span>
                                    {dayLabel(session.day)}{" "}
                                    {toDisplayTime(session.start_time)}-
                                    {toDisplayTime(session.end_time)}
                                  </span>
                                  <span>
                                    {numberToHourDuration(
                                      (toMinutes(session.end_time) -
                                        toMinutes(session.start_time)) /
                                        60,
                                    )}{" "}
                                    {session.type}
                                  </span>
                                </div>
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => {
                                    handleDeleteSession(session.session_id);
                                  }}
                                  title="Delete session"
                                  disabled={isMutating}
                                >
                                  <Trash2 className="h-3 w-3 text-red-400" />
                                </Button>
                              </div>
                              <div className="flex items-center gap-1 justify-between">
                                <span className="truncate">
                                  {session.room_code
                                    ? `${session.room_code}${
                                        session.room_name
                                          ? ` (${session.room_name})`
                                          : ""
                                      }`
                                    : "Online"}
                                </span>
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => {
                                    setRoomEditSessionId(session.session_id);
                                    setShowRoomEditDialog(true);
                                  }}
                                  title="Edit room"
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-foreground/60">
                  Select a session from the list.
                </p>
              )}

              {actionError ? (
                <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                  {actionError}
                </div>
              ) : null}
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-base text-foreground p-4 border border-dashed ">
                Click any class on the grid
              </p>
            </div>
          )}
        </div>
      </div>

      <RoomPickerDialog
        open={showRoomEditDialog}
        onOpenChange={(open) => {
          setShowRoomEditDialog(open);
          if (!open) {
            setActionError("");
            setRoomEditSessionId(null);
          }
        }}
        title="Change Room"
        description="Assign a different room or mark this session as online."
        items={roomPickerItems}
        selectedId={roomPickerSelectedId}
        onSelect={(roomId) => handleUpdateRoom(roomId)}
        allowOnline
        onlineLabel="Online / No Room"
        defaultCampusId={classCampusId}
      />

      <FacultyPickerDialog
        open={showFacultyReplaceDialog}
        onOpenChange={(open) => {
          setShowFacultyReplaceDialog(open);
          if (!open) setActionError("");
        }}
        title="Replace Faculty"
        description="Choose a new faculty for all sessions in this class."
        items={facultyOptions}
        selectedId={selectedSession?.faculty_id ?? null}
        onSelect={(facultyId) => handleReplaceFaculty(facultyId)}
        defaultCampusId={classCampusId}
        defaultCollegeId={classCollegeId}
      />
    </div>
  );
};

export default SchedulerRightPane;
