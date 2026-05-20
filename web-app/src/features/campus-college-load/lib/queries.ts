"use server";

import { createClient } from "@/utils/supabase/server";
import { getCurrentUserData } from "@/features/profile/lib/user-data/queries";
import type {
  CampusCollegeLoad,
  CampusCollegeLoadEvaluation,
  CampusCollegeLoadEvaluationStep,
  CampusCollegeLoadRevision,
  CampusCollegeLoadStatus,
  CampusCollegeLoadStep,
} from "@/features/shared/types/models";

export type CampusCollegeLoadScope = {
  campus_id: string;
  campus_code: string | null;
  campus_name: string | null;
  college_id: string;
  college_code: string | null;
  college_name: string | null;
  designation_id: string;
};

export type CampusCollegeLoadListItem = CampusCollegeLoadScope & {
  load: CampusCollegeLoad | null;
  latest_revision: CampusCollegeLoadRevision | null;
  actionable: boolean;
};

export type CampusCollegeLoadDetail = {
  load: CampusCollegeLoad & {
    campus?: { code?: string | null; name?: string | null } | null;
    college?: { code?: string | null; name?: string | null } | null;
  };
  latest_revision: CampusCollegeLoadRevision | null;
  revisions: CampusCollegeLoadRevision[];
  evaluations: Array<
    CampusCollegeLoadEvaluation & { attachment_signed_url?: string | null }
  >;
  can_submit_revision: boolean;
  can_evaluate_step: CampusCollegeLoadEvaluationStep | null;
  evaluator_designation_id: string | null;
};

type RawProgramChairScope = {
  id: string;
  program_offering:
    | {
        campus_id: string | null;
        campus?: { code?: string | null; name?: string | null } | null;
        program?: {
          college_id?: string | null;
          college?: { code?: string | null; name?: string | null } | null;
        } | null;
      }
    | Array<{
        campus_id: string | null;
        campus?: { code?: string | null; name?: string | null } | null;
        program?: {
          college_id?: string | null;
          college?: { code?: string | null; name?: string | null } | null;
        } | null;
      }>
    | null;
};

const first = <T>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
};

const normalizeLoad = (row: Record<string, unknown>): CampusCollegeLoad => ({
  id: String(row.id),
  campus_id: String(row.campus_id),
  college_id: String(row.college_id),
  academic_term_id: String(row.academic_term_id),
  status: row.status as CampusCollegeLoadStatus,
  current_step: row.current_step as CampusCollegeLoadStep,
  created_by_user_id: (row.created_by_user_id as string | null) ?? null,
  created_by_designation_id: (row.created_by_designation_id as string | null) ?? null,
  updated_by_user_id: (row.updated_by_user_id as string | null) ?? null,
  updated_by_designation_id: (row.updated_by_designation_id as string | null) ?? null,
  created_at: (row.created_at as string | null) ?? null,
  updated_at: (row.updated_at as string | null) ?? null,
});

const normalizeRevision = (
  row: Record<string, unknown> | null | undefined,
): CampusCollegeLoadRevision | null => {
  if (!row) return null;
  return {
    id: String(row.id),
    campus_college_load_id: String(row.campus_college_load_id),
    revision_number: Number(row.revision_number ?? 0),
    snapshot: row.snapshot as CampusCollegeLoadRevision["snapshot"],
    submitted_by_user_id: String(row.submitted_by_user_id),
    submitted_by_designation_id:
      (row.submitted_by_designation_id as string | null) ?? null,
    submitted_at: (row.submitted_at as string | null) ?? null,
  };
};

const normalizeEvaluation = (
  row: Record<string, unknown>,
): CampusCollegeLoadEvaluation => ({
  id: String(row.id),
  campus_college_load_revision_id: String(row.campus_college_load_revision_id),
  step: row.step as CampusCollegeLoadEvaluation["step"],
  designation_id: (row.designation_id as string | null) ?? null,
  evaluator_user_id: (row.evaluator_user_id as string | null) ?? null,
  status: row.status as CampusCollegeLoadEvaluation["status"],
  comment: (row.comment as string | null) ?? null,
  attachment_bucket: (row.attachment_bucket as string | null) ?? null,
  attachment_path: (row.attachment_path as string | null) ?? null,
  attachment_file_name: (row.attachment_file_name as string | null) ?? null,
  attachment_mime_type: (row.attachment_mime_type as string | null) ?? null,
  created_at: (row.created_at as string | null) ?? null,
});

