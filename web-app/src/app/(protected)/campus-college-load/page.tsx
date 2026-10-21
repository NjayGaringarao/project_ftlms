import { Suspense } from "react";
import { redirect } from "next/navigation";
import { TopBarNav } from "@/features/app-shell/components/topbar-nav";
import TermSwitcher from "@/features/shared/components/pickers/term-switcher";
import {
  getDefaultAcademicTermCached,
  getTermByIdCached,
  getTermsListCached,
} from "@/features/admin/lib/terms-cached";
import {
  getCampusCollegeLoadDetail,
  getCampusCollegeLoadList,
} from "@/features/campus-college-load/lib/queries";
import CampusCollegeLoadProgramChair from "@/features/campus-college-load/components/campus-college-load-programchair";
import CampusCollegeLoadEvaluator from "@/features/campus-college-load/components/campus-college-load-evaluator";
import CampusCollegeLoadRoleSwitcher from "@/features/campus-college-load/components/campus-college-load-role-switcher";
import { getUserRole } from "@/features/auth/lib/utils";
import { ListDetailSkeleton } from "@/features/shared/components/skeletons/list-detail-skeleton";
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

const CampusCollegeLoadContent = async ({
  searchParams,
}: CampusCollegeLoadPageProps) => {
  const resolvedSearchParams = await searchParams;
  const requestedTermId = getSingleParam(resolvedSearchParams.academic_term_id);
  const selectedId = getSingleParam(resolvedSearchParams.id) ?? null;
  const selectedCampusId = getSingleParam(resolvedSearchParams.campus_id) ?? null;
  const selectedCollegeId = getSingleParam(resolvedSearchParams.college_id) ?? null;
  const selectedRevisionId = getSingleParam(resolvedSearchParams.revision_id) ?? null;
  const requestedView = getSingleParam(resolvedSearchParams.view);

  const [roles, terms, defaultTerm, queriedTerm] = await Promise.all([
    getUserRole(),
    getTermsListCached(),
    getDefaultAcademicTermCached(),
    requestedTermId ? getTermByIdCached(requestedTermId) : null,
  ]);

  const allowedRoles: UserRole[] = ["Program Chairperson", ...evaluatorRoles];
  const canAccess = allowedRoles.some((role) => roles.includes(role));

  if (!canAccess) redirect("/home");

  const academicTerm = queriedTerm ?? defaultTerm ?? terms[0] ?? null;

  const isChairRole = roles.includes("Program Chairperson");
  const isEvaluatorRole = evaluatorRoles.some((role) => roles.includes(role));

  const listPromise =
    academicTerm && (isChairRole || isEvaluatorRole)
      ? getCampusCollegeLoadList(academicTerm.id)
      : null;
  // An explicit ?id= doesn't depend on the list result — fetch both in parallel.
  const eagerDetailPromise = selectedId && academicTerm
    ? getCampusCollegeLoadDetail(selectedId, {
        academicTermId: academicTerm.id,
        revisionId: selectedRevisionId,
      })
    : null;
  const [items, eagerDetail] = await Promise.all([
    listPromise ?? [],
    eagerDetailPromise ?? null,
  ]);

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

  let detail = eagerDetail;
  if (!selectedId && selectedView === "chair" && chairItems.length > 0) {
    const matchedItem =
      (selectedCampusId && selectedCollegeId
        ? chairItems.find(
            (item) =>
              item.campus_id === selectedCampusId &&
              item.college_id === selectedCollegeId,
          )
        : null) ?? chairItems[0];
    const effectiveSelectedId = matchedItem?.load?.id ?? null;
    detail = effectiveSelectedId
      ? await getCampusCollegeLoadDetail(effectiveSelectedId, {
          academicTermId: academicTerm.id,
          revisionId: selectedRevisionId,
        })
      : null;
  }

  return (
    <div data-testid="campus-college-load-content" className="flex h-full flex-col overflow-hidden">
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

const CampusCollegeLoadPage = ({ searchParams }: CampusCollegeLoadPageProps) => (
  <Suspense
    fallback={<ListDetailSkeleton title="Campus College Load" icon="book-copy" />}
  >
    <CampusCollegeLoadContent searchParams={searchParams} />
  </Suspense>
);

export default CampusCollegeLoadPage;
