import { redirect } from "next/navigation";
import { TopBarNav } from "@/features/app-shell/components/topbar-nav";
import TermSwitcher from "@/features/shared/components/pickers/term-switcher";
import {
  getDefaultAcademicTerm,
  getTermById,
  getTermsList,
} from "@/features/admin/lib/terms";
import {
  getCampusCollegeLoadDetail,
  getCampusCollegeLoadList,
} from "@/features/campus-college-load/lib/queries";
import CampusCollegeLoadWorkspace from "@/features/campus-college-load/components/campus-college-load-workspace";
import { getUserRole } from "@/features/auth/lib/utils";
import type { UserRole } from "@/features/shared/types/models";

type CampusCollegeLoadPageProps = {
  searchParams: Promise<{
    academic_term_id?: string | string[];
    id?: string | string[];
    campus_id?: string | string[];
    college_id?: string | string[];
  }>;
};

const getSingleParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const CampusCollegeLoadPage = async ({
  searchParams,
}: CampusCollegeLoadPageProps) => {
  const roles = await getUserRole();
  const allowedRoles: UserRole[] = [
    "Program Chairperson",
    "Campus Director",
    "Director for Instruction",
    "Vice President for Academic Affairs",
  ];
  const canAccess = allowedRoles.some((role) => roles.includes(role));

  if (!canAccess) redirect("/home");

  const resolvedSearchParams = await searchParams;
  const requestedTermId = getSingleParam(resolvedSearchParams.academic_term_id);
  const selectedId = getSingleParam(resolvedSearchParams.id) ?? null;
  const selectedCampusId = getSingleParam(resolvedSearchParams.campus_id) ?? null;
  const selectedCollegeId = getSingleParam(resolvedSearchParams.college_id) ?? null;

  const [terms, defaultTerm, queriedTerm] = await Promise.all([
    getTermsList(),
    getDefaultAcademicTerm(),
    requestedTermId ? getTermById(requestedTermId) : null,
  ]);
  const academicTerm = queriedTerm ?? defaultTerm ?? terms[0] ?? null;

  const items = academicTerm ? await getCampusCollegeLoadList(academicTerm.id) : [];
  const detail = selectedId ? await getCampusCollegeLoadDetail(selectedId) : null;
  const selectedDraftScope =
    !selectedId && selectedCampusId && selectedCollegeId
      ? items.find(
          (item) =>
            item.campus_id === selectedCampusId &&
            item.college_id === selectedCollegeId,
        ) ?? null
      : null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TopBarNav title="Campus College Load" icon="book-copy" items={[]}>
        <TermSwitcher
          terms={terms}
          selectedTermId={academicTerm?.id}
          routeConfig={{
            mode: "query",
            paramName: "academic_term_id",
            resetParamsOnSelect: ["id", "campus_id", "college_id"],
          }}
          description="Filter campus-college loads by academic term."
          emptyLabel="No academic terms found."
          buttonClassName="bg-background/95 text-foreground justify-between"
          buttonSize="default"
          showSubtitle={false}
        />
      </TopBarNav>

      {academicTerm ? (
        <CampusCollegeLoadWorkspace
          items={items}
          detail={detail}
          selectedId={selectedId}
          selectedDraftScope={selectedDraftScope}
          academicTermId={academicTerm.id}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-3xl rounded-lg border border-dashed p-6">
            <h1 className="text-lg font-semibold">Campus College Load</h1>
            <p className="mt-2 text-sm text-foreground/70">
              Set a default academic term to begin the load workflow.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampusCollegeLoadPage;
