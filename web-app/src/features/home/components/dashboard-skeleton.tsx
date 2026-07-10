import { Skeleton } from "@/components/ui/skeleton";

// Mirrors the dashboard grid (see dashboards/admin-dashboard.tsx) so streamed
// insights replace the skeleton without layout shift.
const DashboardSkeleton = () => (
  <div className="p-6 flex flex-col gap-4 xl:grid xl:grid-cols-2 2xl:grid-cols-3">
    <div className="grid gap-4 grid-cols-2 xl:grid-cols-4 xl:col-span-full">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-28 w-full" />
      ))}
    </div>
    <Skeleton className="h-[240px] w-full" />
    <Skeleton className="h-[240px] w-full" />
    <Skeleton className="hidden h-[240px] w-full 2xl:block" />
  </div>
);

export default DashboardSkeleton;
