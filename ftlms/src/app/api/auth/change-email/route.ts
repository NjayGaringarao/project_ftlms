import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const confirmed_email = searchParams.get("confirmed_email");
  const _next = searchParams.get("next");
  // Ensure next is a valid relative path
  const next = _next?.startsWith("/") ? _next : "/home";

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
      const redirectPath = confirmed_email
        ? `${next}?confirmed_email=${encodeURIComponent(confirmed_email)}`
        : next;
      redirect(redirectPath);
    }
  }

  // Error fallback
  redirect(
    "/auth/error?error=Invalid%20Email%20Change%20Link&message=This%20confirmation%20link%20may%20be%20expired%20or%20invalid.",
  );
}
