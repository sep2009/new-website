export type ShellUser = { name: string | null; email: string | null };

/** Two-letter avatar initials from a name, falling back to the email prefix. */
export function initials(user: ShellUser) {
  const source = user.name?.trim() || user.email?.split("@")[0] || "?";
  const parts = source.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "")).toUpperCase() || "?";
}
