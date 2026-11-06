import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { z } from "zod";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { AppShell, BackLink } from "@/components/garde/AppShell";
import { Chip, SearchInput } from "@/components/garde/SearchInput";
import { PharmacyCard } from "@/components/garde/PharmacyCard";
import { LocationPicker } from "@/components/garde/LocationPicker";
import { GeographicFilters } from "@/components/garde/GeographicFilters";
import { PharmacyMap, useIsWide } from "@/components/garde/PharmacyMap";
import { Button } from "@/components/ui/button";
import { DEFAULT_LOCATION, useUserLocation } from "@/lib/location";
import { geographicOptionsQuery, nearbyPharmaciesQuery } from "@/lib/pharmacies";

const FILTERS = [
  { id: "toutes", label: "Toutes" },
  { id: "garde", label: "De garde" },
  { id: "2km", label: "Moins de 2 km" },
  { id: "telephone", label: "Avec téléphone" },
] as const;

const searchSchema = z.object({
  q: fallback(z.string(), "").optional(),
  filtre: fallback(z.string(), "toutes").optional(),
  region: fallback(z.string(), "").optional(),
  departement: fallback(z.string(), "").optional(),
  ville: fallback(z.string(), "").optional(),
});

export const Route = createFileRoute("/pharmacies/")({
  validateSearch: zodValidator(searchSchema),
  loader: ({ context }) => context.queryClient.ensureQueryData(geographicOptionsQuery),
  head: () => ({
    meta: [
      { title: "Trouver une pharmacie près de moi — GARDE" },
      {
        name: "description",
        content:
          "Liste des pharmacies les plus proches de votre position au Sénégal, avec téléphone, horaires et pharmacies de garde.",
      },
      { property: "og:title", content: "Trouver une pharmacie près de moi — GARDE" },
      {
        property: "og:description",
        content: "Les pharmacies les plus proches de vous, partout au Sénégal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PharmaciesPage,
});

function PharmaciesPage() {
  const { q, filtre: requestedFilter, region, departement, ville } = Route.useSearch();
  const filtre = FILTERS.some((filter) => filter.id === requestedFilter) ? requestedFilter : "toutes";
  const { data: geographicRows } = useSuspenseQuery(geographicOptionsQuery);
  const navigate = useNavigate({ from: "/pharmacies/" });
  const { location, locating, requestGps } = useUserLocation();
  const [text, setText] = useState(q ?? "");
  const [debounced, setDebounced] = useState(q ?? "");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(text), 300);
    return () => clearTimeout(t);
  }, [text]);

  const loc = location ?? DEFAULT_LOCATION;
  const { data, isLoading, error } = useQuery(
    nearbyPharmaciesQuery({
      lat: loc.lat,
      lng: loc.lng,
      search: debounced,
      region,
      department: departement,
      city: ville,
      maxKm: filtre === "2km" ? 2 : null,
      onDuty: filtre === "garde",
      withPhone: filtre === "telephone",
      limit: 40,
    }),
  );

  const wide = useIsWide();
  const title = filtre === "garde" ? "Pharmacies de garde" : "Pharmacies les plus proches";

  return (
    <AppShell>
      <BackLink to="/" />
      <h1 className="mb-5 mt-3 text-[30px] font-extrabold tracking-tight text-foreground md:text-4xl">
        Trouver une pharmacie
      </h1>

      <div className="space-y-4 md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-4 md:space-y-0">
        <SearchInput
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Rechercher une pharmacie, un quartier…"
          aria-label="Rechercher une pharmacie"
        />
        <Button
          type="button"
          size="lg"
          onClick={() => requestGps()}
          className="h-14 w-full rounded-2xl text-lg font-bold shadow-[var(--shadow-soft)] md:w-auto md:px-6"
        >
          {locating ? <Loader2 className="h-5 w-5 animate-spin" /> : <MapPin className="h-5 w-5" />}
          Pharmacies près de moi
        </Button>
        {!location && (
          <div className="space-y-2 md:col-span-2 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:items-start md:gap-4 md:space-y-0">
            <p className="text-sm text-muted-foreground">
              Position non définie : résultats affichés autour de Dakar. Activez le GPS ou
              choisissez votre ville.
            </p>
            <LocationPicker />
          </div>
        )}
        {location && (
          <p className="text-sm text-muted-foreground md:col-span-2">
            Autour de : <span className="font-semibold text-foreground">{location.label}</span>
          </p>
        )}
      </div>

      <GeographicFilters rows={geographicRows} selected={{ region, departement, ville }} onChange={(selection) => navigate({ search: (previous) => ({ ...previous, ...selection, q: text || undefined }) })} />

      <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0">
        {FILTERS.map((f) => (
          <Chip
            key={f.id}
            active={filtre === f.id}
            onClick={() =>
              navigate({ search: (s) => ({ ...s, filtre: f.id === "toutes" ? undefined : f.id }) })
            }
          >
            {f.label}
          </Chip>
        ))}
      </div>

      <div className="md:mt-6 md:flex md:flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start lg:gap-8">
        <section className="min-w-0">
          <h2 className="mb-3 mt-6 text-2xl md:mt-0 font-bold text-foreground">{title}</h2>

          {isLoading && (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          {error && (
            <p className="text-destructive">Impossible de charger les pharmacies. Réessayez.</p>
          )}
          {data && data.length === 0 && (
            <div className="rounded-3xl border border-dashed border-border p-6 text-center text-muted-foreground">
              {filtre === "garde"
                ? "Aucune pharmacie n'a encore déclaré être de garde près de vous. Essayez « Toutes » et appelez avant de vous déplacer."
                : "Aucune pharmacie trouvée avec ces critères."}
            </div>
          )}
          <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            {data?.map((p) => (
              <PharmacyCard key={p.id} {...p} />
            ))}
          </div>
        </section>

        {wide && (
          <aside className="order-first mb-6 lg:sticky lg:top-28 lg:order-none lg:mb-0 lg:mt-0">
            <PharmacyMap
              pharmacies={data ?? []}
              center={loc}
              className="h-80 w-full overflow-hidden rounded-3xl border border-border shadow-[var(--shadow-card)] lg:h-[calc(100vh-9rem)]"
            />
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive" /> Votre position
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Pharmacie
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-success" /> De garde
              </span>
            </p>
          </aside>
        )}
      </div>
    </AppShell>
  );
}
