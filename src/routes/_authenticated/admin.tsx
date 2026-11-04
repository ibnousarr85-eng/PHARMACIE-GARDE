import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, MapPin, ShieldAlert, X } from "lucide-react";
import { AppShell, BackLink } from "@/components/garde/AppShell";
import { Chip } from "@/components/garde/SearchInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/lib/admin";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administration — Demandes des pharmaciens | GARDE" },
      { name: "description", content: "Validez ou refusez les demandes des pharmaciens qui souhaitent gérer une officine sur GARDE." },
      { property: "og:title", content: "Administration — GARDE" },
      { property: "og:description", content: "Validation des demandes des pharmaciens." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Status = "pending" | "approved" | "rejected";
type Request = Tables<"pharmacy_requests"> & {
  pharmacy: { name: string; address: string | null; city: string | null; phone: string | null; owner_id: string | null } | null;
};

const STATUS_LABEL: Record<Status, string> = { pending: "En attente", approved: "Validées", rejected: "Refusées" };

function AdminPage() {
  const { user } = Route.useRouteContext();
  const { data: isAdmin, isLoading } = useIsAdmin(user.id);
  const [status, setStatus] = useState<Status>("pending");

  return (
    <AppShell size="narrow">
      <BackLink to="/espace-pharmacien" />
      <h1 className="mt-3 text-[28px] font-extrabold tracking-tight text-foreground">Administration</h1>
      <p className="mb-5 text-sm text-muted-foreground">Demandes des pharmaciens pour gérer une officine.</p>

      {isLoading ? (
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
      ) : !isAdmin ? (
        <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-[var(--shadow-card)]">
          <ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 font-semibold text-foreground">Accès réservé aux administrateurs GARDE.</p>
          <Link to="/espace-pharmacien" className="mt-3 inline-block text-sm font-semibold text-primary">
            Retour à l'espace pharmacien
          </Link>
        </div>
      ) : (
        <>
          <div className="-mx-5 mb-4 flex gap-2 overflow-x-auto px-5 pb-1">
            {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
              <Chip key={s} active={status === s} onClick={() => setStatus(s)}>
                {STATUS_LABEL[s]}
              </Chip>
            ))}
          </div>
          <RequestList status={status} />
        </>
      )}
    </AppShell>
  );
}

function RequestList({ status }: { status: Status }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-requests", status],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pharmacy_requests")
        .select("*, pharmacy:pharmacies(name, address, city, phone, owner_id)")
        .eq("status", status)
        .order("created_at", { ascending: status === "pending" })
        .limit(100);
      if (error) throw error;
      return data as Request[];
    },
  });

  if (isLoading) return <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />;
  if (error) return <p className="text-destructive">Impossible de charger les demandes.</p>;
  if (!data?.length)
    return (
      <div className="rounded-3xl border border-dashed border-border p-6 text-center text-muted-foreground">
        Aucune demande {STATUS_LABEL[status].toLowerCase()}.
      </div>
    );
  return (
    <div className="space-y-4">
      {data.map((r) => (
        <RequestCard key={r.id} request={r} />
      ))}
    </div>
  );
}

function RequestCard({ request: r }: { request: Request }) {
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const review = useMutation({
    mutationFn: async (approve: boolean) => {
      const trimmed = note.trim();
      const { error } = await supabase.rpc("review_pharmacy_request", {
        p_request_id: r.id,
        p_approve: approve,
        ...(trimmed ? { p_note: trimmed } : {}),
      });
      if (error) throw error;
      return approve;
    },
    onSuccess: (approve) => {
      toast.success(approve ? "Demande validée : le pharmacien peut gérer son officine" : "Demande refusée");
      qc.invalidateQueries({ queryKey: ["admin-requests"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isNew = !r.pharmacy_id;
  const name = r.pharmacy?.name ?? r.name ?? "—";
  const where = r.pharmacy ? [r.pharmacy.address, r.pharmacy.city].filter(Boolean).join(", ") : [r.address, r.city].filter(Boolean).join(", ");
  const phone = r.pharmacy?.phone ?? r.phone;

  return (
    <article className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <p className="text-xs font-semibold uppercase tracking-wide text-secondary-foreground">
        {isNew ? "Nouvelle pharmacie proposée" : "Pharmacie existante"}
      </p>
      <h2 className="mt-1 text-lg font-bold text-foreground">{name}</h2>
      {where && <p className="text-sm text-muted-foreground">{where}</p>}
      {phone && <p className="text-sm text-muted-foreground">Tél. {phone}</p>}
      {isNew && r.lat != null && r.lng != null && (
        <a
          href={`https://www.openstreetmap.org/?mlat=${r.lat}&mlon=${r.lng}#map=18/${r.lat}/${r.lng}`}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-primary"
        >
          <MapPin className="h-4 w-4" /> Voir la position GPS
        </a>
      )}
      {r.pharmacy_id && (
        <Link to="/pharmacies/$id" params={{ id: r.pharmacy_id }} className="mt-1 block text-sm font-semibold text-primary">
          Voir la fiche →
        </Link>
      )}

      <div className="mt-3 rounded-2xl bg-muted p-3 text-sm">
        <p className="font-semibold text-foreground">{r.contact_email ?? "E-mail inconnu"}</p>
        <p className="mt-1 whitespace-pre-wrap text-foreground/85">{r.message || "Aucune information de vérification fournie."}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Reçue le {new Date(r.created_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
        </p>
      </div>

      {r.status === "pending" ? (
        <div className="mt-3 space-y-2">
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note pour le pharmacien (facultatif)"
            className="h-10 rounded-xl"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={review.isPending}
              onClick={() => review.mutate(false)}
              className="flex-1 rounded-xl border-destructive/40 text-destructive"
            >
              <X className="h-4 w-4" /> Refuser
            </Button>
            <Button disabled={review.isPending} onClick={() => review.mutate(true)} className="flex-1 rounded-xl">
              <Check className="h-4 w-4" /> Valider
            </Button>
          </div>
        </div>
      ) : (
        r.admin_note && <p className="mt-3 text-sm text-muted-foreground">Note : {r.admin_note}</p>
      )}
    </article>
  );
}
