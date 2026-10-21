"use server";

import { createClient } from "@/utils/supabase/server";
import { getCurrentUserDataCached } from "@/features/profile/lib/user-data/cached";
import { formatFullName } from "@/features/shared/lib/format-name";
import { getProgramChairCampusCollegeScopesCached } from "./cached";
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

export type CampusCollegeLoadEvaluatorBucket = "PENDING" | "APPROVED" | "RETURNED";

export type CampusCollegeLoadEvaluationAttachment = {
  id: string;
  file_name: string;
  mime_type: string | null;
  signed_url: string | null;
};

// List rows deliberately omit the revision `snapshot` JSONB — it is large and
// only the detail view needs it.
export type CampusCollegeLoadRevisionSummary = Omit<
  CampusCollegeLoadRevision,
  "snapshot"
>;

export type CampusCollegeLoadListItem = CampusCollegeLoadScope & {
  load: CampusCollegeLoad | null;
  latest_revision: CampusCollegeLoadRevisionSummary | null;
  actionable: boolean;
  evaluator_bucket: CampusCollegeLoadEvaluatorBucket | null;
};

export type CampusCollegeLoadDetail = {
  load: CampusCollegeLoad & {
    campus?: { code?: string | null; name?: string | null } | null;
    college?: { code?: string | null; name?: string | null } | null;
  };
  latest_revision: CampusCollegeLoadRevision | null;
  viewed_revision: CampusCollegeLoadRevision | null;
  revisions: CampusCollegeLoadRevision[];
  evaluations: Array<
    CampusCollegeLoadEvaluation & {
      attachment_signed_url?: string | null;
      evaluator_name?: string | null;
      designation_title?: string | null;
      attachments: CampusCollegeLoadEvaluationAttachment[];
    }
  >;
  signatures: {
    prepared: CampusCollegeLoadSignatureSlot;
    recommending_approval: CampusCollegeLoadSignatureSlot;
    approved: CampusCollegeLoadSignatureSlot;
  };
  can_submit_revision: boolean;
  can_evaluate_step: CampusCollegeLoadEvaluationStep | null;
  evaluator_designation_id: string | null;
};

export type CampusCollegeLoadSignatureSlot = {
  label: string;
  name: string | null;
  role: string;
  decided_at: string | null;
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
  submitterNames: Map<string, string> = new Map(),
): CampusCollegeLoadRevision | null => {
  if (!row) return null;
  const submittedByUserId = String(row.submitted_by_user_id);
  return {
    id: String(row.id),
    campus_college_load_id: String(row.campus_college_load_id),
    revision_number: Number(row.revision_number ?? 0),
    snapshot: row.snapshot as CampusCollegeLoadRevision["snapshot"],
    submitted_by_user_id: submittedByUserId,
    submitted_by_designation_id:
      (row.submitted_by_designation_id as string | null) ?? null,
    submitted_by_name: submitterNames.get(submittedByUserId) ?? null,
    submitted_at: (row.submitted_at as string | null) ?? null,
  };
};

