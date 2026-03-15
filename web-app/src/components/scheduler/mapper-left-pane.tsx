"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpDown,
  Blocks,
  DoorOpen,
  SlidersHorizontal,
  User,
  X,
} from "lucide-react";
import ListItemSmall from "@/components/ui/list-item-small";
import { Button } from "@/components/ui/button";
import type {
  CourseLoadingBlockListItem,
  FacultyListItem,
} from "@/lib/course-loading/types";
import type { ExtendedRoom } from "@/models";
import {
  getSchedulerMapperClassList,
  type SchedulerMapperClassListItem,
} from "@/lib/schedule/mapper";
import ClassSchedulerDialog from "./class-scheduler-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { cn } from "@/utils/style";
import SelectBlockDialog from "./select-block-dialog";
import SelectFacultyDialog from "./select-faculty-dialog";
import SelectRoomDialog from "./select-room-dialog";

type MapperLeftPaneProps = {
  academicTermId: string;
  blocks: CourseLoadingBlockListItem[];
};

type ContextKey = "facultyId" | "blockId" | "roomId";
type ActiveContext = { key: ContextKey; value: string } | null;

type SortKey = "classCode" | "totalHours" | "unscheduledHours";
type SortDirection = "asc" | "desc";

const SORT_KEY_PARAM = "sortKey";
const SORT_DIRECTION_PARAM = "sortDirection";

const toFixed = (value: number) => value.toFixed(2);

const parseSortKey = (value: string | null): SortKey => {
  if (value === "totalHours" || value === "unscheduledHours") return value;
  return "classCode";
};

const parseSortDirection = (value: string | null): SortDirection => {
  if (value === "desc") return "desc";
  return "asc";
};

const getActiveContextFromSearchParams = (
  params: Pick<URLSearchParams, "get">,
): ActiveContext => {
  const facultyId = params.get("facultyId");
  const blockId = params.get("blockId");
  const roomId = params.get("roomId");

  const activeCount =
    Number(Boolean(facultyId)) +
    Number(Boolean(blockId)) +
    Number(Boolean(roomId));

  if (activeCount !== 1) return null;
  if (facultyId) return { key: "facultyId", value: facultyId };
  if (blockId) return { key: "blockId", value: blockId };
  if (roomId) return { key: "roomId", value: roomId };
  return null;
};

const mapperCompare = (
  left: SchedulerMapperClassListItem,
  right: SchedulerMapperClassListItem,
  key: SortKey,
  direction: SortDirection,
): number => {
  const multiplier = direction === "asc" ? 1 : -1;

  if (key === "classCode") {
    return left.class_code.localeCompare(right.class_code) * multiplier;
  }

  if (key === "totalHours") {
    return (left.total_hours - right.total_hours) * multiplier;
  }

  const leftTotalUnscheduled =
    left.unscheduled_lecture_hours + left.unscheduled_laboratory_hours;
  const rightTotalUnscheduled =
    right.unscheduled_lecture_hours + right.unscheduled_laboratory_hours;

  return (leftTotalUnscheduled - rightTotalUnscheduled) * multiplier;
};

