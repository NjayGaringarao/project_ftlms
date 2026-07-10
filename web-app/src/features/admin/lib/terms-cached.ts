import { cache } from "react";
import { getDefaultAcademicTerm, getTermById, getTermsList } from "./terms";

// Request-scoped dedupe for term lookups. Lives outside terms.ts because
// "use server" modules may only export async functions, and cache() returns a
// plain function. Args are strings/none, so identity-based cache keys are safe.
export const getTermsListCached = cache(getTermsList);
export const getDefaultAcademicTermCached = cache(getDefaultAcademicTerm);
export const getTermByIdCached = cache(getTermById);
