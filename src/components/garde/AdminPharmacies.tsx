import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SearchInput } from "@/components/garde/SearchInput";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { geographicOptionsQuery } from "@/lib/pharmacies";
import { adminPharmaciesQuery, DEFAULT_ADMIN_CITY, normalizeSenegalPhone, refreshPharmacyViews, validateDuty } from "@/lib/admin-pharmacies";

export function AdminPharmacies() {
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [city, setCity] = useState(DEFAULT_ADMIN_CITY);
  const [page, setPage] = useState(0);
  useEffect(() => { const timer = setTimeout(() => { setSearch(text); setPage(0); }, 250); return () => clearTimeout(timer); }, [text]);
  const options = useQuery(geographicOptionsQuery);
  const cities = [...new Set([DEFAULT_ADMIN_CITY, ...(options.data ?? []).flatMap((row) => row.city ? [row.city] : [])])].sort((a, b) => a.localeCompare(b, "fr"));
  const { data, isPending, error, refetch } = useQuery(adminPharmaciesQuery(search, city, page));
  return <section className="space-y-4">
    <SearchInput aria-label="Rechercher par nom ou ville" placeholder="Nom de pharmacie ou ville…" value={text} onChange={(e) => setText(e.target.value)} />
    <label className="block text-sm font-semibold">Ville
      <select aria-label="Ville des pharmacies" className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3 text-foreground" value={city} onChange={(e) => { setCity(e.target.value); setPage(0); }}>
        <option value="">Toutes les villes</option>{cities.map((name) => <option key={name}>{name}</option>)}
      </select>
    </label>
    {isPending && <Loader2 className="mx-auto animate-spin text-primary" />}
    {error && <div role="alert" className="text-destructive">Impossible de charger les pharmacies. <Button variant="outline" onClick={() => refetch()}>Réessayer</Button></div>}
    {data && <p className="text-sm text-muted-foreground">{data.total} pharmacie(s)</p>}
    {data?.total === 0 && <p>Aucune pharmacie trouvée.</p>}
    <div className="space-y-4">{data?.rows.map((p) => <AdminPharmacyCard key={p.id} pharmacy={p} />)}</div>
    {data && data.total > 20 && <div className="flex items-center justify-between gap-2">
      <Button variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Précédent</Button>
      <span className="text-sm">{page + 1} / {Math.ceil(data.total / 20)}</span>
      <Button variant="outline" disabled={(page + 1) * 20 >= data.total} onClick={() => setPage(page + 1)}>Suivant</Button>
    </div>}
  </section>;
}

function AdminPharmacyCard({ pharmacy: p }: { pharmacy: Tables<"pharmacies"> }) {
  const client = useQueryClient();
  const [phone, setPhone] = useState(p.phone ?? "");
  const [hours, setHours] = useState(p.opening_hours ?? "");
  const [editingDuty, setEditingDuty] = useState(false);
  const [publication, setPublication] = useState(p.duty_publication ?? "");
  const [starts, setStarts] = useState("");
  const [until, setUntil] = useState("");
  const [verified, setVerified] = useState(false);
  const onDuty = p.is_on_duty && (!p.on_duty_until || new Date(p.on_duty_until).getTime() > Date.now());
  const update = useMutation({
    mutationFn: async (kind: "contact" | "activate" | "disable") => {
      const args = kind === "contact" ? { p_update_contact: true, p_phone: normalizeSenegalPhone(phone) ?? "", p_opening_hours: hours.trim() }
        : kind === "activate" ? { p_on_duty: true, ...validateDuty(publication, starts, until, verified) } : { p_on_duty: false };
      const { error } = await supabase.rpc("admin_update_pharmacy", { p_id: p.id, ...args });
      if (error) throw error;
      return kind;
    },
    onSuccess: async (kind) => {
      if (kind !== "contact") setEditingDuty(false);
      await refreshPharmacyViews(client);
      toast.success(kind === "contact" ? "Coordonnées enregistrées" : kind === "activate" ? "Garde publiée" : "Garde désactivée");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  return <article className="rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-card)]">
    <h2 className="break-words text-lg font-bold">{p.name}</h2>
    <p className="text-sm text-muted-foreground">{p.address || "Adresse non renseignée"}</p>
    <p className="text-sm text-muted-foreground">{p.city || "Ville non renseignée"}</p>
    <p className="mt-1 text-sm">Tél. : {p.phone || "Non renseigné"}</p>
    <Link to="/pharmacies/$id" params={{ id: p.id }} className="text-sm font-semibold text-primary">Voir la fiche</Link>
    <div className="my-4 flex items-center justify-between gap-3">
      <span className="font-semibold">De garde</span>
      <Switch aria-label={`De garde — ${p.name}`} checked={onDuty} disabled={update.isPending} onCheckedChange={(checked) => checked ? setEditingDuty(true) : update.mutate("disable")} />
    </div>
    {onDuty && p.on_duty_until && <p className="mb-3 text-sm text-muted-foreground">Jusqu’au {new Date(p.on_duty_until).toLocaleString("fr-FR")}</p>}
    {editingDuty && <form className="mb-4 space-y-3 border-y border-border py-4" onSubmit={(e) => { e.preventDefault(); update.mutate("activate"); }}>
      <label className="block text-sm font-semibold">Publication de garde vérifiée<Input required value={publication} onChange={(e) => setPublication(e.target.value)} placeholder="Lien ou référence de la publication" /></label>
      <label className="block text-sm font-semibold">Début de garde<Input type="datetime-local" required value={starts} onChange={(e) => setStarts(e.target.value)} /></label>
      <label className="block text-sm font-semibold">Fin de garde<Input type="datetime-local" required value={until} onChange={(e) => setUntil(e.target.value)} /></label>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} required className="mt-1" />Je confirme que cette pharmacie et ces dates figurent dans la publication vérifiée.</label>
      <div className="flex flex-wrap gap-2"><Button disabled={update.isPending} type="submit">Activer la garde</Button><Button type="button" variant="outline" onClick={() => setEditingDuty(false)}>Annuler</Button></div>
    </form>}
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); update.mutate("contact"); }}>
      <label className="block text-sm font-semibold">Téléphone<Input type="tel" aria-label={`Téléphone — ${p.name}`} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+221 33 000 00 00" /></label>
      <label className="block text-sm font-semibold">Horaires d’ouverture<Input aria-label={`Horaires — ${p.name}`} value={hours} onChange={(e) => setHours(e.target.value)} /></label>
      <Button type="submit" disabled={update.isPending} className="w-full"><Save className="h-4 w-4" />Enregistrer les coordonnées</Button>
    </form>
  </article>;
}