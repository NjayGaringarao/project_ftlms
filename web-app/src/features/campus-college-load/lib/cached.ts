import { cache } from "react";
import { getProgramChairCampusCollegeScopes } from "./queries";

// Request-scoped dedupe. Lives outside queries.ts because "use server" modules
// may only export async functions, and cache() returns a plain function.
//
// queries.ts imports this module back, so the reference must stay lazy (inside
// the arrow body) — a direct cache(getProgramChairCampusCollegeScopes) would
// hit the not-yet-initialized binding during the circular module evaluation.
export const getProgramChairCampusCollegeScopesCached = cache(async () =>
  getProgramChairCampusCollegeScopes(),
);
