"use server";

import { getCurrentUser } from "@/features/auth/lib/utils";
import {
  RETURN_ATTACHMENT_STAGING_PREFIX,
  stagedReturnAttachmentStorage,
} from "@/features/campus-college-load/lib/attachment-storage";
import {
  RETURN_ATTACHMENT_FILE_POLICY,
  isFileAllowedByPolicy,
} from "@/features/files/lib/file-policy";
import type { StagedFile } from "@/features/files/lib/types";

const isEvaluationStep = (value: string) =>
  value === "CAMPUS_DIRECTOR" ||
  value === "DIRECTOR_FOR_INSTRUCTION" ||
  value === "VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS";

export type StageReturnAttachmentResult =
  | { success: true; file: StagedFile }
  | { success: false; error: string };

export const stageReturnAttachment = async (
  formData: FormData,
): Promise<StageReturnAttachmentResult> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: "You must be signed in." };

  const revisionId = String(formData.get("revisionId") ?? "");
  const step = String(formData.get("step") ?? "");
  const file = formData.get("file");

  if (!revisionId || !isEvaluationStep(step)) {
    return { success: false, error: "Invalid revision or step." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "No file provided." };
  }
  if (!isFileAllowedByPolicy(file, RETURN_ATTACHMENT_FILE_POLICY)) {
    return { success: false, error: "File is too large." };
  }

  try {
    const [staged] = await stagedReturnAttachmentStorage.stageFilesToPrefix({
      prefix: `${RETURN_ATTACHMENT_STAGING_PREFIX}/${revisionId}/${step}`,
      files: [file],
      classification: "return-attachment",
    });
    return { success: true, file: staged };
  } catch (error) {
    console.error("campusCollegeLoad.attachment.stage ::", error);
    return { success: false, error: "Unable to upload the attachment." };
  }
};

export const unstageReturnAttachment = async (
  objectPath: string,
): Promise<{ success: true } | { success: false; error: string }> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: "You must be signed in." };

  if (!objectPath.startsWith(`${RETURN_ATTACHMENT_STAGING_PREFIX}/`)) {
    return { success: false, error: "Invalid attachment." };
  }

  try {
    await stagedReturnAttachmentStorage.removeObject(objectPath);
    return { success: true };
  } catch (error) {
    console.error("campusCollegeLoad.attachment.unstage ::", error);
    return { success: false, error: "Unable to remove the attachment." };
  }
};
