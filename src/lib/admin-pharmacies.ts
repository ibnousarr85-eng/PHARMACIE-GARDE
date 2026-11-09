import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const DEFAULT_ADMIN_CITY = "Dakar";
export function normalizeSenegalPhone(value: string) {
  const compact = value.replace(/[\s().-]/g, "");
  if (!compact) return null;
  const phone = /^\d{9}$/.test(compact) ? `+221${compact}` : compact.replace(/^00221/, "+221");
  if (!/^\+221\d{9}$/.test(phone)) throw new Error("Numéro Sénégal attendu : +221 et neuf chiffres.");
  return phone;
}
export function validateDuty(publication: string, starts: string, until: string, verified: boolean, now = Date.now()) {
  if (!verified || !publication.trim()) throw new Error("Confirmez la publication de garde vérifiée.");
  const start = new Date(starts).getTime();
  const end = new Date(until).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > now || end <= now || end <= start)
    throw new Error("La période publiée doit inclure la date actuelle.");
  return { p_publication: publication.trim(), p_starts_at: new Date(start).toISOString(), p_until: new Date(end).toISOString() };
}
export const adminPharmaciesQuery = (search: string, city: string, page: number) => queryOptions({
  queryKey: ["admin-pharmacies", search, city, page],
  queryFn: async () => {
    let request = supabase.from("pharmacies").select("*", { count: "exact" }).order("name").order("id");
    if (city) request = request.eq("city", city);
    const term = search.trim().replace(/[,()%_\\]/g, " ");
    if (term) request = request.or(`name.ilike.%${term}%,city.ilike.%${term}%`);
    const { data, error, count } = await request.range(page * 20, page * 20 + 19);
    if (error) throw error;
    return { rows: data ?? [], total: count ?? 0 };
  },
});
export async function refreshPharmacyViews(client: QueryClient) {
  await Promise.all(["admin-pharmacies", "nearby", "pharmacy", "my-pharmacy", "med-pharmacies"].map((key) => client.invalidateQueries({ queryKey: [key] })));
}