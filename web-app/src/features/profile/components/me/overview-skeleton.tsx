import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/style";

// Mirrors the /me overview grid (see app/(protected)/me/page.tsx).
const OverviewSkeleton = () => (
  <div
    className={cn(
      "bg-background h-full w-full p-6 overflow-y-auto",
      "flex flex-col gap-4",
      "xl:grid xl:grid-cols-2 2xl:grid-cols-3",
    )}
  >
    <Skeleton className="h-[420px] w-full" />

    <div className="2xl:col-span-2 space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full" />
        ))}
      </div>
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  </div>
);

export default OverviewSkeleton;
