import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getSafeRedirectPath } from "@/features/auth/lib/redirects";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const message = searchParams.get("message");
  const error = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  const errorDescription = searchParams.get("error_description");
  const next = getSafeRedirectPath(searchParams.get("next"), "/me/security");

  const buildRedirectUrl = (
    status: "success" | "pending" | "error",
    detail: string,
    confirmedEmail?: string,
  ) => {
    const target = new URL(next, "https://app.invalid");
    target.searchParams.set("email_change_status", status);
    target.searchParams.set("message", detail);
    if (confirmedEmail) {
      target.searchParams.set("confirmed_email", confirmedEmail);
    }
    return `${target.pathname}${target.search}${target.hash}`;
  };

  const verificationErrorMessage = (code?: string) =>
    code === "pkce_code_verifier_not_found" || code === "flow_state_not_found"
      ? "Open the confirmation link in the browser where you requested the email change. If it still fails, request a new email change."
      : "This confirmation link is invalid, expired, or already used. Request a new email change and use the latest messages in both inboxes.";
  const pendingMessage =
    "One email confirmation has been recorded. Confirm the link in the other email address to complete the change.";

  if (error || errorCode || errorDescription) {
    redirect(
      buildRedirectUrl("error", verificationErrorMessage(errorCode ?? undefined)),
    );
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      redirect(buildRedirectUrl("error", verificationErrorMessage(error.code)));
    }
    if (data.session) {
      redirect(
        buildRedirectUrl(
          "success",
          "Your email address has been changed.",
          data.session.user.email,
        ),
      );
    }
    redirect(buildRedirectUrl("pending", pendingMessage));
  }

  if (token_hash && type === "email_change") {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (error) {
      redirect(buildRedirectUrl("error", verificationErrorMessage(error.code)));
    }
    // Secure email change confirms two inboxes. The first confirmation does
    // not return a session and must not be reported as a completed change.
    if (data.session) {
      redirect(
        buildRedirectUrl(
          "success",
          "Your email address has been changed.",
          data.session.user.email,
        ),
      );
    }
    redirect(buildRedirectUrl("pending", pendingMessage));
  }

  // Supabase's first secure-email confirmation redirects with a message and
  // no code; the second confirmation supplies the PKCE code above.
  if (message) {
    redirect(buildRedirectUrl("pending", pendingMessage));
  }

  // Error fallback
  redirect(buildRedirectUrl("error", verificationErrorMessage()));
}
