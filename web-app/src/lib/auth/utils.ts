import { UserRole } from "@/models";
import { createClient } from "@/utils/supabase/server";
import { User } from "@supabase/supabase-js";

export const isAdminExists = async (): Promise<boolean> => {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("is_admin_exists");

  if (error) {
    console.error("is_admin_exists error:", error);
    throw error;
  }

  return data ?? false;
};

export const getCurrentUser = async (): Promise<User | undefined> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    if (error.message === "Auth session missing!") {
      console.log("lib.auth.getCurrentUser :: [No Current User]");
    } else {
      console.log("lib.auth.getCurrentUser ::", error);
    }
    return undefined;
  } else {
    return data.user;
  }
};

export const getUserRole = async (): Promise<UserRole[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_user_roles");

  if (error) {
    console.error("getUserRole error:", error);
    return [];
  }

  return (data as UserRole[]) ?? [];
};
