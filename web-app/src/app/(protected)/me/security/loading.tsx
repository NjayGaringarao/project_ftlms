import { Skeleton } from "@/components/ui/skeleton";

const Loading = () => (
  <div className="bg-background h-full w-full overflow-y-auto p-6">
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  </div>
);

export default Loading;
