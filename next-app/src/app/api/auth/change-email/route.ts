import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const confirmed_email = searchParams.get("confirmed_email");
  const message = searchParams.get("message");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const _next = searchParams.get("next");
  // Ensure next is a valid relative path
  const next = _next?.startsWith("/") ? _next : "/home";

  const buildRedirectUrl = (status: "success" | "error", detail?: string) => {
    const params = new URLSearchParams();
    params.set("email_change_status", status);
    if (detail) {
      params.set("message", detail);
    }
    if (confirmed_email) {
      params.set("confirmed_email", confirmed_email);
    }
    return `${next}?${params.toString()}`;
  };

  if (message || error || errorDescription) {
    const detail = message || errorDescription || error || undefined;
    const status = error || errorDescription ? "error" : "success";
    redirect(buildRedirectUrl(status, detail));
  }

  if (token_hash && type === "email_change") {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      // Log email change verification success
      // await createLog({
      //   type: "SYSTEM.AUTH",
      //   title: "Email change verified",
      //   description: `Email change verified for ${confirmed_email ?? "user"}`,
      // });
      // Redirect with optional confirmed_email parameter
      const successMessage = confirmed_email
        ? `Email change confirmed for ${confirmed_email}.`
        : "Email change confirmed.";
      redirect(buildRedirectUrl("success", successMessage));
    }
  }

  // Error fallback
  redirect(
    buildRedirectUrl(
      "error",
      "This confirmation link may be expired or invalid.",
    ),
  );
}