const normalizeRevisionSummary = (
  row: Record<string, unknown> | null | undefined,
): CampusCollegeLoadRevisionSummary | null => {
  if (!row) return null;
  return {
    id: String(row.id),
    campus_college_load_id: String(row.campus_college_load_id),
    revision_number: Number(row.revision_number ?? 0),
    submitted_by_user_id: String(row.submitted_by_user_id),
    submitted_by_designation_id:
      (row.submitted_by_designation_id as string | null) ?? null,
    submitted_by_name: null,
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
  system_generated: Boolean(row.system_generated),
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

  const currentUserData = await getCurrentUserDataCached({
    includeDesignations: true,
  });
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
  const supabase = await createClient();
  const [chairScopes, currentUserData, { data, error }] = await Promise.all([
    getProgramChairCampusCollegeScopesCached(),
    getCurrentUserDataCached({ includeDesignations: true }),
    supabase
      .from("campus_college_load")
      .select(
        `
        *,
        campus:campus_id(code, name),
        college:college_id(code, name),
        campus_college_load_revision(id, campus_college_load_id, revision_number, submitted_by_user_id, submitted_by_designation_id, submitted_at)
        `,
      )
      .eq("academic_term_id", academicTermId)
      .order("updated_at", { ascending: false }),
  ]);

  const roles = new Set(
    (currentUserData?.designations ?? []).map((designation) => designation.job_title),
  );
  const campusDirectorCampusIds = new Set(
    (currentUserData?.designations ?? [])
      .filter((designation) => designation.job_title === "Campus Director")
      .map((designation) => designation.campus_id)
      .filter((value): value is string => Boolean(value)),
  );

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
      latest_revision: normalizeRevisionSummary(latestRevision),
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
      evaluator_bucket: null,
    });
  });

  const latestRevisionIds = loadRows
    .map((row) => row.latest_revision?.id)
    .filter((id): id is string => Boolean(id));
  const { data: approvedEvaluationRows } =
    latestRevisionIds.length > 0
      ? await supabase
          .from("campus_college_load_evaluation")
          .select("campus_college_load_revision_id, step, evaluator_user_id")
          .in("campus_college_load_revision_id", latestRevisionIds)
          .eq("status", "APPROVED")
      : { data: [] };
  const approvedByRevision = new Map<string, Set<string>>();
  (approvedEvaluationRows ?? []).forEach((row) => {
    const revisionId = String(row.campus_college_load_revision_id);
    const set = approvedByRevision.get(revisionId) ?? new Set<string>();
    set.add(`${row.step}:${row.evaluator_user_id}`);
    approvedByRevision.set(revisionId, set);
  });
  const currentUserId = currentUserData?.id ?? null;

  const evaluatorChain: Array<{
    step: CampusCollegeLoadEvaluationStep;
    eligible: (campusId: string) => boolean;
  }> = [
    {
      step: "CAMPUS_DIRECTOR",
      eligible: (campusId) => campusDirectorCampusIds.has(campusId),
    },
    {
      step: "DIRECTOR_FOR_INSTRUCTION",
      eligible: () => roles.has("Director for Instruction"),
    },
    {
      step: "VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS",
      eligible: () => roles.has("Vice President for Academic Affairs"),
    },
  ];

  loadRows.forEach((row) => {
    const key = `${row.load.campus_id}:${row.load.college_id}`;
    if (items.has(key)) return;

    let bucket: CampusCollegeLoadEvaluatorBucket | null = null;
    for (const { step, eligible } of evaluatorChain) {
      if (!eligible(row.load.campus_id)) continue;

      if (row.load.status === "SUBMITTED" && row.load.current_step === step) {
        bucket = "PENDING";
        break;
      }
      if (row.load.status === "RETURNED") {
        bucket = "RETURNED";
        break;
      }
      const approvedSet = row.latest_revision
        ? approvedByRevision.get(row.latest_revision.id)
        : undefined;
      if (currentUserId && approvedSet?.has(`${step}:${currentUserId}`)) {
        bucket = "APPROVED";
        break;
      }
    }

    if (!bucket) return;
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
      actionable: bucket === "PENDING",
      evaluator_bucket: bucket,
    });
  });

  return Array.from(items.values());
};

