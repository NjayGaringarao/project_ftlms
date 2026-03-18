"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ArrowUpDown, Blocks, Search } from "lucide-react";
import ListItemSmall from "../ui/list-item-small";
import { SchedulerMapperClassListItem } from "@/lib/schedule/mapper";
import ClassSchedulerDialog from "./class-scheduler-dialog";
import { numberToHourDuration } from "@/utils/time";
import { Input } from "../ui/input";

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
  loading: boolean;
  classes: SchedulerMapperClassListItem[];
  onClassScheduleChange: () => void;
}

const ClassList = ({
  onClassScheduleChange,
  loading,
  classes,
}: ClassListProps) => {
  const [sortKey, setSortKey] = useState<SortKey>("classCode");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedClass, setSelectedClass] =
    useState<SchedulerMapperClassListItem | null>(null);
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();

  const filteredClasses: SchedulerMapperClassListItem[] = useMemo(() => {
    const sorted = [...classes].sort((left, right) =>
      mapperCompare(left, right, sortKey, sortDirection),
    );
    if (!normalizedQuery) return sorted;
    return sorted.filter((item) =>
      item.class_code.toLowerCase().includes(normalizedQuery),
    );
  }, [classes, sortKey, sortDirection, normalizedQuery]);

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
          <div className="flex min-w-0 flex-row items-center gap-2 px-4">
            <Search className="h-4 min-w-4 text-foreground/60" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search class code"
              className="h-8"
            />
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

          {!loading && filteredClasses.length === 0 && (
            <p className="p-4 text-center text-sm text-foreground/70">
              {normalizedQuery ? "No classes match your search." : "No classes found."}
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
