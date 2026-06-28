"use client";

import { ImageField } from "@/features/files/components/image-field";
import {
  uploadCollegeLogoAction,
  removeCollegeLogoAction,
} from "@/features/admin/lib/actions";
import {
  getCollegeLogoPublicUrl,
} from "@/features/admin/lib/college-logo-storage";
import { COLLEGE_LOGO_FILE_POLICY } from "@/features/files/lib/file-policy";

const ACCEPT = COLLEGE_LOGO_FILE_POLICY.allowedExtensions
  .map((ext) => `.${ext}`)
  .join(",");

const HINT = `PNG, JPG, GIF, WEBP or SVG — max ${Math.floor(
  COLLEGE_LOGO_FILE_POLICY.maxSizeBytes / (1024 * 1024),
)}MB`;

type CollegeLogoFieldProps = {
  collegeId: string;
  currentLogoPath: string | null;
  disabled?: boolean;
};

export function CollegeLogoField({
  collegeId,
  currentLogoPath,
  disabled = false,
}: CollegeLogoFieldProps) {
  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("collegeId", collegeId);
    formData.append("file", file);
    const result = await uploadCollegeLogoAction(formData);
    return { error: result.error };
  };

  const handleRemove = async () => {
    const result = await removeCollegeLogoAction(collegeId);
    return { error: result.error };
  };

  return (
    <ImageField
      label="College Logo"
      hint={HINT}
      currentImageUrl={currentLogoPath ? getCollegeLogoPublicUrl(currentLogoPath) : null}
      onUpload={handleUpload}
      onRemove={handleRemove}
      accept={ACCEPT}
      maxSizeBytes={COLLEGE_LOGO_FILE_POLICY.maxSizeBytes}
      disabled={disabled}
    />
  );
}
