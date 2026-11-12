"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Blocks as Sections, BookOpen, ChevronDown, DoorOpen, User, X } from "lucide-react";
import type { SessionDay, SessionType } from "@/features/shared/types/models";
import { toDisplayTime, toMinutes } from "@/features/scheduler/lib/schedule/utils";
import {
  getMergedSectionConflictSessions,
  getSchedulerMapperMatrices,
  getSchedulerMapperMatrixByOnlineSection,
  type SchedulerMatrixSession,
} from "@/features/scheduler/lib/schedule/mapper";
import {
  getSectionCourseOfferingsForScheduler,
  type SchedulerCourseOfferingItem,
} from "@/features/scheduler/lib/schedule/course-offerings";
import {
  createSessionFromOffering,
  getSessionSummaries,
  type SessionSummary,
  updateSessionTime,
} from "@/features/scheduler/lib/schedule/session-actions";
import MatrixRenderer from "./matrix-renderer";
import { getSelectedContextsFromSearchParams } from "./utils";
import SectionPickerDialog from "@/features/shared/components/pickers/section-picker-dialog";
import FacultyPickerDialog from "@/features/shared/components/pickers/faculty-picker-dialog";
import RoomPickerDialog from "@/features/shared/components/pickers/room-picker-dialog";
import SelectCourseOfferingDialog from "@/features/scheduler/components/dialogs/select-course-offering-dialog";
import SchedulerRightPane from "./scheduler-right-pane";
import { SchedulerProvider } from "./scheduler-context";
import type {
  CourseLoadingSectionListItem,
  FacultyListItem,
} from "@/features/course-loading/lib/types";
import { formatMergedSectionLabels } from "@/features/course-loading/lib/formatters";
import type { ExtendedRoom } from "@/features/shared/types/models";
import { Button } from "@/components/ui/button";
import ConfirmScheduleDialog from "@/features/scheduler/components/dialogs/confirm-schedule-dialog";
import { cn } from "@/utils/style";

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
      const existingItems = daySlots[index] ?? [];

      // A merged section can contribute the same timeframe as the selected
      // class. The selected class is the authoritative cell for this view;
      // keep the conflict only when no scheduled class occupies the slot.
      if (
        session.visual_source === "merged_conflict" &&
        existingItems.some((item) => item.visual_source !== "merged_conflict")
      ) {
        return;
      }

      daySlots[index] = [
        ...existingItems.filter(
          (item) =>
            session.visual_source === "merged_conflict"
              ? item.visual_source === "merged_conflict"
              : item.visual_source !== "merged_conflict",
        ),
        session,
      ];
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
  const selectedSectionId = selectedContexts.sectionId ?? null;
  const selectedRoomId = selectedContexts.roomId ?? null;
  const selectedCourseUtilizationId =
    selectedContexts.courseUtilizationId ?? null;

  const [sectionSessions, setSectionSessions] = useState<SchedulerMatrixSession[]>(
    [],
  );
  const [facultySessions, setFacultySessions] = useState<
    SchedulerMatrixSession[]
  >([]);
  const [roomSessions, setRoomSessions] = useState<SchedulerMatrixSession[]>(
    [],
  );
  const [mergedConflictSessions, setMergedConflictSessions] = useState<
    SchedulerMatrixSession[]
  >([]);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [facultyLoading, setFacultyLoading] = useState(false);
  const [roomLoading, setRoomLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [faculty, setFaculty] = useState<FacultyListItem[]>([]);
  const [rooms, setRooms] = useState<ExtendedRoom[]>([]);
  const [sections, setSections] = useState<CourseLoadingSectionListItem[]>([]);
  const [offerings, setOfferings] = useState<SchedulerCourseOfferingItem[]>([]);
  const [offeringsLoading, setOfferingsLoading] = useState(false);
  const [offeringsLoadedForSectionId, setOfferingsLoadedForSectionId] = useState<
    string | null
  >(null);
  const [contextNotice, setContextNotice] = useState("");
  const [showFacultyDialog, setShowFacultyDialog] = useState(false);
  const [showSectionDialog, setShowSectionDialog] = useState(false);
  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [showOfferingDialog, setShowOfferingDialog] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dragError, setDragError] = useState("");
  const [selectedCell, setSelectedCell] = useState<{
    source: "Section" | "Faculty" | "Room";
    sessions: SchedulerMatrixSession[];
  } | null>(null);
  const [selectedCellRequestKey, setSelectedCellRequestKey] = useState(0);
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
    mode: "create" | "move";
  } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sessionType, setSessionType] = useState<SessionType>("Lecture");
  const [isSaving, setIsSaving] = useState(false);
  const [movingSession, setMovingSession] = useState<SessionSummary | null>(
    null,
  );

  const draggingRef = useRef<typeof dragging>(null);
  const matrixRequestIdRef = useRef(0);
  const syncContextFromSessionRef = useRef<
    (session: SessionSummary | null | undefined) => void
  >(() => undefined);

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
    key: "facultyId" | "sectionId" | "roomId" | "courseUtilizationId",
    value: string,
  ) => {
    setQueryParams((next) => {
      next.set(key, value);
    });
  };

  const clearContextParam = (
    key: "facultyId" | "sectionId" | "roomId" | "courseUtilizationId",
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
    setSelectedCellRequestKey((prev) => prev + 1);
    setSelectedClassId(null);
    setActiveSessionId(null);
    setMovingSession(null);
    setOverlappingSessions([]);
  }, []);

  const startMoveSession = useCallback((session: SessionSummary) => {
    setMovingSession(session);
    setActiveSessionId(session.session_id);
    setSelectedClassId(session.class_id);
    setSelectedCell(null);
    setPendingRange(null);
    setConfirmOpen(false);
    setDragError(
      "Select a new timeslot on the grid to move this session.",
    );
  }, []);

  const refreshSessions = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  syncContextFromSessionRef.current = (
    session: SessionSummary | null | undefined,
  ) => {
    if (!session) return;

    const next = new URLSearchParams(searchParams.toString());

    if (session.faculty_id) {
      next.set("facultyId", session.faculty_id);
    }

    if (session.room_id) {
      next.set("roomId", session.room_id);
    } else {
      next.delete("roomId");
    }

    const queryString = next.toString();
    if (queryString === searchParams.toString()) return;
    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const selectedFaculty =
    faculty.find((item) => item.id === selectedFacultyId) ?? null;
  const selectedSection =
    sections.find((item) => item.id === selectedSectionId) ?? null;
  const selectedRoom = rooms.find((item) => item.id === selectedRoomId) ?? null;
  const selectedOffering =
    offerings.find((item) => item.id === selectedCourseUtilizationId) ?? null;

  useEffect(() => {
    setContextNotice("");
  }, [selectedSectionId]);

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
          import("@/features/course-loading/lib/queries"),
          import("@/features/admin/lib/rooms"),
        ]);

        const [facultyRows, roomRows, sectionRows] = await Promise.all([
          courseLoadingModule.getFacultyListByTerm(academic_term_id, {
            includeEmpty: true,
          }),
          roomModule.getRooms(),
          courseLoadingModule.getSectionListByTerm(academic_term_id),
        ]);

        if (cancelled) return;
        setFaculty(facultyRows);
        setRooms(roomRows);
        setSections(sectionRows);
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
      if (!selectedSectionId) {
        setOfferings([]);
        setOfferingsLoading(false);
        setOfferingsLoadedForSectionId(null);
        return;
      }
      setOfferingsLoading(true);
      setOfferingsLoadedForSectionId(null);
      try {
        const rows = await getSectionCourseOfferingsForScheduler(selectedSectionId);
        if (cancelled) return;
        setOfferings(rows);
      } catch (error) {
        console.error("scheduler.offerings.load ::", error);
        if (cancelled) return;
        setOfferings([]);
      } finally {
        if (cancelled) return;
        setOfferingsLoading(false);
        setOfferingsLoadedForSectionId(selectedSectionId);
      }
    };

    void loadOfferings();

    return () => {
      cancelled = true;
    };
  }, [selectedSectionId, refreshKey]);

  useEffect(() => {
    setSectionSessions([]);
    setSectionLoading(Boolean(selectedSectionId));
  }, [selectedSectionId]);

  useEffect(() => {
    if (!selectedCourseUtilizationId) return;
    if (!selectedSectionId) return;
    if (offeringsLoading) return;
    if (offeringsLoadedForSectionId !== selectedSectionId) return;
    const exists = offerings.some(
      (item) => item.id === selectedCourseUtilizationId,
    );
    if (!exists) {
      clearContextParam("courseUtilizationId");
      setContextNotice(
        "Course offering not found for this section. Please reselect.",
      );
    }
  }, [
    offerings,
    offeringsLoadedForSectionId,
    offeringsLoading,
    selectedSectionId,
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
      if (!selectedSectionId && !selectedFacultyId && !selectedRoomId) {
        setSectionSessions([]);
        setFacultySessions([]);
        setRoomSessions([]);
        setSectionLoading(false);
        setFacultyLoading(false);
        setRoomLoading(false);
        return;
      }

      setSectionLoading(Boolean(selectedSectionId));
      setFacultyLoading(Boolean(selectedFacultyId));
      setRoomLoading(Boolean(selectedRoomId));

      const requestId = (matrixRequestIdRef.current += 1);
      const result = await getSchedulerMapperMatrices(academic_term_id, {
        sectionId: selectedSectionId ?? null,
        facultyId: selectedFacultyId ?? null,
        roomId: selectedRoomId ?? null,
      });

      if (cancelled || requestId !== matrixRequestIdRef.current) return;

      setSectionSessions(selectedSectionId ? result.section : []);
      setFacultySessions(selectedFacultyId ? result.faculty : []);
      if (selectedRoomId) {
        setRoomSessions(result.room);
      } else if (selectedSectionId) {
        const onlineSessions = await getSchedulerMapperMatrixByOnlineSection(
          academic_term_id,
          selectedSectionId,
        );
        if (cancelled || requestId !== matrixRequestIdRef.current) return;
        setRoomSessions(onlineSessions);
      } else {
        setRoomSessions([]);
      }

      setSectionLoading(false);
      setFacultyLoading(false);
      setRoomLoading(false);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    academic_term_id,
    selectedSectionId,
    selectedFacultyId,
    selectedRoomId,
    refreshKey,
  ]);

  useEffect(() => {
    let cancelled = false;

    const loadMergedConflicts = async () => {
      if (
        !selectedOffering?.class_id ||
        !selectedSectionId ||
        selectedOffering.merged_sections.length === 0
      ) {
        setMergedConflictSessions([]);
        return;
      }

      const rows = await getMergedSectionConflictSessions(
        academic_term_id,
        selectedOffering.class_id,
        selectedSectionId,
      );
      if (cancelled) return;
      setMergedConflictSessions(rows);
    };

    void loadMergedConflicts();

    return () => {
      cancelled = true;
    };
  }, [
    academic_term_id,
    selectedSectionId,
    selectedOffering?.class_id,
    selectedOffering?.merged_sections.length,
    refreshKey,
  ]);

  const sectionMatrix = useMemo(
    () => buildMatrix([...sectionSessions, ...mergedConflictSessions], slotStarts),
    [sectionSessions, mergedConflictSessions, slotStarts],
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
    if (movingSession) {
      return Math.max(
        Math.ceil(
          (toMinutes(movingSession.end_time) -
            toMinutes(movingSession.start_time)) /
            SLOT_MINUTES,
        ),
        1,
      );
    }
    if (expectedHours <= 0) return 0;
    return Math.ceil(expectedHours / 0.5);
  }, [expectedHours, movingSession]);

  const canDrag = Boolean(
    movingSession ||
      (selectedSectionId &&
        selectedCourseUtilizationId &&
        selectedFacultyId &&
        selectedOffering),
  );

  const hasMatrixConflict = (
    matrix: MatrixMap,
    day: SessionDay,
    startIndex: number,
    endIndex: number,
    excludeSessionId?: string | null,
  ): boolean => {
    const min = Math.min(startIndex, endIndex);
    const max = Math.max(startIndex, endIndex);
    for (let index = min; index <= max; index += 1) {
      const sessions = (matrix[day]?.[index] ?? []).filter(
        (session) => session.id !== excludeSessionId,
      );
      if (sessions.length > 0) {
        return true;
      }
    }
    return false;
  };

  const selectMatrixSessions = useCallback(
    async (
      source: "Section" | "Faculty" | "Room",
      sessions: SchedulerMatrixSession[],
    ) => {
      if (sessions.length === 0) return;

      setSelectedCell({ source, sessions });
      setSelectedCellRequestKey((prev) => prev + 1);

      const summaries = await getSessionSummaries(
        sessions.map((session) => session.id),
      );
      const nextSelectedSummary = summaries[0] ?? null;
      setOverlappingSessions(summaries);
      setActiveSessionId(nextSelectedSummary?.session_id ?? null);
      if (nextSelectedSummary) {
        setSelectedClassId(nextSelectedSummary.class_id);
        syncContextFromSessionRef.current(nextSelectedSummary);
      }
    },
    [],
  );

  const finalizeDrag = (
    day: SessionDay,
    startIndex: number,
    endIndex: number,
  ) => {
    if (!canDrag) {
      setDragError("Select a section, course offering, and faculty to schedule.");
      setDragging(null);
      return;
    }

    const excludedSessionId = movingSession?.session_id ?? null;

    if (
      hasMatrixConflict(
        sectionMatrix,
        day,
        startIndex,
        endIndex,
        excludedSessionId,
      )
    ) {
      setDragError("Section already has a schedule in that time range.");
      setDragging(null);
      return;
    }

    if (
      selectedFacultyId &&
      hasMatrixConflict(
        facultyMatrix,
        day,
        startIndex,
        endIndex,
        excludedSessionId,
      )
    ) {
      setDragError("Faculty already has a schedule in that time range.");
      setDragging(null);
      return;
    }

    if (
      selectedRoomId &&
      hasMatrixConflict(
        roomMatrix,
        day,
        startIndex,
        endIndex,
        excludedSessionId,
      )
    ) {
      setDragError("Room is occupied in that time range.");
      setDragging(null);
      return;
    }

    setDragError("");
    setPendingRange({
      day,
      startIndex,
      endIndex,
      mode: movingSession ? "move" : "create",
    });
    setConfirmOpen(true);
    setDragging(null);
  };

  const handleCellMouseDown = (
    day: SessionDay,
    rowIndex: number,
    items: SchedulerMatrixSession[],
  ) => {
    const selectableItems = items.filter(
      (item) => item.visual_source !== "merged_conflict",
    );
    const isMovingCurrentSession = selectableItems.some(
      (item) => item.id === movingSession?.session_id,
    );

    if (selectableItems.length > 0 && !movingSession) {
      void selectMatrixSessions("Section", selectableItems);
      return;
    }
    if (selectableItems.length > 0 && !isMovingCurrentSession) return;

    if (!canDrag) {
      setDragError("Select a section, course offering, and faculty to schedule.");
      return;
    }

    if (!movingSession && expectedHours <= 0) {
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
    void _items;
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
    (source: "Section" | "Faculty" | "Room") =>
    (_day: SessionDay, _rowIndex: number, items: SchedulerMatrixSession[]) => {
      if (movingSession) return;
      const selectableItems = items.filter(
        (item) => item.visual_source !== "merged_conflict",
      );
      if (selectableItems.length === 0) return;
      void selectMatrixSessions(source, selectableItems);
    };

  useEffect(() => {
    let cancelled = false;

    const loadSummaries = async () => {
      if (!selectedCell || selectedCell.sessions.length === 0) {
        return;
      }
      if (overlappingSessions.length > 0) {
        return;
      }

      const ids = selectedCell.sessions.map((session) => session.id);
      const summaries = await getSessionSummaries(ids);
      if (cancelled) return;
      const nextSelectedSummary = summaries[0] ?? null;
      setOverlappingSessions(summaries);
      setActiveSessionId(nextSelectedSummary?.session_id ?? null);
      if (nextSelectedSummary) {
        setSelectedClassId(nextSelectedSummary.class_id);
        syncContextFromSessionRef.current(nextSelectedSummary);
      }
    };

    void loadSummaries();

    return () => {
      cancelled = true;
    };
  }, [overlappingSessions.length, selectedCell, selectedCellRequestKey]);

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

  const removeMatrixSession = (
    sessions: SchedulerMatrixSession[],
    sessionId: string,
  ) => sessions.filter((session) => session.id !== sessionId);

  const replaceMatrixSession = (
    sessions: SchedulerMatrixSession[],
    session: SchedulerMatrixSession,
  ) => [...removeMatrixSession(sessions, session.id), session];

  const handleConfirmSchedule = async () => {
    if (!pendingRange || isSaving) {
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
    if (
      pendingRange.mode === "create" &&
      expectedHours > 0 &&
      selectedDurationHours - expectedHours > 0.001
    ) {
      setDragError(
        `Selected duration (${selectedDurationHours.toFixed(
          2,
        )}h) exceeds the remaining ${sessionType.toLowerCase()} hours (${expectedHours.toFixed(2)}h).`,
      );
      return;
    }

    if (pendingRange.mode === "move") {
      if (!movingSession) return;

      const previousSectionSessions = sectionSessions;
      const previousFacultySessions = facultySessions;
      const previousRoomSessions = roomSessions;
      const movedMatrixSession: SchedulerMatrixSession = {
        id: movingSession.session_id,
        class_id: movingSession.class_id,
        class_code: movingSession.class_code,
        day: pendingRange.day,
        start_time: startSlot.start,
        end_time: endSlot.end,
      };

      setIsSaving(true);
      setSectionSessions((prev) => replaceMatrixSession(prev, movedMatrixSession));
      setFacultySessions((prev) =>
        selectedFacultyId
          ? replaceMatrixSession(prev, movedMatrixSession)
          : removeMatrixSession(prev, movingSession.session_id),
      );
      setRoomSessions((prev) => replaceMatrixSession(prev, movedMatrixSession));
      setOverlappingSessions((prev) =>
        prev.map((session) =>
          session.session_id === movingSession.session_id
            ? {
                ...session,
                day: pendingRange.day,
                start_time: startSlot.start,
                end_time: endSlot.end,
              }
            : session,
        ),
      );

      const result = await updateSessionTime(movingSession.session_id, {
        day: pendingRange.day,
        startTime: startSlot.start,
        endTime: endSlot.end,
      });

      if (result.error) {
        setSectionSessions(previousSectionSessions);
        setFacultySessions(previousFacultySessions);
        setRoomSessions(previousRoomSessions);
        setDragError(result.error);
        setIsSaving(false);
        return;
      }

      setConfirmOpen(false);
      setPendingRange(null);
      setMovingSession(null);
      setIsSaving(false);
      setDragError("");
      setActiveSessionId(result.data?.id ?? movingSession.session_id);
      setSelectedClassId(result.data?.class_id ?? movingSession.class_id);
      setRefreshKey((prev) => prev + 1);
      return;
    }

    if (!selectedOffering || !selectedFacultyId || !selectedSectionId) {
      return;
    }

    const tempId = `optimistic-${Date.now()}`;
    const tempClassId = selectedOffering.class_id ?? `pending-${selectedOffering.id}`;
    const optimisticSession: SchedulerMatrixSession = {
      id: tempId,
      class_id: tempClassId,
      class_code: selectedOffering.class_code ?? "TMP",
      day: pendingRange.day,
      start_time: startSlot.start,
      end_time: endSlot.end,
    };
    const optimisticSummary: SessionSummary = {
      session_id: tempId,
      class_id: tempClassId,
      class_code: optimisticSession.class_code,
      course_code: selectedOffering.course_code,
      course_title: selectedOffering.course_title,
      faculty_id: selectedFacultyId,
      faculty_name: selectedFaculty?.name ?? selectedOffering.faculty_name,
      room_id: selectedRoomId,
      room_code: selectedRoom?.code ?? null,
      room_name: selectedRoom?.name ?? null,
      campus_id: selectedSection?.campus_id ?? null,
      college_id: selectedSection?.college_id ?? null,
      day: pendingRange.day,
      start_time: startSlot.start,
      end_time: endSlot.end,
      type: sessionType,
      section_codes: [
        selectedSection?.code ?? selectedOffering.section_code,
        ...selectedOffering.merged_sections.map((section) => section.code),
      ],
      section_label: formatMergedSectionLabels(
        [
          {
            code: selectedSection?.code ?? selectedOffering.section_code,
            classification: selectedSection?.classification ?? "regular",
          },
          ...selectedOffering.merged_sections,
        ],
        (section) => section.code,
      ),
    };
    const previousSectionSessions = sectionSessions;
    const previousFacultySessions = facultySessions;
    const previousRoomSessions = roomSessions;
    const previousOverlappingSessions = overlappingSessions;

    setIsSaving(true);
    setSectionSessions((prev) => [...prev, optimisticSession]);
    setFacultySessions((prev) => [...prev, optimisticSession]);
    setRoomSessions((prev) => [...prev, optimisticSession]);
    setSelectedCell(null);
    setOverlappingSessions([optimisticSummary]);
    setActiveSessionId(tempId);
    setSelectedClassId(tempClassId);

    const result = await createSessionFromOffering({
      academicTermId: academic_term_id,
      sectionId: selectedSectionId,
      courseUtilizationId: selectedOffering.id,
      facultyId: selectedFacultyId,
      roomId: selectedRoomId,
      day: pendingRange.day,
      startTime: startSlot.start,
      endTime: endSlot.end,
      type: sessionType,
    });

    if (result.error) {
      setSectionSessions(previousSectionSessions);
      setFacultySessions(previousFacultySessions);
      setRoomSessions(previousRoomSessions);
      setOverlappingSessions(previousOverlappingSessions);
      setActiveSessionId(null);
      setSelectedClassId(selectedOffering.class_id ?? null);
      setDragError(result.error);
      setIsSaving(false);
      return;
    }

    setConfirmOpen(false);
    setPendingRange(null);
    setIsSaving(false);
    setDragError("");
    if (result.data) {
      const realSession: SchedulerMatrixSession = {
        id: result.data.id,
        class_id: result.data.class_id,
        class_code: result.data.class_code,
        day: result.data.day,
        start_time: result.data.start_time,
        end_time: result.data.end_time,
      };
      setSectionSessions((prev) => [
        ...removeMatrixSession(prev, tempId),
        realSession,
      ]);
      setFacultySessions((prev) => [
        ...removeMatrixSession(prev, tempId),
        realSession,
      ]);
      setRoomSessions((prev) => [
        ...removeMatrixSession(prev, tempId),
        realSession,
      ]);
      setOverlappingSessions([
        {
          ...optimisticSummary,
          session_id: result.data.id,
          class_id: result.data.class_id,
          class_code: result.data.class_code,
          day: result.data.day,
          start_time: result.data.start_time,
          end_time: result.data.end_time,
          type: result.data.type,
        },
      ]);
      setActiveSessionId(result.data.id);
      setSelectedClassId(result.data.class_id);
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

  const clearSectionSelection = () => {
    setContextParams((next) => {
      next.delete("sectionId");
      next.delete("courseUtilizationId");
      next.delete("facultyId");
    });
    setPendingRange(null);
    setConfirmOpen(false);
    setDragError("");
  };

  const schedulerContextValue = useMemo(
    () => ({
      sections,
      rooms,
      offerings,
      sectionSessions,
      facultySessions,
      roomSessions,
      selectedSectionId,
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
      startMoveSession,
      clearSelection,
      facultyOptions: faculty,
      refreshSessions,
      movingSession,
      errorMessage: dragError || null,
    }),
    [
      activeSessionId,
      sectionSessions,
      sections,
      clearSelection,
      dragError,
      faculty,
      facultySessions,
      movingSession,
      overlappingSessions,
      offerings,
      refreshKey,
      rooms,
      roomSessions,
      selectSession,
      selectedClassId,
      selectedSectionId,
      selectedFacultyId,
      selectedOffering,
      selectedRoomId,
      sessionType,
      startMoveSession,
      refreshSessions,
    ],
  );

  const clearCourseOffering = () => {
    setContextParams((next) => {
      next.delete("courseUtilizationId");
    });
    setPendingRange(null);
    setConfirmOpen(false);
    setMovingSession(null);
    setDragError("");
  };

  const renderSectionHeader = () => (
    <div className="flex items-center gap-1 w-full">
      {renderHeaderButton(
        "Section",
        "Change Section",
        "Select Section",
        <Sections className="h-3 w-3" />,
        selectedSection?.code ?? null,
        () => setShowSectionDialog(true),
        clearSectionSelection,
      )}
      <Button
        title={
          selectedOffering ? "Change course offering" : "Select course offering"
        }
        variant="outline"
        className={getHeaderButtonClass(Boolean(selectedOffering))}
        onClick={() => setShowOfferingDialog(true)}
        disabled={!selectedSectionId || lookupLoading || offeringsLoading}
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
              data-testid="schedule-mapper-grid"
              data-loading={
                sectionLoading || facultyLoading || roomLoading ? "true" : "false"
              }
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
                title="Section"
                headerAction={renderSectionHeader()}
                days={DAYS}
                timeSlots={timeSlots.map((slot) => slot.start)}
                matrix={sectionMatrix}
                hoveredRow={hoveredRow}
                onHoverRow={setHoveredRow}
                loading={sectionLoading}
                startColumn={2}
                highlightedClassId={selectedOffering?.class_id ?? null}
                selectedSessionId={activeSessionId}
                selectedRange={dragging}
                onCellMouseDown={handleCellMouseDown}
                onCellMouseEnter={handleCellMouseEnter}
                onCellClick={handleSessionClick("Section")}
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
                  () => {
                    clearSelection();
                    clearContextParam("facultyId");
                  },
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
                  () => {
                    clearSelection();
                    clearContextParam("roomId");
                  },
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
        items={faculty}
        selectedId={selectedFacultyId}
        onSelect={(facultyId) => {
          clearSelection();
          setContextParam("facultyId", facultyId);
          setDragError("");
          setShowFacultyDialog(false);
        }}
        defaultCampusId={selectedSection?.campus_id ?? null}
        defaultCollegeId={selectedSection?.college_id ?? null}
      />

      <SectionPickerDialog
        open={showSectionDialog}
        onOpenChange={setShowSectionDialog}
        items={sections}
        selectedId={selectedSectionId}
        onSelect={(sectionId: string) => {
          setContextParams((next) => {
            next.set("sectionId", sectionId);
            next.delete("courseUtilizationId");
            next.delete("facultyId");
          });
          setDragError("");
          setPendingRange(null);
          setConfirmOpen(false);
          setMovingSession(null);
          setShowSectionDialog(false);
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
          const offering = offerings.find((item) => item.id === id);
          setContextParams((next) => {
            next.set("courseUtilizationId", id);
            if (offering?.faculty_id) {
              next.set("facultyId", offering.faculty_id);
            }
          });
          setShowOfferingDialog(false);
          setDragError("");
          setPendingRange(null);
          setConfirmOpen(false);
          setMovingSession(null);
        }}
        onOfferingsChanged={() => setRefreshKey((prev) => prev + 1)}
      />

      <RoomPickerDialog
        open={showRoomDialog}
        onOpenChange={setShowRoomDialog}
        items={rooms}
        selectedId={selectedRoomId}
        onSelect={(roomId) => {
          clearSelection();
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
        defaultCampusId={selectedSection?.campus_id ?? null}
      />

      {confirmOpen ? (
        <ConfirmScheduleDialog
          key={`${academic_term_id}:${movingSession ? movingSession.faculty_id : selectedFacultyId}`}
          open={confirmOpen}
          academicTermId={academic_term_id}
          facultyId={movingSession ? movingSession.faculty_id : selectedFacultyId}
          facultyName={
            movingSession
              ? movingSession.faculty_name
              : selectedFaculty?.name ?? null
          }
          excludeSessionId={
            pendingRange?.mode === "move" ? movingSession?.session_id : null
          }
          onOpenChange={(open) => {
            setConfirmOpen(open);
            if (!open) {
              setPendingRange(null);
            }
          }}
          pendingRange={pendingRange}
          timeSlots={timeSlots}
          sessionType={sessionType}
          selectedSection={selectedSection}
          selectedOffering={selectedOffering}
          selectedRoom={selectedRoom}
          errorMessage={dragError}
          isSaving={isSaving}
          onConfirm={handleConfirmSchedule}
        />
      ) : null}
    </SchedulerProvider>
  );
};

export default ScheduleMapper;