export const getProgramChairCampusCollegeScopes = async (): Promise<
  CampusCollegeLoadScope[]
> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("designation")
    .select(
      `
      id,
      program_offering:program_offering_id(
        campus_id,
        campus:campus_id(code, name),
        program:program_id(
          college_id,
          college:college_id(code, name)
        )
      )
      `,
    )
    .eq("job_title", "Program Chairperson");

  if (error) {
    console.error("campusCollegeLoad.getProgramChairScopes ::", error);
    return [];
  }

  const currentUserData = await getCurrentUserData({ includeDesignations: true });
  const ownDesignationIds = new Set(
    (currentUserData?.designations ?? []).map((designation) => designation.id),
  );

  const scopes = new Map<string, CampusCollegeLoadScope>();
  ((data ?? []) as RawProgramChairScope[])
    .filter((row) => ownDesignationIds.has(row.id))
    .forEach((row) => {
      const offering = first(row.program_offering);
      const campus = first(offering?.campus);
      const program = first(offering?.program);
      const college = first(program?.college);
      const campusId = offering?.campus_id ?? null;
      const collegeId = program?.college_id ?? null;
      if (!campusId || !collegeId) return;
      const key = `${campusId}:${collegeId}`;
      if (scopes.has(key)) return;
      scopes.set(key, {
        campus_id: campusId,
        campus_code: campus?.code ?? null,
        campus_name: campus?.name ?? null,
        college_id: collegeId,
        college_code: college?.code ?? null,
        college_name: college?.name ?? null,
        designation_id: row.id,
      });
    });

  return Array.from(scopes.values()).sort((left, right) =>
    `${left.campus_code ?? ""} ${left.college_code ?? ""}`.localeCompare(
      `${right.campus_code ?? ""} ${right.college_code ?? ""}`,
    ),
  );
};

export const getCampusCollegeLoadList = async (
  academicTermId: string,
): Promise<CampusCollegeLoadListItem[]> => {
  const [chairScopes, currentUserData] = await Promise.all([
    getProgramChairCampusCollegeScopes(),
    getCurrentUserData({ includeDesignations: true }),
  ]);
  const supabase = await createClient();

  const roles = new Set(
    (currentUserData?.designations ?? []).map((designation) => designation.job_title),
  );
  const campusDirectorCampusIds = new Set(
    (currentUserData?.designations ?? [])
      .filter((designation) => designation.job_title === "Campus Director")
      .map((designation) => designation.campus_id)
      .filter((value): value is string => Boolean(value)),
  );

  const { data, error } = await supabase
    .from("campus_college_load")
    .select(
      `
      *,
      campus:campus_id(code, name),
      college:college_id(code, name),
      campus_college_load_revision(*)
      `,
    )
    .eq("academic_term_id", academicTermId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("campusCollegeLoad.getList ::", error);
    return [];
  }

  const loadRows = ((data ?? []) as Array<Record<string, unknown>>).map((row) => {
    const revisions = (row.campus_college_load_revision ??
      []) as Array<Record<string, unknown>>;
    const latestRevision = [...revisions].sort(
      (left, right) =>
        Number(right.revision_number ?? 0) - Number(left.revision_number ?? 0),
    )[0];
    return {
      load: normalizeLoad(row),
      latest_revision: normalizeRevision(latestRevision),
      campus: first(row.campus as { code?: string; name?: string } | null),
      college: first(row.college as { code?: string; name?: string } | null),
    };
  });

  const items = new Map<string, CampusCollegeLoadListItem>();
  chairScopes.forEach((scope) => {
    const match = loadRows.find(
      (row) =>
        row.load.campus_id === scope.campus_id &&
        row.load.college_id === scope.college_id,
    );
    items.set(`${scope.campus_id}:${scope.college_id}`, {
      ...scope,
      load: match?.load ?? null,
      latest_revision: match?.latest_revision ?? null,
      actionable:
        !match?.load ||
        match.load.status === "DRAFT" ||
        match.load.status === "RETURNED",
    });
  });

  loadRows.forEach((row) => {
    const canCampusDirectorAct =
      row.load.status === "SUBMITTED" &&
      row.load.current_step === "CAMPUS_DIRECTOR" &&
      campusDirectorCampusIds.has(row.load.campus_id);
    const canDiAct =
      row.load.status === "SUBMITTED" &&
      row.load.current_step === "DIRECTOR_FOR_INSTRUCTION" &&
      roles.has("Director for Instruction");
    const canVpaaAct =
      row.load.status === "SUBMITTED" &&
      row.load.current_step === "VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS" &&
      roles.has("Vice President for Academic Affairs");
    if (!canCampusDirectorAct && !canDiAct && !canVpaaAct) {
      return;
    }

    const key = `${row.load.campus_id}:${row.load.college_id}`;
    if (items.has(key)) return;
    items.set(key, {
      campus_id: row.load.campus_id,
      campus_code: row.campus?.code ?? null,
      campus_name: row.campus?.name ?? null,
      college_id: row.load.college_id,
      college_code: row.college?.code ?? null,
      college_name: row.college?.name ?? null,
      designation_id: "",
      load: row.load,
      latest_revision: row.latest_revision,
      actionable: canCampusDirectorAct || canDiAct || canVpaaAct,
    });
  });

  return Array.from(items.values());
};

