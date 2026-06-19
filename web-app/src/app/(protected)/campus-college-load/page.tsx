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
import CampusCollegeLoadProgramChair from "@/features/campus-college-load/components/campus-college-load-programchair";
import CampusCollegeLoadEvaluator from "@/features/campus-college-load/components/campus-college-load-evaluator";
import CampusCollegeLoadRoleSwitcher from "@/features/campus-college-load/components/campus-college-load-role-switcher";
import { getUserRole } from "@/features/auth/lib/utils";
import type { UserRole } from "@/features/shared/types/models";

type CampusCollegeLoadPageProps = {
  searchParams: Promise<{
    academic_term_id?: string | string[];
    id?: string | string[];
    campus_id?: string | string[];
    college_id?: string | string[];
    revision_id?: string | string[];
    view?: string | string[];
  }>;
};

const getSingleParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const evaluatorRoles: UserRole[] = [
  "Campus Director",
  "Director for Instruction",
  "Vice President for Academic Affairs",
];

const CampusCollegeLoadPage = async ({
  searchParams,
}: CampusCollegeLoadPageProps) => {
  const roles = await getUserRole();
  const allowedRoles: UserRole[] = ["Program Chairperson", ...evaluatorRoles];
  const canAccess = allowedRoles.some((role) => roles.includes(role));

  if (!canAccess) redirect("/home");

  const resolvedSearchParams = await searchParams;
  const requestedTermId = getSingleParam(resolvedSearchParams.academic_term_id);
  const selectedId = getSingleParam(resolvedSearchParams.id) ?? null;
  const selectedCampusId = getSingleParam(resolvedSearchParams.campus_id) ?? null;
  const selectedCollegeId = getSingleParam(resolvedSearchParams.college_id) ?? null;
  const selectedRevisionId = getSingleParam(resolvedSearchParams.revision_id) ?? null;
  const requestedView = getSingleParam(resolvedSearchParams.view);

  const [terms, defaultTerm, queriedTerm] = await Promise.all([
    getTermsList(),
    getDefaultAcademicTerm(),
    requestedTermId ? getTermById(requestedTermId) : null,
  ]);
  const academicTerm = queriedTerm ?? defaultTerm ?? terms[0] ?? null;

  const isChairRole = roles.includes("Program Chairperson");
  const isEvaluatorRole = evaluatorRoles.some((role) => roles.includes(role));

  const items =
    academicTerm && (isChairRole || isEvaluatorRole)
      ? await getCampusCollegeLoadList(academicTerm.id)
      : [];

  // Items contributed by the chair-scope pass carry the chair's actual
  // designation_id; evaluator-only rows are synthesized with an empty one.
  const chairItems = items.filter((item) => item.designation_id !== "");
  const isChair = chairItems.length > 0;
  const isEvaluator = isEvaluatorRole;

  const selectedView: "chair" | "evaluator" =
    isChair && isEvaluator
      ? requestedView === "evaluator"
        ? "evaluator"
        : "chair"
      : isChair
        ? "chair"
        : "evaluator";

  let effectiveSelectedId = selectedId;
  if (!effectiveSelectedId && selectedView === "chair" && chairItems.length > 0) {
    const matchedItem =
      (selectedCampusId && selectedCollegeId
        ? chairItems.find(
            (item) =>
              item.campus_id === selectedCampusId &&
              item.college_id === selectedCollegeId,
          )
        : null) ?? chairItems[0];
    effectiveSelectedId = matchedItem?.load?.id ?? null;
  }

  const detail = effectiveSelectedId
    ? await getCampusCollegeLoadDetail(effectiveSelectedId, {
        revisionId: selectedRevisionId,
      })
    : null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TopBarNav title="Campus College Load" icon="book-copy" items={[]}>
        <div className="flex flex-wrap items-center gap-2">
          {isChair && isEvaluator ? (
            <CampusCollegeLoadRoleSwitcher view={selectedView} />
          ) : null}
          <TermSwitcher
            terms={terms}
            selectedTermId={academicTerm?.id}
            routeConfig={{
              mode: "query",
              paramName: "academic_term_id",
              resetParamsOnSelect: ["id", "campus_id", "college_id", "revision_id"],
            }}
            description="Filter campus-college loads by academic term."
            emptyLabel="No academic terms found."
            buttonClassName="bg-background/95 text-foreground justify-between"
            buttonSize="default"
            showSubtitle={false}
          />
        </div>
      </TopBarNav>

      {academicTerm ? (
        selectedView === "chair" ? (
          <CampusCollegeLoadProgramChair
            items={chairItems}
            detail={detail}
            academicTermId={academicTerm.id}
            selectedCampusId={selectedCampusId}
            selectedCollegeId={selectedCollegeId}
          />
        ) : (
          <CampusCollegeLoadEvaluator
            items={items}
            detail={detail}
            selectedId={selectedId}
          />
        )
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
