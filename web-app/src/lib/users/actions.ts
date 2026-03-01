"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@/utils/supabase/admin";
import { Identity } from "@/models/identity";
import { revalidatePath } from "next/cache";

type CreateUserInput = {
  email: string;
  password: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  extension?: string | null;
  birth_date: string;
  address?: string | null;
  zip_code?: string | null;
  contact_number?: string | null;
  employment_status?: string | null;
};

const normalizeEmploymentStatus = (value?: string | null) => {
  const normalized = value?.trim().toUpperCase();
  return normalized === "PART_TIME" || normalized === "FULL_TIME"
    ? normalized
    : "PART_TIME";
};

const normalizeJobTitleKey = (value?: string | null) =>
  value?.trim().toLowerCase() ?? "";

const isHigherUpsTitle = (value?: string | null) => {
  const normalized = normalizeJobTitleKey(value);
  return (
    normalized === "university president" ||
    normalized === "director for instruction"
  );
};

type UpdateUserInput = {
  user_id: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  extension?: string | null;
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

  // Create admin client for user creation
  const adminClient = await createAdminClient();

  // Create auth user
  const { data: authData, error: authError } =
    await adminClient.auth.admin.createUser({
      email: input.email.trim(),
      password: input.password.trim(),
      email_confirm: true,
    });

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
    extension: input.extension?.trim() || null,
    birth_date: input.birth_date,
    address: input.address?.trim() || null,
    zip_code: input.zip_code?.trim() || null,
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

  revalidatePath("/users");
  return { data: { id: userId } };
}

// PERSONAL INFORMATION ONLY
type UpdateUserPersonalInfoInput = {
  user_id: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  extension?: string | null;
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
    extension: input.extension?.trim() || null,
    birth_date: input.birth_date,
    address: input.address?.trim() || null,
    zip_code: input.zip_code?.trim() || null,
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
    extension: input.extension?.trim() || null,
    birth_date: input.birth_date,
    address: input.address?.trim() || null,
    zip_code: input.zip_code?.trim() || null,
    contact_number: input.contact_number?.trim() || null,
  };

  const { error: identityError } = await supabase
    .from("identity")
    .upsert(identityPayload, { onConflict: "user_id" });

  if (identityError) {
    return { error: identityError.message };
  }

  // Update user employment status
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
  designations?: Array<{
    id?: string;
    campus_id?: string | null;
    job_title: string;
    department_id?: string | null;
    program_offering_id?: string | null;
    room_id?: string | null;
    load?: number | null;
  }>;
};

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
    updatePayload.employment_status = normalizeEmploymentStatus(
      input.employment_status,
    );
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
      const invalidDesignation = input.designations.find((d) => {
        const normalizedJobTitle = normalizeJobTitleKey(d.job_title);
        const campusId = d.campus_id?.trim() || null;
        const departmentId = d.department_id?.trim() || null;
        const programOfferingId = d.program_offering_id?.trim() || null;
        const roomId = d.room_id?.trim() || null;

        if (!d.job_title?.trim()) {
          return true;
        }

        if (d.load !== undefined && d.load !== null && d.load < 0) {
          return true;
        }

        if (normalizedJobTitle === "program chairperson") {
          return !programOfferingId;
        }

        if (normalizedJobTitle === "college dean") {
          return !departmentId;
        }

        if (normalizedJobTitle === "campus director") {
          return !campusId;
        }

        if (isHigherUpsTitle(d.job_title)) {
          return false;
        }

        const hasContext =
          campusId || departmentId || programOfferingId || roomId;
        return !hasContext;
      });

      if (invalidDesignation) {
        const normalizedJobTitle = normalizeJobTitleKey(
          invalidDesignation.job_title,
        );

        if (!invalidDesignation.job_title?.trim()) {
          return { error: "Each designation must include a job title." };
        }

        if (
          invalidDesignation.load !== undefined &&
          invalidDesignation.load !== null &&
          invalidDesignation.load < 0
        ) {
          return {
            error: "Designation load must be a non-negative number.",
          };
        }

        if (normalizedJobTitle === "program chairperson") {
          return {
            error:
              "Program Chairperson designation requires a program offering.",
          };
        }

        if (normalizedJobTitle === "college dean") {
          return {
            error: "College Dean designation requires a department.",
          };
        }

        if (normalizedJobTitle === "campus director") {
          return {
            error: "Campus Director designation requires a campus.",
          };
        }

        return {
          error:
            "Each designation must include at least one context: campus, department, program offering, or room (except University President and Director for Instruction).",
        };
      }

      const designationsToInsert = input.designations.map((d) => ({
        user_id: input.user_id,
        campus_id: d.campus_id || null,
        job_title: d.job_title.trim(),
        department_id: d.department_id?.trim() || null,
        program_offering_id: d.program_offering_id?.trim() || null,
        room_id: d.room_id?.trim() || null,
        load: d.load ?? null,
      }));

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
): Promise<{ data?: boolean; error?: string }> {
  if (!userId?.trim()) return { error: "User ID is required" };

  const adminClient = await createAdminClient();

  // Delete auth user (cascade delete in database handles identity, designations, degrees)
  const { error } = await adminClient.auth.admin.deleteUser(userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/users");
  return { data: true };
}
