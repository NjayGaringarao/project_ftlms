import { createClient } from "@/utils/supabase/server";
import { createStagedStorageService } from "@/features/files/lib/staged-storage";

export const RETURN_ATTACHMENT_BUCKET = "ftl-evaluation-return-attachment";
export const RETURN_ATTACHMENT_STAGING_PREFIX = "staging";

export const stagedReturnAttachmentStorage = createStagedStorageService({
  createClient,
  bucketName: RETURN_ATTACHMENT_BUCKET,
});
