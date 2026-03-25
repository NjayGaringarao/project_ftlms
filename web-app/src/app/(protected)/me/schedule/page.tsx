import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { FacultyScheduleView } from "@/components/schedule/faculty/faculty-schedule-view";
import { getCurrentUser, getUserRole } from "@/lib/auth/utils";
import { getFacultySchedulePageData } from "@/lib/schedule/faculty-schedule";
import { ACADEMIC_TERM_QUERY_PARAM } from "@/lib/schedule/types";
import { UserRole } from "@/models";

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
    <div className="bg-background h-full w-full overflow-y-auto">
      <PageHeader
        title="Schedule"
        iconName="calendar-days"
        accessLabel={accessLabel}
      />
      <div className="p-6">
        <FacultyScheduleView data={data} />
      </div>
    </div>
  );
};

export default SchedulePage;
