"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  Edit,
  Landmark,
  Merge,
  Plus,
  PlusCircle,
  Send,
  Split,
  Trash2,
  TriangleAlert,
  UserCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AppDialog } from "@/components/ui/app-dialog";
import { AddTile } from "@/components/ui/add-tile";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  createClass,
  deleteClass,
  deleteSession,
  findOrCreateSchedule,
  getFacultyScheduleBundle,
  getOfferedCourseOptionsByTermCampuses,
  mergeClassDeliveries,
  pruneScheduleByCampuses,
  getRoomsByCampus,
  saveSession,
  submitScheduleForCampusDirectors,
  unmergeClassBlock,
} from "@/lib/ftl/actions";
import {
  ConflictType,
  FTLBootstrapData,
  FTLClass,
  FTLFaculty,
  FTLOfferingOption,
  FTLRoom,
  FTLScheduleBundle,
  FTLSession,
  SaveSessionInput,
  SessionConflict,
} from "@/lib/ftl/types";
import { cn } from "@/utils/style";
import { formatDateTime } from "@/utils/time";
import ListItemSmall from "../admin/list-item-small";

const DAY_OPTIONS = [
  { value: "SUNDAY", label: "Sun" },
  { value: "MONDAY", label: "Mon" },
  { value: "TUESDAY", label: "Tue" },
  { value: "WEDNESDAY", label: "Wed" },
  { value: "THURSDAY", label: "Thu" },
  { value: "FRIDAY", label: "Fri" },
  { value: "SATURDAY", label: "Sat  " },
];

const typeLabelMap: Record<ConflictType, string> = {
  FACULTY: "Faculty double-booked",
  ROOM: "Room occupied",
  BLOCK: "Block overlap",
};

const toTimeInput = (value: string) => value.slice(0, 5);

const toMinutes = (value: string) => {
  const [hourRaw, minuteRaw] = value.split(":");
  const hour = Number(hourRaw ?? 0);
  const minute = Number(minuteRaw ?? 0);
  return hour * 60 + minute;
};

const sessionDurationHours = (start: string, end: string) => {
  const minutes = toMinutes(end) - toMinutes(start);
  if (minutes <= 0) return 0;
  return minutes / 60;
};

const dayLabel = (value: string) =>
  DAY_OPTIONS.find((day) => day.value === value)?.label ?? `Day ${value}`;

const fullName = (faculty: FTLFaculty | null) => {
  if (!faculty) return "";

  const parts = [faculty.first_name, faculty.middle_name, faculty.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (!parts) return "Unknown Faculty";
  return faculty.extension ? `${parts}, ${faculty.extension}` : parts;
};

const formatTermLabel = (term: FTLBootstrapData["terms"][number]) => {
  return `${term.code} • AY ${term.academic_year_start}-${term.academic_year_end} • ${term.term_order}`;
};

type ProgramChairPlannerProps = {
  bootstrap: FTLBootstrapData;
  initialFaculty: FTLFaculty[];
};

type SessionDraft = {
  class_delivery_id: string;
  block_ids: string[];
  session_id?: string;
  room_id: string;
  day:
    | "SUNDAY"
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY";
  start_time: string;
  end_time: string;
};

type SessionTableRow = {
  row_id: string;
  class_delivery_id: string;
  course_label: string;
  major_label: string;
  block_label: string;
  remaining_hours: number;
  has_session: boolean;
  session?: FTLSession;
};

type ConfirmDialogState = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "default" | "destructive" | "outline" | "secondary";
  onConfirm: () => void | Promise<void>;
};

