import { redirect } from "next/navigation";
import { FacultyScheduleView } from "@/features/profile/components/schedule/faculty/faculty-schedule-view";
import { getCurrentUser } from "@/features/auth/lib/utils";
import { getFacultySchedulePageData } from "@/features/scheduler/lib/schedule/faculty-schedule";
import { ACADEMIC_TERM_QUERY_PARAM } from "@/features/scheduler/lib/schedule/types";

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

const SchedulePage = async ({ searchParams }: SchedulePageProps) => {
  const [user, resolvedSearchParams] = await Promise.all([
    getCurrentUser(),
    searchParams,
  ]);

  if (!user) {
    redirect("/auth/login");
  }

  const requestedTermId = asStringValue(
    resolvedSearchParams?.[ACADEMIC_TERM_QUERY_PARAM],
  );
  const data = await getFacultySchedulePageData(user.id, requestedTermId);

  return (
    <div className="bg-background h-full w-full overflow-y-auto p-4">
      <FacultyScheduleView data={data} userId={user.id} />
    </div>
  );
};

export default SchedulePage;
