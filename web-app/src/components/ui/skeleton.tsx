import { cn } from "@/utils/style";

// Server-renderable placeholder block; safe to use inside Suspense fallbacks
// (unlike ui/loading.tsx, which only becomes visible after hydration).
const Skeleton = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    data-slot="skeleton"
    className={cn("bg-accent animate-pulse rounded-md", className)}
    {...props}
  />
);

export { Skeleton };
