import { createFileRoute, notFound } from "@tanstack/react-router";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Pill, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoNotice } from "@/components/garde/DemoNotice";
import { demoMedicinePharmaciesQuery } from "@/lib/demo-stock";
import { AppShell, BackLink } from "@/components/garde/AppShell";
import { PharmacyCard } from "@/components/garde/PharmacyCard";
import { LocationPicker } from "@/components/garde/LocationPicker";
import { getMedicinePublic } from "@/lib/public.functions";
import { pharmaciesWithMedicineQuery } from "@/lib/pharmacies";
import { DEFAULT_LOCATION, useUserLocation } from "@/lib/location";
import { formatDateTime, telHref } from "@/lib/format";

export const Route = createFileRoute("/medicaments/$id")({
  validateSearch: z.object({ demo: z.boolean().default(true) }),
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
  const { demo } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { location } = useUserLocation();
  const loc = location ?? DEFAULT_LOCATION;
  const { data, isLoading } = useQuery(pharmaciesWithMedicineQuery(m.id, loc.lat, loc.lng));
  const demoResult = useQuery({ ...demoMedicinePharmaciesQuery(m.id, loc.lat, loc.lng), enabled: demo });

  return (
    <AppShell>
      <BackLink fallback="/medicaments" />
      <h1 className="mt-3 text-[28px] font-extrabold leading-tight tracking-tight text-foreground md:text-4xl">
        {m.name} {m.dosage && m.dosage !== "—" ? m.dosage : ""}
      </h1>
      <p className="mb-4 flex items-center gap-2 text-muted-foreground">
        <Pill className="h-4 w-4 text-destructive" /> {m.form}
        {m.package ? ` • ${m.package}` : ""}
      </p>

      <div className="flex flex-wrap gap-2" aria-label="Type de stock">
        <Button variant={demo ? "default" : "outline"} aria-pressed={demo} onClick={() => navigate({ search: { demo: true } })}>Soutenance</Button>
        <Button variant={!demo ? "default" : "outline"} aria-pressed={!demo} onClick={() => navigate({ search: { demo: false } })}>Stocks réels uniquement</Button>
      </div>
      {demo && <DemoNotice />}

      <div className="md:max-w-md">
        <LocationPicker />
      </div>

      {demo && (
        <section>
          <h2 className="mb-3 mt-6 text-2xl font-bold text-foreground">Stocks indicatifs — Soutenance</h2>
          {demoResult.isLoading && <Loader2 aria-label="Chargement des stocks de démonstration" className="my-6 h-6 w-6 animate-spin text-primary" />}
          {demoResult.isError && <p role="alert" className="my-4 text-destructive">Les stocks de démonstration n’ont pas pu être chargés.</p>}
          {demoResult.data?.length === 0 && <p className="my-4 text-muted-foreground">Aucun stock de démonstration pour ce médicament.</p>}
          <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 lg:grid-cols-3">
            {demoResult.data?.map((p) => (
              <PharmacyCard key={p.id} {...p} demo extra={
                <div className="mt-3 border-l-4 border-primary bg-secondary p-3 text-sm text-secondary-foreground">
                  <p className="font-bold">Données de démonstration (Soutenance)</p>
                  <p className="mt-2 font-semibold">{p.quantity} unités fictives · {p.price_fcfa.toLocaleString("fr-FR")} FCFA indicatifs</p>
                  <p className="mt-1 text-xs">Disponibilité non confirmée.</p>
                  <p className="mt-2 text-xs">{p.duty_publication}</p>
                  {p.phone && <Button asChild variant="outline" className="mt-3 w-full"><a href={telHref(p.phone)}><Phone className="h-4 w-4" />Appeler la pharmacie</a></Button>}
                </div>
              } />
            ))}
          </div>
        </section>
      )}
      <h2 className="mb-3 mt-6 text-2xl font-bold text-foreground">Stocks réels déclarés</h2>
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
      <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 lg:grid-cols-3">
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
