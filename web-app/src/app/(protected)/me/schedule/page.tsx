import { redirect } from "next/navigation";
import { PageHeader } from "@/features/app-shell/components/page-header";
import { FacultyScheduleView } from "@/features/profile/components/schedule/faculty/faculty-schedule-view";
import { getCurrentUser, getUserRole } from "@/features/auth/lib/utils";
import { getFacultySchedulePageData } from "@/features/scheduler/lib/schedule/faculty-schedule";
import { ACADEMIC_TERM_QUERY_PARAM } from "@/features/scheduler/lib/schedule/types";
import { UserRole } from "@/features/shared/types/models";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SchedulePageProps = {
  searchParams?: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

const asStringValue = (value: string | string[] | undefined): string | null => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
};

const getAccessLabel = (roles: UserRole[]) => {
  if (roles.includes("Program Chairperson")) return "Program Chair Access";
  if (roles.includes("College Dean")) return "Dean Access";
  if (roles.includes("Campus Director")) return "Campus Director Access";
  if (roles.includes("Vice President for Academic Affairs"))
    return "VPAA Access";
  return "Faculty Access";
};

const SchedulePage = async ({ searchParams }: SchedulePageProps) => {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const userRole = await getUserRole();

  const requestedTermId = asStringValue(
    resolvedSearchParams?.[ACADEMIC_TERM_QUERY_PARAM],
  );
  const data = await getFacultySchedulePageData(user.id, requestedTermId);
  const accessLabel = getAccessLabel(userRole);

  return (
    <div className="bg-background h-full w-full overflow-y-auto p-6">
      <FacultyScheduleView data={data} userId={user.id} />
    </div>
  );
};

export default SchedulePage;
