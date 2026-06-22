import "@/features/document-export/lib/document-export/register-providers";
import DocumentPrintShell from "@/features/document-export/components/document-print-shell";
import type { ReactNode } from "react";
import { requireAuthenticatedForPrintPage } from "@/features/document-export/lib/document-export/auth";
import { DocumentExportError } from "@/features/document-export/lib/document-export/errors";
import { getDocumentExportProvider } from "@/features/document-export/lib/document-export/provider";
import {
  firstQueryParam,
  parseCsvIds,
  queryRecordToSearchParams,
} from "@/features/document-export/lib/document-export/query";
import { notFound } from "next/navigation";

type DocumentScopePrintPageProps = {
  params: Promise<{
    document_type: string;
    academic_term_id: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

const DocumentScopePrintPage = async ({
  params,
  searchParams,
}: DocumentScopePrintPageProps) => {
  const { document_type, academic_term_id } = await params;
  const query = await searchParams;
  const autoPrint = firstQueryParam(query.autoPrint) === "1";
  let renderedDocuments: ReactNode[] = [];

  try {
    await requireAuthenticatedForPrintPage();
    const provider = getDocumentExportProvider(document_type);
    const entityIds = parseCsvIds(query.entityIds);

    let documents: unknown[] = [];
    if (entityIds.length > 0) {
      documents = await provider.loadDocumentsByEntityIds({
        academicTermId: academic_term_id,
        entityIds,
      });
    } else {
      const scope = provider.parseScopeFromSearchParams(
        queryRecordToSearchParams(query),
      );
      const resolvedEntityIds = await provider.resolveEntityIdsByScope({
        academicTermId: academic_term_id,
        scope,
      });
      documents = await provider.loadDocumentsByEntityIds({
        academicTermId: academic_term_id,
        entityIds: resolvedEntityIds,
      });
    }

    renderedDocuments = documents.map((document) =>
      provider.renderDocument(document),
    );
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

    if (error instanceof Error && error.name.endsWith("ScopeParseError")) {
      notFound();
    }

    throw error;
  }

  return <DocumentPrintShell autoPrint={autoPrint} documents={renderedDocuments} />;
};

export default DocumentScopePrintPage;
