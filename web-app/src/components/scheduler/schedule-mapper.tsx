"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Blocks, BookOpen, ChevronDown, DoorOpen, User, X } from "lucide-react";
import type { SessionDay, SessionType } from "@/models";
import { dayLabel, toDisplayTime, toMinutes } from "@/lib/schedule/utils";
import {
  getSchedulerMapperMatrices,
  getSchedulerMapperMatrixByOnlineBlock,
  type SchedulerMatrixSession,
} from "@/lib/schedule/mapper";
import {
  getBlockCourseOfferingsForScheduler,
  type SchedulerCourseOfferingItem,
} from "@/lib/schedule/course-offerings";
import {
  createSessionFromOffering,
  getSessionSummaries,
  type SessionSummary,
} from "@/lib/schedule/session-actions";
import MatrixRenderer from "./matrix-renderer";
import { getSelectedContextsFromSearchParams } from "./utils";
import BlockPickerDialog from "@/components/shared/block-picker-dialog";
import FacultyPickerDialog from "@/components/shared/faculty-picker-dialog";
import RoomPickerDialog from "@/components/shared/room-picker-dialog";
import SelectCourseOfferingDialog from "@/components/shared/select-course-offering-dialog";
import SchedulerRightPane from "./scheduler-right-pane";
import { SchedulerProvider } from "./scheduler-context";
import type {
  CourseLoadingBlockListItem,
  FacultyListItem,
} from "@/lib/course-loading/types";
import type { ExtendedRoom } from "@/models";
import { Button } from "../ui/button";
import ConfirmScheduleDialog from "@/components/scheduler/dialogs/confirm-schedule-dialog";
import { cn } from "@/utils/style";
import { title } from "process";

type ScheduleMapperProps = {
  academic_term_id: string;
};

type MatrixMap = Record<SessionDay, Record<number, SchedulerMatrixSession[]>>;

