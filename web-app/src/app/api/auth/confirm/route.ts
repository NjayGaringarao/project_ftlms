import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

// Creating a handler to a GET request to route /auth/confirm
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const errorCode = searchParams.get("error_code");
  const _next = searchParams.get("next");
  // Ensure next is a valid relative path
  const next = _next?.startsWith("/") ? _next : "/home";
  const supabase = await createClient();

  // Supabase PKCE callback format.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      redirect(next);
    }
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      redirect(next);
    }
  }

  // Reused/previewed links can arrive as otp_expired or invalid grant even when already confirmed.
  if (errorCode === "otp_expired" || errorCode === "access_denied") {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect(next);
    }

    redirect(
      `/auth/login?message=${encodeURIComponent(
        "Confirmation link expired or was already used. If your account is confirmed, just log in.",
      )}`,
    );
  }

  redirect(
    "/auth/error?error=Invalid%20Link&message=The%20confirmation%20link%20is%20invalid%20or%20expired.",
  );
}
