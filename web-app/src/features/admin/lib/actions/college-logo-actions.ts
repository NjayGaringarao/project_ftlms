"use server";

import { createClient } from "@/utils/supabase/server";
import { isFileAllowedByPolicy } from "@/features/files/lib/file-policy";
import { COLLEGE_LOGO_FILE_POLICY } from "@/features/files/lib/file-policy";
import {
  COLLEGE_LOGO_BUCKET,
  buildCollegeLogoPath,
  getCollegeLogoPublicUrl,
} from "@/features/admin/lib/college-logo-storage";
import { revalidateCollegesPaths } from "./shared";

export async function uploadCollegeLogoAction(
  formData: FormData,
): Promise<{ data?: { logoPath: string; publicUrl: string }; error?: string }> {
  const collegeId = formData.get("collegeId");
  const file = formData.get("file");

  if (typeof collegeId !== "string" || !collegeId.trim()) {
    return { error: "College ID is required" };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { error: "No file provided" };
  }
  if (!isFileAllowedByPolicy(file, COLLEGE_LOGO_FILE_POLICY)) {
    const maxMb = Math.floor(COLLEGE_LOGO_FILE_POLICY.maxSizeBytes / (1024 * 1024));
    return {
      error: `Invalid file. Allowed types: PNG, JPG, GIF, WEBP, SVG. Max size: ${maxMb}MB.`,
    };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("college")
    .select("logo_path")
    .eq("id", collegeId)
    .maybeSingle();

  const oldLogoPath = existing?.logo_path ?? null;
  const newLogoPath = buildCollegeLogoPath(collegeId, file.name);

  const { error: uploadError } = await supabase.storage
    .from(COLLEGE_LOGO_BUCKET)
    .upload(newLogoPath, file);

  if (uploadError) {
    return { error: "Failed to upload logo. Please try again." };
  }

  const { error: dbError } = await supabase
    .from("college")
    .update({ logo_path: newLogoPath })
    .eq("id", collegeId);

  if (dbError) {
    await supabase.storage.from(COLLEGE_LOGO_BUCKET).remove([newLogoPath]);
    return { error: "Failed to save logo reference. Please try again." };
  }

  if (oldLogoPath) {
    await supabase.storage.from(COLLEGE_LOGO_BUCKET).remove([oldLogoPath]).catch(() => {});
  }

  revalidateCollegesPaths(collegeId);

  return { data: { logoPath: newLogoPath, publicUrl: getCollegeLogoPublicUrl(newLogoPath) } };
}

export async function removeCollegeLogoAction(
  collegeId: string,
): Promise<{ data?: boolean; error?: string }> {
  if (!collegeId?.trim()) return { error: "College ID is required" };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("college")
    .select("logo_path")
    .eq("id", collegeId)
    .maybeSingle();

  const logoPath = existing?.logo_path ?? null;

  const { error: dbError } = await supabase
    .from("college")
    .update({ logo_path: null })
    .eq("id", collegeId);

  if (dbError) {
    return { error: "Failed to remove logo. Please try again." };
  }

  if (logoPath) {
    await supabase.storage.from(COLLEGE_LOGO_BUCKET).remove([logoPath]).catch(() => {});
  }

  revalidateCollegesPaths(collegeId);

  return { data: true };
}
