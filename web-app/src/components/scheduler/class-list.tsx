"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  ArrowUpDown,
  Blocks,
  DoorOpen,
  SlidersHorizontal,
  User,
  X,
} from "lucide-react";
import { Button } from "../ui/button";
import ListItemSmall from "../ui/list-item-small";
import { cn } from "@/utils/style";
import {
  CourseLoadingBlockListItem,
  FacultyListItem,
} from "@/lib/course-loading";
import { ExtendedRoom } from "@/models";
import { SchedulerMapperClassListItem } from "@/lib/schedule/mapper";
import ClassSchedulerDialog from "./class-scheduler-dialog";
import { numberToHourDuration } from "@/utils/time";

type SortKey = "classCode" | "totalHours" | "unscheduledHours";
type SortDirection = "asc" | "desc";

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

interface ClassListProps {
  selectedFaculty: FacultyListItem | null;
  selectedBlock: CourseLoadingBlockListItem | null;
  selectedRoom: ExtendedRoom | null;
  onFacultyClick: () => void;
  onBlockClick: () => void;
  onRoomClick: () => void;
  onClearContext: () => void;
  loading: boolean;
  classes: SchedulerMapperClassListItem[];
  onClassScheduleChange: () => void;
}

const ClassList = ({
  selectedFaculty,
  selectedBlock,
  selectedRoom,
  onFacultyClick,
  onBlockClick,
  onRoomClick,
  onClearContext,
  onClassScheduleChange,
  loading,
  classes,
}: ClassListProps) => {
  const [sortKey, setSortKey] = useState<SortKey>("classCode");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedClass, setSelectedClass] =
    useState<SchedulerMapperClassListItem | null>(null);

  const selectedContextLabel =
    selectedFaculty?.name ?? selectedBlock?.code ?? selectedRoom?.code ?? null;

  const filteredClasses: SchedulerMapperClassListItem[] = useMemo(() => {
    return [...classes].sort((left, right) =>
      mapperCompare(left, right, sortKey, sortDirection),
    );
  }, [classes, sortKey, sortDirection]);

  const parseSortKey = (value: string | null): SortKey => {
    if (value === "totalHours" || value === "unscheduledHours") return value;
    return "classCode";
  };

  const parseSortDirection = (value: string | null): SortDirection => {
    if (value === "desc") return "desc";
    return "asc";
  };

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
              onClick={onFacultyClick}
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
              onClick={onBlockClick}
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
              onClick={onRoomClick}
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
                onClick={onClearContext}
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
                setSortKey(parseSortKey(event.target.value));
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
                setSortDirection(parseSortDirection(event.target.value));
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
                `Unsched: Lec ${numberToHourDuration(item.unscheduled_lecture_hours)} Lab ${numberToHourDuration(item.unscheduled_laboratory_hours)}`,
              ]}
              onClick={() => setSelectedClass(item)}
              icon={<Blocks className="h-8 w-8 text-background/80" />}
              annotations={
                <span className="rounded-md bg-foreground/10 px-1.5 py-1 text-xs">
                  Total: {numberToHourDuration(item.total_hours)}
                </span>
              }
            />
          ))}
        </CardContent>
      </Card>

      {selectedClass ? (
        <ClassSchedulerDialog
          open={Boolean(selectedClass)}
          onOpenChange={(open) => {
            if (!open) setSelectedClass(null);
          }}
          classId={selectedClass.id}
          classCode={selectedClass.class_code}
          onChanged={onClassScheduleChange}
        />
      ) : null}
    </>
  );
};

export default ClassList;
