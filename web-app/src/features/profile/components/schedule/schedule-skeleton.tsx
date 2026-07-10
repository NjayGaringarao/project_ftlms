import { Skeleton } from "@/components/ui/skeleton";

// Mirrors the /me/schedule wrapper + FacultyScheduleView toolbar and week grid.
const ScheduleSkeleton = () => (
  <div className="bg-background h-full w-full overflow-y-auto p-6">
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Skeleton className="h-8 w-56" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-full" />
        ))}
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={`col-${index}`} className="h-[60vh] w-full" />
        ))}
      </div>
    </div>
  </div>
);

export default ScheduleSkeleton;
