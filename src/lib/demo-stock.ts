import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const demoMedicinePharmaciesQuery = (medicineId: string, lat: number, lng: number) =>
  queryOptions({
    queryKey: ["demo-medicine-pharmacies", medicineId, lat, lng],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("demo_pharmacies_with_medicine", {
        p_medicine_id: medicineId, p_lat: lat, p_lng: lng,
      });
      if (error) throw error;
      return data ?? [];
    },
  });

export const demoPharmacyStockQuery = (id: string) => queryOptions({
  queryKey: ["demo-pharmacy-stock", id],
  queryFn: async () => {
    const { data, error } = await supabase.from("pharmacy_demo_stock")
      .select("quantity, price_fcfa, medicine:medicines(id, name, dosage, form)")
      .eq("pharmacy_id", id);
    if (error) throw error;
    return data ?? [];
  },
});