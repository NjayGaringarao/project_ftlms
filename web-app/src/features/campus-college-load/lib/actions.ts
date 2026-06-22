"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getCurrentUser } from "@/features/auth/lib/utils";
import { getCurrentUserData } from "@/features/profile/lib/user-data/queries";
import type {
  CampusCollegeLoadEvaluationStep,
  CampusCollegeLoadEvaluationStatus,
} from "@/features/shared/types/models";
import { buildCampusCollegeLoadSnapshot } from "@/features/campus-college-load/lib/snapshot";

const RETURN_ATTACHMENT_BUCKET = "ftl-evaluation-return-attachment";

type ActionState = {
  error?: string;
  success?: string;
};

const isEvaluationStatus = (
  value: string,
): value is CampusCollegeLoadEvaluationStatus =>
  value === "APPROVED" || value === "RETURNED";

const isEvaluationStep = (
  value: string,
): value is CampusCollegeLoadEvaluationStep =>
  value === "CAMPUS_DIRECTOR" ||
  value === "DIRECTOR_FOR_INSTRUCTION" ||
  value === "VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS";

const getProgramChairDesignationForScope = async ({
  campusId,
  collegeId,
}: {
  campusId: string;
  collegeId: string;
}) => {
  const currentUserData = await getCurrentUserData({ includeDesignations: true });
  const designationIds = (currentUserData?.designations ?? [])
    .filter((designation) => designation.job_title === "Program Chairperson")
    .map((designation) => designation.id);
  if (designationIds.length === 0) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("designation")
    .select(
      `
      id,
      program_offering:program_offering_id(
        campus_id,
        program:program_id(college_id)
      )
      `,
    )
    .in("id", designationIds);

  if (error) {
    console.error("campusCollegeLoad.getProgramChairDesignation ::", error);
    return null;
  }

  return (data ?? []).find((row) => {
    const offering = Array.isArray(row.program_offering)
      ? row.program_offering[0]
      : row.program_offering;
    const program = Array.isArray(offering?.program)
      ? offering.program[0]
      : offering?.program;
    return offering?.campus_id === campusId && program?.college_id === collegeId;
  }) ?? null;
};

export const createOrResubmitCampusCollegeLoadAction = async (
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> => {
  const academicTermId = String(formData.get("academicTermId") ?? "");
  const campusId = String(formData.get("campusId") ?? "");
  const collegeId = String(formData.get("collegeId") ?? "");

  if (!academicTermId || !campusId || !collegeId) {
    return { error: "Academic term, campus, and college are required." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: "You must be signed in." };

  const chairDesignation = await getProgramChairDesignationForScope({
    campusId,
    collegeId,
  });
  if (!chairDesignation?.id) {
    return {
      error:
        "Only a Program Chairperson in this campus and college can submit this load.",
    };
  }

  const supabase = await createClient();
  const { data: existingLoad, error: loadError } = await supabase
    .from("campus_college_load")
    .select("*")
    .eq("academic_term_id", academicTermId)
    .eq("campus_id", campusId)
    .eq("college_id", collegeId)
    .maybeSingle();

  if (loadError) {
    console.error("campusCollegeLoad.submit.fetchLoad ::", loadError);
    return { error: "Unable to load the campus-college load." };
  }

  let load = existingLoad;

  if (!load) {
    const { data: inserted, error: insertLoadError } = await supabase
      .from("campus_college_load")
      .insert({
        academic_term_id: academicTermId,
        campus_id: campusId,
        college_id: collegeId,
        status: "DRAFT",
        current_step: "PROGRAM_CHAIR",
        created_by_user_id: currentUser.id,
        created_by_designation_id: chairDesignation.id,
        updated_by_user_id: currentUser.id,
        updated_by_designation_id: chairDesignation.id,
      })
      .select("*")
      .single();

    if (insertLoadError || !inserted) {
      console.error("campusCollegeLoad.submit.insertLoad ::", insertLoadError);
      return { error: "Unable to create the campus-college load." };
    }

    load = inserted;
  }

  if (load.status !== "DRAFT" && load.status !== "RETURNED") {
    return { error: "Only draft or returned loads can be submitted." };
  }

  const { data: latestRevision } = await supabase
    .from("campus_college_load_revision")
    .select("revision_number")
    .eq("campus_college_load_id", load.id)
    .order("revision_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const snapshot = await buildCampusCollegeLoadSnapshot({
    academicTermId,
    campusId,
    collegeId,
  });

  const { error: revisionError } = await supabase
    .from("campus_college_load_revision")
    .insert({
      campus_college_load_id: load.id,
      revision_number: Number(latestRevision?.revision_number ?? 0) + 1,
      snapshot,
      submitted_by_user_id: currentUser.id,
      submitted_by_designation_id: chairDesignation.id,
    });

  if (revisionError) {
    console.error("campusCollegeLoad.submit.insertRevision ::", revisionError);
    return { error: "Unable to submit the revision." };
  }

  revalidatePath("/campus-college-load");
  return { success: "Campus-college load submitted." };
};

const uploadReturnAttachment = async ({
  file,
  revisionId,
  step,
}: {
  file: File | null;
  revisionId: string;
  step: CampusCollegeLoadEvaluationStep;
}): Promise<
  | {
      bucket: string | null;
      path: string | null;
      fileName: string | null;
      mimeType: string | null;
      error?: never;
    }
  | { error: string }
> => {
  if (!file || file.size === 0) {
    return { bucket: null, path: null, fileName: null, mimeType: null };
  }

  const supabase = await createClient();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]+/g, "-");
  const path = `${revisionId}/${step}-${Date.now()}-${sanitizedFileName}`;
  const contentType = file.type || "application/octet-stream";
  const bytes = await file.arrayBuffer();
  const { error } = await supabase.storage
    .from(RETURN_ATTACHMENT_BUCKET)
    .upload(path, bytes, {
      contentType,
      upsert: false,
    });

  if (error) {
    console.error("campusCollegeLoad.return.uploadAttachment ::", error);
    return { error: "Unable to upload the return attachment." };
  }

  return {
    bucket: RETURN_ATTACHMENT_BUCKET,
    path,
    fileName: file.name,
    mimeType: contentType,
  };
};

