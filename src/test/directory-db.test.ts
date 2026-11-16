import { describe, expect, it } from "vitest";
import { supabase } from "@/integrations/supabase/client";

describe("Public directory filters", () => {
  const base = { p_lat: 14.6928, p_lng: -17.4467, p_limit: 200 };
  it("exposes the sourced Fatou Ideu phone and complete schedule through all three Ouest Foire categories", async () => {
    const position = { p_lat: 14.7445, p_lng: -17.468, p_limit: 200 };
    for (const filter of [{}, { p_max_km: 2 }, { p_with_phone: true }]) {
      const { data, error } = await supabase.rpc("search_pharmacy_directory", { ...position, ...filter });
      expect(error).toBeNull();
      const pharmacy = data?.find(p => p.id === "c34bff31-999b-49a0-a8af-eae0494d7683");
      expect(pharmacy?.phone).toBe("+221338278720");
      expect(pharmacy?.opening_hours).toBe("Ouvert tous les jours, 7h – 23h.");
      expect(pharmacy?.address).toBe("Rue GY 316, Grand Yoff, Dakar");
    }
  });
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
  it("finds both newly sourced DIMO pharmacies without inventing Chifaoun habitual hours", async () => {
    for (const name of ["Pharmacie Cheikh Marie Saliou", "Pharmacie Chifaoun"]) {
      const { data, error } = await supabase.rpc("search_pharmacy_directory", { ...base, p_search: name, p_on_duty: true, p_at: "2026-11-14T12:00:00Z" });
      expect(error).toBeNull(); expect(data).toHaveLength(1);
      expect(data?.[0]?.phone).toBe(name.includes("Chifaoun") ? "+221338231313" : "+221338221674");
      if (name.includes("Chifaoun")) expect(data?.[0]?.opening_hours).toBeNull();
    }
  });
  it("completes the sourced active directory phones and preserves unavailable habitual schedules", async () => {
    const { data, error } = await supabase.rpc("search_pharmacy_directory", { ...base, p_on_duty: true, p_at: "2026-11-14T12:00:00Z" });
    expect(error).toBeNull(); expect((data ?? []).length).toBeGreaterThanOrEqual(33);
    expect(data?.every(p => /^\+221\d{9}$/.test(p.phone ?? ""))).toBe(true);
    expect(data?.every(p => Boolean(p.address?.trim()))).toBe(true);
    const shelter = data?.find(p => p.name === "Pharmacie Shelter");
    expect(shelter?.phone).toBe("+221338274329");
    expect(shelter?.opening_hours).toBe("Lun-Sam 08h–23h ; Dim fermé");
    expect(data?.find(p => p.name === "Pharmacie Principale")?.phone).toBe("+221338346923");
    expect(data?.find(p => p.name === "Pharmacie Principale")?.opening_hours).toBeNull();
    expect(data?.find(p => p.name === "Pharmacie Sud Foire")?.opening_hours).toBeNull();
  });
});