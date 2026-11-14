import { describe, expect, it } from "vitest";
import { demoMedicinePharmaciesQuery, demoPharmacyStockQuery } from "@/lib/demo-stock";
import { supabase } from "@/integrations/supabase/client";

describe("Soutenance public stocks", () => {
  const medicineId = "7728fa91-11e6-4948-a7fb-369b70ac6510";
  it("returns the eight audited pharmacies for Doliprane with positive indicative stock and prices", async () => {
    const options = demoMedicinePharmaciesQuery(medicineId, 14.6928, -17.4467);
    const { data, error } = await supabase.rpc("demo_pharmacies_with_medicine", { p_medicine_id: medicineId, p_lat: 14.6928, p_lng: -17.4467 });
    expect(error).toBeNull();
    expect(data).toHaveLength(8);
    expect(data?.every(p => p.quantity > 0 && p.price_fcfa > 0 && p.phone?.startsWith("+221"))).toBe(true);
    expect(options.queryKey[0]).toBe("demo-medicine-pharmacies");
  });
  it("orders demo pharmacies by distance from the supplied position", async () => {
    const { data, error } = await supabase.rpc("demo_pharmacies_with_medicine", { p_medicine_id: medicineId, p_lat: 14.6928, p_lng: -17.4467 });
    expect(error).toBeNull();
    const distances = data?.map(p => p.distance_km) ?? [];
    expect(distances.length).toBe(8);
    expect(distances).toEqual([...distances].sort((a,b) => a-b));
  });
  it("keeps demo inventory separate from real stock queries", async () => {
    const id = "fe8c437e-ca9c-4233-a13f-3d3ac829bc27";
    const { data, error } = await supabase.from("pharmacy_demo_stock").select("quantity, price_fcfa").eq("pharmacy_id", id).eq("medicine_id", medicineId);
    expect(error).toBeNull();
    expect(data).toEqual([{ quantity: 24, price_fcfa: 1500 }]);
    expect(demoPharmacyStockQuery(id).queryKey).toEqual(["demo-pharmacy-stock", id]);
    const { data: real, error: realError } = await supabase.rpc("pharmacies_with_medicine", { p_medicine_id: medicineId, p_lat: 14.6928, p_lng: -17.4467, p_limit: 30 });
    expect(realError).toBeNull();
    expect(real).toEqual([]);
  });
});