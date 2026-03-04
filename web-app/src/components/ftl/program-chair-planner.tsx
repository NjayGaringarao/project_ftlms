"use client";

import { useMemo, useState } from "react";
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
import { ContextPickersDialogs } from "./program-chair-planner/context-pickers-dialogs";
import { ScheduleActionDialogs } from "./program-chair-planner/schedule-action-dialogs";
import { Step1Context } from "./program-chair-planner/step-1-context";
import { Step2TeachingLoad } from "./program-chair-planner/step-2-teaching-load";
import { Step3ConstructSchedule } from "./program-chair-planner/step-3-construct-schedule";
import { Step4Review } from "./program-chair-planner/step-4-review";
import {
  formatTermLabel,
  fullName,
  sessionDurationHours,
  toTimeInput,
} from "./program-chair-planner/utils";
import {
  ConfirmDialogState,
  SessionDraft,
  SessionTableRow,
} from "./program-chair-planner/types";

type ProgramChairPlannerProps = {
  bootstrap: FTLBootstrapData;
  initialFaculty: FTLFaculty[];
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

  const selectedTerm = useMemo(
    () => bootstrap.terms.find((term) => term.id === selectedTermId) ?? null,
    [bootstrap.terms, selectedTermId],
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
      ].join(" ");
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
          <Step1Context
            facultyName={selectedFaculty ? fullName(selectedFaculty) : null}
            selectedFacultyId={selectedFaculty?.id ?? null}
            selectedTermId={selectedTermId}
            selectedTermCode={selectedTerm?.code ?? null}
            onClearFaculty={() => {
              setSelectedFacultyId(null);
              setSelectedTermId(null);
              setSelectedCampusIds([]);
              setOfferingOptions([]);
              setRooms([]);
              setScheduleBundle({ schedule: null, classes: [] });
            }}
            onOpenFacultyPicker={() => setIsFacultyPickerOpen(true)}
            onClearTerm={() => {
              setSelectedTermId(null);
              setSelectedCampusIds([]);
              setOfferingOptions([]);
              setRooms([]);
              setScheduleBundle({ schedule: null, classes: [] });
            }}
            onOpenTermPicker={() => setIsTermPickerOpen(true)}
          />

          <Step2TeachingLoad
            campuses={bootstrap.campuses}
            selectedCampusIds={selectedCampusIds}
            classes={scheduleBundle.classes}
            mergeTargetsByClassId={mergeTargetsByClassId}
            isSaving={isSaving}
            isLoadingOfferings={isLoadingOfferings}
            selectedTermId={selectedTermId}
            offeringOptionsLength={offeringOptions.length}
            selectedFacultyId={selectedFacultyId}
            onRemoveCampus={(campusId) => {
              const nextCampusIds = selectedCampusIds.filter(
                (item) => item !== campusId,
              );
              void handleCampusSelectionChange(nextCampusIds);
            }}
            onOpenCampusPicker={() => setIsCampusPickerOpen(true)}
            onRemoveClass={(item) => void handleRemoveClassFromSchedule(item)}
            onOpenMerge={(classDeliveryId) => openMergeDialog(classDeliveryId)}
            onOpenUnmerge={(classDeliveryId) =>
              openUnmergeDialog(classDeliveryId)
            }
            onOpenOfferingPicker={() => setIsOfferingPickerOpen(true)}
          />
        </div>

        <div className="col-span-3 flex flex-col gap-4 overflow-hidden">
          <Step3ConstructSchedule
            isLoadingSchedule={isLoadingSchedule}
            selectedFacultyId={selectedFacultyId}
            selectedTermId={selectedTermId}
            isSaving={isSaving}
            scheduleBundle={scheduleBundle}
            classDeliveryOptions={classDeliveryOptions}
            newSessionDraft={newSessionDraft}
            setNewSessionDraft={setNewSessionDraft}
            rooms={rooms}
            isAddDisabled={isAddDisabled}
            addDisabledReason={addDisabledReason}
            sessionTableRows={sessionTableRows}
            classByIdMap={classByIdMap}
            onCreateSchedule={async () => {
              if (!selectedFacultyId || !selectedTermId) return;

              setIsSaving(true);
              const bundle = await findOrCreateSchedule(
                selectedFacultyId,
                selectedTermId,
              );
              setScheduleBundle(bundle);
              setIsSaving(false);
            }}
            onSeedNewSessionDraft={seedNewSessionDraft}
            onAddSessionRow={handleAddSessionRow}
            onOpenEditSessionDialog={openEditSessionDialog}
            onDeleteSession={handleDeleteSession}
          />

          <Step4Review
            teachingLoadTotal={teachingLoadTotal}
            selectedFacultyDesignationLoad={selectedFacultyDesignationLoad}
            totalWorkingLoad={totalWorkingLoad}
            updatedAt={scheduleBundle?.schedule?.updated_at ?? null}
            disableSubmit={
              !scheduleBundle.schedule ||
              isSaving ||
              selectedCampusIds.length === 0
            }
            onSubmit={handleSubmitSchedule}
          />
        </div>
      </div>

      <ContextPickersDialogs
        isFacultyPickerOpen={isFacultyPickerOpen}
        setIsFacultyPickerOpen={setIsFacultyPickerOpen}
        facultyQuery={facultyQuery}
        setFacultyQuery={setFacultyQuery}
        filteredFaculty={filteredFaculty}
        fullName={fullName}
        onSelectFaculty={(facultyId) => {
          setSelectedFacultyId(facultyId);
          setIsFacultyPickerOpen(false);
          void loadScheduleFor(facultyId, selectedTermId);
        }}
        isTermPickerOpen={isTermPickerOpen}
        setIsTermPickerOpen={setIsTermPickerOpen}
        termQuery={termQuery}
        setTermQuery={setTermQuery}
        filteredTerms={filteredTerms}
        onSelectTerm={(termId) => {
          setSelectedTermId(termId);
          setIsTermPickerOpen(false);
          void loadTermCampusDataFor(termId, selectedCampusIds);
          void loadScheduleFor(selectedFacultyId, termId);
        }}
        isCampusPickerOpen={isCampusPickerOpen}
        setIsCampusPickerOpen={setIsCampusPickerOpen}
        campusQuery={campusQuery}
        setCampusQuery={setCampusQuery}
        filteredCampuses={filteredCampuses}
        selectedCampusIds={selectedCampusIds}
        onChangeCampusIds={(campusIds) => {
          void handleCampusSelectionChange(campusIds);
        }}
        isOfferingPickerOpen={isOfferingPickerOpen}
        setIsOfferingPickerOpen={setIsOfferingPickerOpen}
        offeringQuery={offeringQuery}
        setOfferingQuery={setOfferingQuery}
        filteredOfferingOptions={filteredOfferingOptions}
        isSaving={isSaving}
        onSelectOffering={(item) => {
          void handleAddOfferingToSchedule(item);
        }}
      />

      <ScheduleActionDialogs
        isSessionDialogOpen={isSessionDialogOpen}
        setIsSessionDialogOpen={setIsSessionDialogOpen}
        sessionDraft={sessionDraft}
        setSessionDraft={(draft) => setSessionDraft(draft)}
        rooms={rooms}
        onSaveSession={() => {
          void handleSaveSession();
        }}
        isMergeDialogOpen={isMergeDialogOpen}
        setIsMergeDialogOpen={setIsMergeDialogOpen}
        mergeSourceClass={mergeSourceClass}
        mergeSourceClassId={mergeSourceClassId}
        mergeTargetClassId={mergeTargetClassId}
        setMergeTargetClassId={setMergeTargetClassId}
        mergeTargetOptions={mergeTargetOptions}
        onCancelMerge={() => {
          setIsMergeDialogOpen(false);
          setMergeSourceClassId(null);
          setMergeTargetClassId(null);
        }}
        onMergeClasses={() => {
          void handleMergeClasses();
        }}
        isUnmergeDialogOpen={isUnmergeDialogOpen}
        setIsUnmergeDialogOpen={setIsUnmergeDialogOpen}
        unmergeSourceClass={unmergeSourceClass}
        unmergeSourceClassId={unmergeSourceClassId}
        unmergeBlockId={unmergeBlockId}
        setUnmergeBlockId={setUnmergeBlockId}
        onCancelUnmerge={() => {
          setIsUnmergeDialogOpen(false);
          setUnmergeSourceClassId(null);
          setUnmergeBlockId(null);
        }}
        onUnmergeClass={() => {
          void handleUnmergeClass();
        }}
        isConflictDialogOpen={isConflictDialogOpen}
        setIsConflictDialogOpen={setIsConflictDialogOpen}
        conflicts={conflicts}
        onSaveAnyway={() => {
          void handleSaveAnyway();
        }}
        confirmDialogState={confirmDialogState}
        setConfirmDialogState={setConfirmDialogState}
        isSaving={isSaving}
      />
    </div>
  );
};

export default ProgramChairPlanner;
