import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Clock, MapPin, ShieldCheck, Store } from "lucide-react";
import { AppShell } from "@/components/garde/AppShell";
import { SearchInput } from "@/components/garde/SearchInput";
import { LocationPicker } from "@/components/garde/LocationPicker";
import { Button } from "@/components/ui/button";
import { useUserLocation } from "@/lib/location";
import hero from "@/assets/pharmacie-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GARDE — Trouver une pharmacie de garde au Sénégal" },
      { name: "description", content: "Trouvez en un geste la pharmacie la plus proche de vous et les pharmacies de garde partout au Sénégal." },
      { property: "og:title", content: "GARDE — Votre santé, près de vous." },
      { property: "og:description", content: "La pharmacie la plus proche et les pharmacies de garde au Sénégal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { location, requestGps } = useUserLocation();

  const go = async () => {
    if (!location) await requestGps();
    navigate({ to: "/pharmacies", search: { q: q.trim() || undefined } });
  };

  return (
    <AppShell
      footer={
        <div className="grid grid-cols-3 gap-2 text-center">
          <QuickLink to="/pharmacies" search={{ filtre: "garde" }} icon={<Clock className="h-6 w-6" />} label="Pharmacies de garde" />
          <QuickLink to="/pharmacies" search={{ filtre: "2km" }} icon={<MapPin className="h-6 w-6" />} label="Localisation rapide" />
          <QuickLink to="/medicaments" icon={<ShieldCheck className="h-6 w-6" />} label="Accès aux infos utiles" />
        </div>
      }
    >
      <h1 className="mb-6 text-[32px] font-extrabold leading-[1.15] tracking-tight text-foreground">
        Besoin d'une pharmacie de garde ?
      </h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          go();
        }}
        className="space-y-4"
      >
        <SearchInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher une pharmacie ou un quartier…"
          aria-label="Rechercher une pharmacie"
        />
        <LocationPicker />
        <Button type="submit" size="lg" className="h-14 w-full rounded-2xl text-lg font-bold shadow-[var(--shadow-soft)]">
          Trouver une pharmacie
        </Button>
      </form>

      <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-secondary/50 p-3">
        <img src={hero} alt="Pharmacie de garde au Sénégal" width={1280} height={768} className="w-full rounded-2xl" />
      </div>

      <Link
        to="/espace-pharmacien"
        className="mt-5 inline-flex items-center justify-center gap-2 self-center text-sm font-semibold text-primary"
      >
        <Store className="h-4 w-4" /> Vous êtes pharmacien ? Gérez votre stock
      </Link>
    </AppShell>
  );
}

function QuickLink({
  to,
  search,
  icon,
  label,
}: {
  to: "/pharmacies" | "/medicaments";
  search?: Record<string, string>;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link to={to} search={search as never} className="flex flex-col items-center gap-2">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-foreground shadow-[var(--shadow-card)]">
        {icon}
      </span>
      <span className="text-sm font-semibold leading-tight text-foreground">{label}</span>
    </Link>
  );
}