export const submitCampusCollegeLoadEvaluationAction = async (
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> => {
  const revisionId = String(formData.get("revisionId") ?? "");
  const step = String(formData.get("step") ?? "");
  const status = String(formData.get("status") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();
  const attachment = formData.get("attachment");

  if (!revisionId || !isEvaluationStep(step) || !isEvaluationStatus(status)) {
    return { error: "Evaluation request is incomplete." };
  }

  if (status === "RETURNED" && comment.length === 0) {
    return { error: "A return comment is required." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: "You must be signed in." };

  const currentUserData = await getCurrentUserData({ includeDesignations: true });
  const expectedTitle =
    step === "CAMPUS_DIRECTOR"
      ? "Campus Director"
      : step === "DIRECTOR_FOR_INSTRUCTION"
        ? "Director for Instruction"
        : "Vice President for Academic Affairs";

  const supabase = await createClient();
  const { data: revision } = await supabase
    .from("campus_college_load_revision")
    .select("id, campus_college_load:campus_college_load_id(campus_id)")
    .eq("id", revisionId)
    .maybeSingle();

  const load = Array.isArray(revision?.campus_college_load)
    ? revision?.campus_college_load[0]
    : revision?.campus_college_load;

  const designation = (currentUserData?.designations ?? []).find((item) => {
    if (item.job_title !== expectedTitle) return false;
    if (step !== "CAMPUS_DIRECTOR") return true;
    return item.campus_id === load?.campus_id;
  });

  if (!designation) {
    return { error: "You do not have the required designation for this step." };
  }

  const uploaded = await uploadReturnAttachment({
    file: attachment instanceof File ? attachment : null,
    revisionId,
    step,
  });
  if ("error" in uploaded) return { error: uploaded.error };

  const { error } = await supabase.from("campus_college_load_evaluation").insert({
    campus_college_load_revision_id: revisionId,
    step,
    evaluator_user_id: currentUser.id,
    designation_id: designation.id,
    status,
    comment: comment || null,
    attachment_bucket: uploaded.bucket,
    attachment_path: uploaded.path,
    attachment_file_name: uploaded.fileName,
    attachment_mime_type: uploaded.mimeType,
  });

  if (error) {
    console.error("campusCollegeLoad.evaluate.insert ::", error);
    return { error: "Unable to submit the evaluation." };
  }

  revalidatePath("/campus-college-load");
  return {
    success:
      status === "RETURNED"
        ? "Campus-college load returned for revision."
        : "Campus-college load approved.",
  };
};
