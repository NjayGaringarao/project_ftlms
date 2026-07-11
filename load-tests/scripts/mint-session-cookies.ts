import { createClient as createAnonClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { loadEnv, type PersonaKey } from "./lib/env";
import { readState, writeState } from "./lib/state";

type PersonaSeedResult = { userId: string; designationId: string; email: string; password: string };

type MintedCookie = { name: string; value: string };

const mintFor = async (
  env: ReturnType<typeof loadEnv>,
  email: string,
  password: string,
) => {
  const anon = createAnonClient(env.supabaseUrl, env.supabaseAnonKey);
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.session) throw new Error(`No session returned for ${email}`);

  // Feed the real session through @supabase/ssr's own cookie-writing logic
  // (same code path web-app/src/utils/supabase/server.ts uses) so we get the
  // exact cookie name(s)/chunking/encoding the Next.js app expects, instead
  // of hand-rolling it.
  const captured: MintedCookie[] = [];
  const serverClient = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll: () => [],
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => captured.push({ name, value }));
      },
    },
  });
  await serverClient.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });

  if (captured.length === 0) {
    throw new Error(
      `setSession() did not produce any cookies for ${email} — @supabase/ssr may not have ` +
        `flushed synchronously. Inspect this script if REST-mode k6 scripts get redirected to /auth/login.`,
    );
  }

  return {
    cookies: captured,
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  };
};

const main = async () => {
  const env = loadEnv();
  const personaResults = readState<Record<PersonaKey, PersonaSeedResult>>("personas.json");
  if (!personaResults) {
    throw new Error("No .state/personas.json found. Run `npm run seed` first.");
  }

  for (const key of Object.keys(personaResults) as PersonaKey[]) {
    const { email, password, userId, designationId } = personaResults[key];
    const minted = await mintFor(env, email, password);
    writeState(`session.${key}.json`, {
      email,
      userId,
      designationId,
      cookies: minted.cookies,
      accessToken: minted.accessToken,
      refreshToken: minted.refreshToken,
    });
    console.log(`[${key}] minted session for ${email} (${minted.cookies.length} cookie(s))`);
  }
};

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
