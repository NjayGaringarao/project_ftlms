import AutoPrintTrigger from "@/components/ftl-evaluation/faculty-load/auto-print-trigger";
import FacultyLoadPrintDocument from "@/components/ftl-evaluation/faculty-load/faculty-load-print-document";
import {
  isFacultyLoadExportError,
} from "@/lib/faculty-load-export/document";
import {
  parseFacultyLoadExportScope,
} from "@/lib/faculty-load-export/scope";
import { resolveFacultyLoadExportDocumentsByScope } from "@/lib/faculty-load-export/scope-resolver";
import { notFound, redirect } from "next/navigation";

type FacultyLoadScopePrintPageProps = {
  params: Promise<{ academic_term_id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

const firstQueryParam = (value: string | string[] | undefined): string => {
  if (!value) return "";
  return Array.isArray(value) ? (value[0] ?? "") : value;
};

const FacultyLoadScopePrintPage = async ({
  params,
  searchParams,
}: FacultyLoadScopePrintPageProps) => {
  const { academic_term_id } = await params;
  const query = await searchParams;
  const autoPrint = firstQueryParam(query.autoPrint) === "1";

  let payload: Awaited<
    ReturnType<typeof resolveFacultyLoadExportDocumentsByScope>
  >;

  try {
    const scope = parseFacultyLoadExportScope({
      scopeKind: query.scopeKind,
      statusFilter: query.statusFilter,
      searchQuery: query.searchQuery,
      campusId: query.campusId,
      collegeId: query.collegeId,
      mode: query.mode,
    });

    payload = await resolveFacultyLoadExportDocumentsByScope({
      academicTermId: academic_term_id,
      scope,
    });
  } catch (error) {
    if (isFacultyLoadExportError(error)) {
      if (error.status === 403) {
        redirect("/home");
      }

      if (error.status === 400 || error.status === 404) {
        notFound();
      }
    }

    if (
      error instanceof Error &&
      error.name === "FacultyLoadExportScopeParseError"
    ) {
      notFound();
    }

    throw error;
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 print:bg-white print:p-0">
      <AutoPrintTrigger enabled={autoPrint} />
      <div className="flex flex-col gap-4 print:gap-0">
        {payload.documents.map((document, index) => (
          <section
            key={`${document.facultyId}:${document.academicTermId}`}
            className={index > 0 ? "print:break-before-page" : undefined}
            style={index > 0 ? { pageBreakBefore: "always" } : undefined}
          >
            <FacultyLoadPrintDocument document={document} />
          </section>
        ))}
      </div>
    </main>
  );
};

export default FacultyLoadScopePrintPage;
