import { createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Pill } from "lucide-react";
import { AppShell, BackLink } from "@/components/garde/AppShell";
import { PharmacyCard } from "@/components/garde/PharmacyCard";
import { LocationPicker } from "@/components/garde/LocationPicker";
import { getMedicinePublic } from "@/lib/public.functions";
import { pharmaciesWithMedicineQuery } from "@/lib/pharmacies";
import { DEFAULT_LOCATION, useUserLocation } from "@/lib/location";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/medicaments/$id")({
  loader: async ({ params }) => {
    const m = await getMedicinePublic({ data: { id: params.id } });
    if (!m) throw notFound();
    return m;
  },
  head: ({ loaderData }) => {
    const n = loaderData ? `${loaderData.name} ${loaderData.dosage ?? ""}`.trim() : "Médicament";
    return {
      meta: [
        { title: `${n} : pharmacies avec du stock — GARDE` },
        { name: "description", content: `Pharmacies proches de vous qui ont ${n} en stock au Sénégal.` },
        { property: "og:title", content: `${n} — GARDE` },
        { property: "og:description", content: `Où trouver ${n} près de chez vous.` },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: () => (
    <AppShell>
      <BackLink to="/medicaments" />
      <p className="mt-6 text-muted-foreground">Médicament introuvable.</p>
    </AppShell>
  ),
  component: MedicinePharmacies,
});

function MedicinePharmacies() {
  const m = Route.useLoaderData();
  const { location } = useUserLocation();
  const loc = location ?? DEFAULT_LOCATION;
  const { data, isLoading } = useQuery(pharmaciesWithMedicineQuery(m.id, loc.lat, loc.lng));

  return (
    <AppShell>
      <BackLink fallback="/medicaments" />
      <h1 className="mt-3 text-[28px] font-extrabold leading-tight tracking-tight text-foreground">
        {m.name} {m.dosage && m.dosage !== "—" ? m.dosage : ""}
      </h1>
      <p className="mb-4 flex items-center gap-2 text-muted-foreground">
        <Pill className="h-4 w-4 text-destructive" /> {m.form}
        {m.package ? ` • ${m.package}` : ""}
      </p>

      <LocationPicker />

      <h2 className="mb-3 mt-6 text-2xl font-bold text-foreground">Pharmacies avec du stock</h2>
      {isLoading && (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      {data && data.length === 0 && (
        <p className="rounded-3xl border border-dashed border-border p-6 text-center text-muted-foreground">
          Aucune pharmacie n'a encore signalé ce médicament en stock. Appelez la pharmacie la plus proche pour vérifier.
        </p>
      )}
      <div className="space-y-4">
        {data?.map((p) => (
          <PharmacyCard
            key={p.id}
            {...p}
            extra={
              <p className="mt-3 rounded-xl bg-success-soft p-3 text-sm font-semibold text-success">
                {p.quantity} en stock
                {p.price_fcfa != null ? ` · ${p.price_fcfa.toLocaleString("fr-FR")} FCFA` : ""}
                <span className="block text-xs font-normal">Mis à jour {formatDateTime(p.stock_updated_at)}</span>
              </p>
            }
          />
        ))}
      </div>
    </AppShell>
  );
}
