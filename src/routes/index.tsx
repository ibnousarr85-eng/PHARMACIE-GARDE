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

const ADVANTAGES = [
  {
    to: "/pharmacies" as const,
    search: { filtre: "garde" },
    icon: Clock,
    label: "Pharmacies de garde",
    text: "Celles qui sont ouvertes la nuit et le week-end.",
  },
  {
    to: "/pharmacies" as const,
    search: { filtre: "2km" },
    icon: MapPin,
    label: "Localisation rapide",
    text: "Les pharmacies à moins de 2 km de vous.",
  },
  {
    to: "/medicaments" as const,
    search: undefined,
    icon: ShieldCheck,
    label: "Accès aux infos utiles",
    text: "Médicaments en stock, téléphone et itinéraire.",
  },
];

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
          {ADVANTAGES.map((a) => (
            <QuickLink key={a.label} to={a.to} search={a.search} icon={<a.icon className="h-6 w-6" />} label={a.label} />
          ))}
        </div>
      }
    >
      <div className="flex flex-col md:grid md:grid-cols-2 md:items-center md:gap-10 lg:gap-16">
        {/* Left: search + location */}
        <div className="flex flex-col">
          <h1 className="mb-6 text-[32px] font-extrabold leading-[1.15] tracking-tight text-foreground md:text-5xl md:leading-[1.1] lg:text-[56px]">
            Besoin d'une pharmacie de garde\u00a0?
          </h1>
          <p className="mb-8 hidden text-lg text-muted-foreground md:block">
            Trouvez la pharmacie la plus proche de vous, partout au Sénégal, avec son téléphone et son itinéraire.
          </p>

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

          <Link
            to="/espace-pharmacien"
            className="mt-5 hidden items-center gap-2 text-sm font-semibold text-primary md:inline-flex"
          >
            <Store className="h-4 w-4" /> Vous êtes pharmacien ? Gérez votre stock
          </Link>
        </div>

        {/* Right: illustration + advantages */}
        <div className="flex flex-col">
          <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-secondary/50 p-3 md:mt-0 md:shadow-[var(--shadow-card)]">
            <img src={hero} alt="Pharmacie de garde au Sénégal" width={1280} height={768} className="w-full rounded-2xl" />
          </div>

          <ul className="mt-6 hidden gap-3 md:grid lg:grid-cols-3">
            {ADVANTAGES.map((a) => (
              <li key={a.label}>
                <Link
                  to={a.to}
                  search={a.search as never}
                  className="flex h-full items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-colors hover:border-primary/40 lg:flex-col"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                    <a.icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-bold leading-tight text-foreground">{a.label}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">{a.text}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Link
        to="/espace-pharmacien"
        className="mt-5 inline-flex items-center justify-center gap-2 self-center text-sm font-semibold text-primary md:hidden"
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
  search?: Record<string, string> | undefined;
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
