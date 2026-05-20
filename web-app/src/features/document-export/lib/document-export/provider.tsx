import type { ReactNode } from "react";
import type { DocumentType } from "@/features/document-export/lib/document-export/types";
import {
  DocumentExportError,
} from "@/features/document-export/lib/document-export/errors";

export type DocumentExportProvider = {
  documentType: DocumentType;
  parseScopeFromSearchParams: (searchParams: URLSearchParams) => unknown;
  parseScopeFromBody: (payload: unknown) => unknown;
  toScopeSearchParams: (scope: unknown) => URLSearchParams;
  resolveEntityIdsByScope: (args: {
    academicTermId: string;
    scope: unknown;
  }) => Promise<string[]>;
  loadSingleDocument: (args: {
    academicTermId: string;
    entityId: string;
  }) => Promise<unknown>;
  loadDocumentsByEntityIds: (args: {
    academicTermId: string;
    entityIds: string[];
  }) => Promise<unknown[]>;
  renderDocument: (document: unknown) => ReactNode;
  buildSingleFileName: (document: unknown) => string | Promise<string>;
  buildScopeFileName: (args: {
    academicTermId: string;
    entityCount: number;
    scope: unknown;
  }) => string | Promise<string>;
};

const providersByType: Partial<Record<DocumentType, DocumentExportProvider>> = {};

const assertProviderContract = (provider: DocumentExportProvider): void => {
  const requiredKeys: Array<keyof DocumentExportProvider> = [
    "documentType",
    "parseScopeFromSearchParams",
    "parseScopeFromBody",
    "toScopeSearchParams",
    "resolveEntityIdsByScope",
    "loadSingleDocument",
    "loadDocumentsByEntityIds",
    "renderDocument",
    "buildSingleFileName",
    "buildScopeFileName",
  ];

  for (const key of requiredKeys) {
    if (!(key in provider)) {
      throw new Error(
        `Invalid document export provider registration: missing key "${key}".`,
      );
    }
  }
};

Object.values(providersByType).forEach(assertProviderContract);

export const getDocumentExportProvider = (
  documentType: string,
): DocumentExportProvider => {
  const provider = providersByType[documentType as DocumentType];
  if (provider) return provider;

  throw new DocumentExportError(
    404,
    `Unsupported document type: ${documentType}`,
  );
};
