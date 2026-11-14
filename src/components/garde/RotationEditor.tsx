import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { refreshPharmacyViews } from "@/lib/admin-pharmacies";
import { validateRotation } from "@/lib/duty";
import { formatDateTime } from "@/lib/format";

export function RotationEditor({ pharmacyId }: { pharmacyId: string }) {
  const client = useQueryClient();
  const [edit, setEdit] = useState<Tables<"duty_rotations"> | "new" | null>(null);
  const [starts, setStarts] = useState(""); const [ends, setEnds] = useState(""); const [hours, setHours] = useState(""); const [source, setSource] = useState(""); const [status, setStatus] = useState("source_checked");
  const history = useQuery({ queryKey: ["duty-rotations", pharmacyId], queryFn: async () => {
    const { data, error } = await supabase.from("duty_rotations").select("*").eq("pharmacy_id", pharmacyId).order("starts_at", { ascending: false }); if(error) throw error; return data ?? [];
  }});
  const save = useMutation({ mutationFn: async () => {
    const { error } = await supabase.rpc("admin_save_rotation", { p_id: edit && edit !== "new" ? edit.id : "00000000-0000-0000-0000-000000000000", p_pharmacy_id: pharmacyId, ...validateRotation(source, starts.endsWith("Z") ? starts : `${starts}Z`, ends.endsWith("Z") ? ends : `${ends}Z`), p_duty_hours: hours.trim(), p_status: status }); if(error) throw error;
  }, onSuccess: async () => { setEdit(null); await refreshPharmacyViews(client); toast.success("Rotation enregistrée"); }, onError: (e: Error) => toast.error(e.message) });
  const open = (r: Tables<"duty_rotations"> | "new") => { setEdit(r); setStarts(r === "new" ? "" : r.starts_at.slice(0,16)); setEnds(r === "new" ? "" : r.ends_at.slice(0,16)); setHours(r === "new" ? "" : r.duty_hours ?? ""); setSource(r === "new" ? "" : r.source); setStatus(r === "new" ? "source_checked" : r.validation_status); };
  return <section className="my-4 border-t border-border pt-4">
    <h3 className="font-bold">Historique des rotations</h3>
    {history.isError && <p role="alert" className="text-destructive">Impossible de charger les rotations.</p>}
    {history.data?.map(r => <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-3 text-sm"><div>Du {formatDateTime(r.starts_at)} au {formatDateTime(r.ends_at)}<br />Horaires de garde : {r.duty_hours || "Non renseigné"}<br />{r.source}<br />{r.validation_status === "cancelled" ? "Annulée" : r.validation_status === "validated" ? "Validée" : "Source consultée — non confirmée officiellement"}</div><Button variant="outline" onClick={() => open(r)}>Modifier la rotation</Button></div>)}
    <Button variant="outline" className="mt-3" onClick={() => open("new")}>Ajouter une période de garde</Button>
    {edit && <form className="mt-4 space-y-3" onSubmit={e => { e.preventDefault(); save.mutate(); }}>
      <label className="block text-sm font-semibold">Début (UTC)<Input type="datetime-local" required value={starts} onChange={e=>setStarts(e.target.value)} /></label>
      <label className="block text-sm font-semibold">Fin (UTC)<Input type="datetime-local" required value={ends} onChange={e=>setEnds(e.target.value)} /></label>
      <label className="block text-sm font-semibold">Horaires de garde<Input value={hours} onChange={e=>setHours(e.target.value)} placeholder="Non renseigné" /></label>
      <label className="block text-sm font-semibold">Source de la rotation<Input required value={source} onChange={e=>setSource(e.target.value)} /></label>
      <label className="block text-sm font-semibold">Validation<select className="h-11 w-full rounded-lg border border-border bg-background px-3" value={status} onChange={e=>setStatus(e.target.value)}><option value="source_checked">Source consultée</option><option value="validated">Validée après contrôle</option><option value="cancelled">Annulée</option></select></label>
      <div className="flex gap-2"><Button disabled={save.isPending}>Enregistrer la rotation</Button><Button type="button" variant="outline" onClick={()=>setEdit(null)}>Annuler</Button></div>
    </form>}
  </section>;
}