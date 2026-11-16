export type Preferences = {
  notify_on_this_day: boolean;
  notify_future_messages: boolean;
  notify_account: boolean;
  /** Include place names when sharing a memory. Off by default. */
  share_location: boolean;
  default_view: "grid" | "list";
  reduce_motion: boolean;
};

export const DEFAULT_PREFS: Preferences = {
  notify_on_this_day: true,
  notify_future_messages: true,
  notify_account: true,
  share_location: false,
  default_view: "grid",
  reduce_motion: false,
};

/** People under 18 get stricter, locked privacy defaults. Birth year is optional. */
export function ageFromBirthYear(birthYear: number | null | undefined, now = new Date()): number | null {
  if (!birthYear) return null;
  return now.getFullYear() - birthYear;
}

export function isUnder18(birthYear: number | null | undefined, now = new Date()): boolean {
  const age = ageFromBirthYear(birthYear, now);
  return age !== null && age < 18;
}
