import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatHours } from "@/lib/format";

export function DirectoryCandidates() {
  const query = useQuery({ queryKey: ["directory-candidates"], queryFn: async () => {
    const { data, error } = await supabase.from("pharmacy_directory_candidates").select("*").order("name"); if(error) throw error; return data ?? [];
  }});
  return <details className="border-y border-border py-4">
    <summary className="cursor-pointer font-semibold">Informations à contrôler ({query.data?.length ?? 0})</summary>
    {query.isError && <p role="alert" className="mt-3 text-destructive">Impossible de charger les propositions.</p>}
    <ul className="mt-3 divide-y divide-border">{query.data?.map(c => <li key={c.id} className="py-3 text-sm"><p className="font-bold">{c.name} — {c.city || "Non renseigné"}</p><p>{c.address || c.locality || "Non renseigné"} · {c.phone || "Non renseigné"}</p><p>Horaires habituels annoncés : {formatHours(c.habitual_hours) || "Non renseigné"}</p><p className="text-muted-foreground">{c.source} · Non validé</p><p className="text-xs text-muted-foreground">{c.note}</p></li>)}</ul>
  </details>;
}