import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Clock, Loader2, LocateFixed, LogOut, Plus, Save, ShieldCheck, Trash2, XCircle } from "lucide-react";
import { AppShell, BackLink } from "@/components/garde/AppShell";
import { SearchInput } from "@/components/garde/SearchInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_LOCATION, useUserLocation } from "@/lib/location";
import { medicineSearchQuery, nearbyPharmaciesQuery, pharmacyStockQuery } from "@/lib/pharmacies";
import { formatDistance } from "@/lib/format";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/espace-pharmacien")({
  head: () => ({
    meta: [
      { title: "Espace pharmacien — GARDE" },
      { name: "description", content: "Mettez à jour le stock de médicaments et la garde de votre pharmacie." },
      { property: "og:title", content: "Espace pharmacien — GARDE" },
      { property: "og:description", content: "Gérez votre pharmacie sur GARDE." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

type Pharmacy = Tables<"pharmacies">;
type PharmacyRequest = Tables<"pharmacy_requests"> & { pharmacy: { name: string; city: string | null } | null };

export function useIsAdmin(userId: string) {
  return useQuery({
    queryKey: ["is-admin", userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
      if (error) throw error;
      return data === true;
    },
  });
}

function Dashboard() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: isAdmin } = useIsAdmin(user.id);
  const { data: pharmacy, isLoading } = useQuery({
    queryKey: ["my-pharmacy", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("pharmacies").select("*").eq("owner_id", user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const { data: request, isLoading: loadingRequest } = useQuery({
    queryKey: ["my-request", user.id],
    enabled: !isLoading && !pharmacy,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pharmacy_requests")
        .select("*, pharmacy:pharmacies(name, city)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as PharmacyRequest | null;
    },
  });

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <AppShell>
      <div className="flex items-center justify-between gap-3">
        <BackLink to="/" />
        <button type="button" onClick={signOut} className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground">
          <LogOut className="h-4 w-4" /> Déconnexion
        </button>
      </div>
      <h1 className="mt-3 text-[28px] font-extrabold tracking-tight text-foreground">Espace pharmacien</h1>
      <p className="mb-5 truncate text-sm text-muted-foreground">{user.email}</p>

      {isAdmin && (
        <Link
          to="/admin"
          className="mb-5 flex items-center gap-3 rounded-3xl border border-primary/30 bg-secondary p-4 font-semibold text-secondary-foreground"
        >
          <ShieldCheck className="h-6 w-6 shrink-0" />
          <span className="min-w-0 flex-1">Administration : valider les demandes des pharmaciens</span>
          <span aria-hidden>→</span>
        </Link>
      )}

      {isLoading || (!pharmacy && loadingRequest) ? (
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
      ) : pharmacy ? (
        <ManagePharmacy pharmacy={pharmacy} />
      ) : request?.status === "pending" ? (
        <PendingRequest request={request} userId={user.id} />
      ) : (
        <>
          {request?.status === "rejected" && (
            <div className="mb-5 rounded-3xl border border-destructive/30 bg-destructive/5 p-5">
              <p className="flex items-center gap-2 font-bold text-destructive">
                <XCircle className="h-5 w-5" /> Demande refusée
              </p>
              <p className="mt-1 text-sm text-foreground/85">
                {request.admin_note ?? "Votre dernière demande n'a pas été validée."} Vous pouvez envoyer une nouvelle demande.
              </p>
            </div>
          )}
          <RequestPharmacy userId={user.id} />
        </>
      )}
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5 rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <h2 className="mb-4 text-lg font-bold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

/* ---------- Pending request ---------- */

function PendingRequest({ request, userId }: { request: PharmacyRequest; userId: string }) {
  const qc = useQueryClient();
  const cancel = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("pharmacy_requests").delete().eq("id", request.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Demande annulée");
      qc.invalidateQueries({ queryKey: ["my-request", userId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const name = request.pharmacy?.name ?? request.name;
  return (
    <div className="rounded-3xl bg-secondary p-5">
      <p className="flex items-center gap-2 text-sm font-semibold text-secondary-foreground">
        <Clock className="h-4 w-4" /> Demande en attente de validation
      </p>
      <p className="mt-1 text-2xl font-extrabold text-foreground">{name}</p>
      <p className="mt-2 text-sm text-foreground/85">
        Un administrateur GARDE vérifie que vous êtes bien responsable de cette officine. Vous pourrez gérer le stock et la
        garde dès que votre demande sera validée.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Envoyée le {new Date(request.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
      </p>
      <Button variant="outline" onClick={() => cancel.mutate()} disabled={cancel.isPending} className="mt-4 w-full rounded-xl">
        Annuler la demande
      </Button>
    </div>
  );
}

/* ---------- Request an existing pharmacy or a new one ---------- */

function useSubmitRequest(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Omit<Tables<"pharmacy_requests">, "id" | "user_id" | "contact_email" | "status" | "admin_note" | "reviewed_by" | "reviewed_at" | "created_at"> | { pharmacy_id: string; message: string | null }) => {
      const { error } = await supabase.from("pharmacy_requests").insert(row as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Demande envoyée. Un administrateur va la vérifier.");
      qc.invalidateQueries({ queryKey: ["my-request", userId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

function RequestPharmacy({ userId }: { userId: string }) {
  const { location, requestGps } = useUserLocation();
  const loc = location ?? DEFAULT_LOCATION;
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);
  const { data } = useQuery(nearbyPharmaciesQuery({ lat: loc.lat, lng: loc.lng, search: debounced, limit: 15 }));
  const submit = useSubmitRequest(userId);

  return (
    <>
      <div className="mb-5 rounded-3xl bg-secondary p-5 text-sm text-foreground/85">
        Pour protéger les patients, chaque pharmacien est vérifié par un administrateur GARDE avant de pouvoir gérer une
        officine.
      </div>
      <Section title="Vos informations pour la vérification">
        <Label htmlFor="verif">Numéro d'inscription à l'Ordre, téléphone, fonction…</Label>
        <Textarea
          id="verif"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ex : Dr Awa Ndiaye, pharmacienne titulaire, Ordre n° …, joignable au 77 …"
          className="mt-1 min-h-24 rounded-xl"
        />
      </Section>
      <Section title="1. Trouvez votre pharmacie">
        <p className="mb-3 text-sm text-muted-foreground">
          Recherchez votre officine parmi les pharmacies du Sénégal déjà référencées, puis demandez à la gérer.
        </p>
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom de votre pharmacie…" />
        <button type="button" onClick={() => requestGps()} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary">
          <LocateFixed className="h-4 w-4" /> Chercher autour de ma position
        </button>
        <ul className="mt-3 divide-y divide-border">
          {data?.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {p.address ?? p.city} · {formatDistance(p.distance_km)}
                </p>
              </div>
              <Button
                size="sm"
                disabled={submit.isPending}
                onClick={() => submit.mutate({ pharmacy_id: p.id, message: message.trim() || null })}
                className="shrink-0 rounded-xl"
              >
                C'est la mienne
              </Button>
            </li>
          ))}
        </ul>
      </Section>
      <AddPharmacy message={message} submit={submit} />
    </>
  );
}

function AddPharmacy({ message, submit }: { message: string; submit: ReturnType<typeof useSubmitRequest> }) {
  const { location, requestGps, locating } = useUserLocation();
  const [form, setForm] = useState({ name: "", address: "", city: "", phone: "", opening_hours: "" });

  return (
    <Section title="2. Elle n'est pas dans la liste ? Proposez-la">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!location || location.source !== "gps") {
            toast.error("Activez le GPS depuis votre pharmacie pour la positionner.");
            return;
          }
          submit.mutate({
            pharmacy_id: null,
            name: form.name.trim(),
            address: form.address.trim() || null,
            city: form.city.trim() || null,
            phone: form.phone.trim() || null,
            opening_hours: form.opening_hours.trim() || null,
            lat: location.lat,
            lng: location.lng,
            message: message.trim() || null,
          });
        }}
        className="space-y-3"
      >
        <Field label="Nom de la pharmacie" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <Field label="Adresse" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
        <Field label="Ville" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
        <Field label="Téléphone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+221 33 …" />
        <Field
          label="Horaires habituels"
          value={form.opening_hours}
          onChange={(v) => setForm({ ...form, opening_hours: v })}
          placeholder="Lun-Sam 08:00-21:00"
        />
        <Button type="button" variant="outline" onClick={() => requestGps()} className="w-full rounded-xl">
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
          {location?.source === "gps" ? "Position GPS enregistrée ✓" : "Enregistrer la position GPS (sur place)"}
        </Button>
        <Button type="submit" disabled={submit.isPending || !form.name.trim()} className="h-12 w-full rounded-2xl font-bold">
          Envoyer ma demande
        </Button>
      </form>
    </Section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="h-11 rounded-xl" {...rest} />
    </div>
  );
}

/* ---------- Manage pharmacy ---------- */

function ManagePharmacy({ pharmacy }: { pharmacy: Pharmacy }) {
  return (
    <>
      <div className="mb-5 rounded-3xl bg-secondary p-5">
        <p className="text-sm font-semibold text-secondary-foreground">Votre pharmacie</p>
        <p className="text-2xl font-extrabold text-foreground">{pharmacy.name}</p>
        <Link to="/pharmacies/$id" params={{ id: pharmacy.id }} className="text-sm font-semibold text-primary">
          Voir la fiche publique →
        </Link>
      </div>
      <DutyCard pharmacy={pharmacy} />
      <StockManager pharmacyId={pharmacy.id} />
      <InfoForm pharmacy={pharmacy} />
    </>
  );
}

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function DutyCard({ pharmacy }: { pharmacy: Pharmacy }) {
  const qc = useQueryClient();
  const [onDuty, setOnDuty] = useState(pharmacy.is_on_duty);
  const [until, setUntil] = useState(toLocalInput(pharmacy.on_duty_until));
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("pharmacies")
        .update({ is_on_duty: onDuty, on_duty_until: onDuty && until ? new Date(until).toISOString() : null })
        .eq("id", pharmacy.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Statut de garde mis à jour");
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Section title="Pharmacie de garde">
      <div className="flex items-center justify-between">
        <Label htmlFor="duty">Nous sommes de garde</Label>
        <Switch id="duty" checked={onDuty} onCheckedChange={setOnDuty} />
      </div>
      {onDuty && (
        <div className="mt-3 space-y-1">
          <Label>Jusqu'à</Label>
          <Input type="datetime-local" value={until} onChange={(e) => setUntil(e.target.value)} className="h-11 rounded-xl" />
        </div>
      )}
      <Button onClick={() => save.mutate()} disabled={save.isPending} className="mt-4 w-full rounded-xl">
        Enregistrer
      </Button>
    </Section>
  );
}

function InfoForm({ pharmacy }: { pharmacy: Pharmacy }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: pharmacy.name,
    address: pharmacy.address ?? "",
    city: pharmacy.city ?? "",
    phone: pharmacy.phone ?? "",
    opening_hours: pharmacy.opening_hours ?? "",
  });
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("pharmacies")
        .update({
          name: form.name.trim() || pharmacy.name,
          address: form.address.trim() || null,
          city: form.city.trim() || null,
          phone: form.phone.trim() || null,
          opening_hours: form.opening_hours.trim() || null,
        })
        .eq("id", pharmacy.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Informations mises à jour");
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Section title="Informations de la pharmacie">
      <div className="space-y-3">
        <Field label="Nom" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <Field label="Adresse" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
        <Field label="Ville" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
        <Field label="Téléphone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <Field label="Horaires habituels" value={form.opening_hours} onChange={(v) => setForm({ ...form, opening_hours: v })} />
        <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full rounded-xl">
          Enregistrer
        </Button>
      </div>
    </Section>
  );
}

function StockManager({ pharmacyId }: { pharmacyId: string }) {
  const qc = useQueryClient();
  const { data: stock } = useQuery(pharmacyStockQuery(pharmacyId));
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["pharmacy-stock", pharmacyId] });
    qc.invalidateQueries({ queryKey: ["med-pharmacies"] });
  };

  return (
    <Section title="Stock de médicaments">
      <p className="mb-3 text-sm text-muted-foreground">
        Mettez à jour les quantités dès que vous renouvelez votre stock : les patients voient la date de mise à jour.
      </p>
      {stock && stock.length === 0 && <p className="mb-3 text-sm text-muted-foreground">Aucun médicament enregistré.</p>}
      <ul className="mb-4 divide-y divide-border">
        {stock?.map((s) => (
          <StockRow key={s.medicine!.id} pharmacyId={pharmacyId} row={s} onChange={refresh} />
        ))}
      </ul>
      <AddStock pharmacyId={pharmacyId} onAdded={refresh} existing={new Set(stock?.map((s) => s.medicine!.id))} />
    </Section>
  );
}

type StockRowData = {
  quantity: number;
  price_fcfa: number | null;
  updated_at: string;
  medicine: { id: string; name: string; dosage: string | null; form: string | null } | null;
};

function StockRow({ pharmacyId, row, onChange }: { pharmacyId: string; row: StockRowData; onChange: () => void }) {
  const [qty, setQty] = useState(String(row.quantity));
  const [price, setPrice] = useState(row.price_fcfa != null ? String(row.price_fcfa) : "");
  const m = row.medicine!;
  const save = async () => {
    const quantity = Math.max(0, parseInt(qty, 10) || 0);
    const { error } = await supabase
      .from("pharmacy_stock")
      .update({ quantity, price_fcfa: price ? Math.max(0, parseInt(price, 10) || 0) : null })
      .eq("pharmacy_id", pharmacyId)
      .eq("medicine_id", m.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Stock mis à jour");
      onChange();
    }
  };
  const remove = async () => {
    const { error } = await supabase.from("pharmacy_stock").delete().eq("pharmacy_id", pharmacyId).eq("medicine_id", m.id);
    if (error) toast.error(error.message);
    else onChange();
  };
  return (
    <li className="py-3">
      <p className="font-semibold text-foreground">
        {m.name} {m.dosage && m.dosage !== "—" ? m.dosage : ""} <span className="text-xs font-normal text-muted-foreground">{m.form}</span>
      </p>
      <div className="mt-2 flex items-end gap-2">
        <div className="flex-1">
          <Label className="text-xs">Quantité</Label>
          <Input type="number" min={0} value={qty} onChange={(e) => setQty(e.target.value)} className="h-10 rounded-xl" />
        </div>
        <div className="flex-1">
          <Label className="text-xs">Prix (FCFA)</Label>
          <Input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} className="h-10 rounded-xl" />
        </div>
        <Button size="icon" onClick={save} aria-label="Enregistrer" className="h-10 w-10 rounded-xl">
          <Save className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="outline" onClick={remove} aria-label="Retirer" className="h-10 w-10 rounded-xl">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}

function AddStock({ pharmacyId, onAdded, existing }: { pharmacyId: string; onAdded: () => void; existing: Set<string> }) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selected, setSelected] = useState<Tables<"medicines"> | null>(null);
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [creating, setCreating] = useState(false);
  const [newMed, setNewMed] = useState({ name: "", dosage: "", form: "", package: "" });

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);
  const { data: meds } = useQuery({ ...medicineSearchQuery(debounced), enabled: debounced.length > 1 && !selected });

  const add = async () => {
    if (!selected) return;
    const { error } = await supabase.from("pharmacy_stock").upsert({
      pharmacy_id: pharmacyId,
      medicine_id: selected.id,
      quantity: Math.max(0, parseInt(qty, 10) || 0),
      price_fcfa: price ? Math.max(0, parseInt(price, 10) || 0) : null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Médicament ajouté au stock");
    setSelected(null);
    setQ("");
    setQty("");
    setPrice("");
    onAdded();
  };

  const createMedicine = async () => {
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("medicines")
      .insert({
        name: newMed.name.trim(),
        dosage: newMed.dosage.trim() || null,
        form: newMed.form.trim() || null,
        package: newMed.package.trim() || null,
        created_by: u.user?.id ?? null,
      })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setSelected(data);
    setCreating(false);
    setNewMed({ name: "", dosage: "", form: "", package: "" });
  };

  return (
    <div className="rounded-2xl bg-muted p-4">
      <p className="mb-2 flex items-center gap-1 font-semibold text-foreground">
        <Plus className="h-4 w-4" /> Ajouter un médicament
      </p>
      {selected ? (
        <div className="space-y-2">
          <p className="text-sm">
            <span className="font-semibold">{selected.name} {selected.dosage}</span> — {selected.form}{" "}
            <button type="button" className="text-primary" onClick={() => setSelected(null)}>
              changer
            </button>
          </p>
          <div className="flex gap-2">
            <Input type="number" min={0} placeholder="Quantité" value={qty} onChange={(e) => setQty(e.target.value)} className="h-10 rounded-xl" />
            <Input type="number" min={0} placeholder="Prix FCFA" value={price} onChange={(e) => setPrice(e.target.value)} className="h-10 rounded-xl" />
          </div>
          <Button onClick={add} className="w-full rounded-xl">
            Ajouter au stock
          </Button>
        </div>
      ) : creating ? (
        <div className="space-y-2">
          <Input placeholder="Nom (ex : Doliprane)" value={newMed.name} onChange={(e) => setNewMed({ ...newMed, name: e.target.value })} className="h-10 rounded-xl" />
          <Input placeholder="Dosage (ex : 500 mg)" value={newMed.dosage} onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })} className="h-10 rounded-xl" />
          <Input placeholder="Forme (ex : Comprimés)" value={newMed.form} onChange={(e) => setNewMed({ ...newMed, form: e.target.value })} className="h-10 rounded-xl" />
          <Input placeholder="Conditionnement (ex : Boîte de 16)" value={newMed.package} onChange={(e) => setNewMed({ ...newMed, package: e.target.value })} className="h-10 rounded-xl" />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCreating(false)} className="flex-1 rounded-xl">
              Annuler
            </Button>
            <Button onClick={createMedicine} disabled={!newMed.name.trim()} className="flex-1 rounded-xl">
              Créer
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Input placeholder="Rechercher dans le catalogue…" value={q} onChange={(e) => setQ(e.target.value)} className="h-10 rounded-xl bg-background" />
          <ul className="mt-2 max-h-56 overflow-y-auto">
            {meds?.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  disabled={existing.has(m.id)}
                  onClick={() => setSelected(m)}
                  className="w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-background disabled:opacity-50"
                >
                  {m.name} {m.dosage && m.dosage !== "—" ? m.dosage : ""} — {m.form}
                  {existing.has(m.id) && " (déjà en stock)"}
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => setCreating(true)} className="mt-2 text-sm font-semibold text-primary">
            Médicament absent du catalogue ? Le créer
          </button>
        </>
      )}
    </div>
  );
}
