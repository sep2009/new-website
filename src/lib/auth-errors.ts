/** Turn Supabase auth errors into calm, helpful messages. */
export function friendlyAuthError(err: { message?: string; code?: string; status?: number } | null): string {
  if (!err) return "";
  const code = err.code ?? "";
  const msg = (err.message ?? "").toLowerCase();

  if (code === "invalid_credentials" || msg.includes("invalid login credentials"))
    return "That email and password don't match. Check them and try again.";
  if (code === "email_not_confirmed" || msg.includes("email not confirmed"))
    return "Please verify your email first. We can send the link again.";
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit" || err.status === 429)
    return "Too many attempts. Please wait a minute and try again.";
  if (code === "weak_password" || msg.includes("password should"))
    return "That password is too weak. Try a longer one with letters and numbers.";
  if (code === "same_password" || msg.includes("different from the old"))
    return "Choose a password you haven't used before.";
  if (code === "user_already_exists" || msg.includes("already registered"))
    return "An account with this email already exists. Try signing in instead.";
  if (code === "signup_disabled") return "Sign-ups are currently closed.";
  if (msg.includes("fetch") || msg.includes("network"))
    return "We couldn't reach the server. Check your connection and try again.";
  return "Something went wrong. Please try again.";
}
