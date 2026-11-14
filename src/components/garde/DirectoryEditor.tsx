import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { normalizeSenegalPhone, refreshPharmacyViews } from "@/lib/admin-pharmacies";

export function DirectoryEditor({ pharmacy, close }: { pharmacy?: Tables<"pharmacies">; close: () => void }) {
  const client = useQueryClient();
  const [values, setValues] = useState({ name: pharmacy?.name ?? "", address: pharmacy?.address ?? "", city: pharmacy?.city ?? "", region: pharmacy?.region ?? "", department: pharmacy?.department ?? "", commune: pharmacy?.commune ?? "", locality: pharmacy?.locality ?? "", phone: pharmacy?.phone ?? "", habitual_hours: pharmacy?.habitual_hours ?? "", information_source: pharmacy?.information_source ?? "", lat: String(pharmacy?.lat ?? ""), lng: String(pharmacy?.lng ?? ""), validation_status: pharmacy?.validation_status ?? "unverified" });
  const save = useMutation({ mutationFn: async () => {
    const { error } = await supabase.rpc("admin_save_directory", { p_id: pharmacy?.id ?? null, p_data: { ...values, phone: normalizeSenegalPhone(values.phone) } });
    if (error) throw error;
  }, onSuccess: async () => { await refreshPharmacyViews(client); close(); toast.success("Informations enregistrées"); }, onError: (e: Error) => toast.error(e.message) });
  const fields = { name: "Nom", address: "Adresse complète", city: "Ville", region: "Région", department: "Département", commune: "Commune", locality: "Quartier", phone: "Téléphone", habitual_hours: "Horaires habituels", information_source: "Source de l’information", lat: "Latitude exacte", lng: "Longitude exacte" } as const;
  return <form className="space-y-3 border-y border-border py-4" onSubmit={e => { e.preventDefault(); save.mutate(); }}>
    <h3 className="font-bold">{pharmacy ? "Modifier le répertoire" : "Ajouter une pharmacie"}</h3>
    <div className="grid gap-3 md:grid-cols-2">{Object.entries(fields).map(([key, label]) => <label key={key} className="text-sm font-semibold">{label}<Input required={["name","lat","lng"].includes(key)} value={values[key as keyof typeof values]} onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))} /></label>)}</div>
    <label className="block text-sm font-semibold">Validation<select className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3" value={values.validation_status} onChange={e => setValues(v => ({ ...v, validation_status: e.target.value }))}><option value="unverified">Non vérifié</option><option value="source_checked">Source consultée</option><option value="validated">Validé après contrôle</option></select></label>
    <div className="flex gap-2"><Button disabled={save.isPending}>Enregistrer</Button><Button type="button" variant="outline" onClick={close}>Annuler</Button></div>
  </form>;
}