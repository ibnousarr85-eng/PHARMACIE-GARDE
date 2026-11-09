import { describe, expect, it, vi } from "vitest";
import { DEFAULT_ADMIN_CITY, normalizeSenegalPhone, validateDuty, refreshPharmacyViews } from "@/lib/admin-pharmacies";
import { QueryClient } from "@tanstack/react-query";

describe("Admin pharmacy rules", () => {
  it("defaults the city filter to Dakar", () => expect(DEFAULT_ADMIN_CITY).toBe("Dakar"));
  it("normalizes Senegal phones to +221 and nine digits", () => {
    expect(normalizeSenegalPhone("33 823 03 33")).toBe("+221338230333");
    expect(normalizeSenegalPhone("00221 33 823 03 33")).toBe("+221338230333");
    expect(() => normalizeSenegalPhone("+33 123456789")).toThrow();
  });
  it("allows a missing phone", () => expect(normalizeSenegalPhone("")).toBeNull());
  const now = Date.parse("2026-11-09T19:42:00Z");
  it("requires a verified publication", () => {
    expect(() => validateDuty("", "2026-11-09", "2026-11-16", true, now)).toThrow();
    expect(() => validateDuty("Publication", "2026-11-09", "2026-11-16", false, now)).toThrow();
  });
  it("only activates a current nonexpired published period", () => {
    expect(validateDuty("Publication", "2026-11-09T00:00:00Z", "2026-11-16T00:00:00Z", true, now).p_until).toBe("2026-11-16T00:00:00.000Z");
    expect(() => validateDuty("Publication", "2026-11-01", "2026-11-08", true, now)).toThrow();
    expect(() => validateDuty("Publication", "2026-11-10", "2026-11-16", true, now)).toThrow();
  });
  it("refreshes both public lists and pharmacy detail after edits", async () => {
    const client = new QueryClient();
    const spy = vi.spyOn(client, "invalidateQueries");
    await refreshPharmacyViews(client);
    expect(spy).toHaveBeenCalledWith({ queryKey: ["nearby"] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ["pharmacy"] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ["admin-pharmacies"] });
  });
});