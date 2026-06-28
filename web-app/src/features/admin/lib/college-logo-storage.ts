import { buildStoredFileName } from "@/features/files/lib/staged-storage";

export const COLLEGE_LOGO_BUCKET = "ftl-college-logos";

export function getCollegeLogoPublicUrl(logoPath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${base}/storage/v1/object/public/${COLLEGE_LOGO_BUCKET}/${logoPath}`;
}

export function buildCollegeLogoPath(collegeId: string, fileName: string): string {
  return `colleges/${collegeId}/${buildStoredFileName(fileName)}`;
}
