import { FacultyLoadSummaryPage } from "@/features/campus-college-load/components/print/faculty-load-summary-page";
import { FacultyTeachingLoadPage } from "@/features/campus-college-load/components/print/faculty-teaching-load-page";
import { DocumentExportError } from "@/features/document-export/lib/document-export/errors";
import { registerDocumentExportProvider } from "@/features/document-export/lib/document-export/provider";
import { normalizeCampusCollegeLoadSnapshot } from "@/features/shared/types/models";
import type {
  CampusCollegeLoadSnapshotClass,
  CampusCollegeLoadSnapshotFaculty,
} from "@/features/shared/types/models";
import { createClient } from "@/utils/supabase/server";

export type CampusCollegeLoadScope = {
  campusId: string;
  collegeId: string;
};

export type CampusCollegeLoadDocument = {
  revision_id: string;
  campus_name: string | null;
  campus_code: string | null;
  college_name: string | null;
  college_code: string | null;
  academic_term_name: string | null;
  academic_term_code: string | null;
  academic_year_code: string | null;
  faculty: CampusCollegeLoadSnapshotFaculty[];
  class_schedule_classes: CampusCollegeLoadSnapshotClass[];
};

const slugify = (value: string): string =>
  value.replace(/[^a-zA-Z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

const parseScope = (campusId: unknown, collegeId: unknown): CampusCollegeLoadScope => {
  if (
    typeof campusId !== "string" || !campusId.trim() ||
    typeof collegeId !== "string" || !collegeId.trim()
  ) {
    throw new DocumentExportError(400, "campusId and collegeId are required.");
  }
  return { campusId, collegeId };
};

const loadSingleDocument = async ({
  entityId: revisionId,
}: {
  academicTermId: string;
  entityId: string;
}): Promise<CampusCollegeLoadDocument> => {
  const supabase = await createClient();
  const { data: revision } = await supabase
    .from("campus_college_load_revision")
    .select("id, snapshot")
    .eq("id", revisionId)
    .maybeSingle();

  if (!revision) throw new DocumentExportError(404, "Revision not found.");

  const normalized = normalizeCampusCollegeLoadSnapshot(revision.snapshot);
  if (!normalized) throw new DocumentExportError(404, "Snapshot not available.");

  return {
    revision_id: revisionId,
    campus_name: normalized.metadata.campus_name,
    campus_code: normalized.metadata.campus_code,
    college_name: normalized.metadata.college_name,
    college_code: normalized.metadata.college_code,
    academic_term_name: normalized.metadata.academic_term_name ?? null,
    academic_term_code: normalized.metadata.academic_term_code ?? null,
    academic_year_code: normalized.metadata.academic_year_code ?? null,
    faculty: normalized.faculty_load.faculty,
    class_schedule_classes: normalized.class_schedule.classes,
  };
};

const resolveEntityIdsByScope = async ({
  academicTermId,
  scope,
}: {
  academicTermId: string;
  scope: unknown;
}): Promise<string[]> => {
  const { campusId, collegeId } = scope as CampusCollegeLoadScope;
  const supabase = await createClient();

  const { data: load } = await supabase
    .from("campus_college_load")
    .select("id")
    .eq("campus_id", campusId)
    .eq("college_id", collegeId)
    .eq("academic_term_id", academicTermId)
    .maybeSingle();
  if (!load) return [];

  const { data: revision } = await supabase
    .from("campus_college_load_revision")
    .select("id")
    .eq("campus_college_load_id", load.id)
    .order("revision_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  return revision ? [revision.id] : [];
};

const campusCollegeLoadProvider = {
  documentType: "campus_college_load" as const,

  parseScopeFromSearchParams: (searchParams: URLSearchParams) =>
    parseScope(searchParams.get("campusId"), searchParams.get("collegeId")),

  parseScopeFromBody: (payload: unknown) => {
    const row = (payload ?? {}) as Record<string, unknown>;
    return parseScope(row.campusId, row.collegeId);
  },

  toScopeSearchParams: (scope: unknown) => {
    const { campusId, collegeId } = scope as CampusCollegeLoadScope;
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
    const doc = document as CampusCollegeLoadDocument;
    const semesterLabel = [doc.academic_term_name, doc.academic_year_code]
      .filter(Boolean)
      .join(", ");

    const metadata = {
      campus_id: "",
      campus_name: doc.campus_name,
      campus_code: doc.campus_code,
      college_id: "",
      college_name: doc.college_name,
      college_code: doc.college_code,
      academic_term_id: "",
      academic_term_name: doc.academic_term_name,
      academic_term_code: doc.academic_term_code,
      academic_year_code: doc.academic_year_code,
      generated_at: "",
    };

    const classMap = new Map(doc.class_schedule_classes.map((c) => [c.class_id, c]));

    return (
      <div>
        <FacultyLoadSummaryPage
          metadata={metadata}
          faculty={doc.faculty}
        />
        {doc.faculty.map((faculty) => (
          <div
            key={faculty.faculty_id}
            className="print:break-before-page"
            style={{ pageBreakBefore: "always" }}
          >
            <FacultyTeachingLoadPage
              metadata={metadata}
              faculty={faculty}
              classMap={classMap}
              semesterLabel={semesterLabel}
            />
          </div>
        ))}
      </div>
    );
  },

  buildSingleFileName: (document: unknown) => {
    const doc = document as CampusCollegeLoadDocument;
    const parts = [doc.college_code, doc.campus_code, "faculty-teaching-load"]
      .filter((p): p is string => Boolean(p))
      .join("-");
    return `${slugify(parts)}.pdf`;
  },

  buildScopeFileName: async ({
    scope,
  }: {
    academicTermId: string;
    entityCount: number;
    scope: unknown;
  }) => {
    const { campusId, collegeId } = scope as CampusCollegeLoadScope;
    const supabase = await createClient();
    const [{ data: campus }, { data: college }] = await Promise.all([
      supabase.from("campus").select("code").eq("id", campusId).maybeSingle(),
      supabase.from("college").select("code").eq("id", collegeId).maybeSingle(),
    ]);
    const parts = [college?.code, campus?.code, "faculty-teaching-load"]
      .filter((p): p is string => Boolean(p))
      .join("-");
    return `${slugify(parts)}.pdf`;
  },
};

registerDocumentExportProvider(campusCollegeLoadProvider);
