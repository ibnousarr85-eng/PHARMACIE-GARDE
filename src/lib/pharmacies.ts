import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type NearbyPharmacy = {
  id: string;
  name: string;
  address: string | null;
  locality: string | null;
  city: string | null;
  phone: string | null;
  opening_hours: string | null;
  lat: number;
  lng: number;
  on_duty: boolean;
  on_duty_until: string | null;
  distance_km: number;
};

export type NearbyFilters = {
  lat: number;
  lng: number;
  search?: string;
  maxKm?: number | null;
  onDuty?: boolean;
  withPhone?: boolean;
  limit?: number;
};

export const nearbyPharmaciesQuery = (f: NearbyFilters) =>
  queryOptions({
    queryKey: ["nearby", f],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("nearest_pharmacies", {
        p_lat: f.lat,
        p_lng: f.lng,
        p_search: f.search?.trim() || undefined,
        p_max_km: f.maxKm ?? undefined,
        p_on_duty: f.onDuty ?? false,
        p_with_phone: f.withPhone ?? false,
        p_limit: f.limit ?? 40,
      });
      if (error) throw error;
      return (data ?? []) as NearbyPharmacy[];
    },
  });

export const pharmacyQuery = (id: string) =>
  queryOptions({
    queryKey: ["pharmacy", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("pharmacies").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const pharmacyStockQuery = (id: string) =>
  queryOptions({
    queryKey: ["pharmacy-stock", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pharmacy_stock")
        .select("quantity, price_fcfa, updated_at, medicine:medicines(id, name, dosage, form, package)")
        .eq("pharmacy_id", id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const medicineSearchQuery = (q: string) =>
  queryOptions({
    queryKey: ["medicines", q],
    queryFn: async () => {
      let req = supabase.from("medicines").select("*").order("name").limit(40);
      const term = q.trim();
      if (term) req = req.or(`name.ilike.%${term.replace(/[,()%]/g, " ")}%,category.ilike.%${term.replace(/[,()%]/g, " ")}%`);
      const { data, error } = await req;
      if (error) throw error;
      return data ?? [];
    },
  });

export const medicineQuery = (id: string) =>
  queryOptions({
    queryKey: ["medicine", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("medicines").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export type PharmacyWithMedicine = {
  id: string;
  name: string;
  address: string | null;
  locality: string | null;
  city: string | null;
  phone: string | null;
  lat: number;
  lng: number;
  on_duty: boolean;
  quantity: number;
  price_fcfa: number | null;
  stock_updated_at: string;
  distance_km: number;
};

export const pharmaciesWithMedicineQuery = (medicineId: string, lat: number, lng: number) =>
  queryOptions({
    queryKey: ["med-pharmacies", medicineId, lat, lng],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("pharmacies_with_medicine", {
        p_medicine_id: medicineId,
        p_lat: lat,
        p_lng: lng,
        p_limit: 30,
      });
      if (error) throw error;
      return (data ?? []) as PharmacyWithMedicine[];
    },
  });
