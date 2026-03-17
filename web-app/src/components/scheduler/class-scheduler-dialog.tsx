"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, DoorClosed, DoorOpen, Trash2 } from "lucide-react";
import ListItemSmall from "@/components/ui/list-item-small";
import { AddTile } from "@/components/ui/add-tile";
import { Button } from "@/components/ui/button";
import { AppDialog } from "@/components/ui/app-dialog";
import { Select } from "@/components/ui/select";
import { toDisplayTime, toMinutes, dayLabel } from "@/lib/schedule/utils";
import type { SessionDay, SessionType } from "@/models";
import {
  createClassSession,
  deleteClassSession,
  getClassSchedulerDetails,
  getSessionConflictWindows,
  type SchedulerDialogDetails,
} from "@/lib/schedule/session-actions";
import { Card, CardContent, CardHeader } from "../ui/card";
import TimePicker from "./time-picker";
import { numberToHourDuration } from "@/utils/time";

type ClassSchedulerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  classCode?: string;
  onChanged?: () => void;
};

const SESSION_DAYS: SessionDay[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const durationHours = (startTime: string, endTime: string): number => {
  const duration = (toMinutes(endTime) - toMinutes(startTime)) / 60;
  return Number.isFinite(duration) && duration > 0 ? duration : 0;
};

const toFixed = (value: number) => value.toFixed(2);

const ClassSchedulerDialog = ({
  open,
  onOpenChange,
  classId,
  classCode,
  onChanged,
}: ClassSchedulerDialogProps) => {
  const [details, setDetails] = useState<SchedulerDialogDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showInsertForm, setShowInsertForm] = useState(false);
  const [showRoomDialog, setShowRoomDialog] = useState(false);

  const [type, setType] = useState<SessionType>("Lecture");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [day, setDay] = useState<SessionDay>("MONDAY");
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<
    Array<{ start_time: string; end_time: string; reason: string }>
  >([]);

  const [isMutating, setIsMutating] = useState(false);

  const loadDetails = async () => {
    setLoading(true);
    const result = await getClassSchedulerDetails(classId);
    if (result.error || !result.data) {
      setError(result.error ?? "Unable to load class details");
      setDetails(null);
      setLoading(false);
      return;
    }

    setDetails(result.data);
    setError("");
    setLoading(false);
  };

  const handleDeleteSession = async (sessionId: string) => {
    setIsMutating(true);
    const result = await deleteClassSession(sessionId);
    if (result.error) {
      setError(result.error);
      setIsMutating(false);
      return;
    }

    await loadDetails();
    onChanged?.();
    setIsMutating(false);
  };

  const handleInsertSession = async () => {
    if (!details || !startTime || !endTime) return;

    setIsMutating(true);
    const result = await createClassSession({
      classId: details.class_id,
      day,
      type,
      roomId,
      startTime,
      endTime,
    });

    if (result.error) {
      setError(result.error);
      setIsMutating(false);
      return;
    }

    setShowInsertForm(false);
    setError("");
    await loadDetails();
    onChanged?.();
    setIsMutating(false);
  };

  useEffect(() => {
    loadDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  useEffect(() => {
    if (!showInsertForm || !details) return;
    let cancelled = false;

    const loadConflicts = async () => {
      const rows = await getSessionConflictWindows(
        details.class_id,
        day,
        roomId,
      );
      if (cancelled) return;
      setConflicts(rows);
    };

    loadConflicts();

    return () => {
      cancelled = true;
    };
  }, [showInsertForm, details, day, roomId]);

  const expectedHours = useMemo(() => {
    if (!details) return 1;
    return type === "Lecture"
      ? details.unscheduled_lecture_hours
      : details.unscheduled_laboratory_hours;
  }, [details, type]);

  const selectedRoom =
    details?.rooms.find((room) => room.id === roomId) ?? null;

  const canInsert =
    Boolean(details) &&
    Boolean(day) &&
    Boolean(startTime) &&
    Boolean(endTime) &&
    !isMutating;

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={classCode ?? "Class Scheduler"}
      description="Manage class sessions and scheduling details."
      contentClassName="flex min-h-[60vh] max-h-[85vh] w-full max-w-6xl flex-col overflow-hidden"
    >
      {loading && (
        <p className="text-sm text-foreground/70">Loading class data...</p>
      )}

      {!loading && !details && (
        <p className="text-sm text-red-700">
          {error || "Class details unavailable"}
        </p>
      )}

      {!loading && details && (
        <div className="grid grid-cols-3 gap-4 overflow-hidden flex-1">
          <Card className="col-span-2 flex flex-col gap-3 overflow-hidden h-full">
            <CardHeader className="flex items-center justify-between">
              <h3 className="font-semibold">Session Management</h3>
              <span className="text-xs text-foreground/70">
                Unscheduled Lec: {numberToHourDuration(details.unscheduled_lecture_hours)} Lab: {numberToHourDuration(details.unscheduled_laboratory_hours)}
              </span>
            </CardHeader>

            <CardContent className="h-full flex flex-col gap-3 overflow-y-auto">

            <div className="flex max-h-[38vh] flex-col gap-2 overflow-y-auto">
              {details.sessions.length === 0 && (
                <p className="rounded-md bg-foreground/5 p-3 text-sm text-foreground/70">
                  No sessions yet.
                </p>
              )}

              {details.sessions.map((session) => (
                <ListItemSmall
                  key={session.id}
                  title={session.code}
                  subtitle={[
                    `${session.room_code ?? "Online Class"} | ${toDisplayTime(session.start_time)} - ${toDisplayTime(session.end_time)}`,
                  ]}
                  className="hover:bg-background hover:border-foreground/15 "
                  icon={<DoorClosed className="h-8 w-8 text-background/80" />}
                  annotations={
                    <div className="flex flex-row items-center">
                      <span className="rounded-md bg-foreground/10 px-1.5 py-1 text-xs">
                        {session.type}{" "}
                        {toFixed(
                          durationHours(session.start_time, session.end_time),
                        )}
                        h
                      </span>
                      <Button
                      
                        variant="ghost"
                        onClick={() => handleDeleteSession(session.id)}
                        disabled={isMutating}
                      >
                        <Trash2 className="h-5 w-5 text-red-600" />
               
                      </Button>
                    </div>
                  }
                />
              ))}
            </div>

            {!showInsertForm && (
              <AddTile
                title="Insert Session"
                description="Add lecture or laboratory schedule for this class"
                onClick={() => {
                  setType("Lecture");
                  setDay("MONDAY");
                  setRoomId(null);
                  setStartTime(null);
                  setEndTime(null);
                  setShowInsertForm(true);
                }}
              />
            )}

            {showInsertForm && (
              <div className="space-y-3 rounded-md border p-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <p className="text-xs font-medium">Type</p>
                    <Select
                      value={type}
                      onChange={(event) => {
                        setType(event.target.value as SessionType);
                        setStartTime(null);
                        setEndTime(null);
                      }}
                    >
                      <option value="Lecture">Lecture</option>
                      <option value="Laboratory">Laboratory</option>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium">Day</p>
                    <Select
                      value={day}
                      onChange={(event) => {
                        setDay(event.target.value as SessionDay);
                        setStartTime(null);
                        setEndTime(null);
                      }}
                    >
                      {SESSION_DAYS.map((item) => (
                        <option key={item} value={item}>
                          {dayLabel(item)}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowRoomDialog(true)}
                    className="justify-start"
                  >
                    <Building2 className="h-4 w-4" />
                    <span className="truncate text-xs">
                      {selectedRoom
                        ? `${selectedRoom.code} (${selectedRoom.campus_name ?? "Campus"})`
                        : "Select Room (optional)"}
                    </span>
                  </Button>

                  <TimePicker
                    expectedHours={expectedHours}
                    conflicts={conflicts}
                    startTime={startTime}
                    endTime={endTime}
                    onRangeChange={(range: {
                      startTime: string;
                      endTime: string;
                    }) => {
                      setStartTime(range.startTime);
                      setEndTime(range.endTime);
                    }}
                  />
                </div>


                {error && (
                  <p className="rounded-md border border-red-300 bg-red-50 p-2 text-xs text-red-800">
                    {error}
                  </p>
                )}

                <div className="flex justify-end items-center gap-2">
                <p className="flex-1 text-xs text-foreground/70">
                  Expected duration for {type}: {numberToHourDuration(expectedHours)}
                </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowInsertForm(false);
                      setError("");
                    }}
                    disabled={isMutating}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => void handleInsertSession()}
                    disabled={!canInsert}
                  >
                    Insert
                  </Button>
                </div>
              </div>
            )}
            </CardContent>

          </Card>

          <div className="h-full flex flex-col gap-2 overflow-y-auto">
            <div className="text-foreground">
              <h3>Course</h3>
              <div className="rounded-md shadow p-3 text-sm">
                <p>
                  {details.course_code} - {details.course_title}
                </p>
                <p className="text-xs text-foreground/70">
                  Total Hours: {numberToHourDuration(details.total_hours)} (Lec{" "}
                  {numberToHourDuration(details.lecture_unit)} + Lab{" "}
                  {numberToHourDuration(details.laboratory_unit * 3)})
                </p>
              </div>
            </div>

            <div className="text-foreground">
              <p>Faculty</p>
              <div className="rounded-md shadow p-3 text-sm">
                <p>{details.faculty_name}</p>
                <p className="text-xs text-foreground/70">
                  {details.faculty_rank ?? "No rank assigned"}
                </p>
                <p className="text-xs text-foreground/70">
                  {details.faculty_degrees.length > 0
                    ? details.faculty_degrees.join(", ")
                    : "No degrees on file"}
                </p>
              </div>
            </div>

            <div className="text-foreground flex flex-col gap-1">
              <p className="-mb-1">Block(s)</p>
              {details.blocks.map((block) => (
                <div key={block.id} className="rounded-md shadow p-3 text-sm">
                  <p>{block.code ?? "N/A"}</p>
                  <p className="text-xs text-foreground/70">
                    Program: {block.program_name ?? "Unknown"}{" "}
                  </p>

                  <p className="text-xs text-foreground/70">
                    Major: {block.major_name ?? "Unknown"}
                  </p>

                  <p className="text-xs text-foreground/70">
                    Student Count: {block.student_count ?? 0}
                  </p>
                </div>
              ))}
            </div>

            <div className="text-foreground">
              <p>Campus</p>
              <div className="overflow-y-auto rounded-md shadow p-3 text-sm">
                <p> {details.blocks[0]?.campus_name ?? "Unknown Campus"}</p>
                <p className="text-xs text-foreground/70">
                  {details.blocks[0]?.campus_address
                    ? `${details.blocks[0]?.campus_address}`
                    : ""}
                </p>
              </div>
            </div>
          </div>

          <AppDialog
            open={showRoomDialog}
            onOpenChange={setShowRoomDialog}
            title="Select Room"
            description="Choose a room for this session."
            contentClassName="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden"
          >
            <div className="flex flex-col gap-2 overflow-y-auto">
              <Button
                variant={roomId ? "outline" : "default"}
                onClick={() => {
                  setRoomId(null);
                  setShowRoomDialog(false);
                }}
              >
                Online Class
              </Button>

              {details.rooms.map((room) => (
                <ListItemSmall
                  key={room.id}
                  title={room.code}
                  subtitle={[`${room.name} | ${room.campus_name ?? "Campus"}`]}
                  isSelected={room.id === roomId}
                  onClick={() => {
                    setRoomId(room.id);
                    setShowRoomDialog(false);
                  }}
                  icon={<DoorOpen className="h-5 w-5 text-background/80" />}
                  annotations={
                    <span className="rounded-md bg-foreground/10 px-1 py-0.5 text-xs">
                      Cap: {room.capacity ?? 0}
                    </span>
                  }
                />
              ))}
            </div>
          </AppDialog>

        </div>
      )}
    </AppDialog>
  );
};

export default ClassSchedulerDialog;
