"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@/utils/supabase/admin";
import { Identity } from "@/features/shared/types/models/identity";
import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

type CreateUserInput = {
  email: string;
  password: string;
  is_admin?: boolean;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  suffix?: string | null;
  professional_extension?: string | null;
  birth_date: string;
  address?: string | null;
  zip_code?: string | null;
  contact_number?: string | null;
  employment_status?: string | null;
  campus_id: string;
  college_id: string;
};

const EMPLOYMENT_STATUS_ALIASES = new Map<string, string>([
  ["regular", "Regular"],
  ["part-time", "Part-time"],
  ["part time", "Part-time"],
  ["part_time", "Part-time"],
  ["parttime", "Part-time"],
  ["contract of service", "Contract of Service"],
  ["contract_of_service", "Contract of Service"],
  ["temporary", "Temporary"],
  // Backward compatibility for legacy payloads.
  ["full-time", "Regular"],
  ["full time", "Regular"],
  ["full_time", "Regular"],
]);

const normalizeEmploymentStatus = (value?: string | null) => {
  const normalized = value?.trim();
  if (!normalized) return null;

  const mapped = EMPLOYMENT_STATUS_ALIASES.get(normalized.toLowerCase());
  return mapped ?? null;
};

const getEmploymentStatusValidationError = (value?: string | null) => {
  if (!value?.trim()) return null;

  return normalizeEmploymentStatus(value)
    ? null
    : "Invalid employment status. Allowed values: Regular, Part-time, Contract of Service, Temporary.";
};

const normalizeJobTitleKey = (value?: string | null) =>
  value?.trim().toLowerCase() ?? "";

const isHigherUpsTitle = (value?: string | null) => {
  const normalized = normalizeJobTitleKey(value);
  return (
    normalized === "director for instruction" ||
    normalized === "vice president for academic affairs" ||
    normalized === "quality assurance"
  );
};

type UpdateUserInput = {
  user_id: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  suffix?: string | null;
  professional_extension?: string | null;
  birth_date: string;
  address?: string | null;
  zip_code?: string | null;
  contact_number?: string | null;
  employment_status?: string | null;
};

