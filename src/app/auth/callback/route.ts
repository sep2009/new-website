import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/validation";

/**
 * Landing point for email confirmation, password recovery and OAuth links.
 * Exchanges the one-time code for a session cookie, then redirects.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  // Expired, reused or missing code.
  const failure = next === "/reset-password" ? "/reset-password" : "/verify-email?error=link";
  return NextResponse.redirect(`${origin}${failure}`);
}
