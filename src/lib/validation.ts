/** Small, dependency-free field validators. Each returns an error string or undefined. */

export const PASSWORD_MIN = 8;

export function validateName(value: string): string | undefined {
  const v = value.trim();
  if (!v) return "Enter your name.";
  if (v.length > 80) return "Keep your name under 80 characters.";
}

export function validateEmail(value: string): string | undefined {
  const v = value.trim();
  if (!v) return "Enter your email address.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "Enter a valid email address, like name@example.com.";
}

export function validatePassword(value: string): string | undefined {
  if (!value) return "Create a password.";
  if (value.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (!/[a-zA-Z]/.test(value) || !/\d/.test(value)) return "Include at least one letter and one number.";
}

export function validateConfirm(password: string, confirm: string): string | undefined {
  if (!confirm) return "Re-enter your password.";
  if (password !== confirm) return "Passwords don't match.";
}

/** Only allow same-site relative redirects (prevents open redirects). */
export function safeNext(next: string | null | undefined, fallback = "/home"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}
