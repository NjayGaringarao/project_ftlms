import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";
// The client you created from the Server-Side Auth instructions
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const _next = searchParams.get("next");
  // Ensure next is a valid relative path, default to update-password page
  const next = _next?.startsWith("/") ? _next : "/auth/update-password";

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      // Successfully verified, redirect to update password page
      redirect(next);
    } else {
      console.error("reset-password route GET :: verifyOtp error:", error);
    }
  }

  // Redirect the user to an error page with some instructions
  redirect(
    "/auth/error?error=Invalid%20Link&message=The%20reset%20link%20is%20invalid%20or%20has%20expired.%20Please%20request%20a%20new%20one.",
  );
}
