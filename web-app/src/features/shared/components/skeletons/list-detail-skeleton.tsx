import { Skeleton } from "@/components/ui/skeleton";
import { TopBarNav } from "@/features/app-shell/components/topbar-nav";
import type { IconName } from "@/utils/icon";

type ListDetailSkeletonProps = {
  /** When provided, renders the page top bar so the shell matches the loaded page. */
  title?: string;
  icon?: IconName;
};

// Mirrors the ManagementContainer grid + AdminManagementList shapes so the
// streamed-in content replaces the skeleton without layout shift.
const ListDetailSkeleton = ({ title, icon }: ListDetailSkeletonProps) => (
  <div className="flex h-full flex-col overflow-hidden">
    {title ? (
      <TopBarNav title={title} icon={icon} items={[]}>
        <Skeleton className="h-9 w-44 bg-background/30" />
      </TopBarNav>
    ) : null}

    <div className="min-h-0 h-full overflow-hidden flex-1 p-4 grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-[minmax(360px,420px)_minmax(0,1fr)]">
      <section className="min-w-0 h-full overflow-hidden">
        <div className="relative h-full flex-1 flex flex-col gap-4 overflow-hidden">
          <div className="flex w-full flex-row items-center gap-4">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 w-28" />
          </div>
          <div className="min-h-0 flex-1 space-y-1 overflow-hidden">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        </div>
      </section>

      <aside className="hidden h-full min-w-0 flex-col justify-center lg:flex">
        <div className="w-full space-y-4 rounded-lg border p-6">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
          <div className="space-y-3 pt-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </aside>
    </div>
  </div>
);

export { ListDetailSkeleton };
