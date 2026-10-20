import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const forwardedProto =
    request.headers
      .get("x-forwarded-proto")
      ?.split(",")[0]
      ?.trim()
      ?.toLowerCase() || "https";
  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const host = request.headers.get("host")?.split(",")[0]?.trim();

  const originFromHeaders = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : host
      ? `${forwardedProto}://${host}`
      : undefined;
  const baseOrigin = originFromHeaders || process.env.NEXT_PUBLIC_SITE_URL;

  return NextResponse.redirect(new URL("/auth/login", baseOrigin || request.url), {
    status: 303,
  });
}
