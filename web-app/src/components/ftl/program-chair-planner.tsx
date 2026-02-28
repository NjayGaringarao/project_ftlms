"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  Plus,
  Save,
  Send,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AppDialog } from "@/components/ui/app-dialog";
import {
  createClass,
  deleteClass,
  deleteSession,
  findOrCreateSchedule,
  getFacultyScheduleBundle,
  getOfferedCoursesByTermCampus,
  getRoomsByCampus,
  saveSession,
  submitScheduleForCampusDirector,
  updateClass,
} from "@/lib/ftl/actions";
import {
  ConflictType,
  FTLBootstrapData,
  FTLClass,
  FTLFaculty,
  FTLOffering,
  FTLRoom,
  FTLScheduleBundle,
  FTLSession,
  SaveSessionInput,
  SessionConflict,
} from "@/lib/ftl/types";

const DAY_OPTIONS = [
  { value: 1, label: "Sunday" },
  { value: 2, label: "Monday" },
  { value: 3, label: "Tuesday" },
  { value: 4, label: "Wednesday" },
  { value: 5, label: "Thursday" },
  { value: 6, label: "Friday" },
  { value: 7, label: "Saturday" },
];

const typeLabelMap: Record<ConflictType, string> = {
  FACULTY: "Faculty double-booked",
  ROOM: "Room occupied",
  BLOCK: "Block overlap",
};

const toTimeInput = (value: string) => value.slice(0, 5);

const dayLabel = (value: number) =>
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
  class_id: string;
  block_id: string | null;
  session_id?: string;
  room_id: string | null;
  day: number;
  start_time: string;
  end_time: string;
};