export const getCampusCollegeLoadDetail = async (
  loadId: string,
  options: { academicTermId: string; revisionId?: string | null },
): Promise<CampusCollegeLoadDetail | null> => {
  const supabase = await createClient();

  // Stage 1 — all independent of one another.
  const [
    { data: rawLoad, error: loadError },
    { data: rawRevisions },
    currentUserData,
    chairScopes,
  ] = await Promise.all([
    supabase
      .from("campus_college_load")
      .select("*, campus:campus_id(code, name), college:college_id(code, name)")
      .eq("id", loadId)
      .eq("academic_term_id", options.academicTermId)
      .maybeSingle(),
    supabase
      .from("campus_college_load_revision")
      .select("*")
      .eq("campus_college_load_id", loadId)
      .order("revision_number", { ascending: false }),
    getCurrentUserDataCached({ includeDesignations: true }),
    getProgramChairCampusCollegeScopesCached(),
  ]);

  if (loadError || !rawLoad) {
    if (loadError) console.error("campusCollegeLoad.getDetail.load ::", loadError);
    return null;
  }

  const rawRevisionRows = (rawRevisions ?? []) as Array<Record<string, unknown>>;
  const submitterIds = Array.from(
    new Set(
      rawRevisionRows
        .map((row) => row.submitted_by_user_id)
        .filter((value): value is string => typeof value === "string"),
    ),
  );

  // The viewed revision is decidable from the raw rows (already ordered by
  // revision_number desc), so the evaluations fetch doesn't have to wait for
  // the submitter-name lookup.
  const requestedRawRevision = options?.revisionId
    ? (rawRevisionRows.find((row) => String(row.id) === options.revisionId) ?? null)
    : null;
  const viewedRevisionId = requestedRawRevision
    ? String(requestedRawRevision.id)
    : rawRevisionRows[0]
      ? String(rawRevisionRows[0].id)
      : null;

  // Stage 2 — needs only the revision rows.
  const [{ data: submitterIdentities }, { data: rawEvaluations }] =
    await Promise.all([
      submitterIds.length > 0
        ? supabase
            .from("identity")
            .select("user_id, first_name, middle_name, last_name, suffix, professional_extension")
            .in("user_id", submitterIds)
        : Promise.resolve({ data: [] }),
      viewedRevisionId
        ? supabase
            .from("campus_college_load_evaluation")
            .select("*")
            .eq("campus_college_load_revision_id", viewedRevisionId)
            .order("created_at", { ascending: true })
        : Promise.resolve({ data: [] }),
    ]);
  const submitterNames = new Map(
    (submitterIdentities ?? []).map((identity) => [
      identity.user_id as string,
      formatFullName(identity) ?? "Unnamed Faculty",
    ]),
  );

  const revisions = rawRevisionRows
    .map((row) => normalizeRevision(row, submitterNames))
    .filter((row): row is CampusCollegeLoadRevision => Boolean(row));
  const latestRevision = revisions[0] ?? null;
  const viewedRevision =
    (viewedRevisionId
      ? (revisions.find((revision) => revision.id === viewedRevisionId) ?? null)
      : null) ?? latestRevision;

  const evaluationRows = (rawEvaluations ?? []) as Array<Record<string, unknown>>;
  const evaluatorIds = Array.from(
    new Set(
      evaluationRows
        .map((row) => row.evaluator_user_id)
        .filter((value): value is string => typeof value === "string"),
    ),
  );
  const designationIds = Array.from(
    new Set(
      evaluationRows
        .map((row) => row.designation_id)
        .filter((value): value is string => typeof value === "string"),
    ),
  );
  const evaluationIds = evaluationRows
    .map((row) => row.id)
    .filter((value): value is string => typeof value === "string");

  // Stage 3 — needs only the evaluation rows.
  const [
    { data: evaluatorIdentities },
    { data: evaluatorDesignations },
    { data: rawAttachmentRows },
  ] = await Promise.all([
    evaluatorIds.length > 0
      ? supabase
          .from("identity")
          .select("user_id, first_name, middle_name, last_name, suffix, professional_extension")
          .in("user_id", evaluatorIds)
      : Promise.resolve({ data: [] }),
    designationIds.length > 0
      ? supabase
          .from("designation")
          .select("id, job_title")
          .in("id", designationIds)
      : Promise.resolve({ data: [] }),
    evaluationIds.length > 0
      ? supabase
          .from("campus_college_load_evaluation_attachment")
          .select("*")
          .in("campus_college_load_evaluation_id", evaluationIds)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);
  const evaluatorNames = new Map(
    (evaluatorIdentities ?? []).map((identity) => [
      identity.user_id as string,
      formatFullName(identity) ?? "Unnamed Evaluator",
    ]),
  );
  const designationTitles = new Map(
    (evaluatorDesignations ?? []).map((designation) => [
      designation.id as string,
      designation.job_title as string,
    ]),
  );
  const attachmentRowsByEvaluationId = new Map<
    string,
    Array<Record<string, unknown>>
  >();
  (rawAttachmentRows ?? []).forEach((row) => {
    const evaluationId = String(row.campus_college_load_evaluation_id);
    const list = attachmentRowsByEvaluationId.get(evaluationId) ?? [];
    list.push(row as Record<string, unknown>);
    attachmentRowsByEvaluationId.set(evaluationId, list);
  });

  const normalizedEvaluations = evaluationRows.map((row) => normalizeEvaluation(row));

  // Stage 4 — sign all attachment URLs in one batched call per bucket instead
  // of one round trip per attachment.
  const pathsByBucket = new Map<string, string[]>();
  const collectRef = (bucket: string | null, path: string | null) => {
    if (!bucket || !path) return;
    const paths = pathsByBucket.get(bucket) ?? [];
    paths.push(path);
    pathsByBucket.set(bucket, paths);
  };
  normalizedEvaluations.forEach((evaluation) =>
    collectRef(evaluation.attachment_bucket, evaluation.attachment_path),
  );
  attachmentRowsByEvaluationId.forEach((rows) =>
    rows.forEach((row) =>
      collectRef(
        (row.attachment_bucket as string | null) ?? null,
        (row.attachment_path as string | null) ?? null,
      ),
    ),
  );

  const signedUrlByRef = new Map<string, string | null>();
  await Promise.all(
    Array.from(pathsByBucket.entries()).map(async ([bucket, paths]) => {
      const { data } = await supabase.storage
        .from(bucket)
        .createSignedUrls(paths, 60 * 60);
      (data ?? []).forEach((item, index) => {
        // Per-item failures keep today's behavior: signed_url stays null.
        signedUrlByRef.set(
          `${bucket}:${item.path ?? paths[index]}`,
          item.error ? null : (item.signedUrl ?? null),
        );
      });
    }),
  );
  const getSignedUrl = (bucket: string | null, path: string | null) =>
    bucket && path ? (signedUrlByRef.get(`${bucket}:${path}`) ?? null) : null;

  const evaluations = normalizedEvaluations.map((evaluation) => {
    const enrichedEvaluation = {
      ...evaluation,
      evaluator_name: evaluation.evaluator_user_id
        ? (evaluatorNames.get(evaluation.evaluator_user_id) ?? null)
        : null,
      designation_title: evaluation.designation_id
        ? (designationTitles.get(evaluation.designation_id) ?? null)
        : null,
    };

    const attachments: CampusCollegeLoadEvaluationAttachment[] = [];

    if (evaluation.attachment_path && evaluation.attachment_bucket) {
      attachments.push({
        id: evaluation.id,
        file_name: evaluation.attachment_file_name ?? "Attachment",
        mime_type: evaluation.attachment_mime_type,
        signed_url: getSignedUrl(
          evaluation.attachment_bucket,
          evaluation.attachment_path,
        ),
      });
    }

    const additionalRows = attachmentRowsByEvaluationId.get(evaluation.id) ?? [];
    for (const attachmentRow of additionalRows) {
      const bucket = String(attachmentRow.attachment_bucket ?? "");
      const path = String(attachmentRow.attachment_path ?? "");
      if (!bucket || !path) continue;

      attachments.push({
        id: String(attachmentRow.id),
        file_name:
          (attachmentRow.attachment_file_name as string | null) ?? "Attachment",
        mime_type: (attachmentRow.attachment_mime_type as string | null) ?? null,
        signed_url: getSignedUrl(bucket, path),
      });
    }

    return {
      ...enrichedEvaluation,
      attachment_signed_url: attachments[0]?.signed_url ?? null,
      attachments,
    };
  });
  const getSignature = (
    step: CampusCollegeLoadEvaluationStep,
    label: string,
    role: string,
  ): CampusCollegeLoadSignatureSlot => {
    const approval = evaluations.find(
      (evaluation) => evaluation.step === step && evaluation.status === "APPROVED",
    );

    return {
      label,
      name: approval?.evaluator_name ?? null,
      role,
      decided_at: approval?.created_at ?? null,
    };
  };

  const load = normalizeLoad(rawLoad as Record<string, unknown>);
  const canSubmitRevision = chairScopes.some(
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
    viewed_revision: viewedRevision,
    revisions,
    evaluations,
    signatures: {
      prepared: getSignature(
        "CAMPUS_DIRECTOR",
        "Prepared",
        "Campus Director",
      ),
      recommending_approval: getSignature(
        "DIRECTOR_FOR_INSTRUCTION",
        "Recommending Approval",
        "Director for Instruction",
      ),
      approved: getSignature(
        "VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS",
        "Approved",
        "Vice President for Academic Affairs",
      ),
    },
    can_submit_revision: canSubmitRevision,
    can_evaluate_step: canEvaluateStep,
    evaluator_designation_id: evaluatorDesignationId,
  };
};
