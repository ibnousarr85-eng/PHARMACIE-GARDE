import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { z } from "zod";
import { AppShell, BackLink } from "@/components/garde/AppShell";
import { Chip, SearchInput } from "@/components/garde/SearchInput";
import { PharmacyCard } from "@/components/garde/PharmacyCard";
import { LocationPicker } from "@/components/garde/LocationPicker";
import { Button } from "@/components/ui/button";
import { DEFAULT_LOCATION, useUserLocation } from "@/lib/location";
import { nearbyPharmaciesQuery } from "@/lib/pharmacies";

const FILTERS = [
  { id: "toutes", label: "Toutes" },
  { id: "garde", label: "De garde" },
  { id: "2km", label: "Moins de 2 km" },
  { id: "telephone", label: "Avec téléphone" },
] as const;

const searchSchema = z.object({
  q: z.string().optional(),
  filtre: z.enum(["toutes", "garde", "2km", "telephone"]).optional(),
});

export const Route = createFileRoute("/pharmacies/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Trouver une pharmacie près de moi — GARDE" },
      { name: "description", content: "Liste des pharmacies les plus proches de votre position au Sénégal, avec téléphone, horaires et pharmacies de garde." },
      { property: "og:title", content: "Trouver une pharmacie près de moi — GARDE" },
      { property: "og:description", content: "Les pharmacies les plus proches de vous, partout au Sénégal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PharmaciesPage,
});

function PharmaciesPage() {
  const { q, filtre = "toutes" } = Route.useSearch();
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
      maxKm: filtre === "2km" ? 2 : null,
      onDuty: filtre === "garde",
      withPhone: filtre === "telephone",
      limit: 40,
    }),
  );

  const title = filtre === "garde" ? "Pharmacies de garde" : "Pharmacies les plus proches";

  return (
    <AppShell>
      <BackLink to="/" />
      <h1 className="mb-5 mt-3 text-[30px] font-extrabold tracking-tight text-foreground">Trouver une pharmacie</h1>

      <div className="space-y-4">
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
          className="h-14 w-full rounded-2xl text-lg font-bold shadow-[var(--shadow-soft)]"
        >
          {locating ? <Loader2 className="h-5 w-5 animate-spin" /> : <MapPin className="h-5 w-5" />}
          Pharmacies près de moi
        </Button>
        {!location && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Position non définie : résultats affichés autour de Dakar. Activez le GPS ou choisissez votre ville.
            </p>
            <LocationPicker />
          </div>
        )}
        {location && (
          <p className="text-sm text-muted-foreground">
            Autour de : <span className="font-semibold text-foreground">{location.label}</span>
          </p>
        )}
      </div>

      <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
        {FILTERS.map((f) => (
          <Chip
            key={f.id}
            active={filtre === f.id}
            onClick={() => navigate({ search: (s) => ({ ...s, filtre: f.id === "toutes" ? undefined : f.id }) })}
          >
            {f.label}
          </Chip>
        ))}
      </div>

      <h2 className="mb-3 mt-6 text-2xl font-bold text-foreground">{title}</h2>

      {isLoading && (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      {error && <p className="text-destructive">Impossible de charger les pharmacies. Réessayez.</p>}
      {data && data.length === 0 && (
        <div className="rounded-3xl border border-dashed border-border p-6 text-center text-muted-foreground">
          {filtre === "garde"
            ? "Aucune pharmacie n'a encore déclaré être de garde près de vous. Essayez « Toutes » et appelez avant de vous déplacer."
            : "Aucune pharmacie trouvée avec ces critères."}
        </div>
      )}
      <div className="space-y-4">
        {data?.map((p) => (
          <PharmacyCard key={p.id} {...p} />
        ))}
      </div>
    </AppShell>
  );
}
