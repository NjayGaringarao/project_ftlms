import { redirect } from "next/navigation";
import { FacultyScheduleView } from "@/components/schedule/faculty/faculty-schedule-view";
import { getCurrentUser } from "@/lib/auth/utils";
import { getFacultySchedulePageData } from "@/lib/schedule/faculty-schedule";
import { ACADEMIC_TERM_QUERY_PARAM } from "@/lib/schedule/types";

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
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const requestedTermId = asStringValue(
    resolvedSearchParams?.[ACADEMIC_TERM_QUERY_PARAM],
  );
  const data = await getFacultySchedulePageData(user.id, requestedTermId);

  return (
    <div className="bg-background h-full w-full p-6 overflow-y-auto">
      <FacultyScheduleView data={data} />
    </div>
  );
};

export default SchedulePage;
