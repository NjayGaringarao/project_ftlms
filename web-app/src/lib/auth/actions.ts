"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function createAdmin(email: string, password: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/confirm?next=/home`,
      data: {
        user_role: "ADMIN",
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/auth/create-admin-success");
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/home");
}

export async function requestPasswordReset(email: string) {
  const supabase = await createClient();

  // The redirectTo should point to the API route that handles the token exchange
  // The API route will then redirect to the update-password page after verification
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/reset-password?next=/auth/update-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function updatePassword(password: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  redirect("/home");
}

export async function updateEmail(newEmail: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser(
    { email: newEmail },
    {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/change-email?next=/me/security`,
    },
  );

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
