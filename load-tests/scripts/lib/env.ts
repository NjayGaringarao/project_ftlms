import "dotenv/config";

export type PersonaKey = "chair" | "campusDirector" | "dfi" | "vpaa";

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required env var ${name}. Copy load-tests/.env.example to load-tests/.env and fill it in.`,
    );
  }
  return value;
};

const assertLocalSupabase = (url: string) => {
  if (process.env.LOAD_TEST_ALLOW_REMOTE === "1") return;
  const host = new URL(url).hostname;
  if (host !== "localhost" && host !== "127.0.0.1") {
    throw new Error(
      `Refusing to run against non-local Supabase URL "${url}". ` +
        `These scripts create/mutate data and are meant for a local instance only. ` +
        `Set LOAD_TEST_ALLOW_REMOTE=1 if you really mean to target this host.`,
    );
  }
};

export const loadEnv = () => {
  const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL");
  assertLocalSupabase(supabaseUrl);

  return {
    supabaseUrl,
    supabaseAnonKey: required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY"),
    supabaseServiceRoleKey: required("SUPABASE_SECRET_DEFAULT_KEY"),
    siteUrl: process.env.SITE_URL ?? "http://localhost:3000",
    evalBatchSize: Number(process.env.LOAD_TEST_EVAL_BATCH_SIZE ?? "20"),
  };
};
