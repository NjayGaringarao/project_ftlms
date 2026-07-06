import { PageHeader } from "@/features/app-shell/components/page-header";
import { getUserRole } from "@/features/auth/lib/utils";
import {
  accessLabelForRole,
  resolveHighestRole,
} from "@/features/home/lib/ftl-status";
import { ReactNode, Suspense } from "react";

const HomeHeader = async () => {
  const roles = await getUserRole();
  return <PageHeader accessLabel={accessLabelForRole(resolveHighestRole(roles))} />;
};

// The sticky header lives in the layout so the route's loading state only
// replaces the content below it. The layout itself must stay synchronous —
// an awaited fetch here would blank the whole route until it resolves —
// so the access label streams in behind its own Suspense boundary.
const HomeLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="bg-background h-full w-full overflow-y-auto flex flex-col">
      <Suspense fallback={<PageHeader accessLabel="" />}>
        <HomeHeader />
      </Suspense>
      <div className="flex-1">{children}</div>
    </div>
  );
};

export default HomeLayout;
