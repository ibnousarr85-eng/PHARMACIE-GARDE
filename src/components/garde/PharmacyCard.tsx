import { Link } from "@tanstack/react-router";
import { Clock, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistance, formatHours, telHref } from "@/lib/format";

type Props = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  opening_hours?: string | null;
  on_duty: boolean;
  distance_km: number;
  extra?: React.ReactNode;
};

export function PharmacyCard(p: Props) {
  const hours = formatHours(p.opening_hours);
  return (
    <article className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xl font-bold leading-tight text-foreground">{p.name}</h3>
        {p.on_duty ? (
          <span className="shrink-0 rounded-full border border-success/30 bg-success-soft px-3 py-1 text-xs font-semibold text-success">
            De garde
          </span>
        ) : (
          <span className="shrink-0 rounded-full border border-primary/30 bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
            À {formatDistance(p.distance_km)}
          </span>
        )}
      </div>
      <ul className="mt-3 space-y-1.5 text-[15px] text-muted-foreground">
        <li className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <span>{p.address || p.city || "Sénégal"}</span>
        </li>
        <li className="flex items-start gap-2">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{hours ? `Horaires : ${hours}` : "Horaires non renseignés"}</span>
        </li>
        <li className="flex items-start gap-2">
          <Phone className="mt-0.5 h-4 w-4 shrink-0" />
          {p.phone ? (
            <a href={telHref(p.phone)} className="font-semibold text-primary">
              {p.phone}
            </a>
          ) : (
            <span>Téléphone non renseigné</span>
          )}
        </li>
      </ul>
      {p.on_duty && (
        <p className="mt-2 text-sm text-muted-foreground">À {formatDistance(p.distance_km)} de vous</p>
      )}
      {p.extra}
      <Button asChild size="lg" className="mt-4 h-12 w-full rounded-2xl text-base font-bold">
        <Link to="/pharmacies/$id" params={{ id: p.id }}>
          Voir les détails
        </Link>
      </Button>
    </article>
  );
}
