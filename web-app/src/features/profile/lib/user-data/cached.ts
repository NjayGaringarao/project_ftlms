import { cache } from "react";
import type { UserDataOptions, UserDataReadModel } from "./types";
import { getCurrentUserData } from "./queries";

// Lives outside queries.ts because "use server" modules may only export async
// functions, and cache() returns a plain function.
//
// cache() keys arguments by Object.is, so an options object literal would miss
// on every call — key on a canonical (sorted) JSON string instead.
const getCurrentUserDataByKey = cache(
  async (optionsKey: string): Promise<UserDataReadModel | null> =>
    getCurrentUserData(JSON.parse(optionsKey) as UserDataOptions),
);

export const getCurrentUserDataCached = (options?: UserDataOptions) =>
  getCurrentUserDataByKey(
    JSON.stringify(
      Object.fromEntries(
        Object.entries(options ?? {}).sort(([a], [b]) => a.localeCompare(b)),
      ),
    ),
  );