export async function createUser(
  input: CreateUserInput,
): Promise<{ data?: { id: string }; error?: string }> {
  // Validate required fields
  if (!input.email?.trim()) return { error: "Email is required" };
  if (!input.password?.trim()) return { error: "Password is required" };
  if (!input.first_name?.trim()) return { error: "First name is required" };
  if (!input.last_name?.trim()) return { error: "Last name is required" };
  if (!input.birth_date?.trim()) return { error: "Birth date is required" };
  if (!input.campus_id?.trim()) return { error: "Campus is required" };
  if (!input.college_id?.trim()) return { error: "College is required" };

  // Create admin client for user creation
  const adminClient = await createAdminClient();

  // Create auth user.
  // Admin accounts must go through sign-up confirmation email flow.
  const authResponse = input.is_admin
    ? await createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        },
      ).auth.signUp({
        email: input.email.trim(),
        password: input.password.trim(),
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/confirm?next=/home`,
          data: {
            user_role: "ADMIN",
          },
        },
      })
    : await adminClient.auth.admin.createUser({
        email: input.email.trim(),
        password: input.password.trim(),
        email_confirm: true,
        user_metadata: {},
      });

  const { data: authData, error: authError } = authResponse;

  if (authError || !authData.user) {
    return { error: authError?.message ?? "Failed to create auth user" };
  }

  const userId = authData.user.id;

  // Get regular supabase client for inserting identity and updating user
  const supabase = await createClient();

  // Insert identity record
  const identityPayload: Identity = {
    user_id: userId,
    first_name: input.first_name.trim(),
    middle_name: input.middle_name?.trim() || null,
    last_name: input.last_name.trim(),
    suffix: input.suffix?.trim() || null,
    professional_extension: input.professional_extension?.trim() || null,
    birth_date: input.birth_date,
    address: input.address?.trim() || null,
    contact_number: input.contact_number?.trim() || null,
  };

  const { error: identityError } = await supabase
    .from("identity")
    .insert(identityPayload);

  if (identityError) {
    // Rollback: delete the auth user
    await adminClient.auth.admin.deleteUser(userId);
    return { error: identityError.message };
  }

  // Update user employment status if provided
  if (input.employment_status?.trim()) {
    const employmentStatusError = getEmploymentStatusValidationError(
      input.employment_status,
    );

    if (employmentStatusError) {
      return { error: employmentStatusError };
    }

    const { error: userError } = await supabase
      .from("user")
      .update({
        employment_status: normalizeEmploymentStatus(input.employment_status),
      })
      .eq("id", userId);

    if (userError) {
      console.error("lib.users.actions.createUser.userUpdate ::", userError);
      // Don't fail the whole operation, just log it
    }
  }

  const { error: affiliationError } = await supabase
    .from("user")
    .update({
      campus_id: input.campus_id.trim(),
      college_id: input.college_id.trim(),
    })
    .eq("id", userId);

  if (affiliationError) {
    console.error("lib.users.actions.createUser.affiliation ::", affiliationError);
  }

  revalidatePath("/users");
  return { data: { id: userId } };
}

// PERSONAL INFORMATION ONLY
type UpdateUserPersonalInfoInput = {
  user_id: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  suffix?: string | null;
  professional_extension?: string | null;
  birth_date: string;
  address?: string | null;
  zip_code?: string | null;
  contact_number?: string | null;
};

export async function updateUserPersonalInfo(
  input: UpdateUserPersonalInfoInput,
): Promise<{ data?: boolean; error?: string }> {
  // Validate required fields
  if (!input.user_id?.trim()) return { error: "User ID is required" };
  if (!input.first_name?.trim()) return { error: "First name is required" };
  if (!input.last_name?.trim()) return { error: "Last name is required" };
  if (!input.birth_date?.trim()) return { error: "Birth date is required" };

  const supabase = await createClient();

  // Update identity
  const identityPayload: Identity = {
    user_id: input.user_id,
    first_name: input.first_name.trim(),
    middle_name: input.middle_name?.trim() || null,
    last_name: input.last_name.trim(),
    suffix: input.suffix?.trim() || null,
    professional_extension: input.professional_extension?.trim() || null,
    birth_date: input.birth_date,
    address: input.address?.trim() || null,
    contact_number: input.contact_number?.trim() || null,
  };

  const { error: identityError } = await supabase
    .from("identity")
    .upsert(identityPayload, { onConflict: "user_id" });

  if (identityError) {
    return { error: identityError.message };
  }

  revalidatePath("/users");
  revalidatePath(`/users/${input.user_id}`);
  return { data: true };
}

// LEGACY: Update both personal and professional (kept for backward compatibility)
export async function updateUserProfile(
  input: UpdateUserInput,
): Promise<{ data?: boolean; error?: string }> {
  // Validate required fields
  if (!input.user_id?.trim()) return { error: "User ID is required" };
  if (!input.first_name?.trim()) return { error: "First name is required" };
  if (!input.last_name?.trim()) return { error: "Last name is required" };
  if (!input.birth_date?.trim()) return { error: "Birth date is required" };

  const supabase = await createClient();

  // Update identity
  const identityPayload: Identity = {
    user_id: input.user_id,
    first_name: input.first_name.trim(),
    middle_name: input.middle_name?.trim() || null,
    last_name: input.last_name.trim(),
    suffix: input.suffix?.trim() || null,
    professional_extension: input.professional_extension?.trim() || null,
    birth_date: input.birth_date,
    address: input.address?.trim() || null,
    contact_number: input.contact_number?.trim() || null,
  };

  const { error: identityError } = await supabase
    .from("identity")
    .upsert(identityPayload, { onConflict: "user_id" });

  if (identityError) {
    return { error: identityError.message };
  }

  // Update user employment status
  const employmentStatusError = getEmploymentStatusValidationError(
    input.employment_status,
  );

  if (employmentStatusError) {
    return { error: employmentStatusError };
  }

  const { error: userError } = await supabase
    .from("user")
    .update({
      employment_status: normalizeEmploymentStatus(input.employment_status),
    })
    .eq("id", input.user_id);

  if (userError) {
    return { error: userError.message };
  }

  revalidatePath("/users");
  revalidatePath(`/users/${input.user_id}`);
  return { data: true };
}
type UpdateUserProfessionalInput = {
  user_id: string;
  academic_rank_id?: string | null;
  employment_status?: string | null;
  campus_id?: string | null;
  college_id?: string | null;
  designations?: UserDesignationInput[];
};

type UserDesignationInput = {
  id?: string;
  campus_id?: string | null;
  job_title: string;
  college_id?: string | null;
  program_offering_id?: string | null;
  room_id?: string | null;
  load?: number | null;
};

const getDesignationValidationError = (designation: UserDesignationInput) => {
  const normalizedJobTitle = normalizeJobTitleKey(designation.job_title);
  const campusId = designation.campus_id?.trim() || null;
  const collegeId = designation.college_id?.trim() || null;
  const programOfferingId = designation.program_offering_id?.trim() || null;
  const roomId = designation.room_id?.trim() || null;

  if (!designation.job_title?.trim()) {
    return "Each designation must include a job title.";
  }

  if (
    designation.load !== undefined &&
    designation.load !== null &&
    designation.load < 0
  ) {
    return "Designation load must be a non-negative number.";
  }

  if (normalizedJobTitle === "program chairperson" && !programOfferingId) {
    return "Program Chairperson designation requires a program offering.";
  }

  if (normalizedJobTitle === "college dean" && !collegeId) {
    return "College Dean designation requires a college.";
  }

  if (normalizedJobTitle === "campus director" && !campusId) {
    return "Campus Director designation requires a campus.";
  }

  if (isHigherUpsTitle(designation.job_title)) {
    return null;
  }

  const hasContext = campusId || collegeId || programOfferingId || roomId;
  return hasContext
    ? null
    : "Each designation must include at least one context: campus, college, program offering, or room (except Director for Instruction, Vice President for Academic Affairs, and Quality Assurance).";
};

const toDesignationInsert = (
  userId: string,
  designation: UserDesignationInput,
) => ({
  user_id: userId,
  campus_id: designation.campus_id?.trim() || null,
  job_title: designation.job_title.trim(),
  college_id: designation.college_id?.trim() || null,
  program_offering_id: designation.program_offering_id?.trim() || null,
  room_id: designation.room_id?.trim() || null,
  load: designation.load ?? null,
});

export async function updateUserProfessional(
  input: UpdateUserProfessionalInput,
): Promise<{ data?: boolean; error?: string }> {
  if (!input.user_id?.trim()) return { error: "User ID is required" };

  const supabase = await createClient();

  // Update academic rank and employment status
  const updatePayload: Record<string, unknown> = {};
  if (input.academic_rank_id !== undefined) {
    updatePayload.academic_rank_id = input.academic_rank_id || null;
  }
  if (input.employment_status !== undefined) {
    const employmentStatusError = getEmploymentStatusValidationError(
      input.employment_status,
    );

    if (employmentStatusError) {
      return { error: employmentStatusError };
    }

    updatePayload.employment_status = normalizeEmploymentStatus(
      input.employment_status,
    );
  }
  if (input.campus_id !== undefined || input.college_id !== undefined) {
    if (!input.campus_id?.trim()) return { error: "Campus is required" };
    if (!input.college_id?.trim()) return { error: "College is required" };

    updatePayload.campus_id = input.campus_id.trim();
    updatePayload.college_id = input.college_id.trim();
  }

  if (Object.keys(updatePayload).length > 0) {
    const { error: userError } = await supabase
      .from("user")
      .update(updatePayload)
      .eq("id", input.user_id);

    if (userError) {
      return { error: userError.message };
    }
  }

  // Handle designations update
  if (input.designations) {
    // Use admin client for designation operations (bypasses RLS)
    const adminClient = await createAdminClient();

    // Delete existing designations
    const { error: deleteError } = await adminClient
      .from("designation")
      .delete()
      .eq("user_id", input.user_id);

    if (deleteError) {
      return { error: `Failed to remove designations: ${deleteError.message}` };
    }

    // Insert new designations
    if (input.designations.length > 0) {
      const designationError = input.designations
        .map(getDesignationValidationError)
        .find(Boolean);

      if (designationError) {
        return { error: designationError };
      }

      const designationsToInsert = input.designations.map((designation) =>
        toDesignationInsert(input.user_id, designation),
      );

      const { error: insertError } = await adminClient
        .from("designation")
        .insert(designationsToInsert);

      if (insertError) {
        return { error: `Failed to add designations: ${insertError.message}` };
      }
    }
  }

  revalidatePath("/users");
  revalidatePath(`/users/${input.user_id}`);
  revalidatePath(`/users/${input.user_id}/edit`);
  return { data: true };
}

type AddUserDesignationInput = {
  user_id: string;
  designation: UserDesignationInput;
};

export async function addUserDesignation(
  input: AddUserDesignationInput,
): Promise<{ data?: boolean; error?: string }> {
  if (!input.user_id?.trim()) return { error: "User ID is required" };

  const designationError = getDesignationValidationError(input.designation);
  if (designationError) return { error: designationError };

  const adminClient = await createAdminClient();
  const { error } = await adminClient
    .from("designation")
    .insert(toDesignationInsert(input.user_id, input.designation));

  if (error) {
    return { error: `Failed to add designation: ${error.message}` };
  }

  revalidatePath("/users");
  revalidatePath(`/users/${input.user_id}`);
  return { data: true };
}

type RemoveUserDesignationInput = {
  user_id: string;
  designation_id: string;
};

export async function removeUserDesignation(
  input: RemoveUserDesignationInput,
): Promise<{ data?: boolean; error?: string }> {
  if (!input.user_id?.trim()) return { error: "User ID is required" };
  if (!input.designation_id?.trim()) {
    return { error: "Designation ID is required" };
  }

  const adminClient = await createAdminClient();
  const { error } = await adminClient
    .from("designation")
    .delete()
    .eq("id", input.designation_id)
    .eq("user_id", input.user_id);

  if (error) {
    return { error: `Failed to remove designation: ${error.message}` };
  }

  revalidatePath("/users");
  revalidatePath(`/users/${input.user_id}`);
  return { data: true };
}

type ChangeUserEmailInput = {
  user_id: string;
  new_email: string;
};

export async function changeUserEmail(
  input: ChangeUserEmailInput,
): Promise<{ data?: boolean; error?: string }> {
  if (!input.user_id?.trim()) return { error: "User ID is required" };
  if (!input.new_email?.trim()) return { error: "Email is required" };

  const adminClient = await createAdminClient();

  // Update auth email (no email verification)
  const { error: authError } = await adminClient.auth.admin.updateUserById(
    input.user_id,
    {
      email: input.new_email.trim(),
      email_confirm: true,
    },
  );

  if (authError) {
    return { error: authError.message };
  }

  revalidatePath("/users");
  revalidatePath(`/users/${input.user_id}`);
  revalidatePath(`/users/${input.user_id}/edit`);
  return { data: true };
}

type ChangeUserPasswordInput = {
  user_id: string;
  new_password: string;
};

export async function changeUserPassword(
  input: ChangeUserPasswordInput,
): Promise<{ data?: boolean; error?: string }> {
  if (!input.user_id?.trim()) return { error: "User ID is required" };
  if (!input.new_password?.trim()) return { error: "Password is required" };

  const adminClient = await createAdminClient();

  // Update password (no verification email sent)
  const { error } = await adminClient.auth.admin.updateUserById(input.user_id, {
    password: input.new_password.trim(),
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/users");
  revalidatePath(`/users/${input.user_id}`);
  revalidatePath(`/users/${input.user_id}/edit`);
  return { data: true };
}

export async function deleteUser(
  userId: string,
): Promise<{ data?: boolean; error?: string; deletedCurrentUser?: boolean }> {
  if (!userId?.trim()) return { error: "User ID is required" };

  const supabase = await createClient();
  const adminClient = await createAdminClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  const isDeletingCurrentUser = currentUser?.id === userId;

  if (isDeletingCurrentUser) {
    return { error: "You cannot delete your own administrator account." };
  }

  // Delete auth user (cascade delete in database handles identity, designations, degrees)
  const { error } = await adminClient.auth.admin.deleteUser(userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/users");
  return { data: true, deletedCurrentUser: false };
}
