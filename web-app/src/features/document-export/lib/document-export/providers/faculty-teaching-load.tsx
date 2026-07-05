import { FacultyTeachingLoadPage } from "@/features/campus-college-load/components/print/faculty-teaching-load-page";
import { DocumentExportError } from "@/features/document-export/lib/document-export/errors";
import { registerDocumentExportProvider } from "@/features/document-export/lib/document-export/provider";
import {
  normalizeCampusCollegeLoadSnapshot,
} from "@/features/shared/types/models";
import type {
  CampusCollegeLoadSnapshotClass,
  CampusCollegeLoadSnapshotFaculty,
  CampusCollegeLoadSnapshotMetadata,
} from "@/features/shared/types/models";
import { getCollegeLogoPublicUrl } from "@/features/admin/lib/college-logo-storage";
import { createClient } from "@/utils/supabase/server";

export type FacultyTeachingLoadScope = {
  userId: string;
};

export type FacultyTeachingLoadDocument = {
  faculty: CampusCollegeLoadSnapshotFaculty;
  metadata: CampusCollegeLoadSnapshotMetadata;
  college_logo_url: string | null;
  class_schedule_classes: CampusCollegeLoadSnapshotClass[];
};

const slugify = (value: string): string =>
  value.replace(/[^a-zA-Z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

const parseScope = (userId: unknown): FacultyTeachingLoadScope => {
  if (typeof userId !== "string" || !userId.trim()) {
    throw new DocumentExportError(400, "userId is required.");
  }
  return { userId };
};

const loadSingleDocument = async ({
  academicTermId,
  entityId: userId,
}: {
  academicTermId: string;
  entityId: string;
}): Promise<FacultyTeachingLoadDocument> => {
  const supabase = await createClient();

  // Fetch all campus_college_load entries for this academic term
  const { data: loads } = await supabase
    .from("campus_college_load")
    .select("id, college_id")
    .eq("academic_term_id", academicTermId);

  if (!loads || loads.length === 0) {
    throw new DocumentExportError(404, "No campus college load found for this academic term.");
  }

  // Fetch the latest revision for each load in parallel
  const revisionResults = await Promise.all(
    loads.map((load) =>
      supabase
        .from("campus_college_load_revision")
        .select("id, snapshot")
        .eq("campus_college_load_id", load.id)
        .order("revision_number", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then((res) => ({ ...res, collegeId: load.college_id })),
    ),
  );

  // Find the revision that contains this faculty
  for (const result of revisionResults) {
    const revision = result.data;
    if (!revision) continue;

    const normalized = normalizeCampusCollegeLoadSnapshot(revision.snapshot);
    if (!normalized) continue;

    const faculty = normalized.faculty_load.faculty.find(
      (f) => f.faculty_id === userId,
    );
    if (!faculty) continue;

    let college_logo_url: string | null = null;
    if (result.collegeId) {
      const { data: college } = await supabase
        .from("college")
        .select("logo_path")
        .eq("id", result.collegeId)
        .maybeSingle();
      if (college?.logo_path) {
        college_logo_url = getCollegeLogoPublicUrl(college.logo_path);
      }
    }

    return {
      faculty,
      metadata: normalized.metadata,
      college_logo_url,
      class_schedule_classes: normalized.class_schedule.classes,
    };
  }

  throw new DocumentExportError(404, "Faculty teaching load not found for this academic term.");
};

const facultyTeachingLoadProvider = {
  documentType: "faculty_teaching_load" as const,

  parseScopeFromSearchParams: (searchParams: URLSearchParams) =>
    parseScope(searchParams.get("userId")),

  parseScopeFromBody: (payload: unknown) => {
    const row = (payload ?? {}) as Record<string, unknown>;
    return parseScope(row.userId);
  },

  toScopeSearchParams: (scope: unknown) => {
    const { userId } = scope as FacultyTeachingLoadScope;
    return new URLSearchParams({ userId });
  },

  resolveEntityIdsByScope: async ({
    scope,
  }: {
    academicTermId: string;
    scope: unknown;
  }) => {
    const { userId } = scope as FacultyTeachingLoadScope;
    return [userId];
  },

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
    const doc = document as FacultyTeachingLoadDocument;
    const { metadata } = doc;
    const semesterLabel = [metadata.academic_term_name, metadata.academic_year_code]
      .filter(Boolean)
      .join(", ");

    const classMap = new Map(doc.class_schedule_classes.map((c) => [c.class_id, c]));

    return (
      <FacultyTeachingLoadPage
        metadata={metadata}
        faculty={doc.faculty}
        classMap={classMap}
        semesterLabel={semesterLabel}
        collegeLogoUrl={doc.college_logo_url}
      />
    );
  },

  buildSingleFileName: (document: unknown) => {
    const doc = document as FacultyTeachingLoadDocument;
    const parts = [doc.faculty.faculty_name, "faculty-teaching-load"]
      .filter((p): p is string => Boolean(p))
      .join("-");
    return `${slugify(parts)}.pdf`;
  },

  buildScopeFileName: async ({
    academicTermId,
    scope,
  }: {
    academicTermId: string;
    entityCount: number;
    scope: unknown;
  }) => {
    const { userId } = scope as FacultyTeachingLoadScope;
    try {
      const doc = await loadSingleDocument({ academicTermId, entityId: userId });
      const parts = [doc.faculty.faculty_name, "faculty-teaching-load"]
        .filter((p): p is string => Boolean(p))
        .join("-");
      return `${slugify(parts)}.pdf`;
    } catch {
      return "faculty-teaching-load.pdf";
    }
  },
};

registerDocumentExportProvider(facultyTeachingLoadProvider);
