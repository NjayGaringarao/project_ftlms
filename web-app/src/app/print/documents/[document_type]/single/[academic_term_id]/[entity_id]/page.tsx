import "@/features/document-export/lib/document-export/register-providers";
import DocumentPrintShell from "@/features/document-export/components/document-print-shell";
import type { ReactNode } from "react";
import { requireAuthenticatedForPrintPage } from "@/features/document-export/lib/document-export/auth";
import { DocumentExportError } from "@/features/document-export/lib/document-export/errors";
import { getDocumentExportProvider } from "@/features/document-export/lib/document-export/provider";
import { notFound } from "next/navigation";

type DocumentSinglePrintPageProps = {
  params: Promise<{
    document_type: string;
    academic_term_id: string;
    entity_id: string;
  }>;
  searchParams: Promise<{ autoPrint?: string | string[] }>;
};

export const dynamic = "force-dynamic";

const firstQueryParam = (value: string | string[] | undefined): string => {
  if (!value) return "";
  return Array.isArray(value) ? (value[0] ?? "") : value;
};

const DocumentSinglePrintPage = async ({
  params,
  searchParams,
}: DocumentSinglePrintPageProps) => {
  const { document_type, academic_term_id, entity_id } = await params;
  const query = await searchParams;
  const autoPrint = firstQueryParam(query.autoPrint) === "1";
  let renderedDocument: ReactNode;

  try {
    await requireAuthenticatedForPrintPage();
    const provider = getDocumentExportProvider(document_type);
    const document = await provider.loadSingleDocument({
      academicTermId: academic_term_id,
      entityId: entity_id,
    });
    renderedDocument = provider.renderDocument(document);
  } catch (error) {
    if (error instanceof DocumentExportError) {
      if (error.status === 400 || error.status === 404) {
        notFound();
      }
    }

    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      ((error as { status?: unknown }).status === 400 ||
        (error as { status?: unknown }).status === 404)
    ) {
      notFound();
    }

    throw error;
  }

  return (
    <DocumentPrintShell autoPrint={autoPrint} documents={[renderedDocument]} />
  );
};

export default DocumentSinglePrintPage;
