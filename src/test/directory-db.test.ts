import { describe, expect, it } from "vitest";
import { supabase } from "@/integrations/supabase/client";

describe("Public directory filters", () => {
  const base = { p_lat: 14.6928, p_lng: -17.4467, p_limit: 200 };
  it("finds the permanent directory by neighborhood and returns distances within 2 km", async () => {
    const { data, error } = await supabase.rpc("search_pharmacy_directory", { ...base, p_search: "Plateau" });
    expect(error).toBeNull(); expect((data ?? []).length).toBeGreaterThan(0);
    const nearby = await supabase.rpc("search_pharmacy_directory", { ...base, p_max_km: 2 });
    expect(nearby.error).toBeNull(); expect((nearby.data ?? []).length).toBeGreaterThan(0);
    expect(nearby.data?.every(p => p.distance_km <= 2)).toBe(true);
  });
  it("only returns pharmacies with a phone for the phone filter", async () => {
    const { data, error } = await supabase.rpc("search_pharmacy_directory", { ...base, p_with_phone: true });
    expect(error).toBeNull(); expect((data ?? []).length).toBeGreaterThan(0);
    expect(data?.every(p => Boolean(p.phone?.trim()))).toBe(true);
  });
  it("returns Guigon during the published 14–21 November rotation and not after it", async () => {
    const current = await supabase.rpc("search_pharmacy_directory", { ...base, p_search: "Guigon", p_on_duty: true, p_at: "2026-11-14T12:00:00Z" });
    expect(current.error).toBeNull(); expect(current.data).toHaveLength(1);
    expect(current.data?.[0]?.opening_hours).toBe("Mo-Sa 07:30-22:30; Su off");
    const expired = await supabase.rpc("search_pharmacy_directory", { ...base, p_search: "Guigon", p_on_duty: true, p_at: "2026-11-23T12:00:00Z" });
    expect(expired.error).toBeNull(); expect(expired.data).toEqual([]);
  });
  it("denies admin directory writes to anonymous callers", async () => {
    const { error } = await supabase.rpc("admin_save_directory", { p_id: "00000000-0000-0000-0000-000000000000", p_data: {} });
    expect(error).not.toBeNull();
  });
});