const MapperLeftPane = ({ academicTermId, blocks }: MapperLeftPaneProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeContext, setActiveContext] = useState<ActiveContext>(() =>
    getActiveContextFromSearchParams(searchParams),
  );
  const [classes, setClasses] = useState<SchedulerMapperClassListItem[]>([]);
  const [faculty, setFaculty] = useState<FacultyListItem[]>([]);
  const [rooms, setRooms] = useState<ExtendedRoom[]>([]);
  const [loading, setLoading] = useState(true);

  const [showFacultyDialog, setShowFacultyDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [selectedClass, setSelectedClass] =
    useState<SchedulerMapperClassListItem | null>(null);
  const [classListRefreshKey, setClassListRefreshKey] = useState(0);

  const [facultyQuery, setFacultyQuery] = useState("");
  const [blockQuery, setBlockQuery] = useState("");
  const [blockCampusFilter, setBlockCampusFilter] = useState("");
  const [blockYearFilter, setBlockYearFilter] = useState("");
  const [roomQuery, setRoomQuery] = useState("");
  const [roomCampusFilter, setRoomCampusFilter] = useState("");

  const selectedFacultyId =
    activeContext?.key === "facultyId" ? activeContext.value : null;
  const selectedBlockId =
    activeContext?.key === "blockId" ? activeContext.value : null;
  const selectedRoomId =
    activeContext?.key === "roomId" ? activeContext.value : null;
  const sortKey = parseSortKey(searchParams.get(SORT_KEY_PARAM));
  const sortDirection = parseSortDirection(
    searchParams.get(SORT_DIRECTION_PARAM),
  );

  const selectedFaculty =
    faculty.find((item) => item.id === selectedFacultyId) ?? null;
  const selectedBlock =
    blocks.find((item) => item.id === selectedBlockId) ?? null;
  const selectedRoom = rooms.find((item) => item.id === selectedRoomId) ?? null;

  const setQueryParams = (mutate: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(searchParams.toString());
    mutate(next);
    const queryString = next.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const setContextParam = (
    key: ContextKey,
    value: string,
  ) => {
    setActiveContext({ key, value });
    setQueryParams((next) => {
      next.delete("facultyId");
      next.delete("blockId");
      next.delete("roomId");
      next.set(key, value);
    });
  };

  const clearContext = () => {
    setActiveContext(null);
    setQueryParams((next) => {
      next.delete("facultyId");
      next.delete("blockId");
      next.delete("roomId");
    });
  };

  useEffect(() => {
    setActiveContext(getActiveContextFromSearchParams(searchParams));
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    const loadLookups = async () => {
      setLoading(true);
      const [courseLoadingModule, roomModule] = await Promise.all([
        import("@/lib/course-loading/queries"),
        import("@/lib/admin/rooms"),
      ]);

      const [facultyRows, roomRows] = await Promise.all([
        courseLoadingModule.getFacultyListByTerm(academicTermId),
        roomModule.getRooms(),
      ]);

      if (cancelled) return;
      setFaculty(facultyRows);
      setRooms(roomRows);
      setLoading(false);
    };

    loadLookups();

    return () => {
      cancelled = true;
    };
  }, [academicTermId]);

  useEffect(() => {
    if (!showBlockDialog) return;
    setBlockQuery("");
    setBlockCampusFilter("");
    setBlockYearFilter("");
  }, [showBlockDialog]);

  useEffect(() => {
    let cancelled = false;

    const loadClassList = async () => {
      const rows = await getSchedulerMapperClassList(academicTermId, {
        facultyId: selectedFacultyId,
        blockId: selectedBlockId,
        roomId: selectedRoomId,
      });

      if (cancelled) return;
      setClasses(rows);
    };

    loadClassList();

    return () => {
      cancelled = true;
    };
  }, [
    academicTermId,
    selectedFacultyId,
    selectedBlockId,
    selectedRoomId,
    classListRefreshKey,
  ]);

  const filteredClasses = useMemo(() => {


    return [...classes].sort((left, right) =>
      mapperCompare(left, right, sortKey, sortDirection),
    );
  }, [classes, sortKey, sortDirection]);

  const blockCampusOptions = useMemo(() => {
    const map = new Map<string, string>();
    blocks.forEach((item) => {
      if (item.campus_id && item.campus_name) {
        map.set(item.campus_id, item.campus_name);
      }
    });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [blocks]);

  const blockYearOptions = useMemo(() => {
    const set = new Set<number>();
    blocks.forEach((item) => set.add(item.year_level));
    return Array.from(set).sort((a, b) => a - b);
  }, [blocks]);

  const roomCampusOptions = useMemo(() => {
    const map = new Map<string, string>();
    rooms.forEach((item) => {
      if (item.campus?.id && item.campus?.name) {
        map.set(item.campus.id, item.campus.name);
      }
    });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [rooms]);

  const filteredFaculty = useMemo(() => {
    const normalized = facultyQuery.trim().toLowerCase();
    if (!normalized) return faculty;

    return faculty.filter((item) =>
      item.name.toLowerCase().includes(normalized),
    );
  }, [faculty, facultyQuery]);

  const filteredBlocks = useMemo(() => {
    const normalized = blockQuery.trim().toLowerCase();

    return blocks.filter((item) => {
      if (blockCampusFilter && item.campus_id !== blockCampusFilter)
        return false;
      if (blockYearFilter && item.year_level !== Number(blockYearFilter))
        return false;

      if (!normalized) return true;

      return (
        item.code.toLowerCase().includes(normalized) ||
        item.program_offering_code.toLowerCase().includes(normalized)
      );
    });
  }, [blocks, blockQuery, blockCampusFilter, blockYearFilter]);

  const filteredRooms = useMemo(() => {
    const normalized = roomQuery.trim().toLowerCase();

    return rooms.filter((item) => {
      if (roomCampusFilter && item.campus_id !== roomCampusFilter) return false;
      if (!normalized) return true;

      return (
        item.code.toLowerCase().includes(normalized) ||
        item.name?.toLowerCase().includes(normalized)
      );
    });
  }, [rooms, roomQuery, roomCampusFilter]);

  const selectedContextLabel =
    selectedFaculty?.name ?? selectedBlock?.code ?? selectedRoom?.code ?? null;

  return (
    <>
      <Card className="flex h-full flex-col gap-0 w-full overflow-hidden">
        <CardHeader className="flex-col mb-2">
          <CardTitle>Classes</CardTitle>
        </CardHeader>
        <CardContent className="px-2 flex flex-col gap-2 w-full">
          <div className="flex min-w-0 flex-row items-center gap-1 px-4">
            <SlidersHorizontal className="h-4 min-w-4 -ml-1" />
            {!selectedFaculty && !selectedBlock && !selectedRoom && (
              <p className="text-sm text-foreground mr-1">Set Context</p>
            )}
            <Button
              title={
                selectedFaculty
                  ? "Change Faculty Context"
                  : "Select Faculty Context"
              }
              variant="outline"
              className={cn(
                "min-w-0",
                selectedFaculty ? "flex-1" : "",
                !selectedRoom && !selectedBlock && !selectedFaculty && "flex-1",
              )}
              onClick={() => setShowFacultyDialog(true)}
            >
              <User className="h-4 w-4" />
              {selectedFaculty && (
                <span className="truncate text-sm">{selectedFaculty.name}</span>
              )}
            </Button>

            <Button
              title={
                selectedBlock ? "Change Block Context" : "Select Block Context"
              }
              variant="outline"
               className={cn(
                "min-w-0",
                selectedBlock ? "flex-1" : "",
                !selectedRoom && !selectedBlock && !selectedFaculty && "flex-1",
              )}
              onClick={() => setShowBlockDialog(true)}
            >
              <Blocks className="h-4 w-4" />
              {selectedBlock && (
                <span className="truncate text-sm">{selectedBlock.code}</span>
              )}
            </Button>

            <Button
              title={
                selectedRoom ? "Change Room Context" : "Select Room Context"
              }
              variant="outline"
              className={cn(
                "min-w-0",
                selectedRoom ? "flex-1" : "",
                !selectedRoom && !selectedBlock && !selectedFaculty && "flex-1",
              )}
              onClick={() => setShowRoomDialog(true)}
            >
              <DoorOpen className="h-4 w-4" />

              {selectedRoom && (
                <span className="truncate text-sm">{selectedRoom.code}</span>
              )}
            </Button>

            {(selectedFaculty || selectedBlock || selectedRoom) && (
              <Button
                title="Clear Context"
                variant="outline"
                onClick={clearContext}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex min-w-0 flex-row gap-2 px-4 items-center">
            <ArrowUpDown className="h-4 w-4" />
            <select
              value={sortKey}
              onChange={(event) => {
                const value = parseSortKey(event.target.value);
                setQueryParams((next) => next.set(SORT_KEY_PARAM, value));
              }}
              className="flex-1 rounded-md border bg-background px-2 py-1.5 text-xs"
            >
              <option value="classCode">Sort by Class Code</option>
              <option value="totalHours">Sort by Total Hours</option>
              <option value="unscheduledHours">
                Sort by Unscheduled Hours
              </option>
            </select>

            <select
              value={sortDirection}
              onChange={(event) => {
                const value = parseSortDirection(event.target.value);
                setQueryParams((next) => next.set(SORT_DIRECTION_PARAM, value));
              }}
              className="rounded-md border bg-background px-2 py-1.5 text-xs"
              aria-label="Sort direction"
            >
              <option value="asc">ASC</option>
              <option value="desc">DESC</option>
            </select>
          </div>
        </CardContent>

        <CardContent className="flex flex-col flex-1 gap-2 overflow-y-auto p-4">
          {loading && (
            <p className="p-4 text-center text-sm text-foreground/70">
              Loading list...
            </p>
          )}

          {!loading && !selectedContextLabel && (
            <p className="p-4 text-center text-sm text-foreground/70">
              Select a faculty, block, or room to load classes.
            </p>
          )}

          {!loading && selectedContextLabel && filteredClasses.length === 0 && (
            <p className="p-4 text-center text-sm text-foreground/70">
              No classes found.
            </p>
          )}

          {filteredClasses.map((item) => (
            <ListItemSmall
              key={item.id}
              title={item.class_code}
              subtitle={[
                `Unsched: Lec ${toFixed(item.unscheduled_lecture_hours)}h Lab ${toFixed(item.unscheduled_laboratory_hours)}h`,
              ]}
              onClick={() => setSelectedClass(item)}
              icon={<Blocks className="h-8 w-8 text-background/80" />}
              annotations={
                <span className="rounded-md bg-foreground/10 px-1.5 py-1 text-xs">
                  Hrs: {toFixed(item.total_hours)}
                </span>
              }
            />
          ))}
        </CardContent>
      </Card>

      <SelectFacultyDialog
        open={showFacultyDialog}
        onOpenChange={setShowFacultyDialog}
        facultyQuery={facultyQuery}
        onFacultyQueryChange={setFacultyQuery}
        faculty={filteredFaculty}
        selectedFacultyId={selectedFacultyId}
        onSelectFaculty={(facultyId) => {
          setContextParam("facultyId", facultyId);
          setShowFacultyDialog(false);
        }}
      />

      <SelectBlockDialog
        open={showBlockDialog}
        onOpenChange={setShowBlockDialog}
        blockQuery={blockQuery}
        onBlockQueryChange={setBlockQuery}
        blockCampusFilter={blockCampusFilter}
        onBlockCampusFilterChange={setBlockCampusFilter}
        blockCampusOptions={blockCampusOptions}
        blockYearFilter={blockYearFilter}
        onBlockYearFilterChange={setBlockYearFilter}
        blockYearOptions={blockYearOptions}
        blocks={filteredBlocks}
        selectedBlockId={selectedBlockId}
        onSelectBlock={(blockId: string) => {
          setContextParam("blockId", blockId);
          setShowBlockDialog(false);
        }}
      />

      <SelectRoomDialog
        open={showRoomDialog}
        onOpenChange={setShowRoomDialog}
        roomQuery={roomQuery}
        onRoomQueryChange={setRoomQuery}
        roomCampusFilter={roomCampusFilter}
        onRoomCampusFilterChange={setRoomCampusFilter}
        roomCampusOptions={roomCampusOptions}
        rooms={filteredRooms}
        selectedRoomId={selectedRoomId}
        onSelectRoom={(roomId: string) => {
          setContextParam("roomId", roomId);
          setShowRoomDialog(false);
        }}
      />

      {selectedClass ? (
        <ClassSchedulerDialog
          open={Boolean(selectedClass)}
          onOpenChange={(open) => {
            if (!open) setSelectedClass(null);
          }}
          classId={selectedClass.id}
          classCode={selectedClass.class_code}
          onChanged={() => setClassListRefreshKey((value) => value + 1)}
        />
      ) : null}
    </>
  );
};

export default MapperLeftPane;
