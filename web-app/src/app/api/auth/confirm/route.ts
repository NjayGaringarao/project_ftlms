import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

// Creating a handler to a GET request to route /auth/confirm
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const _next = searchParams.get("next");
  // Ensure next is a valid relative path
  const next = _next?.startsWith("/") ? _next : "/home";

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      // Log generic email confirmation success
      // await createLog({
      //   type: "SYSTEM.AUTH",
      //   title: "Email confirmed",
      //   description: `Email confirmation via ${type} successful`,
      // });
      // Redirect user to specified redirect URL or default
      redirect(next);
    }
  }

  // Redirect the user to an error page with some instructions
  redirect(
    "/auth/error?error=Invalid%20Link&message=The%20confirmation%20link%20is%20invalid%20or%20has%20expired.",
  );
}
