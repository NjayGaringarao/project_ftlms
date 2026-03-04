"use server";

import { getUserRole } from "@/lib/auth/utils";

export const ensureProgramChair = async () => {
  const roles = await getUserRole();
  if (!roles.includes("PROGRAM_CHAIRPERSON")) {
    throw new Error("Unauthorized");
  }
};
