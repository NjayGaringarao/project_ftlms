import { computeSectionUnits } from "@/features/campus-college-load/utils/section-units";
import { SectionScheduleTable } from "@/features/campus-college-load/components/snapshot/section-schedule-table";
import { DocumentExportError } from "@/features/document-export/lib/document-export/errors";
import { registerDocumentExportProvider } from "@/features/document-export/lib/document-export/provider";
import type { CampusCollegeLoadSnapshotClass } from "@/features/shared/types/models";
import { normalizeCampusCollegeLoadSnapshot } from "@/features/shared/types/models";
import { createClient } from "@/utils/supabase/server";

export type SectionScheduleScope = {
  campusId: string;
  collegeId: string;
};

export type SectionScheduleDocument = {
  revision_id: string;
  section_id: string;
  section_code: string;
  year_level: number | null;
  classification: string | null;
  campus_code: string | null;
  campus_name: string | null;
  college_code: string | null;
  college_name: string | null;
  academic_term_code: string | null;
  academic_term_name: string | null;
  academic_year_code: string | null;
  classes: CampusCollegeLoadSnapshotClass[];
  total_units: number;
  is_overloaded: boolean;
};

const slugify = (value: string): string =>
  value.replace(/[^a-zA-Z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

const parseScope = (
  campusId: unknown,
  collegeId: unknown,
): SectionScheduleScope => {
  if (
    typeof campusId !== "string" ||
    !campusId.trim() ||
    typeof collegeId !== "string" ||
    !collegeId.trim()
  ) {
    throw new DocumentExportError(400, "campusId and collegeId are required.");
  }
  return { campusId, collegeId };
};

const parseEntityId = (
  entityId: string,
): { revisionId: string; sectionId: string } => {
  const [revisionId, sectionId] = entityId.split("__");
  if (!revisionId || !sectionId) {
    throw new DocumentExportError(400, "Invalid entity id.");
  }
  return { revisionId, sectionId };
};

const loadSingleDocument = async ({
  academicTermId,
  entityId,
}: {
  academicTermId: string;
  entityId: string;
}): Promise<SectionScheduleDocument> => {
  const { revisionId, sectionId } = parseEntityId(entityId);
  const supabase = await createClient();

  const { data: revision } = await supabase
    .from("campus_college_load_revision")
    .select("id, snapshot")
    .eq("id", revisionId)
    .maybeSingle();

  if (!revision) throw new DocumentExportError(404, "Revision not found.");

  const normalized = normalizeCampusCollegeLoadSnapshot(revision.snapshot);
  if (!normalized) throw new DocumentExportError(404, "Snapshot not available.");

  if (normalized.metadata.academic_term_id !== academicTermId) {
    throw new DocumentExportError(404, "Academic term mismatch.");
  }

  const section = normalized.class_schedule.sections.find(
    (sectionRow) => sectionRow.section_id === sectionId,
  );
  if (!section) {
    throw new DocumentExportError(404, "Section not found in this revision.");
  }

  const classes = normalized.class_schedule.classes.filter(
    (classRow) => classRow.section_id === sectionId,
  );
  const { totalUnits, isOverloaded } = computeSectionUnits(classes);

  return {
    revision_id: revisionId,
    section_id: sectionId,
    section_code: section.section_code,
    year_level: section.year_level,
    classification: section.classification,
    campus_code: normalized.metadata.campus_code,
    campus_name: normalized.metadata.campus_name,
    college_code: normalized.metadata.college_code,
    college_name: normalized.metadata.college_name,
    academic_term_code: normalized.metadata.academic_term_code ?? null,
    academic_term_name: normalized.metadata.academic_term_name ?? null,
    academic_year_code: normalized.metadata.academic_year_code ?? null,
    classes,
    total_units: totalUnits,
    is_overloaded: isOverloaded,
  };
};

const resolveEntityIdsByScope = async ({
  academicTermId,
  scope,
}: {
  academicTermId: string;
  scope: unknown;
}): Promise<string[]> => {
  const { campusId, collegeId } = scope as SectionScheduleScope;
  const supabase = await createClient();

  const { data: load } = await supabase
    .from("campus_college_load")
    .select("id")
    .eq("campus_id", campusId)
    .eq("college_id", collegeId)
    .eq("academic_term_id", academicTermId)
    .maybeSingle();
  if (!load) return [];

  const { data: revisions } = await supabase
    .from("campus_college_load_revision")
    .select("id, snapshot")
    .eq("campus_college_load_id", load.id)
    .order("revision_number", { ascending: false })
    .limit(1);

  const latestRevision = revisions?.[0];
  if (!latestRevision) return [];

  const normalized = normalizeCampusCollegeLoadSnapshot(latestRevision.snapshot);
  if (!normalized) return [];

  return normalized.class_schedule.sections.map(
    (sectionRow) => `${latestRevision.id}__${sectionRow.section_id}`,
  );
};

const sectionScheduleProvider = {
  documentType: "section_schedule" as const,

  parseScopeFromSearchParams: (searchParams: URLSearchParams) =>
    parseScope(searchParams.get("campusId"), searchParams.get("collegeId")),

  parseScopeFromBody: (payload: unknown) => {
    const row = (payload ?? {}) as Record<string, unknown>;
    return parseScope(row.campusId, row.collegeId);
  },

  toScopeSearchParams: (scope: unknown) => {
    const { campusId, collegeId } = scope as SectionScheduleScope;
    return new URLSearchParams({ campusId, collegeId });
  },

  resolveEntityIdsByScope,

  loadSingleDocument,

  loadDocumentsByEntityIds: ({
    academicTermId,
    entityIds,
  }: {
    academicTermId: string;
    entityIds: string[];
  }) =>
    Promise.all(
      entityIds.map((entityId) => loadSingleDocument({ academicTermId, entityId })),
    ),

  renderDocument: (document: unknown) => {
    const doc = document as SectionScheduleDocument;
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">{doc.section_code}</h1>
        <p className="text-sm text-foreground/70">
          {doc.college_name} ({doc.college_code}) — {doc.campus_name} (
          {doc.campus_code})
        </p>
        <p className="text-sm text-foreground/70">
          {doc.academic_term_name}
          {doc.academic_year_code ? `, ${doc.academic_year_code}` : ""}
        </p>
        <p className="mt-1 text-sm">
          {doc.total_units} Units{doc.is_overloaded ? " (Overloaded)" : ""}
        </p>
        <div className="mt-4">
          <SectionScheduleTable classes={doc.classes} />
        </div>
      </div>
    );
  },

  buildSingleFileName: (document: unknown) => {
    const doc = document as SectionScheduleDocument;
    const parts = [doc.college_code, doc.campus_code, doc.section_code, "schedule"]
      .filter((part): part is string => Boolean(part))
      .join("-");
    return `${slugify(parts)}.pdf`;
  },

  buildScopeFileName: async ({
    scope,
    entityCount,
  }: {
    academicTermId: string;
    entityCount: number;
    scope: unknown;
  }) => {
    const { campusId, collegeId } = scope as SectionScheduleScope;
    const supabase = await createClient();
    const [{ data: campus }, { data: college }] = await Promise.all([
      supabase.from("campus").select("code").eq("id", campusId).maybeSingle(),
      supabase.from("college").select("code").eq("id", collegeId).maybeSingle(),
    ]);
    const parts = [college?.code, campus?.code, "class-schedules", `${entityCount}-sections`]
      .filter((part): part is string => Boolean(part))
      .join("-");
    return `${slugify(parts)}.pdf`;
  },
};

registerDocumentExportProvider(sectionScheduleProvider);
