import AutoPrintTrigger from "@/components/ftl-evaluation/faculty-load/auto-print-trigger";
import FacultyLoadPrintDocument from "@/components/ftl-evaluation/faculty-load/faculty-load-print-document";
import {
  getFacultyLoadExportDocument,
  isFacultyLoadExportError,
} from "@/lib/faculty-load-export/document";
import type { FacultyLoadExportDocument } from "@/lib/faculty-load-export/document";
import { notFound, redirect } from "next/navigation";

type FacultyLoadPrintPageProps = {
  params: Promise<{ academic_term_id: string; faculty_id: string }>;
  searchParams: Promise<{ autoPrint?: string | string[] }>;
};

export const dynamic = "force-dynamic";

const FacultyLoadPrintPage = async ({
  params,
  searchParams,
}: FacultyLoadPrintPageProps) => {
  const { academic_term_id, faculty_id } = await params;
  const query = await searchParams;
  const autoPrint = query.autoPrint === "1";
  let document: FacultyLoadExportDocument;

  try {
    document = await getFacultyLoadExportDocument({
      academicTermId: academic_term_id,
      facultyId: faculty_id,
    });
  } catch (error) {
    if (isFacultyLoadExportError(error)) {
      if (error.status === 403) {
        redirect("/home");
      }

      if (error.status === 404) {
        notFound();
      }
    }

    throw error;
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 print:bg-white print:p-0">
      <AutoPrintTrigger enabled={autoPrint} />
      <FacultyLoadPrintDocument document={document} />
    </main>
  );
};

export default FacultyLoadPrintPage;