const ProgramChairPlanner = ({
  bootstrap,
  initialFaculty,
}: ProgramChairPlannerProps) => {
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(
    null,
  );
  const [selectedCampusIds, setSelectedCampusIds] = useState<string[]>([]);

  const [faculties] = useState<FTLFaculty[]>(initialFaculty);
  const [offeringOptions, setOfferingOptions] = useState<FTLOfferingOption[]>(
    [],
  );
  const [rooms, setRooms] = useState<FTLRoom[]>([]);
  const [scheduleBundle, setScheduleBundle] = useState<FTLScheduleBundle>({
    schedule: null,
    classes: [],
  });

  const [facultyQuery, setFacultyQuery] = useState("");
  const [termQuery, setTermQuery] = useState("");
  const [campusQuery, setCampusQuery] = useState("");
  const [offeringQuery, setOfferingQuery] = useState("");

  const [isFacultyPickerOpen, setIsFacultyPickerOpen] = useState(false);
  const [isTermPickerOpen, setIsTermPickerOpen] = useState(false);
  const [isCampusPickerOpen, setIsCampusPickerOpen] = useState(false);
  const [isOfferingPickerOpen, setIsOfferingPickerOpen] = useState(false);

  const [isLoadingOfferings, setIsLoadingOfferings] = useState(false);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: "error" | "success";
    text: string;
  } | null>(null);

  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [sessionDraft, setSessionDraft] = useState<SessionDraft | null>(null);
  const [newSessionDraft, setNewSessionDraft] = useState<SessionDraft>({
    class_delivery_id: "",
    block_ids: [],
    room_id: "",
    day: "MONDAY",
    start_time: "07:30",
    end_time: "09:00",
  });

  const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);
  const [pendingSessionInput, setPendingSessionInput] =
    useState<SaveSessionInput | null>(null);
  const [conflicts, setConflicts] = useState<SessionConflict[]>([]);

  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);
  const [mergeSourceClassId, setMergeSourceClassId] = useState<string | null>(
    null,
  );
  const [mergeTargetClassId, setMergeTargetClassId] = useState<string | null>(
    null,
  );

  const [isUnmergeDialogOpen, setIsUnmergeDialogOpen] = useState(false);
  const [unmergeSourceClassId, setUnmergeSourceClassId] = useState<
    string | null
  >(null);
  const [unmergeBlockId, setUnmergeBlockId] = useState<string | null>(null);
  const [confirmDialogState, setConfirmDialogState] =
    useState<ConfirmDialogState | null>(null);

  const selectedFaculty = useMemo(
    () => faculties.find((item) => item.id === selectedFacultyId) ?? null,
    [faculties, selectedFacultyId],
  );

  const filteredFaculty = useMemo(() => {
    const query = facultyQuery.trim().toLowerCase();
    if (!query) return faculties;

    return faculties.filter((item) => {
      const name =
        `${item.first_name} ${item.middle_name ?? ""} ${item.last_name}`
          .toLowerCase()
          .replace(/\s+/g, " ")
          .trim();

      return name.includes(query);
    });
  }, [faculties, facultyQuery]);

  const selectedFacultyDesignationLoad =
    selectedFaculty?.total_designation_load ?? 0;

  const teachingLoadTotal = useMemo(
    () =>
      scheduleBundle.classes.reduce(
        (sum, item) =>
          sum + (item.lecture_hour ?? 0) + (item.laboratory_hour ?? 0) * 0.75,
        0,
      ),
    [scheduleBundle.classes],
  );

  const totalWorkingLoad = teachingLoadTotal + selectedFacultyDesignationLoad;

  const filteredTerms = useMemo(() => {
    const query = termQuery.trim().toLowerCase();
    if (!query) return bootstrap.terms;

    return bootstrap.terms.filter((term) =>
      formatTermLabel(term).toLowerCase().includes(query),
    );
  }, [bootstrap.terms, termQuery]);

  const filteredCampuses = useMemo(() => {
    const query = campusQuery.trim().toLowerCase();
    if (!query) return bootstrap.campuses;

    return bootstrap.campuses.filter((campus) =>
      campus.name.toLowerCase().includes(query),
    );
  }, [bootstrap.campuses, campusQuery]);

  const filteredOfferingOptions = useMemo(() => {
    const query = offeringQuery.trim().toLowerCase();
    if (!query) return offeringOptions;

    return offeringOptions.filter((item) => {
      const summary =
        `${item.course_code} ${item.course_title} ${item.program_code ?? ""} ${item.major_code ?? ""} ${item.block_label} ${item.campus_name}`
          .toLowerCase()
          .replace(/\s+/g, " ")
          .trim();

      return summary.includes(query);
    });
  }, [offeringOptions, offeringQuery]);

  const groupedConflicts = useMemo(
    () => ({
      FACULTY: conflicts.filter((item) => item.type === "FACULTY"),
      ROOM: conflicts.filter((item) => item.type === "ROOM"),
      BLOCK: conflicts.filter((item) => item.type === "BLOCK"),
    }),
    [conflicts],
  );

  const classLoadSummaryMap = useMemo(() => {
    return new Map(
      scheduleBundle.classes.map((item) => {
        const required =
          (item.lecture_hour ?? 0) + (item.laboratory_hour ?? 0) * 0.75;
        const scheduled = item.sessions.reduce(
          (sum, session) =>
            sum + sessionDurationHours(session.start_time, session.end_time),
          0,
        );

        return [
          item.id,
          {
            required,
            scheduled,
            remaining: Math.max(required - scheduled, 0),
          },
        ];
      }),
    );
  }, [scheduleBundle.classes]);

  const sessionTableRows = useMemo<SessionTableRow[]>(() => {
    const scheduledRows: SessionTableRow[] = [];
    const unscheduledRows: SessionTableRow[] = [];

    for (const item of scheduleBundle.classes) {
      const courseLabel = `${item.course_code}`;
      const majorLabel = [
        item.program_code ?? "N/A",
        item.major_code ?? "N/A",
      ].join(" | ");
      const blockLabel = item.year_section ?? "No Block";
      const remainingHours = classLoadSummaryMap.get(item.id)?.remaining ?? 0;

      for (const session of item.sessions) {
        scheduledRows.push({
          row_id: session.id,
          class_delivery_id: item.id,
          course_label: courseLabel,
          major_label: majorLabel,
          block_label: blockLabel,
          remaining_hours: remainingHours,
          has_session: true,
          session,
        });
      }

      if (item.sessions.length === 0 || remainingHours > 0) {
        unscheduledRows.push({
          row_id: `placeholder-${item.id}`,
          class_delivery_id: item.id,
          course_label: courseLabel,
          major_label: majorLabel,
          block_label: blockLabel,
          remaining_hours: remainingHours,
          has_session: false,
        });
      }
    }

    unscheduledRows.sort((a, b) => {
      if (a.remaining_hours !== b.remaining_hours) {
        return b.remaining_hours - a.remaining_hours;
      }

      return a.course_label.localeCompare(b.course_label);
    });

    return [...scheduledRows, ...unscheduledRows];
  }, [classLoadSummaryMap, scheduleBundle.classes]);

  const classByIdMap = useMemo(
    () =>
      new Map(scheduleBundle.classes.map((item) => [item.id, item] as const)),
    [scheduleBundle.classes],
  );

  const mergeTargetsByClassId = useMemo(() => {
    const grouped = new Map<string, FTLClass[]>();

    for (const item of scheduleBundle.classes) {
      const key = item.course_code.trim().toUpperCase();
      const bucket = grouped.get(key) ?? [];
      bucket.push(item);
      grouped.set(key, bucket);
    }

    const targetsById = new Map<string, FTLClass[]>();

    for (const group of grouped.values()) {
      if (group.length < 2) continue;

      for (const item of group) {
        targetsById.set(
          item.id,
          group.filter((candidate) => candidate.id !== item.id),
        );
      }
    }

    return targetsById;
  }, [scheduleBundle.classes]);

  const classDeliveryOptions = useMemo(
    () =>
      scheduleBundle.classes
        .map((item) => ({
          class_delivery_id: item.id,
          block_ids: item.block_ids,
          label: `${item.course_code} (${item.year_section ?? "No Block"})`,
          remaining: classLoadSummaryMap.get(item.id)?.remaining ?? 0,
        }))
        .filter((item) => item.remaining > 0)
        .sort((a, b) => b.remaining - a.remaining),
    [classLoadSummaryMap, scheduleBundle.classes],
  );

  const newSessionRemainingHours =
    classLoadSummaryMap.get(newSessionDraft.class_delivery_id)?.remaining ??
    null;

  const addDisabledReason = !newSessionDraft.class_delivery_id
    ? "Select a class course first."
    : (newSessionRemainingHours ?? 0) <= 0
      ? "Selected class course is fully scheduled."
      : isSaving
        ? "Saving in progress."
        : null;

  const isAddDisabled = addDisabledReason !== null;

  const mergeSourceClass = mergeSourceClassId
    ? (classByIdMap.get(mergeSourceClassId) ?? null)
    : null;

  const mergeTargetOptions = mergeSourceClassId
    ? (mergeTargetsByClassId.get(mergeSourceClassId) ?? [])
    : [];

  const unmergeSourceClass = unmergeSourceClassId
    ? (classByIdMap.get(unmergeSourceClassId) ?? null)
    : null;

  const pickDefaultClassForAdd = (classes: FTLClass[]) => {
    const sorted = [...classes]
      .map((item) => {
        const required =
          (item.lecture_hour ?? 0) + (item.laboratory_hour ?? 0) * 0.75;
        const scheduled = item.sessions.reduce(
          (sum, session) =>
            sum + sessionDurationHours(session.start_time, session.end_time),
          0,
        );

        return {
          class_delivery_id: item.id,
          block_ids: item.block_ids,
          remaining: Math.max(required - scheduled, 0),
        };
      })
      .filter((item) => item.remaining > 0)
      .sort((a, b) => b.remaining - a.remaining);

    return sorted[0] ?? null;
  };

  const loadTermCampusDataFor = async (
    termId: string | null,
    campusIds: string[],
  ) => {
    const dedupedCampusIds = Array.from(new Set(campusIds.filter(Boolean)));

    if (!termId || dedupedCampusIds.length === 0) {
      setOfferingOptions([]);
      setRooms([]);
      return;
    }

    setIsLoadingOfferings(true);

    const [nextOfferings, roomGroups] = await Promise.all([
      getOfferedCourseOptionsByTermCampuses(termId, dedupedCampusIds),
      Promise.all(
        dedupedCampusIds.map((campusId) => getRoomsByCampus(campusId)),
      ),
    ]);

    const nextRooms = Array.from(
      new Map(roomGroups.flat().map((room) => [room.id, room])).values(),
    );

    setOfferingOptions(nextOfferings);
    setRooms(nextRooms);
    setIsLoadingOfferings(false);
  };

  const loadScheduleFor = async (
    facultyId: string | null,
    termId: string | null,
  ) => {
    if (!facultyId || !termId) {
      setScheduleBundle({ schedule: null, classes: [] });
      setSelectedCampusIds([]);
      await loadTermCampusDataFor(termId, []);
      return;
    }

    setIsLoadingSchedule(true);
    const bundle = await getFacultyScheduleBundle(facultyId, termId);
    setScheduleBundle(bundle);

    const defaultClass = pickDefaultClassForAdd(bundle.classes);
    setNewSessionDraft((prev) => ({
      ...prev,
      class_delivery_id: defaultClass?.class_delivery_id ?? "",
      block_ids: defaultClass?.block_ids ?? [],
    }));

    const campusIdsFromBundle = Array.from(
      new Set(bundle.classes.flatMap((item) => item.campus_ids ?? [])),
    );
    setSelectedCampusIds(campusIdsFromBundle);
    await loadTermCampusDataFor(termId, campusIdsFromBundle);

    setIsLoadingSchedule(false);
  };

  const refreshScheduleBundle = async () => {
    if (!selectedFacultyId || !selectedTermId) return null;

    const refreshed = await getFacultyScheduleBundle(
      selectedFacultyId,
      selectedTermId,
    );
    setScheduleBundle(refreshed);

    const defaultClass = pickDefaultClassForAdd(refreshed.classes);
    setNewSessionDraft((prev) => ({
      ...prev,
      class_delivery_id:
        prev.class_delivery_id &&
        refreshed.classes.some((item) => item.id === prev.class_delivery_id)
          ? prev.class_delivery_id
          : (defaultClass?.class_delivery_id ?? ""),
      block_ids:
        prev.class_delivery_id &&
        refreshed.classes.some((item) => item.id === prev.class_delivery_id)
          ? (refreshed.classes.find(
              (item) => item.id === prev.class_delivery_id,
            )?.block_ids ?? [])
          : (defaultClass?.block_ids ?? []),
    }));

    return refreshed;
  };

  const handleCampusSelectionChange = async (
    nextCampusIds: string[],
    skipConfirmation = false,
  ) => {
    const uniqueCampusIds = Array.from(new Set(nextCampusIds.filter(Boolean)));
    const removedCampusIds = selectedCampusIds.filter(
      (campusId) => !uniqueCampusIds.includes(campusId),
    );

    if (
      !skipConfirmation &&
      scheduleBundle.schedule &&
      removedCampusIds.length > 0
    ) {
      const affectedClasses = scheduleBundle.classes.filter((item) =>
        item.campus_ids.some((campusId) => removedCampusIds.includes(campusId)),
      );
      const affectedSessions = affectedClasses.reduce(
        (sum, item) => sum + item.sessions.length,
        0,
      );
      const removedCampusNames = removedCampusIds
        .map(
          (campusId) =>
            bootstrap.campuses.find((item) => item.id === campusId)?.name ??
            campusId,
        )
        .join(", ");

      setConfirmDialogState({
        title: "Remove campus and dependent schedule data?",
        description: `Removing campus (${removedCampusNames}) will remove ${affectedClasses.length} class row(s) and ${affectedSessions} session(s) from this schedule.`,
        confirmLabel: "Remove Campus",
        confirmVariant: "destructive",
        onConfirm: async () => {
          setConfirmDialogState(null);
          await handleCampusSelectionChange(uniqueCampusIds, true);
        },
      });
      return;
    }

    setSelectedCampusIds(uniqueCampusIds);
    await loadTermCampusDataFor(selectedTermId, uniqueCampusIds);

    if (!scheduleBundle.schedule || removedCampusIds.length === 0) {
      return;
    }

    setIsSaving(true);
    const pruneResult = await pruneScheduleByCampuses({
      schedule_id: scheduleBundle.schedule.id,
      campus_ids: uniqueCampusIds,
      expected_schedule_updated_at: scheduleBundle.schedule.updated_at,
    });

    if (pruneResult.error) {
      setFeedback({ kind: "error", text: pruneResult.error });
      setIsSaving(false);
      return;
    }

    await refreshScheduleBundle();
    setIsSaving(false);
  };

  const requireSchedule = async () => {
    if (!selectedFacultyId || !selectedTermId) return null;

    if (scheduleBundle.schedule) return scheduleBundle.schedule;

    setIsSaving(true);
    const bundle = await findOrCreateSchedule(
      selectedFacultyId,
      selectedTermId,
    );
    setScheduleBundle(bundle);
    setIsSaving(false);

    if (!bundle.schedule) {
      setFeedback({ kind: "error", text: "Unable to create schedule." });
      return null;
    }

    return bundle.schedule;
  };

  const handleAddOfferingToSchedule = async (option: FTLOfferingOption) => {
    const schedule = await requireSchedule();
    if (!schedule) return;

    setIsSaving(true);
    setFeedback(null);

    const result = await createClass({
      schedule_id: schedule.id,
      course_offering_id: option.course_offering_id,
      block_id: option.block_id,
      expected_schedule_updated_at: schedule.updated_at,
    });

    if (result.error) {
      setFeedback({ kind: "error", text: result.error });
      setIsSaving(false);
      return;
    }

    await refreshScheduleBundle();
    await loadTermCampusDataFor(selectedTermId, selectedCampusIds);
    setIsOfferingPickerOpen(false);
    setIsSaving(false);
    setFeedback({ kind: "success", text: "Course added to schedule" });
  };

  const handleRemoveClassFromSchedule = async (item: FTLClass) => {
    if (!scheduleBundle.schedule) return;

    const sessionCount = item.sessions.length;
    const blockSummary =
      item.year_section ?? item.blocks.map((block) => block.label).join(", ");

    setConfirmDialogState({
      title: "Remove class row from schedule?",
      description: `Remove class row ${item.course_code} (${blockSummary || "No Block"}) from Step 2? Impact: 1 class row removed and ${sessionCount} session(s) removed.`,
      confirmLabel: "Remove Class",
      confirmVariant: "destructive",
      onConfirm: async () => {
        setConfirmDialogState(null);
        setIsSaving(true);
        const result = await deleteClass({
          class_id: item.id,
          schedule_id: scheduleBundle.schedule!.id,
          expected_schedule_updated_at: scheduleBundle.schedule!.updated_at,
        });

        if (result.error) {
          setFeedback({ kind: "error", text: result.error });
          setIsSaving(false);
          return;
        }

        await refreshScheduleBundle();
        await loadTermCampusDataFor(selectedTermId, selectedCampusIds);
        setIsSaving(false);
        setFeedback({
          kind: "success",
          text: `${item.course_code} class row removed from schedule`,
        });
      },
    });
    return;
  };

  const openMergeDialog = (classDeliveryId: string) => {
    const targets = mergeTargetsByClassId.get(classDeliveryId) ?? [];
    if (targets.length === 0) return;

    setMergeSourceClassId(classDeliveryId);
    setMergeTargetClassId(targets[0]?.id ?? null);
    setIsMergeDialogOpen(true);
  };

  const handleMergeClasses = async () => {
    if (
      !scheduleBundle.schedule ||
      !mergeSourceClassId ||
      !mergeTargetClassId
    ) {
      return;
    }

    setIsSaving(true);
    const result = await mergeClassDeliveries({
      schedule_id: scheduleBundle.schedule.id,
      source_class_id: mergeSourceClassId,
      target_class_id: mergeTargetClassId,
      expected_schedule_updated_at: scheduleBundle.schedule.updated_at,
    });

    if (result.error) {
      setFeedback({ kind: "error", text: result.error });
      setIsSaving(false);
      return;
    }

    await refreshScheduleBundle();
    setIsMergeDialogOpen(false);
    setMergeSourceClassId(null);
    setMergeTargetClassId(null);
    setIsSaving(false);
    setFeedback({ kind: "success", text: "Classes merged successfully" });
  };

  const openUnmergeDialog = (classDeliveryId: string) => {
    const ownerClass = classByIdMap.get(classDeliveryId);
    if (!ownerClass || ownerClass.blocks.length <= 1) return;

    setUnmergeSourceClassId(classDeliveryId);
    setUnmergeBlockId(ownerClass.blocks[0]?.id ?? null);
    setIsUnmergeDialogOpen(true);
  };

  const handleUnmergeClass = async () => {
    if (!scheduleBundle.schedule || !unmergeSourceClassId || !unmergeBlockId) {
      return;
    }

    setIsSaving(true);
    const result = await unmergeClassBlock({
      schedule_id: scheduleBundle.schedule.id,
      class_id: unmergeSourceClassId,
      block_id: unmergeBlockId,
      expected_schedule_updated_at: scheduleBundle.schedule.updated_at,
      remove_sessions: true,
    });

    if (result.error) {
      setFeedback({ kind: "error", text: result.error });
      setIsSaving(false);
      return;
    }

    await refreshScheduleBundle();
    setIsUnmergeDialogOpen(false);
    setUnmergeSourceClassId(null);
    setUnmergeBlockId(null);
    setIsSaving(false);
    setFeedback({ kind: "success", text: "Class unmerged successfully" });
  };

  const seedNewSessionDraft = (classDeliveryId: string) => {
    const selectedClass = scheduleBundle.classes.find(
      (item) => item.id === classDeliveryId,
    );

    setNewSessionDraft((prev) => ({
      ...prev,
      class_delivery_id: classDeliveryId,
      block_ids: selectedClass?.block_ids ?? [],
      room_id: prev.room_id,
    }));
  };

  const handleAddSessionRow = async () => {
    if (!newSessionDraft.class_delivery_id) {
      setFeedback({
        kind: "error",
        text: "Select class course before adding session.",
      });
      return;
    }

    if (!newSessionDraft.room_id) {
      setFeedback({ kind: "error", text: "Room is required." });
      return;
    }

    if (newSessionDraft.end_time <= newSessionDraft.start_time) {
      setFeedback({
        kind: "error",
        text: "End time must be later than start time.",
      });
      return;
    }

    if ((newSessionRemainingHours ?? 0) <= 0) {
      setFeedback({
        kind: "error",
        text: "Selected course is fully scheduled.",
      });
      return;
    }

    setIsSaving(true);
    await attemptSaveSession(newSessionDraft, false);
    setIsSaving(false);

    setNewSessionDraft((prev) => ({
      ...prev,
      room_id: "",
      start_time: "07:30",
      end_time: "09:00",
    }));
  };

  const openEditSessionDialog = async (item: FTLClass, session: FTLSession) => {
    const campusIds =
      item.campus_ids.length > 0 ? item.campus_ids : selectedCampusIds;
    if (campusIds.length > 0) {
      const roomGroups = await Promise.all(
        campusIds.map((campusId) => getRoomsByCampus(campusId)),
      );
      const campusRooms = Array.from(
        new Map(roomGroups.flat().map((room) => [room.id, room])).values(),
      );
      setRooms(campusRooms);
    }

    setSessionDraft({
      class_delivery_id: item.id,
      block_ids: item.block_ids,
      session_id: session.id,
      room_id: session.room_id,
      day: session.day,
      start_time: toTimeInput(session.start_time),
      end_time: toTimeInput(session.end_time),
    });
    setIsSessionDialogOpen(true);
  };

  const attemptSaveSession = async (
    draft: SessionDraft,
    saveAnyway: boolean,
  ) => {
    if (!scheduleBundle.schedule || !selectedFacultyId) return;

    const ownerClass = scheduleBundle.classes.find(
      (item) => item.id === draft.class_delivery_id,
    );

    const input: SaveSessionInput = {
      session_id: draft.session_id,
      class_delivery_id: draft.class_delivery_id,
      schedule_id: scheduleBundle.schedule.id,
      academic_term_id: scheduleBundle.schedule.academic_term_id,
      faculty_user_id: selectedFacultyId,
      block_ids: ownerClass?.block_ids ?? draft.block_ids,
      room_id: draft.room_id,
      day: draft.day,
      start_time: draft.start_time,
      end_time: draft.end_time,
      expected_schedule_updated_at: scheduleBundle.schedule.updated_at,
      save_anyway: saveAnyway,
    };

    const result = await saveSession(input);

    if (result.error) {
      setFeedback({ kind: "error", text: result.error });
      return;
    }

    if (result.needs_conflict_confirmation) {
      setPendingSessionInput(input);
      setConflicts(result.conflicts);
      setIsConflictDialogOpen(true);
      return;
    }

    setIsSessionDialogOpen(false);
    setIsConflictDialogOpen(false);
    setPendingSessionInput(null);
    setConflicts([]);

    const refreshed = await refreshScheduleBundle();
    if (!refreshed) return;

    if (result.session) {
      const nextClasses = refreshed.classes.map((item) => ({
        ...item,
        sessions: item.sessions.map((session) =>
          session.id === result.session?.id
            ? { ...session, last_conflict_count: result.conflicts.length }
            : session,
        ),
      }));

      setScheduleBundle({ ...refreshed, classes: nextClasses });
    } else {
      setScheduleBundle(refreshed);
    }

    setFeedback({
      kind: "success",
      text:
        result.conflicts.length > 0
          ? "Session saved with conflicts"
          : "Session saved",
    });
  };

  const handleSaveSession = async () => {
    if (!sessionDraft) return;

    if (!sessionDraft.room_id) {
      setFeedback({
        kind: "error",
        text: "Room is required.",
      });
      return;
    }

    if (sessionDraft.end_time <= sessionDraft.start_time) {
      setFeedback({
        kind: "error",
        text: "End time must be later than start time.",
      });
      return;
    }

    setIsSaving(true);
    await attemptSaveSession(sessionDraft, false);
    setIsSaving(false);
  };

  const handleSaveAnyway = async () => {
    if (!pendingSessionInput) return;

    setIsSaving(true);
    const result = await saveSession({
      ...pendingSessionInput,
      save_anyway: true,
    });

    if (result.error) {
      setFeedback({ kind: "error", text: result.error });
      setIsSaving(false);
      return;
    }

    const refreshed = await refreshScheduleBundle();
    if (!refreshed) {
      setIsSaving(false);
      return;
    }

    if (result.session) {
      const nextClasses = refreshed.classes.map((item) => ({
        ...item,
        sessions: item.sessions.map((session) =>
          session.id === result.session?.id
            ? { ...session, last_conflict_count: result.conflicts.length }
            : session,
        ),
      }));

      setScheduleBundle({ ...refreshed, classes: nextClasses });
    } else {
      setScheduleBundle(refreshed);
    }

    setIsConflictDialogOpen(false);
    setIsSessionDialogOpen(false);
    setPendingSessionInput(null);
    setConflicts([]);
    setIsSaving(false);
    setFeedback({ kind: "success", text: "Session saved with conflicts" });
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!scheduleBundle.schedule) return;

    setConfirmDialogState({
      title: "Delete this session?",
      description: "This action cannot be undone.",
      confirmLabel: "Delete Session",
      confirmVariant: "destructive",
      onConfirm: async () => {
        setConfirmDialogState(null);
        setIsSaving(true);
        const result = await deleteSession({
          session_id: sessionId,
          schedule_id: scheduleBundle.schedule!.id,
          expected_schedule_updated_at: scheduleBundle.schedule!.updated_at,
        });

        if (result.error) {
          setFeedback({ kind: "error", text: result.error });
          setIsSaving(false);
          return;
        }

        await refreshScheduleBundle();
        setIsSaving(false);
        setFeedback({ kind: "success", text: "Session deleted" });
      },
    });
  };

  const handleSubmitSchedule = async () => {
    if (!scheduleBundle.schedule || selectedCampusIds.length === 0) return;

    setIsSaving(true);
    const result = await submitScheduleForCampusDirectors({
      schedule_id: scheduleBundle.schedule.id,
      campus_ids: selectedCampusIds,
    });

    if (result.error) {
      setFeedback({ kind: "error", text: result.error });
      setIsSaving(false);
      return;
    }

    await refreshScheduleBundle();
    setIsSaving(false);

    if (result.missing_directors.length > 0) {
      setFeedback({
        kind: "error",
        text: `Submitted to ${result.submitted_campus_count} campus director(s). Missing director designation for: ${result.missing_directors
          .map((item) => item.campus_name)
          .join(", ")}`,
      });
      return;
    }

    setFeedback({
      kind: "success",
      text: `Schedule submitted to ${result.submitted_campus_count} campus director(s).`,
    });
  };

  const conflictBadgeClass = (type: ConflictType) => {
    if (type === "FACULTY") return "border-red-300 bg-red-50 text-red-700";
    if (type === "ROOM") return "border-amber-300 bg-amber-50 text-amber-700";
    return "border-orange-300 bg-orange-50 text-orange-700";
  };

  const severityBadgeClass = (severity: SessionConflict["severity"]) => {
    if (severity === "HIGH") return "border-red-300 bg-red-50 text-red-700";
    return "border-amber-300 bg-amber-50 text-amber-700";
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden p-4">
      {feedback ? (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${
            feedback.kind === "error"
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-emerald-300 bg-emerald-50 text-emerald-700"
          }`}
        >
          {feedback.text}
        </div>
      ) : null}

      <div className={cn("h-full overflow-hidden", "grid grid-cols-4 gap-4")}>
        <div className="flex flex-col gap-4 h-full overflow-hidden">
          <Card className="gap-2">
            <CardHeader className="gap-0">
              <CardTitle>Step 1: Set Context</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 overflow-auto">
              <div className="space-y-1">
                <p className="text-xs text-foreground/70">Faculty</p>
                {selectedFaculty ? (
                  <div
                    key={selectedFaculty.id}
                    className="rounded-md w-full border flex flex-row items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 p-4 text-sm">
                      <UserCircle className="h-6 w-6 text-foreground/70" />
                      <p>{fullName(selectedFaculty)}</p>
                    </div>
                    <button
                      className="p-4"
                      onClick={() => {
                        setSelectedFacultyId(null);
                        setSelectedTermId(null);
                        setSelectedCampusIds([]);
                        setOfferingOptions([]);
                        setRooms([]);
                        setScheduleBundle({ schedule: null, classes: [] });
                      }}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ) : null}

                {!selectedFaculty && (
                  <AddTile
                    title="Select Faculty"
                    description="Open searchable faculty list"
                    onClick={() => setIsFacultyPickerOpen(true)}
                  />
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs text-foreground/70">Academic Term</p>
                {selectedTermId ? (
                  <div
                    key={selectedTermId}
                    className="rounded-md w-full border flex flex-row items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 p-4 text-xs">
                      <Calendar className="h-6 w-6 text-foreground/70" />
                      <p>
                        {bootstrap.terms.find(
                          (term) => term.id === selectedTermId,
                        )?.code ?? ""}
                      </p>
                    </div>
                    <button
                      className="p-4"
                      onClick={() => {
                        setSelectedTermId(null);
                        setSelectedCampusIds([]);
                        setOfferingOptions([]);
                        setRooms([]);
                        setScheduleBundle({ schedule: null, classes: [] });
                      }}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ) : null}

                {!selectedTermId && (
                  <AddTile
                    title="Select Academic Term"
                    description="Open searchable term list"
                    onClick={() => setIsTermPickerOpen(true)}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 gap-2 overflow-hidden flex flex-col">
            <CardHeader className="pb-2 gap-0">
              <CardTitle className="text-base">
                Step 2: Manage Teaching Load
              </CardTitle>
            </CardHeader>
            <CardContent className="min-h-0 overflow-auto space-y-3">
              <div className="space-y-1">
                <p className="text-xs text-foreground/70">Campuses</p>
                {selectedCampusIds.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedCampusIds.map((campusId) => {
                      const campus = bootstrap.campuses.find(
                        (item) => item.id === campusId,
                      );
                      if (!campus) return null;

                      return (
                        <div
                          key={campusId}
                          className="rounded-md w-full border flex flex-row items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 p-4 text-sm">
                            <Landmark className="h-6 w-6 text-foreground/70" />
                            <p>{campus.name}</p>
                          </div>
                          <button
                            className="p-4"
                            onClick={() => {
                              const nextCampusIds = selectedCampusIds.filter(
                                (item) => item !== campusId,
                              );
                              void handleCampusSelectionChange(nextCampusIds);
                            }}
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
                <AddTile
                  title="Add Campus"
                  description="Select one or more campuses"
                  onClick={() => setIsCampusPickerOpen(true)}
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs text-foreground/70">Classes</p>

                {scheduleBundle.classes.map((item) => (
                  <div
                    key={`${item.id}-${item.course_offering_id}`}
                    className="rounded-md w-full border flex flex-row items-center justify-between gap-2"
                  >
                    <div className="p-3 text-sm">
                      <div className="flex flex-row gap-2 items-center">
                        <p className="font-medium">{item.course_code}</p>
                        <p className="text-xs text-foreground/70">
                          {item.program_code ?? "N/A"}{" "}
                          {item.major_code ?? "N/A"} {" | "}
                          {item.year_section ?? "No Block"}
                        </p>
                      </div>
                      <p className="text-xs text-foreground/70">
                        {`Load: ${(item.lecture_hour ?? 0) + (item.laboratory_hour ?? 0) * 0.75} ${(item.laboratory_hour ?? 0) * 0.75} = Lecture: ${item.lecture_hour ?? 0} + Laboratory: ${item.laboratory_hour ?? 0} × 0.75`}
                      </p>
                      <p className="text-xs text-emerald-700">
                        {(item.blocks.length ?? 0) > 1
                          ? `Merged Class with ${item.blocks.length} blocks`
                          : "Single class delivery"}
                      </p>
                    </div>

                    <div className="p-2 flex flex-col items-center justify-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void handleRemoveClassFromSchedule(item)}
                        disabled={isSaving}
                        title="unassign this class from the faculty schedule"
                      >
                        <X className="h-5 w-5" />
                      </Button>

                      {(mergeTargetsByClassId.get(item.id)?.length ?? 0) > 0 ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openMergeDialog(item.id)}
                          disabled={isSaving}
                          title="Merge into another same-course class"
                        >
                          <Merge className="h-4 w-4" />
                        </Button>
                      ) : null}

                      {(item.blocks.length ?? 0) > 1 ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openUnmergeDialog(item.id)}
                          disabled={isSaving}
                          title="Unmerge into separate classes"
                        >
                          <Split className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}

                {!isLoadingOfferings &&
                selectedTermId &&
                selectedCampusIds.length > 0 &&
                offeringOptions.length === 0 ? (
                  <p className="rounded-md border border-dashed px-3 py-4 text-sm text-foreground/70">
                    No offered courses found for selected term and campuses.
                  </p>
                ) : null}

                <AddTile
                  title="Add Class"
                  description="Open searchable class list"
                  onClick={() => setIsOfferingPickerOpen(true)}
                  disabled={
                    !selectedFacultyId ||
                    !selectedTermId ||
                    selectedCampusIds.length === 0
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-3 flex flex-col gap-4 overflow-hidden">
          <Card className="flex-1 overflow-hidden flex-col gap-0">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">
                    Step 3: Construct Schedule
                  </CardTitle>
                </div>
              </div>
            </CardHeader>

            <CardContent className="min-h-0 overflow-y-auto space-y-3">
              {isLoadingSchedule ? (
                <p className="text-sm text-foreground/70">
                  Loading schedule...
                </p>
              ) : null}

              {!isLoadingSchedule &&
              selectedFacultyId &&
              !scheduleBundle.schedule ? (
                <div className="rounded-md border border-dashed p-4">
                  <p className="text-sm text-foreground/70 mb-3">
                    No schedule yet for this faculty and term.
                  </p>
                  <Button
                    size="sm"
                    onClick={async () => {
                      if (!selectedFacultyId || !selectedTermId) return;

                      setIsSaving(true);
                      const bundle = await findOrCreateSchedule(
                        selectedFacultyId,
                        selectedTermId,
                      );
                      setScheduleBundle(bundle);
                      setIsSaving(false);
                    }}
                    disabled={!selectedTermId || isSaving}
                  >
                    Create Schedule
                  </Button>
                </div>
              ) : null}

              {scheduleBundle.schedule ? (
                <div className="space-y-3">
                  {scheduleBundle.classes.length === 0 ? (
                    <p className="rounded-md border border-dashed px-3 py-4 text-sm text-foreground/70">
                      No classes yet. Add at least one class to begin scheduling
                      sessions.
                    </p>
                  ) : (
                    <div className="space-y-2 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-foreground/70">
                            <th className="px-1.5 py-1.5">Class Course</th>
                            <th className="px-1.5 py-1.5 min-w-40">
                              Program Major | Block
                            </th>
                            <th className="px-1.5 py-1.5">Day</th>
                            <th className="px-1.5 py-1.5">Start</th>
                            <th className="px-1.5 py-1.5">End</th>
                            <th className="px-1.5 py-1.5 min-w-28">Room</th>
                            <th className="px-1.5 py-1.5 text-left min-w-20">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b bg-muted/20 align-center">
                            <td className="px-1.5 py-1.5">
                              <select
                                className="w-32 rounded-md border bg-background px-2 py-1.5 text-sm"
                                value={newSessionDraft.class_delivery_id}
                                onChange={(event) =>
                                  seedNewSessionDraft(event.target.value)
                                }
                              >
                                <option value="">Select Course</option>
                                {classDeliveryOptions.map((item) => (
                                  <option
                                    key={item.class_delivery_id}
                                    value={item.class_delivery_id}
                                  >
                                    {item.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-1.5 py-1.5 text-xs text-foreground/70 min-w-32">
                              <p>
                                {newSessionDraft.class_delivery_id
                                  ? `Unscheduled: ${newSessionRemainingHours?.toFixed(2) ?? "0.00"} Hours`
                                  : "Select a class course first"}
                              </p>
                            </td>
                            <td className="px-1.5 py-1.5">
                              <select
                                className="w-20 rounded-md border bg-background px-2 py-1.5 text-sm"
                                value={newSessionDraft.day}
                                onChange={(event) =>
                                  setNewSessionDraft((prev) => ({
                                    ...prev,
                                    day: event.target
                                      .value as SessionDraft["day"],
                                  }))
                                }
                              >
                                {DAY_OPTIONS.map((item) => (
                                  <option key={item.value} value={item.value}>
                                    {item.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-1.5 py-1.5">
                              <Input
                                type="time"
                                value={newSessionDraft.start_time}
                                onChange={(event) =>
                                  setNewSessionDraft((prev) => ({
                                    ...prev,
                                    start_time: event.target.value,
                                  }))
                                }
                              />
                            </td>
                            <td className="px-1.5 py-1.5">
                              <Input
                                type="time"
                                value={newSessionDraft.end_time}
                                onChange={(event) =>
                                  setNewSessionDraft((prev) => ({
                                    ...prev,
                                    end_time: event.target.value,
                                  }))
                                }
                              />
                            </td>
                            <td className="px-1.5 py-1.5">
                              <select
                                className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                                value={newSessionDraft.room_id}
                                onChange={(event) =>
                                  setNewSessionDraft((prev) => ({
                                    ...prev,
                                    room_id: event.target.value,
                                  }))
                                }
                              >
                                <option value="">Select room</option>
                                {rooms.map((room) => (
                                  <option key={room.id} value={room.id}>
                                    {room.code}{" "}
                                    {room.name ? `- ${room.name}` : ""}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-1.5 py-1.5 text-right">
                              <span
                                className="inline-flex w-full"
                                title={
                                  isAddDisabled ? addDisabledReason : undefined
                                }
                              >
                                <Button
                                  size="sm"
                                  onClick={() => void handleAddSessionRow()}
                                  disabled={isAddDisabled}
                                  className="w-full"
                                >
                                  <Plus className="h-4 w-4 text-background" />
                                  Insert
                                </Button>
                              </span>
                            </td>
                          </tr>

                          {sessionTableRows.map((row) => {
                            const ownerClass = classByIdMap.get(
                              row.class_delivery_id,
                            );

                            return (
                              <tr
                                key={row.row_id}
                                className="border-b align-center"
                              >
                                <td className="px-1.5 py-1.5 font-medium">
                                  {row.course_label}
                                </td>
                                <td className="px-1.5 py-1.5 text-xs text-foreground/70">
                                  {row.major_label} | {row.block_label}
                                </td>
                                <td className="px-1.5 py-1.5">
                                  {row.session
                                    ? dayLabel(row.session.day)
                                    : "—"}
                                </td>
                                {row.has_session ? (
                                  <>
                                    <td className="px-1.5 py-1.5">
                                      {row.session
                                        ? toTimeInput(row.session.start_time)
                                        : "—"}
                                    </td>
                                    <td className="px-1.5 py-1.5">
                                      {row.session
                                        ? toTimeInput(row.session.end_time)
                                        : "—"}
                                    </td>
                                    <td className="px-1.5 py-1.5 text-xs">
                                      {row.session
                                        ? `${row.session.room_code ?? "Unknown"}${row.session.room_name ? ` - ${row.session.room_name}` : ""}`
                                        : "—"}
                                    </td>
                                  </>
                                ) : (
                                  <td
                                    colSpan={3}
                                    className="px-1.5 py-1.5 text-xs text-foreground/70"
                                  >
                                    {row.remaining_hours > 0 ? (
                                      <span>
                                        Unscheduled:{" "}
                                        {row.remaining_hours.toFixed(2)} Hours
                                      </span>
                                    ) : (
                                      <span className="inline-flex rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                        Fully Scheduled
                                      </span>
                                    )}
                                  </td>
                                )}
                                <td className="px-1.5 py-1.5">
                                  <div className="flex items-center gap-1.5 justify-end">
                                    {!row.has_session ? (
                                      <span
                                        className="inline-flex"
                                        title={
                                          row.remaining_hours <= 0
                                            ? "Class course is fully scheduled."
                                            : undefined
                                        }
                                      >
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          title="Stage this class"
                                          onClick={() =>
                                            seedNewSessionDraft(
                                              row.class_delivery_id,
                                            )
                                          }
                                          disabled={row.remaining_hours <= 0}
                                        >
                                          <PlusCircle className="h-4 w-4" />
                                        </Button>
                                      </span>
                                    ) : (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          title="Modify this schedule"
                                          onClick={() => {
                                            if (ownerClass && row.session) {
                                              void openEditSessionDialog(
                                                ownerClass,
                                                row.session,
                                              );
                                            }
                                          }}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          title="Delete this schedule"
                                          onClick={() => {
                                            if (row.session) {
                                              void handleDeleteSession(
                                                row.session.id,
                                              );
                                            }
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-0">
              <CardTitle className="text-base">Step 4: Review</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-3 flex-row">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-md border p-2 flex items-center gap-2">
                  <p className="text-foreground/70">Teaching Load</p>
                  <p className="text-sm font-semibold">
                    {teachingLoadTotal.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-md border p-2 flex items-center gap-2">
                  <p className="text-foreground/70">Designation Load</p>
                  <p className="text-sm font-semibold">
                    {selectedFacultyDesignationLoad.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-md border p-2 flex items-center gap-2">
                  <p className="text-foreground/70">Total Working Load</p>
                  <p className="text-sm font-semibold">
                    {totalWorkingLoad.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-foreground/70 flex flex-1">
                Last Updated:{" "}
                {scheduleBundle?.schedule?.updated_at
                  ? formatDateTime(scheduleBundle.schedule.updated_at)
                  : "N/A"}
              </div>
              <Button
                onClick={handleSubmitSchedule}
                disabled={
                  !scheduleBundle.schedule ||
                  isSaving ||
                  selectedCampusIds.length === 0
                }
              >
                <Send className="h-4 w-4" />
                Submit
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <AppDialog
        open={isFacultyPickerOpen}
        onOpenChange={setIsFacultyPickerOpen}
        title="Select Faculty"
        description="Search and select one faculty"
      >
        <div className="space-y-3">
          <Input
            placeholder="Search faculty"
            value={facultyQuery}
            onChange={(event) => setFacultyQuery(event.target.value)}
          />
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {filteredFaculty.map((faculty) => (
              <button
                key={faculty.id}
                type="button"
                className="w-full rounded-md border p-2 text-left hover:bg-accent"
                onClick={() => {
                  setSelectedFacultyId(faculty.id);
                  setIsFacultyPickerOpen(false);
                  void loadScheduleFor(faculty.id, selectedTermId);
                }}
              >
                <p className="text-sm font-medium">{fullName(faculty)}</p>
                <p className="text-xs text-foreground/70">
                  {faculty.employment_status} • Designation load{" "}
                  {faculty.total_designation_load}
                </p>
              </button>
            ))}
          </div>
        </div>
      </AppDialog>

      <AppDialog
        open={isTermPickerOpen}
        onOpenChange={setIsTermPickerOpen}
        title="Select Academic Term"
        description="Search and select one term"
        contentClassName="flex flex-col flex-1 max-h-11/12 w-full max-w-3xl overflow-hidden"
      >
        <div className="h-full flex flex-col gap-3 overflow-hidden">
          <Input
            placeholder="Search term"
            value={termQuery}
            onChange={(event) => setTermQuery(event.target.value)}
          />
          <div className="flex-1 grid grid-cols-2 gap-2 overflow-y-auto">
            {filteredTerms.map((term) => (
              <ListItemSmall
                key={term.id}
                title={term.code}
                subtitle={[]}
                onClick={() => {
                  setSelectedTermId(term.id);
                  setIsTermPickerOpen(false);
                  void loadTermCampusDataFor(term.id, selectedCampusIds);
                  void loadScheduleFor(selectedFacultyId, term.id);
                }}
                icon={<Calendar className="h-6 w-6 text-background/70" />}
              />
            ))}
          </div>
        </div>
      </AppDialog>

      <AppDialog
        open={isCampusPickerOpen}
        onOpenChange={setIsCampusPickerOpen}
        title="Add Campuses"
        description="Search and add one or more campuses"
      >
        <div className="space-y-3">
          <Input
            placeholder="Search campus"
            value={campusQuery}
            onChange={(event) => setCampusQuery(event.target.value)}
          />
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {filteredCampuses.map((campus) => {
              const selected = selectedCampusIds.includes(campus.id);
              return (
                <button
                  key={campus.id}
                  type="button"
                  className={cn(
                    "w-full rounded-md border p-2 text-left",
                    selected
                      ? "border-primary bg-primary/10"
                      : "hover:bg-accent",
                  )}
                  onClick={() => {
                    const nextCampusIds = selected
                      ? selectedCampusIds.filter((item) => item !== campus.id)
                      : [...selectedCampusIds, campus.id];

                    void handleCampusSelectionChange(nextCampusIds);
                  }}
                >
                  <p className="text-sm font-medium">{campus.name}</p>
                </button>
              );
            })}
          </div>
        </div>
      </AppDialog>

      <AppDialog
        open={isOfferingPickerOpen}
        onOpenChange={setIsOfferingPickerOpen}
        title="Add Class"
        description="Select a class; taken items are shown but disabled"
      >
        <div className="space-y-3">
          <Input
            placeholder="Search class"
            value={offeringQuery}
            onChange={(event) => setOfferingQuery(event.target.value)}
          />
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {filteredOfferingOptions.map((item) => (
              <button
                key={item.key}
                type="button"
                disabled={item.is_taken || isSaving}
                className={cn(
                  "w-full rounded-md border p-2 text-left",
                  item.is_taken
                    ? "cursor-not-allowed border-border bg-muted text-foreground/60"
                    : "hover:bg-accent",
                )}
                onClick={() => void handleAddOfferingToSchedule(item)}
              >
                <p className="text-sm font-medium">
                  {item.course_code} • {item.course_title}
                </p>
                <p className="text-xs text-foreground/70">
                  {item.campus_name} • {item.program_code ?? "N/A"} {" | "}
                  {item.major_code ?? "N/A"} {item.block_label}
                </p>
                <p className="text-xs text-foreground/70">
                  Course load = {item.lecture_hour ?? 0} + (
                  {item.laboratory_hour ?? 0} × 0.75)
                </p>
                {item.is_taken ? (
                  <p className="text-xs text-destructive">
                    Already assigned to:{" "}
                    {item.assigned_faculty_name ?? "Unknown Faculty"}
                  </p>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </AppDialog>

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
              <Button onClick={handleSaveSession} disabled={isSaving}>
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
            <Button
              variant="outline"
              onClick={() => {
                setIsMergeDialogOpen(false);
                setMergeSourceClassId(null);
                setMergeTargetClassId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMergeClasses}
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
            <Button
              variant="outline"
              onClick={() => {
                setIsUnmergeDialogOpen(false);
                setUnmergeSourceClassId(null);
                setUnmergeBlockId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleUnmergeClass}
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
                        {toTimeInput(conflict.start_time)}-
                        {toTimeInput(conflict.end_time)}
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
            <Button onClick={handleSaveAnyway} disabled={isSaving}>
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
    </div>
  );
};

export default ProgramChairPlanner;
