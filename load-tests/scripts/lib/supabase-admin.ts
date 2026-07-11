import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "./env";

export const createSupabaseAdmin = () => {
  const env = loadEnv();
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
