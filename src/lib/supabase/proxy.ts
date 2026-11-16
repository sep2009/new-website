import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Signed-in only. Everything under these prefixes needs a session. */
const PROTECTED = ["/home", "/memories", "/journey", "/profile", "/settings", "/map", "/on-this-day", "/mood", "/messages", "/recap", "/onboarding", "/design"];
/** Signed-out only. Signed-in users are sent to Home. */
const GUEST_ONLY = ["/signin", "/signup", "/forgot-password"];

const matches = (path: string, prefixes: string[]) =>
  prefixes.some((p) => path === p || path.startsWith(`${p}/`));

/**
 * Refreshes the Supabase session cookie on every request and applies
 * optimistic redirects. Real authorization is still enforced server-side
 * (layout checks) and in the database (Row Level Security).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() validates the token with Supabase (unlike reading the cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  const redirectTo = (to: string) => {
    const url = request.nextUrl.clone();
    url.pathname = to;
    url.search = "";
    const redirect = NextResponse.redirect(url);
    // keep any refreshed auth cookies on the redirect response
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  };

  if (!user && matches(path, PROTECTED)) return redirectTo("/signin");
  if (user && matches(path, GUEST_ONLY)) return redirectTo("/home");

  return response;
}