const DAYS: SessionDay[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const START_MINUTE = 7 * 60;
const END_MINUTE = 22 * 60;
const SLOT_MINUTES = 30;

const toTimeValue = (minutes: number): string => {
  const hour = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const minute = (minutes % 60).toString().padStart(2, "0");
  return `${hour}:${minute}:00`;
};

const createEmptyMatrix = (): MatrixMap => {
  return DAYS.reduce((acc, day) => {
    acc[day] = {};
    return acc;
  }, {} as MatrixMap);
};

const buildMatrix = (
  sessions: SchedulerMatrixSession[],
  slotStarts: number[],
): MatrixMap => {
  const matrix = createEmptyMatrix();

  sessions.forEach((session) => {
    const day = session.day;
    if (!matrix[day]) return;

    const startMinute = toMinutes(session.start_time);
    const endMinute = toMinutes(session.end_time);
    if (!Number.isFinite(startMinute) || !Number.isFinite(endMinute)) return;

    slotStarts.forEach((slotStart, index) => {
      const slotEnd = slotStart + SLOT_MINUTES;
      const overlaps = startMinute < slotEnd && slotStart < endMinute;
      if (!overlaps) return;

      const daySlots = matrix[day];
      if (!daySlots[index]) daySlots[index] = [];
      daySlots[index].push(session);
    });
  });

  return matrix;
};

const ScheduleMapper = ({ academic_term_id }: ScheduleMapperProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedContexts = getSelectedContextsFromSearchParams(searchParams);
  const selectedFacultyId = selectedContexts.facultyId ?? null;
  const selectedBlockId = selectedContexts.blockId ?? null;
  const selectedRoomId = selectedContexts.roomId ?? null;
  const selectedCourseUtilizationId =
    selectedContexts.courseUtilizationId ?? null;

  const [blockSessions, setBlockSessions] = useState<SchedulerMatrixSession[]>(
    [],
  );
  const [facultySessions, setFacultySessions] = useState<
    SchedulerMatrixSession[]
  >([]);
  const [roomSessions, setRoomSessions] = useState<SchedulerMatrixSession[]>(
    [],
  );
  const [blockLoading, setBlockLoading] = useState(false);
  const [facultyLoading, setFacultyLoading] = useState(false);
  const [roomLoading, setRoomLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [faculty, setFaculty] = useState<FacultyListItem[]>([]);
  const [rooms, setRooms] = useState<ExtendedRoom[]>([]);
  const [blocks, setBlocks] = useState<CourseLoadingBlockListItem[]>([]);
  const [offerings, setOfferings] = useState<SchedulerCourseOfferingItem[]>([]);
  const [offeringsLoading, setOfferingsLoading] = useState(false);
  const [offeringsLoadedForBlockId, setOfferingsLoadedForBlockId] = useState<
    string | null
  >(null);
  const [contextNotice, setContextNotice] = useState("");
  const [showFacultyDialog, setShowFacultyDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [showOfferingDialog, setShowOfferingDialog] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dragError, setDragError] = useState("");
  const [selectedCell, setSelectedCell] = useState<{
    source: "Block" | "Faculty" | "Room";
    sessions: SchedulerMatrixSession[];
  } | null>(null);
  const [overlappingSessions, setOverlappingSessions] = useState<
    SessionSummary[]
  >([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{
    day: SessionDay;
    startIndex: number;
    endIndex: number;
  } | null>(null);
  const [pendingRange, setPendingRange] = useState<{
    day: SessionDay;
    startIndex: number;
    endIndex: number;
  } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sessionType, setSessionType] = useState<SessionType>("Lecture");
  const [isSaving, setIsSaving] = useState(false);

  const draggingRef = useRef<typeof dragging>(null);
  const matrixRequestIdRef = useRef(0);

  useEffect(() => {
    draggingRef.current = dragging;
  }, [dragging]);

  const setQueryParams = (mutate: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(searchParams.toString());
    mutate(next);
    const queryString = next.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const setContextParams = (mutate: (next: URLSearchParams) => void) => {
    setQueryParams(mutate);
  };

  const setContextParam = (
    key: "facultyId" | "blockId" | "roomId" | "courseUtilizationId",
    value: string,
  ) => {
    setQueryParams((next) => {
      next.set(key, value);
    });
  };

  const clearContextParam = (
    key: "facultyId" | "blockId" | "roomId" | "courseUtilizationId",
  ) => {
    setQueryParams((next) => {
      next.delete(key);
    });
  };

  const selectSession = useCallback(
    (sessionId: string | null, classId?: string | null) => {
      setActiveSessionId(sessionId ?? null);
      if (classId) {
        setSelectedClassId(classId);
      }
    },
    [],
  );

  const clearSelection = useCallback(() => {
    setSelectedCell(null);
    setSelectedClassId(null);
    setActiveSessionId(null);
  }, []);

  const refreshSessions = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const selectedFaculty =
    faculty.find((item) => item.id === selectedFacultyId) ?? null;
  const selectedBlock =
    blocks.find((item) => item.id === selectedBlockId) ?? null;
  const selectedRoom = rooms.find((item) => item.id === selectedRoomId) ?? null;
  const selectedOffering =
    offerings.find((item) => item.id === selectedCourseUtilizationId) ?? null;

  useEffect(() => {
    setContextNotice("");
  }, [selectedBlockId]);

  useEffect(() => {
    if (selectedOffering) {
      setContextNotice("");
    }
  }, [selectedOffering?.id]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLookupLoading(true);
      try {
        const [courseLoadingModule, roomModule] = await Promise.all([
          import("@/lib/course-loading/queries"),
          import("@/lib/admin/rooms"),
        ]);

        const [facultyRows, roomRows, blockRows] = await Promise.all([
          courseLoadingModule.getFacultyListByTerm(academic_term_id),
          roomModule.getRooms(),
          courseLoadingModule.getBlockListByTerm(academic_term_id),
        ]);

        if (cancelled) return;
        setFaculty(facultyRows);
        setRooms(roomRows);
        setBlocks(blockRows);
      } catch (error) {
        console.error("scheduler.lookup.load ::", error);
      } finally {
        if (cancelled) return;
        setLookupLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [academic_term_id]);

  useEffect(() => {
    let cancelled = false;

    const loadOfferings = async () => {
      if (!selectedBlockId) {
        setOfferings([]);
        setOfferingsLoading(false);
        setOfferingsLoadedForBlockId(null);
        return;
      }
      setOfferingsLoading(true);
      setOfferingsLoadedForBlockId(null);
      try {
        const rows = await getBlockCourseOfferingsForScheduler(selectedBlockId);
        if (cancelled) return;
        setOfferings(rows);
      } catch (error) {
        console.error("scheduler.offerings.load ::", error);
        if (cancelled) return;
        setOfferings([]);
      } finally {
        if (cancelled) return;
        setOfferingsLoading(false);
        setOfferingsLoadedForBlockId(selectedBlockId);
      }
    };

    void loadOfferings();

    return () => {
      cancelled = true;
    };
  }, [selectedBlockId, refreshKey]);

  useEffect(() => {
    setBlockSessions([]);
    setBlockLoading(Boolean(selectedBlockId));
  }, [selectedBlockId]);

  useEffect(() => {
    if (!selectedCourseUtilizationId) return;
    if (!selectedBlockId) return;
    if (offeringsLoading) return;
    if (offeringsLoadedForBlockId !== selectedBlockId) return;
    const exists = offerings.some(
      (item) => item.id === selectedCourseUtilizationId,
    );
    if (!exists) {
      clearContextParam("courseUtilizationId");
      setContextNotice(
        "Course offering not found for this block. Please reselect.",
      );
    }
  }, [
    offerings,
    offeringsLoadedForBlockId,
    offeringsLoading,
    selectedBlockId,
    selectedCourseUtilizationId,
  ]);

  const timeSlots = useMemo(() => {
    const slots: { start: string; end: string; startMinute: number }[] = [];
    for (
      let minute = START_MINUTE;
      minute <= END_MINUTE - SLOT_MINUTES;
      minute += SLOT_MINUTES
    ) {
      const start = toTimeValue(minute);
      const end = toTimeValue(minute + SLOT_MINUTES);
      slots.push({ start, end, startMinute: minute });
    }
    return slots;
  }, []);

  const slotStarts = useMemo(
    () => timeSlots.map((slot) => slot.startMinute),
    [timeSlots],
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!selectedBlockId && !selectedFacultyId && !selectedRoomId) {
        setBlockSessions([]);
        setFacultySessions([]);
        setRoomSessions([]);
        setBlockLoading(false);
        setFacultyLoading(false);
        setRoomLoading(false);
        return;
      }

      setBlockLoading(Boolean(selectedBlockId));
      setFacultyLoading(Boolean(selectedFacultyId));
      setRoomLoading(Boolean(selectedRoomId));

      const requestId = (matrixRequestIdRef.current += 1);
      const result = await getSchedulerMapperMatrices(academic_term_id, {
        blockId: selectedBlockId ?? null,
        facultyId: selectedFacultyId ?? null,
        roomId: selectedRoomId ?? null,
      });

      if (cancelled || requestId !== matrixRequestIdRef.current) return;

      setBlockSessions(selectedBlockId ? result.block : []);
      setFacultySessions(selectedFacultyId ? result.faculty : []);
      if (selectedRoomId) {
        setRoomSessions(result.room);
      } else if (selectedBlockId) {
        const onlineSessions = await getSchedulerMapperMatrixByOnlineBlock(
          academic_term_id,
          selectedBlockId,
        );
        if (cancelled || requestId !== matrixRequestIdRef.current) return;
        setRoomSessions(onlineSessions);
      } else {
        setRoomSessions([]);
      }

      setBlockLoading(false);
      setFacultyLoading(false);
      setRoomLoading(false);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    academic_term_id,
    selectedBlockId,
    selectedFacultyId,
    selectedRoomId,
    refreshKey,
  ]);

  const blockMatrix = useMemo(
    () => buildMatrix(blockSessions, slotStarts),
    [blockSessions, slotStarts],
  );
  const facultyMatrix = useMemo(
    () => buildMatrix(facultySessions, slotStarts),
    [facultySessions, slotStarts],
  );
  const roomMatrix = useMemo(
    () => buildMatrix(roomSessions, slotStarts),
    [roomSessions, slotStarts],
  );

  const expectedHours = useMemo(() => {
    if (!selectedOffering) return 0;
    return sessionType === "Lecture"
      ? selectedOffering.unscheduled_lecture_hours
      : selectedOffering.unscheduled_laboratory_hours;
  }, [selectedOffering, sessionType]);

  const maxDragSlots = useMemo(() => {
    if (expectedHours <= 0) return 0;
    return Math.ceil(expectedHours / 0.5);
  }, [expectedHours]);

  const canDrag = Boolean(
    selectedBlockId &&
    selectedCourseUtilizationId &&
    selectedFacultyId &&
    selectedOffering,
  );

  const hasMatrixConflict = (
    matrix: MatrixMap,
    day: SessionDay,
    startIndex: number,
    endIndex: number,
  ): boolean => {
    const min = Math.min(startIndex, endIndex);
    const max = Math.max(startIndex, endIndex);
    for (let index = min; index <= max; index += 1) {
      if ((matrix[day]?.[index] ?? []).length > 0) {
        return true;
      }
    }
    return false;
  };

  const finalizeDrag = (
    day: SessionDay,
    startIndex: number,
    endIndex: number,
  ) => {
    if (!canDrag) {
      setDragError("Select a block, course offering, and faculty to schedule.");
      setDragging(null);
      return;
    }

    if (hasMatrixConflict(blockMatrix, day, startIndex, endIndex)) {
      setDragError("Block already has a schedule in that time range.");
      setDragging(null);
      return;
    }

    if (hasMatrixConflict(facultyMatrix, day, startIndex, endIndex)) {
      setDragError("Faculty already has a schedule in that time range.");
      setDragging(null);
      return;
    }

    if (
      selectedRoomId &&
      hasMatrixConflict(roomMatrix, day, startIndex, endIndex)
    ) {
      setDragError("Room is occupied in that time range.");
      setDragging(null);
      return;
    }

    setDragError("");
    setPendingRange({ day, startIndex, endIndex });
    setConfirmOpen(true);
    setDragging(null);
  };

  const handleCellMouseDown = (
    day: SessionDay,
    rowIndex: number,
    items: SchedulerMatrixSession[],
  ) => {
    if (items.length > 0) {
      setSelectedCell({ source: "Block", sessions: items });
      return;
    }
    if (!canDrag) {
      setDragError("Select a block, course offering, and faculty to schedule.");
      return;
    }

    if (expectedHours <= 0) {
      setDragError(
        `No remaining ${sessionType.toLowerCase()} hours for this course.`,
      );
      return;
    }
    setDragError("");
    setDragging({ day, startIndex: rowIndex, endIndex: rowIndex });
  };

  const handleCellMouseEnter = (
    day: SessionDay,
    rowIndex: number,
    _items: SchedulerMatrixSession[],
  ) => {
    setDragging((prev) => {
      if (!prev || prev.day !== day) return prev;
      if (maxDragSlots <= 0) return prev;
      const minIndex = 0;
      const maxIndex = timeSlots.length - 1;
      const direction = rowIndex >= prev.startIndex ? 1 : -1;
      const clampedEnd =
        direction === 1
          ? Math.min(prev.startIndex + maxDragSlots - 1, rowIndex, maxIndex)
          : Math.max(prev.startIndex - (maxDragSlots - 1), rowIndex, minIndex);
      return { ...prev, endIndex: clampedEnd };
    });
  };

  const handleSessionClick =
    (source: "Block" | "Faculty" | "Room") =>
    (_day: SessionDay, _rowIndex: number, items: SchedulerMatrixSession[]) => {
      if (items.length === 0) return;
      setSelectedCell({ source, sessions: items });
    };

  useEffect(() => {
    let cancelled = false;

    const loadSummaries = async () => {
      if (!selectedCell || selectedCell.sessions.length === 0) {
        setOverlappingSessions([]);
        setActiveSessionId(null);
        return;
      }

      const ids = selectedCell.sessions.map((session) => session.id);
      const summaries = await getSessionSummaries(ids);
      if (cancelled) return;
      setOverlappingSessions(summaries);
      setActiveSessionId((prev) => {
        if (!summaries || summaries.length === 0) return null;
        if (prev && summaries.some((item) => item.session_id === prev)) {
          return prev;
        }
        return summaries[0].session_id;
      });
      if (summaries && summaries.length > 0) {
        setSelectedClassId(summaries[0]?.class_id ?? null);
      }
    };

    void loadSummaries();

    return () => {
      cancelled = true;
    };
  }, [selectedCell]);

  useEffect(() => {
    if (!dragging) return;

    const handleMouseUp = () => {
      const current = draggingRef.current;
      if (!current) return;
      finalizeDrag(current.day, current.startIndex, current.endIndex);
      setDragging(null);
    };

    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging]);

  const handleConfirmSchedule = async () => {
    if (
      !pendingRange ||
      !selectedOffering ||
      !selectedFacultyId ||
      !selectedBlockId
    ) {
      return;
    }

    const minIndex = Math.min(pendingRange.startIndex, pendingRange.endIndex);
    const maxIndex = Math.max(pendingRange.startIndex, pendingRange.endIndex);
    const startSlot = timeSlots[minIndex];
    const endSlot = timeSlots[maxIndex];

    if (!startSlot || !endSlot) {
      setDragError("Invalid time range selected.");
      return;
    }

    const selectedDurationHours =
      (toMinutes(endSlot.end) - toMinutes(startSlot.start)) / 60;
    if (expectedHours > 0 && selectedDurationHours - expectedHours > 0.001) {
      setDragError(
        `Selected duration (${selectedDurationHours.toFixed(
          2,
        )}h) exceeds the remaining ${sessionType.toLowerCase()} hours (${expectedHours.toFixed(2)}h).`,
      );
      return;
    }

    setIsSaving(true);
    const result = await createSessionFromOffering({
      academicTermId: academic_term_id,
      blockId: selectedBlockId,
      courseUtilizationId: selectedOffering.id,
      facultyId: selectedFacultyId,
      roomId: selectedRoomId,
      day: pendingRange.day,
      startTime: startSlot.start,
      endTime: endSlot.end,
      type: sessionType,
    });

    if (result.error) {
      setDragError(result.error);
      setIsSaving(false);
      return;
    }

    setConfirmOpen(false);
    setPendingRange(null);
    setIsSaving(false);
    setDragError("");
    if (result.data?.id && selectedOffering.class_id) {
      setSelectedCell({
        source: "Block",
        sessions: [
          {
            id: result.data.id,
            class_id: selectedOffering.class_id,
            class_code: selectedOffering.class_code ?? "TMP",
            day: pendingRange.day,
            start_time: startSlot.start,
            end_time: endSlot.end,
          },
        ],
      });
      setActiveSessionId(result.data.id);
      setSelectedClassId(selectedOffering.class_id);
    } else {
      setSelectedCell(null);
      setActiveSessionId(result.data?.id ?? null);
      setSelectedClassId(selectedOffering.class_id ?? null);
    }
    setRefreshKey((prev) => prev + 1);
  };

  const getHeaderButtonClass = (hasSelection: boolean) =>
    cn("min-w-0 h-7 px-2 text-sm", hasSelection ? "font-semibold flex-1" : "");

  const renderHeaderButton = (
    entityName: string,
    emptyStateTitle: string,
    filledStateTitle: string,
    icon: React.ReactNode,
    selectedLabel: string | null,
    onClick: () => void,
    onClear: () => void,
  ) => (
    <>
      <Button
        title={selectedLabel ? `${filledStateTitle}` : `${emptyStateTitle}`}
        variant="outline"
        className={getHeaderButtonClass(Boolean(selectedLabel))}
        onClick={onClick}
        disabled={lookupLoading}
      >
        {icon}
        <span className="truncate">{selectedLabel ?? `${filledStateTitle}`}</span>
        <ChevronDown className="h-3 w-3 text-foreground/60" />,
      </Button>
      {selectedLabel ? (
        <Button
          title={`Clear ${entityName} selection`}
          variant="ghost"
          className="h-7 w-7 p-0 hover:bg-transparent"
          onClick={onClear}
          disabled={lookupLoading}
        >
          <X className="h-3 w-3 text-background" />
        </Button>
      ) : null}
    </>
  );

  const clearBlockSelection = () => {
    setContextParams((next) => {
      next.delete("blockId");
      next.delete("courseUtilizationId");
    });
    setPendingRange(null);
    setConfirmOpen(false);
    setDragError("");
  };

  const schedulerContextValue = useMemo(
    () => ({
      blocks,
      rooms,
      offerings,
      blockSessions,
      facultySessions,
      roomSessions,
      selectedBlockId,
      selectedFacultyId,
      selectedRoomId,
      selectedOffering,
      sessionType,
      setSessionType,
      selectedSessionId: activeSessionId,
      selectedClassId,
      classRefreshKey: refreshKey,
      overlappingSessions,
      selectSession,
      clearSelection,
      facultyOptions: faculty,
      refreshSessions,
      errorMessage: dragError || null,
    }),
    [
      activeSessionId,
      blockSessions,
      blocks,
      clearSelection,
      dragError,
      faculty,
      facultySessions,
      overlappingSessions,
      offerings,
      refreshKey,
      rooms,
      roomSessions,
      selectSession,
      selectedClassId,
      selectedBlockId,
      selectedFacultyId,
      selectedOffering,
      selectedRoomId,
      sessionType,
      refreshSessions,
    ],
  );

  const clearCourseOffering = () => {
    setContextParams((next) => {
      next.delete("courseUtilizationId");
    });
    setPendingRange(null);
    setConfirmOpen(false);
    setDragError("");
  };

  const renderBlockHeader = () => (
    <div className="flex items-center gap-1 w-full">
      {renderHeaderButton(
        "Block",
        "Change Block",
        "Select Block",
        <Blocks className="h-3 w-3" />,
        selectedBlock?.code ?? null,
        () => setShowBlockDialog(true),
        clearBlockSelection,
      )}
      <Button
        title={
          selectedOffering ? "Change course offering" : "Select course offering"
        }
        variant="outline"
        className={getHeaderButtonClass(Boolean(selectedOffering))}
        onClick={() => setShowOfferingDialog(true)}
        disabled={!selectedBlockId || lookupLoading || offeringsLoading}
      >
        <BookOpen className="h-3 w-3" />
        <span className="truncate">
          {selectedOffering?.course_code ?? "Pick Course"}
        </span>
        <ChevronDown className="h-3 w-3 text-foreground/60" />
      </Button>
      {selectedOffering ? (
        <Button
          title="Clear course offering"
          variant="ghost"
          className="h-7 w-7 p-0 hover:bg-transparent"
          onClick={clearCourseOffering}
          disabled={lookupLoading}
        >
          <X className="h-3 w-3 text-background" />
        </Button>
      ) : null}
    </div>
  );

  if (!academic_term_id?.trim()) {
    return (
      <div className="flex h-full items-center justify-center rounded-md border border-dashed p-6 text-sm text-foreground/70">
        Academic term not set.
      </div>
    );
  }

  return (
    <SchedulerProvider value={schedulerContextValue}>
      <div className="flex flex-col h-full border rounded-md overflow-hidden">
        {contextNotice ? (
          <div className="border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {contextNotice}
          </div>
        ) : null}
        <div className="flex-1 flex flex-row h-full overflow-hidden">
          <div className="flex-1 overflow-auto">
            <div
              className="grid auto-rows-[2.5rem] grid-cols-[minmax(5rem,8rem)_repeat(21,minmax(3rem,1fr))] min-w-max border border-foreground/10 text-xs"
              onMouseLeave={() => {
                setHoveredRow(null);
              }}
              onMouseUp={() => {
                if (!dragging) return;
                finalizeDrag(
                  dragging.day,
                  dragging.startIndex,
                  dragging.endIndex,
                );
                setDragging(null);
              }}
            >
              {/* TOP-LEFT */}
              <div
                className="sticky top-0 left-0 z-50 bg-foreground/70 border-r-4 border-foreground/10 backdrop-blur-xs"
                style={{ gridColumn: 1, gridRow: 1 }}
              />

              {/* TIME HEADER */}
              <div
                className="sticky text-sm text-background top-10 left-0 z-50 bg-foreground/80 flex items-center justify-center border-b-4 border-r-4 border-foreground/10 font-semibold backdrop-blur-xs"
                style={{ gridColumn: 1, gridRow: 2 }}
              >
                Time
              </div>

              {/* TIME SLOTS */}
              {timeSlots.map((slot, index) => (
                <div
                  key={`time-${slot.start}`}
                  className={cn(
                    "sticky left-0 z-20 bg-background flex items-center justify-center border-b border-r-4 border-foreground/10 text-xs",
                    hoveredRow === index &&
                      "bg-foreground/5 border-y-foreground/20 backdrop-blur-xs",
                  )}
                  style={{ gridColumn: 1, gridRow: 3 + index }}
                  onMouseEnter={() => setHoveredRow(index)}
                >
                  {toDisplayTime(slot.start)} - {toDisplayTime(slot.end)}
                </div>
              ))}

              {/* MATRIX RENDERERS */}
              <MatrixRenderer
                title="Block"
                headerAction={renderBlockHeader()}
                days={DAYS}
                timeSlots={timeSlots.map((slot) => slot.start)}
                matrix={blockMatrix}
                hoveredRow={hoveredRow}
                onHoverRow={setHoveredRow}
                loading={blockLoading}
                startColumn={2}
                highlightedClassId={selectedOffering?.class_id ?? null}
                selectedSessionId={activeSessionId}
                selectedRange={dragging}
                onCellMouseDown={handleCellMouseDown}
                onCellMouseEnter={handleCellMouseEnter}
                onCellClick={handleSessionClick("Block")}
              />

              <MatrixRenderer
                title="Faculty"
                headerAction={renderHeaderButton(
                  "Faculty",
                  "Change Faculty",
                  "Select Faculty",
                  <User className="h-3 w-3" />,
                  selectedFaculty?.name ?? null,
                  () => setShowFacultyDialog(true),
                  () => clearContextParam("facultyId"),
                )}
                days={DAYS}
                timeSlots={timeSlots.map((slot) => slot.start)}
                matrix={facultyMatrix}
                hoveredRow={hoveredRow}
                onHoverRow={setHoveredRow}
                loading={facultyLoading}
                startColumn={9}
                highlightedClassId={selectedOffering?.class_id ?? null}
                selectedSessionId={activeSessionId}
                selectedRange={selectedFacultyId ? dragging : null}
                onCellClick={handleSessionClick("Faculty")}
                onCellMouseDown={handleCellMouseDown}
                onCellMouseEnter={handleCellMouseEnter}
              />

              <MatrixRenderer
                title="Room"
                headerAction={renderHeaderButton(
                  "Room",
                  "Change Room",
                  "Online Room / No Room",
                  <DoorOpen className="h-3 w-3" />,
                  selectedRoom?.code ?? null,
                  () => setShowRoomDialog(true),
                  () => clearContextParam("roomId"),
                )}
                days={DAYS}
                timeSlots={timeSlots.map((slot) => slot.start)}
                matrix={roomMatrix}
                hoveredRow={hoveredRow}
                onHoverRow={setHoveredRow}
                loading={roomLoading}
                startColumn={16}
                highlightedClassId={selectedOffering?.class_id ?? null}
                selectedSessionId={activeSessionId}
                selectedRange={dragging}
                onCellClick={handleSessionClick("Room")}
              />
            </div>
          </div>
          <SchedulerRightPane />
        </div>

      </div>
      <FacultyPickerDialog
        open={showFacultyDialog}
        onOpenChange={setShowFacultyDialog}
        title="Select Faculty"
        description="Select faculty to map. You can select block and room independently."
        items={faculty}
        selectedId={selectedFacultyId}
        onSelect={(facultyId) => {
          setContextParam("facultyId", facultyId);
          setDragError("");
          setShowFacultyDialog(false);
        }}
        defaultCampusId={selectedBlock?.campus_id ?? null}
        defaultCollegeId={selectedBlock?.college_id ?? null}
      />

      <BlockPickerDialog
        open={showBlockDialog}
        onOpenChange={setShowBlockDialog}
        items={blocks}
        selectedId={selectedBlockId}
        onSelect={(blockId: string) => {
          setContextParams((next) => {
            next.set("blockId", blockId);
            next.delete("courseUtilizationId");
          });
          setDragError("");
          setPendingRange(null);
          setConfirmOpen(false);
          setShowBlockDialog(false);
          setRefreshKey((prev) => prev + 1);
        }}
      />

      <SelectCourseOfferingDialog
        open={showOfferingDialog}
        onOpenChange={setShowOfferingDialog}
        academicTermId={academic_term_id}
        offerings={offerings}
        selectedOfferingId={selectedCourseUtilizationId}
        onSelectOffering={(id) => {
          setContextParam("courseUtilizationId", id);
          setShowOfferingDialog(false);
          setDragError("");
          setPendingRange(null);
          setConfirmOpen(false);
        }}
        onOfferingsChanged={() => setRefreshKey((prev) => prev + 1)}
      />

      <RoomPickerDialog
        open={showRoomDialog}
        onOpenChange={setShowRoomDialog}
        items={rooms}
        selectedId={selectedRoomId}
        onSelect={(roomId) => {
          if (roomId) {
            setContextParam("roomId", roomId);
          } else {
            clearContextParam("roomId");
          }
          setDragError("");
          setShowRoomDialog(false);
        }}
        allowOnline
        onlineLabel="Online / No Room"
        defaultCampusId={selectedBlock?.campus_id ?? null}
      />

      <ConfirmScheduleDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) {
            setPendingRange(null);
          }
        }}
        pendingRange={pendingRange}
        timeSlots={timeSlots}
        sessionType={sessionType}
        selectedBlock={selectedBlock}
        selectedOffering={selectedOffering}
        selectedFaculty={selectedFaculty}
        selectedRoom={selectedRoom}
        errorMessage={dragError}
        isSaving={isSaving}
        onConfirm={handleConfirmSchedule}
      />
    </SchedulerProvider>
  );
};

export default ScheduleMapper;
