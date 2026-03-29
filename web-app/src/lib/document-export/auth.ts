import { redirect } from "next/navigation";
import { DocumentExportError } from "@/lib/document-export/errors";
import { createClient } from "@/utils/supabase/server";

export const requireAuthenticatedForApi = async (): Promise<string> => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new DocumentExportError(401, "Authentication required.");
  }

  return user.id;
};

export const requireAuthenticatedForPrintPage = async (): Promise<string> => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/home");
  }

  return user.id;
};
