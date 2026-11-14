export type DutyPeriod = { starts_at: string; ends_at: string; validation_status: string };
export function activeDuty<T extends DutyPeriod>(rotations: T[], at = Date.now()) {
  return rotations.filter(r => ["source_checked", "validated"].includes(r.validation_status) && Date.parse(r.starts_at) <= at && at < Date.parse(r.ends_at))
    .sort((a,b) => Date.parse(b.starts_at)-Date.parse(a.starts_at))[0] ?? null;
}
export function validateRotation(source: string, starts: string, ends: string) {
  const start = Date.parse(starts), end = Date.parse(ends);
  if (!source.trim() || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) throw new Error("Source et période valides requises.");
  return { p_source: source.trim(), p_starts_at: new Date(start).toISOString(), p_ends_at: new Date(end).toISOString() };
}