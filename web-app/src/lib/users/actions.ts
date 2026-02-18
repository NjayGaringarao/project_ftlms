"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
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
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_DEFAULT_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

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
      .update({ employment_status: input.employment_status.trim() })
      .eq("id", userId);

    if (userError) {
      console.error("lib.users.actions.createUser.userUpdate ::", userError);
      // Don't fail the whole operation, just log it
    }
  }

  revalidatePath("/users");
  return { data: { id: userId } };
}

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
    .update({ employment_status: input.employment_status?.trim() || null })
    .eq("id", input.user_id);

  if (userError) {
    return { error: userError.message };
  }

  revalidatePath("/users");
  revalidatePath(`/users/${input.user_id}`);
  return { data: true };
}