const ProgramChairPlanner = ({
  bootstrap,
  initialFaculty,
}: ProgramChairPlannerProps) => {
  const [selectedTermId, setSelectedTermId] = useState("");
  const [selectedCampusId, setSelectedCampusId] = useState("");
  const [facultyQuery, setFacultyQuery] = useState("");
  const [selectedFacultyId, setSelectedFacultyId] = useState("");

  const [faculties] = useState<FTLFaculty[]>(initialFaculty);
  const [offerings, setOfferings] = useState<FTLOffering[]>([]);
  const [rooms, setRooms] = useState<FTLRoom[]>([]);
  const [scheduleBundle, setScheduleBundle] = useState<FTLScheduleBundle>({
    schedule: null,
    classes: [],
  });

  const isLoadingFaculty = false;
  const [isLoadingOfferings, setIsLoadingOfferings] = useState(false);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: "error" | "success";
    text: string;
  } | null>(null);

  const [isClassDialogOpen, setIsClassDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<FTLClass | null>(null);
  const [classCourseCtId, setClassCourseCtId] = useState("");
  const [classBlockId, setClassBlockId] = useState<string>("none");

  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [sessionDraft, setSessionDraft] = useState<SessionDraft | null>(null);

  const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);
  const [pendingSessionInput, setPendingSessionInput] =
    useState<SaveSessionInput | null>(null);
  const [conflicts, setConflicts] = useState<SessionConflict[]>([]);

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

  const selectedOffering = useMemo(
    () =>
      offerings.find((item) => item.course_c_t_id === classCourseCtId) ?? null,
    [offerings, classCourseCtId],
  );

  const sortedOfferings = useMemo(
    () =>
      [...offerings].sort((a, b) => {
        if (a.course_code !== b.course_code) {
          return a.course_code.localeCompare(b.course_code);
        }

        return a.curriculum_title.localeCompare(b.curriculum_title);
      }),
    [offerings],
  );

  const groupedConflicts = useMemo(
    () => ({
      FACULTY: conflicts.filter((item) => item.type === "FACULTY"),
      ROOM: conflicts.filter((item) => item.type === "ROOM"),
      BLOCK: conflicts.filter((item) => item.type === "BLOCK"),
    }),
    [conflicts],
  );

  const loadTermCampusDataFor = async (termId: string, campusId: string) => {
    if (!termId || !campusId) {
      setOfferings([]);
      setRooms([]);
      return;
    }

    setIsLoadingOfferings(true);

    const [nextOfferings, nextRooms] = await Promise.all([
      getOfferedCoursesByTermCampus(termId, campusId),
      getRoomsByCampus(campusId),
    ]);

    setOfferings(nextOfferings);
    setRooms(nextRooms);
    setIsLoadingOfferings(false);
  };

  const loadScheduleFor = async (facultyId: string, termId: string) => {
    if (!facultyId || !termId) {
      setScheduleBundle({ schedule: null, classes: [] });
      return;
    }

    setIsLoadingSchedule(true);
    const bundle = await getFacultyScheduleBundle(facultyId, termId);
    setScheduleBundle(bundle);
    setIsLoadingSchedule(false);
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

  const openCreateClassDialog = async () => {
    setFeedback(null);
    const schedule = await requireSchedule();
    if (!schedule) return;

    setEditingClass(null);
    setClassCourseCtId(offerings[0]?.course_c_t_id ?? "");
    setClassBlockId("none");
    setIsClassDialogOpen(true);
  };

  const openEditClassDialog = (item: FTLClass) => {
    setEditingClass(item);
    setClassCourseCtId(item.course_c_t_id);
    setClassBlockId(item.block_id ?? "none");
    setIsClassDialogOpen(true);
  };

  const handleSaveClass = async () => {
    if (!classCourseCtId) {
      setFeedback({ kind: "error", text: "Select an offered course." });
      return;
    }

    const schedule = await requireSchedule();
    if (!schedule) return;

    setIsSaving(true);
    setFeedback(null);

    const payload = {
      schedule_id: schedule.id,
      course_c_t_id: classCourseCtId,
      block_id: classBlockId === "none" ? null : classBlockId,
      expected_schedule_updated_at: schedule.updated_at,
    };

    const result = editingClass
      ? await updateClass({ class_id: editingClass.id, ...payload })
      : await createClass(payload);

    if (result.error) {
      setFeedback({ kind: "error", text: result.error });
      setIsSaving(false);
      return;
    }

    const refreshed = await getFacultyScheduleBundle(
      selectedFacultyId,
      selectedTermId,
    );
    setScheduleBundle(refreshed);
    setIsClassDialogOpen(false);
    setIsSaving(false);
    setFeedback({
      kind: "success",
      text: editingClass ? "Class updated" : "Class added",
    });
  };

  const handleDeleteClass = async (classId: string) => {
    if (!scheduleBundle.schedule) return;
    const confirmed = window.confirm("Delete this class and all its sessions?");
    if (!confirmed) return;

    setIsSaving(true);
    const result = await deleteClass({
      class_id: classId,
      schedule_id: scheduleBundle.schedule.id,
      expected_schedule_updated_at: scheduleBundle.schedule.updated_at,
    });

    if (result.error) {
      setFeedback({ kind: "error", text: result.error });
      setIsSaving(false);
      return;
    }

    const refreshed = await getFacultyScheduleBundle(
      selectedFacultyId,
      selectedTermId,
    );
    setScheduleBundle(refreshed);
    setIsSaving(false);
    setFeedback({ kind: "success", text: "Class deleted" });
  };

  const openCreateSessionDialog = (item: FTLClass) => {
    setSessionDraft({
      class_id: item.id,
      block_id: item.block_id,
      room_id: null,
      day: 2,
      start_time: "07:30",
      end_time: "09:00",
    });
    setIsSessionDialogOpen(true);
  };

  const openEditSessionDialog = (item: FTLClass, session: FTLSession) => {
    setSessionDraft({
      class_id: item.id,
      block_id: item.block_id,
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
    if (!scheduleBundle.schedule || !selectedFacultyId || !selectedCampusId)
      return;

    const input: SaveSessionInput = {
      session_id: draft.session_id,
      class_id: draft.class_id,
      schedule_id: scheduleBundle.schedule.id,
      academic_term_id: scheduleBundle.schedule.academic_term_id,
      campus_id: selectedCampusId,
      faculty_user_id: selectedFacultyId,
      block_id: draft.block_id,
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

    const refreshed = await getFacultyScheduleBundle(
      selectedFacultyId,
      selectedTermId,
    );

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

    const refreshed = await getFacultyScheduleBundle(
      selectedFacultyId,
      selectedTermId,
    );

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

    const confirmed = window.confirm("Delete this session?");
    if (!confirmed) return;

    setIsSaving(true);
    const result = await deleteSession({
      session_id: sessionId,
      schedule_id: scheduleBundle.schedule.id,
      expected_schedule_updated_at: scheduleBundle.schedule.updated_at,
    });

    if (result.error) {
      setFeedback({ kind: "error", text: result.error });
      setIsSaving(false);
      return;
    }

    const refreshed = await getFacultyScheduleBundle(
      selectedFacultyId,
      selectedTermId,
    );
    setScheduleBundle(refreshed);
    setIsSaving(false);
    setFeedback({ kind: "success", text: "Session deleted" });
  };

  const handleSubmitSchedule = async () => {
    if (!scheduleBundle.schedule || !selectedCampusId) return;

    setIsSaving(true);
    const result = await submitScheduleForCampusDirector({
      schedule_id: scheduleBundle.schedule.id,
      campus_id: selectedCampusId,
    });

    if (result.error) {
      setFeedback({ kind: "error", text: result.error });
      setIsSaving(false);
      return;
    }

    const refreshed = await getFacultyScheduleBundle(
      selectedFacultyId,
      selectedTermId,
    );
    setScheduleBundle(refreshed);
    setIsSaving(false);
    setFeedback({ kind: "success", text: "Schedule submitted for evaluation" });
  };

  const conflictBadgeClass = (type: ConflictType) => {
    if (type === "FACULTY") return "border-red-300 bg-red-50 text-red-700";
    if (type === "ROOM") return "border-amber-300 bg-amber-50 text-amber-700";
    return "border-orange-300 bg-orange-50 text-orange-700";
  };

  const scheduleStateBadgeClass = (state: string | undefined) => {
    if (state === "APPROVED")
      return "border-emerald-300 bg-emerald-50 text-emerald-700";
    if (state === "PENDING")
      return "border-amber-300 bg-amber-50 text-amber-700";
    if (state === "REJECTED") return "border-red-300 bg-red-50 text-red-700";
    return "border-border bg-muted text-foreground/80";
  };

  const severityBadgeClass = (severity: SessionConflict["severity"]) => {
    if (severity === "HIGH") return "border-red-300 bg-red-50 text-red-700";
    return "border-amber-300 bg-amber-50 text-amber-700";
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden p-4">
      <Card className="py-4">
        <CardHeader className="pb-2">
          <CardTitle>Program Chair Scheduling</CardTitle>
          <CardDescription>
            Build faculty-level schedule proposals by term and campus.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <p className="text-xs text-foreground/70">Academic Term</p>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={selectedTermId}
              onChange={(event) => {
                const nextTermId = event.target.value;
                setSelectedTermId(nextTermId);
                void loadTermCampusDataFor(nextTermId, selectedCampusId);
                void loadScheduleFor(selectedFacultyId, nextTermId);
              }}
            >
              <option value="">Select term</option>
              {bootstrap.terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {formatTermLabel(term)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-foreground/70">Campus</p>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={selectedCampusId}
              onChange={(event) => {
                const nextCampusId = event.target.value;
                setSelectedCampusId(nextCampusId);
                void loadTermCampusDataFor(selectedTermId, nextCampusId);
              }}
            >
              <option value="">Select campus</option>
              {bootstrap.campuses.map((campus) => (
                <option key={campus.id} value={campus.id}>
                  {campus.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-foreground/70">Faculty</p>
            <Input
              placeholder="Search faculty"
              value={facultyQuery}
              onChange={(event) => setFacultyQuery(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

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

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="min-h-0 py-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Faculty List</CardTitle>
            <CardDescription>
              {isLoadingFaculty
                ? "Loading faculty..."
                : `${filteredFaculty.length} faculty`}
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-0 overflow-y-auto space-y-2">
            {filteredFaculty.map((faculty) => {
              const active = faculty.id === selectedFacultyId;
              return (
                <button
                  key={faculty.id}
                  type="button"
                  onClick={() => {
                    setSelectedFacultyId(faculty.id);
                    void loadScheduleFor(faculty.id, selectedTermId);
                  }}
                  className={`w-full rounded-md border px-3 py-2 text-left transition ${
                    active
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:bg-accent"
                  }`}
                >
                  <p className="font-medium text-sm">{fullName(faculty)}</p>
                  <p className="text-xs text-foreground/70">
                    {faculty.employment_status} • Designation load{" "}
                    {faculty.total_designation_load}
                  </p>
                </button>
              );
            })}

            {!isLoadingFaculty && filteredFaculty.length === 0 ? (
              <p className="rounded-md border border-dashed px-3 py-4 text-center text-sm text-foreground/70">
                No faculty found.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid min-h-0 gap-4 lg:grid-rows-[minmax(200px,320px)_1fr]">
          <Card className="min-h-0 py-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Offered Courses</CardTitle>
              <CardDescription>
                {selectedTermId && selectedCampusId
                  ? isLoadingOfferings
                    ? "Loading offerings..."
                    : `${sortedOfferings.length} offered courses`
                  : "Select term and campus to load offerings"}
              </CardDescription>
            </CardHeader>
            <CardContent className="min-h-0 overflow-auto">
              <table className="w-full min-w-180 text-sm">
                <thead>
                  <tr className="border-b text-left text-foreground/70">
                    <th className="py-2 pr-2">Course</th>
                    <th className="py-2 pr-2">Title</th>
                    <th className="py-2 pr-2">Curriculum</th>
                    <th className="py-2 pr-2">Major</th>
                    <th className="py-2 pr-2">Blocks</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedOfferings.map((item) => (
                    <tr key={item.course_c_t_id} className="border-b align-top">
                      <td className="py-2 pr-2 font-medium">
                        {item.course_code}
                      </td>
                      <td className="py-2 pr-2">{item.course_title}</td>
                      <td className="py-2 pr-2">
                        <p>{item.curriculum_title}</p>
                        <p className="text-xs text-foreground/70">
                          Series {item.curriculum_series_year}
                          {item.curriculum_revised_year
                            ? ` • Revised ${item.curriculum_revised_year}`
                            : ""}
                        </p>
                      </td>
                      <td className="py-2 pr-2">
                        {item.major_code
                          ? `${item.major_code} - ${item.major_name}`
                          : item.major_name}
                      </td>
                      <td className="py-2 pr-2">
                        {item.available_blocks.length > 0
                          ? item.available_blocks
                              .map(
                                (block) =>
                                  `Y${block.year_level}-${block.section}`,
                              )
                              .join(", ")
                          : "No block"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!isLoadingOfferings &&
              selectedTermId &&
              selectedCampusId &&
              sortedOfferings.length === 0 ? (
                <p className="mt-4 rounded-md border border-dashed px-3 py-4 text-sm text-foreground/70">
                  No offered courses found for this term and campus.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="min-h-0 py-4">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">
                    Faculty Schedule Editor
                  </CardTitle>
                  <CardDescription>
                    {selectedFaculty
                      ? fullName(selectedFaculty)
                      : "Select faculty to start"}
                  </CardDescription>
                  {selectedFaculty ? (
                    <div className="mt-1">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-medium ${scheduleStateBadgeClass(
                          scheduleBundle.schedule?.state,
                        )}`}
                      >
                        {scheduleBundle.schedule?.state ?? "NONE"}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={openCreateClassDialog}
                    disabled={
                      !selectedFacultyId ||
                      !selectedTermId ||
                      !selectedCampusId ||
                      isSaving
                    }
                  >
                    <Plus className="h-4 w-4" />
                    Add Class
                  </Button>
                  <Button
                    onClick={handleSubmitSchedule}
                    disabled={!scheduleBundle.schedule || isSaving}
                  >
                    <Send className="h-4 w-4" />
                    Submit
                  </Button>
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
                  <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-foreground/70">
                    Updated: {scheduleBundle.schedule.updated_at ?? "n/a"}
                  </div>

                  {scheduleBundle.classes.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-md border p-3 space-y-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">
                            {item.course_code} - {item.course_title}
                          </p>
                          <p className="text-xs text-foreground/70">
                            {item.curriculum_title}
                            {item.major_code ? ` • ${item.major_code}` : ""}
                            {item.year_section ? ` • ${item.year_section}` : ""}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditClassDialog(item)}
                          >
                            <Save className="h-4 w-4" />
                            Edit Class
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => void handleDeleteClass(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {item.sessions.map((session) => (
                          <div
                            key={session.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
                          >
                            <div>
                              <p className="text-sm font-medium">
                                {dayLabel(session.day)} •{" "}
                                {toTimeInput(session.start_time)}-
                                {toTimeInput(session.end_time)}
                              </p>
                              <p className="text-xs text-foreground/70">
                                Room {session.room_code ?? "TBA"}
                              </p>
                              {session.last_conflict_count > 0 ? (
                                <span className="mt-1 inline-flex rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                                  {session.last_conflict_count} conflict(s)
                                </span>
                              ) : null}
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  openEditSessionDialog(item, session)
                                }
                              >
                                <CalendarClock className="h-4 w-4" />
                                Edit Session
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  void handleDeleteSession(session.id)
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openCreateSessionDialog(item)}
                        >
                          <Plus className="h-4 w-4" />
                          Add Session
                        </Button>
                      </div>
                    </div>
                  ))}

                  {scheduleBundle.classes.length === 0 ? (
                    <p className="rounded-md border border-dashed px-3 py-4 text-sm text-foreground/70">
                      No classes yet. Add at least one class to begin scheduling
                      sessions.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <AppDialog
        open={isClassDialogOpen}
        onOpenChange={setIsClassDialogOpen}
        title={editingClass ? "Edit Class" : "Add Class"}
        description="Assign offered course and optional block"
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs text-foreground/70">Offered Course</p>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={classCourseCtId}
              onChange={(event) => {
                const nextCourseCtId = event.target.value;
                setClassCourseCtId(nextCourseCtId);
                const nextOffering = offerings.find(
                  (item) => item.course_c_t_id === nextCourseCtId,
                );
                setClassBlockId(
                  nextOffering?.available_blocks[0]?.id ?? "none",
                );
              }}
            >
              <option value="">Select offered course</option>
              {sortedOfferings.map((item) => (
                <option key={item.course_c_t_id} value={item.course_c_t_id}>
                  {item.course_code} - {item.course_title} •{" "}
                  {item.curriculum_title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-foreground/70">Block</p>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={classBlockId}
              onChange={(event) => setClassBlockId(event.target.value)}
            >
              <option value="none">No block</option>
              {(selectedOffering?.available_blocks ?? []).map((block) => (
                <option key={block.id} value={block.id}>
                  Year {block.year_level} - {block.section}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsClassDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveClass}
              disabled={isSaving || !classCourseCtId}
            >
              {editingClass ? "Save Class" : "Add Class"}
            </Button>
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
                  value={String(sessionDraft.day)}
                  onChange={(event) =>
                    setSessionDraft({
                      ...sessionDraft,
                      day: Number(event.target.value),
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
                  value={sessionDraft.room_id ?? "none"}
                  onChange={(event) =>
                    setSessionDraft({
                      ...sessionDraft,
                      room_id:
                        event.target.value === "none"
                          ? null
                          : event.target.value,
                    })
                  }
                >
                  <option value="none">TBA</option>
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
        open={isConflictDialogOpen}
        onOpenChange={setIsConflictDialogOpen}
        title="Conflict Review"
        description="Conflicts were found. You can return to edit or save anyway."
        contentClassName="max-w-4xl"
      >
        <div className="space-y-3">
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            <p className="font-medium flex items-center gap-2">
              <TriangleAlert className="h-4 w-4" />
              {conflicts.length} conflict(s) detected
            </p>
            <p>Conflict prompts appear for every session create/edit.</p>
          </div>

          <div className="max-h-85 overflow-y-auto space-y-4">
            {(["FACULTY", "ROOM", "BLOCK"] as const)
              .filter((type) => groupedConflicts[type].length > 0)
              .map((type) => (
                <div key={type} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${conflictBadgeClass(
                        type,
                      )}`}
                    >
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

          <div className="flex justify-end gap-2">
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
    </div>
  );
};

export default ProgramChairPlanner;
