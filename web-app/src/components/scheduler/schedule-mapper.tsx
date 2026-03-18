"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Blocks, DoorOpen, User, X } from "lucide-react";
import type { SessionDay } from "@/models";
import { toDisplayTime, toMinutes } from "@/lib/schedule/utils";
import {
  getSchedulerMapperMatrixByBlock,
  getSchedulerMapperMatrixByFaculty,
  getSchedulerMapperMatrixByRoom,
  type SchedulerMatrixSession,
} from "@/lib/schedule/mapper";
import MatrixRenderer from "./matrix-renderer";
import { getSelectedContextsFromSearchParams } from "./utils";
import SelectBlockDialog from "./select-block-dialog";
import SelectFacultyDialog from "./select-faculty-dialog";
import SelectRoomDialog from "./select-room-dialog";
import type {
  CourseLoadingBlockListItem,
  FacultyListItem,
} from "@/lib/course-loading/types";
import type { ExtendedRoom } from "@/models";
import { Button } from "../ui/button";
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

  const [blockSessions, setBlockSessions] = useState<SchedulerMatrixSession[]>([]);
  const [facultySessions, setFacultySessions] = useState<SchedulerMatrixSession[]>([]);
  const [roomSessions, setRoomSessions] = useState<SchedulerMatrixSession[]>([]);
  const [blockLoading, setBlockLoading] = useState(false);
  const [facultyLoading, setFacultyLoading] = useState(false);
  const [roomLoading, setRoomLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [faculty, setFaculty] = useState<FacultyListItem[]>([]);
  const [rooms, setRooms] = useState<ExtendedRoom[]>([]);
  const [blocks, setBlocks] = useState<CourseLoadingBlockListItem[]>([]);
  const [showFacultyDialog, setShowFacultyDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showRoomDialog, setShowRoomDialog] = useState(false);

  const setQueryParams = (mutate: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(searchParams.toString());
    mutate(next);
    const queryString = next.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const setContextParam = (key: "facultyId" | "blockId" | "roomId", value: string) => {
    setQueryParams((next) => {
      next.set(key, value);
    });
  };

  const clearContextParam = (key: "facultyId" | "blockId" | "roomId") => {
    setQueryParams((next) => {
      next.delete(key);
    });
  };

  const selectedFaculty =
    faculty.find((item) => item.id === selectedFacultyId) ?? null;
  const selectedBlock = blocks.find((item) => item.id === selectedBlockId) ?? null;
  const selectedRoom = rooms.find((item) => item.id === selectedRoomId) ?? null;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLookupLoading(true);
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
      setLookupLoading(false);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [academic_term_id]);

  const timeSlots = useMemo(() => {
    const slots: { start: string; end: string; startMinute: number }[] = [];
    for (let minute = START_MINUTE; minute <= END_MINUTE - SLOT_MINUTES; minute += SLOT_MINUTES) {
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
      if (!selectedBlockId) {
        setBlockSessions([]);
        setBlockLoading(false);
        return;
      }

      setBlockLoading(true);
      const rows = await getSchedulerMapperMatrixByBlock(academic_term_id, selectedBlockId);
      if (cancelled) return;
      setBlockSessions(rows);
      setBlockLoading(false);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [academic_term_id, selectedBlockId]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!selectedFacultyId) {
        setFacultySessions([]);
        setFacultyLoading(false);
        return;
      }

      setFacultyLoading(true);
      const rows = await getSchedulerMapperMatrixByFaculty(
        academic_term_id,
        selectedFacultyId,
      );
      if (cancelled) return;
      setFacultySessions(rows);
      setFacultyLoading(false);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [academic_term_id, selectedFacultyId]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!selectedRoomId) {
        setRoomSessions([]);
        setRoomLoading(false);
        return;
      }

      setRoomLoading(true);
      const rows = await getSchedulerMapperMatrixByRoom(academic_term_id, selectedRoomId);
      if (cancelled) return;
      setRoomSessions(rows);
      setRoomLoading(false);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [academic_term_id, selectedRoomId]);

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

  const resolveSubtitle = (
    selectedId: string | null,
    loading: boolean,
    count: number,
    emptyLabel: string,
  ): string | null => {
    if (loading) return "Loading...";
    if (!selectedId) return emptyLabel;
    if (count === 0) return "No sessions";
    return null;
  };

  const getHeaderButtonClass = (hasSelection: boolean) =>
    cn("min-w-0 h-7 px-2 text-[11px]", hasSelection ? "font-semibold" : "");

  const renderHeaderButton = (
    label: string,
    icon: React.ReactNode,
    selectedLabel: string | null,
    onClick: () => void,
    onClear: () => void,
  ) => (
    <>
      <Button
        title={selectedLabel ? `Change ${label}` : `Select ${label}`}
        variant="outline"
        className={getHeaderButtonClass(Boolean(selectedLabel))}
        onClick={onClick}
        disabled={lookupLoading}
      >
        {icon}
        <span className="truncate">{selectedLabel ?? `Pick ${label}`}</span>
      </Button>
      {selectedLabel ? (
        <Button
          title={`Clear ${label}`}
          variant="outline"
          className="h-7 w-7 p-0"
          onClick={onClear}
          disabled={lookupLoading}
        >
          <X className="h-3 w-3" />
        </Button>
      ) : null}
    </>
  );

    if (!academic_term_id?.trim()) {
    return (
      <div className="flex h-full items-center justify-center rounded-md border border-dashed p-6 text-sm text-foreground/70">
        Academic term not set.
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="min-w-[1100px]">
        <div className="grid auto-rows-[2.5rem] grid-cols-[minmax(7.5rem,9rem)_repeat(21,minmax(4.5rem,1fr))] border border-foreground/10 text-xs">
          <div
            className="border-b border-r border-foreground/10 px-2 py-1.5 text-xs font-semibold"
            style={{ gridColumn: 1, gridRow: 1 }}
          >
            Time
          </div>
          <div
            className="border-b border-r border-foreground/10 px-2 py-1.5"
            style={{ gridColumn: 1, gridRow: 2 }}
          />

          {timeSlots.map((slot, index) => (
            <div
              key={`time-${slot.start}`}
              className="border-b border-r border-foreground/10 px-2 py-1 text-[11px] text-foreground/80"
              style={{ gridColumn: 1, gridRow: 3 + index }}
            >
              {toDisplayTime(slot.start)} - {toDisplayTime(slot.end)}
            </div>
          ))}

          <MatrixRenderer
            title="Block"
            subtitle={resolveSubtitle(
              selectedBlockId,
              blockLoading,
              blockSessions.length,
              "Pick Block",
            )}
            headerAction={renderHeaderButton(
              "Block",
              <Blocks className="h-3 w-3" />,
              selectedBlock?.code ?? null,
              () => setShowBlockDialog(true),
              () => clearContextParam("blockId"),
            )}
            days={DAYS}
            timeSlots={timeSlots.map((slot) => slot.start)}
            matrix={blockMatrix}
            loading={blockLoading}
            startColumn={2}
          />

          <MatrixRenderer
            title="Faculty"
            subtitle={resolveSubtitle(
              selectedFacultyId,
              facultyLoading,
              facultySessions.length,
              "Pick Faculty",
            )}
            headerAction={renderHeaderButton(
              "Faculty",
              <User className="h-3 w-3" />,
              selectedFaculty?.name ?? null,
              () => setShowFacultyDialog(true),
              () => clearContextParam("facultyId"),
            )}
            days={DAYS}
            timeSlots={timeSlots.map((slot) => slot.start)}
            matrix={facultyMatrix}
            loading={facultyLoading}
            startColumn={9}
          />

          <MatrixRenderer
            title="Room"
            subtitle={resolveSubtitle(
              selectedRoomId,
              roomLoading,
              roomSessions.length,
              "Pick Room",
            )}
            headerAction={renderHeaderButton(
              "Room",
              <DoorOpen className="h-3 w-3" />,
              selectedRoom?.code ?? null,
              () => setShowRoomDialog(true),
              () => clearContextParam("roomId"),
            )}
            days={DAYS}
            timeSlots={timeSlots.map((slot) => slot.start)}
            matrix={roomMatrix}
            loading={roomLoading}
            startColumn={16}
          />
        </div>
      </div>

      <SelectFacultyDialog
        open={showFacultyDialog}
        onOpenChange={setShowFacultyDialog}
        faculty={faculty}
        selectedFacultyId={selectedFacultyId}
        onSelectFaculty={(facultyId) => {
          setContextParam("facultyId", facultyId);
          setShowFacultyDialog(false);
        }}
      />

      <SelectBlockDialog
        open={showBlockDialog}
        onOpenChange={setShowBlockDialog}
        blocks={blocks}
        selectedBlockId={selectedBlockId}
        onSelectBlock={(blockId: string) => {
          setContextParam("blockId", blockId);
          setShowBlockDialog(false);
        }}
      />

      <SelectRoomDialog
        open={showRoomDialog}
        onOpenChange={setShowRoomDialog}
        rooms={rooms}
        selectedRoomId={selectedRoomId}
        onSelectRoom={(roomId: string) => {
          setContextParam("roomId", roomId);
          setShowRoomDialog(false);
        }}
      />
    </div>
  );
};

export default ScheduleMapper;
