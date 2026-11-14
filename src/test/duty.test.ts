import { describe, expect, it } from "vitest";
import { activeDuty, validateRotation } from "@/lib/duty";

const rotation = { starts_at: "2026-11-14T00:00:00Z", ends_at: "2026-11-22T00:00:00Z", validation_status: "source_checked" };
describe("Separate duty rotations", () => {
  it("includes the published start and excludes the end of a duty period", () => {
    expect(activeDuty([rotation], Date.parse("2026-11-14T00:00:00Z"))).toEqual(rotation);
    expect(activeDuty([rotation], Date.parse("2026-11-13T23:59:59Z"))).toBeNull();
    expect(activeDuty([rotation], Date.parse("2026-11-22T00:00:00Z"))).toBeNull();
  });
  it("does not display cancelled or unverified rotations as active", () => {
    const now = Date.parse("2026-11-14T12:00:00Z");
    expect(activeDuty([{ ...rotation, validation_status: "cancelled" }], now)).toBeNull();
    expect(activeDuty([{ ...rotation, validation_status: "unverified" }], now)).toBeNull();
  });
  it("permits historical and future rotations but requires source and valid dates", () => {
    expect(validateRotation("DIMO", "2026-11-14T00:00:00Z", "2026-11-22T00:00:00Z").p_source).toBe("DIMO");
    expect(()=>validateRotation("", rotation.starts_at, rotation.ends_at)).toThrow();
    expect(()=>validateRotation("DIMO", rotation.ends_at, rotation.starts_at)).toThrow();
  });
});