export const getCampusCollegeLoadDetail = async (
  loadId: string,
): Promise<CampusCollegeLoadDetail | null> => {
  const supabase = await createClient();
  const { data: rawLoad, error: loadError } = await supabase
    .from("campus_college_load")
    .select("*, campus:campus_id(code, name), college:college_id(code, name)")
    .eq("id", loadId)
    .maybeSingle();

  if (loadError || !rawLoad) {
    if (loadError) console.error("campusCollegeLoad.getDetail.load ::", loadError);
    return null;
  }

  const { data: rawRevisions } = await supabase
    .from("campus_college_load_revision")
    .select("*")
    .eq("campus_college_load_id", loadId)
    .order("revision_number", { ascending: false });

  const revisions = ((rawRevisions ?? []) as Array<Record<string, unknown>>)
    .map((row) => normalizeRevision(row))
    .filter((row): row is CampusCollegeLoadRevision => Boolean(row));
  const latestRevision = revisions[0] ?? null;

  const { data: rawEvaluations } = latestRevision
    ? await supabase
        .from("campus_college_load_evaluation")
        .select("*")
        .eq("campus_college_load_revision_id", latestRevision.id)
        .order("created_at", { ascending: true })
    : { data: [] };

  const evaluations = await Promise.all(
    ((rawEvaluations ?? []) as Array<Record<string, unknown>>).map(
      async (row) => {
        const evaluation = normalizeEvaluation(row);
        if (!evaluation.attachment_path || !evaluation.attachment_bucket) {
          return { ...evaluation, attachment_signed_url: null };
        }

        const { data } = await supabase.storage
          .from(evaluation.attachment_bucket)
          .createSignedUrl(evaluation.attachment_path, 60 * 10, {
            download: evaluation.attachment_file_name ?? true,
          });

        return {
          ...evaluation,
          attachment_signed_url: data?.signedUrl ?? null,
        };
      },
    ),
  );

  const currentUserData = await getCurrentUserData({ includeDesignations: true });
  const load = normalizeLoad(rawLoad as Record<string, unknown>);
  const canSubmitRevision = (await getProgramChairCampusCollegeScopes()).some(
    (scope) =>
      scope.campus_id === load.campus_id &&
      scope.college_id === load.college_id &&
      (load.status === "DRAFT" || load.status === "RETURNED"),
  );

  let canEvaluateStep: CampusCollegeLoadEvaluationStep | null = null;
  let evaluatorDesignationId: string | null = null;
  if (load.status === "SUBMITTED") {
    for (const designation of currentUserData?.designations ?? []) {
      if (
        load.current_step === "CAMPUS_DIRECTOR" &&
        designation.job_title === "Campus Director" &&
        designation.campus_id === load.campus_id
      ) {
        canEvaluateStep = "CAMPUS_DIRECTOR";
        evaluatorDesignationId = designation.id;
      }
      if (
        load.current_step === "DIRECTOR_FOR_INSTRUCTION" &&
        designation.job_title === "Director for Instruction"
      ) {
        canEvaluateStep = "DIRECTOR_FOR_INSTRUCTION";
        evaluatorDesignationId = designation.id;
      }
      if (
        load.current_step === "VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS" &&
        designation.job_title === "Vice President for Academic Affairs"
      ) {
        canEvaluateStep = "VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS";
        evaluatorDesignationId = designation.id;
      }
    }
  }

  return {
    load: {
      ...load,
      campus: first(rawLoad.campus),
      college: first(rawLoad.college),
    },
    latest_revision: latestRevision,
    revisions,
    evaluations,
    can_submit_revision: canSubmitRevision,
    can_evaluate_step: canEvaluateStep,
    evaluator_designation_id: evaluatorDesignationId,
  };
};
