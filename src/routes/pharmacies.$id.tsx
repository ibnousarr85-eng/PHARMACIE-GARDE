import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Clock, Info, Map, MapPin, Phone, Pill } from "lucide-react";
import { AppShell, BackLink } from "@/components/garde/AppShell";
import { Button } from "@/components/ui/button";
import { getPharmacyPublic } from "@/lib/public.functions";
import { pharmacyStockQuery } from "@/lib/pharmacies";
import { directionsHref, formatDateTime, formatHours, telHref } from "@/lib/format";
import { z } from "zod";
import { DemoNotice } from "@/components/garde/DemoNotice";
import { demoPharmacyStockQuery } from "@/lib/demo-stock";

export const Route = createFileRoute("/pharmacies/$id")({
  validateSearch: z.object({ demo: z.boolean().default(false) }),
  loader: async ({ params }) => {
    const pharmacy = await getPharmacyPublic({ data: { id: params.id } });
    if (!pharmacy) throw notFound();
    return pharmacy;
  },
  head: ({ loaderData }) => {
    const name = loaderData?.name ?? "Pharmacie";
    const where = loaderData?.address ?? loaderData?.city ?? "Sénégal";
    return {
      meta: [
        { title: `${name} — GARDE` },
        {
          name: "description",
          content: `${name}, ${where} : adresse, téléphone, horaires et itinéraire.`,
        },
        { property: "og:title", content: `${name} — GARDE` },
        {
          property: "og:description",
          content: `${name}, ${where} : adresse, téléphone et itinéraire.`,
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: () => (
    <AppShell>
      <BackLink to="/pharmacies" />
      <p className="mt-6 text-muted-foreground">Cette pharmacie est introuvable.</p>
    </AppShell>
  ),
  component: PharmacyDetail,
});

function PharmacyDetail() {
  const p = Route.useLoaderData();
  const { demo } = Route.useSearch();
  const demoStock = useQuery({ ...demoPharmacyStockQuery(p.id), enabled: demo });
  const { data: stock } = useQuery(pharmacyStockQuery(p.id));
  const hours = formatHours(p.opening_hours);
  const d = 0.006;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${p.lng - d},${p.lat - d},${p.lng + d},${p.lat + d}&layer=mapnik&marker=${p.lat},${p.lng}`;
  const available = (stock ?? []).filter((s) => s.quantity > 0);
  const actions = (
    <div className="space-y-3">
      {p.phone ? (
        <Button
          asChild
          size="lg"
          className="h-14 w-full rounded-2xl text-lg font-bold shadow-[var(--shadow-soft)]"
        >
          <a href={telHref(p.phone)}>Appeler la pharmacie</a>
        </Button>
      ) : (
        <Button disabled size="lg" className="h-14 w-full rounded-2xl text-lg font-bold">
          Numéro non renseigné
        </Button>
      )}
      <Button
        asChild
        variant="outline"
        size="lg"
        className="h-14 w-full rounded-2xl border-primary text-lg font-bold text-primary"
      >
        <a href={directionsHref(p.lat, p.lng)} target="_blank" rel="noreferrer">
          Itinéraire
        </a>
      </Button>
    </div>
  );

  return (
    <AppShell footer={actions}>
      <BackLink fallback="/pharmacies" />
      <h1 className="mt-3 text-[28px] font-extrabold uppercase leading-tight tracking-tight text-foreground md:text-4xl">
        {p.name}
      </h1>
      <p className="mb-4 font-semibold text-foreground/85">Informations sur la pharmacie</p>
      {demo && <DemoNotice />}

      {p.managed && (
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-success">
          <BadgeCheck className="h-4 w-4" /> Informations tenues à jour par la pharmacie
        </p>
      )}

      <div className="flex flex-col gap-3 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] md:grid-rows-[auto_1fr] md:items-start md:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
        <div className="space-y-3 md:col-start-1 md:row-start-1 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
          <InfoCard icon={<MapPin className="h-4 w-4 text-destructive" />} label="Adresse">
            {p.address || p.city || "Sénégal"}
          </InfoCard>
          <InfoCard icon={<Phone className="h-4 w-4" />} label="Téléphone">
            {p.phone ? (
              <a href={telHref(p.phone)} className="text-primary">
                {p.phone}
              </a>
            ) : (
              "Numéro non renseigné"
            )}
          </InfoCard>
          <InfoCard icon={<Clock className="h-4 w-4" />} label="Horaires de garde">
            {p.on_duty ? (
              <span className="text-success">
                De garde
                {p.on_duty_until ? ` jusqu'au ${formatDateTime(new Date(Date.parse(p.on_duty_until)-1).toISOString())}` : " actuellement"}
              </span>
            ) : (
              <span>Pas de garde déclarée</span>
            )}
            <span className="mt-1 block text-sm font-normal text-muted-foreground">
              Horaires de garde : {p.duty?.duty_hours || "Non renseigné"}
            </span>
            {p.duty && <span className="mt-1 block text-xs font-normal text-muted-foreground">Du {formatDateTime(p.duty.starts_at)} au {formatDateTime(p.duty.ends_at)} · {p.duty.source}</span>}
          </InfoCard>
          <InfoCard icon={<Clock className="h-4 w-4" />} label="Horaires habituels">{hours || "Non renseigné"}</InfoCard>
          <InfoCard icon={<MapPin className="h-4 w-4" />} label="Localisation"><span className="text-sm">Région : {p.region || "Non renseigné"}<br />Département : {p.department || "Non renseigné"}<br />Commune : {p.commune || "Non renseigné"}<br />Quartier : {p.locality || "Non renseigné"}</span></InfoCard>
          <InfoCard icon={<Info className="h-4 w-4" />} label="Source et validation"><span className="text-sm">{p.information_source || "Non renseigné"}<br />{p.validation_status === "validated" ? "Validé" : p.validation_status === "source_checked" ? "Source consultée — à confirmer auprès de l’officine" : "Non vérifié"}<br />Vérification : {p.checked_at ? formatDateTime(p.checked_at) : "Non renseigné"}</span></InfoCard>
          {p.rotations.length > 0 && <details className="rounded-2xl border border-border bg-card p-4 lg:col-span-2"><summary className="cursor-pointer font-semibold">Historique des rotations</summary><ul className="mt-3 divide-y divide-border">{p.rotations.map(r => <li key={r.id} className="py-3 text-sm">Du {formatDateTime(r.starts_at)} au {formatDateTime(new Date(Date.parse(r.ends_at)-1).toISOString())}<br />Horaires de garde : {r.duty_hours || "Non renseigné"}<br /><span className="text-muted-foreground">{r.source} · Vérification : {r.checked_at ? formatDateTime(r.checked_at) : "Non renseigné"}</span></li>)}</ul></details>}
        </div>

        <div className="space-y-4 md:sticky md:top-28 md:col-start-2 md:row-span-2 md:row-start-1">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="mb-3 flex items-center gap-2 text-[15px] font-bold text-foreground">
              <Map className="h-4 w-4 text-primary" /> Localisation — Emplacement sur la carte
            </p>
            <iframe
              title={`Carte — ${p.name}`}
              src={mapSrc}
              className="h-52 w-full rounded-2xl border border-border md:h-72 lg:h-80"
              loading="lazy"
            />
          </div>
          <div className="hidden md:block">{actions}</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 md:col-start-1 md:row-start-2 md:p-5">
          <p className="mb-3 flex items-center gap-2 text-[15px] font-bold text-foreground">
            <Pill className="h-4 w-4 text-primary" /> Médicaments en stock
          </p>
          {available.length === 0 ? (
            <p className="flex items-start gap-2 rounded-xl bg-muted p-3 text-sm text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0" /> Cette pharmacie n'a pas encore publié son
              stock. Appelez pour vérifier.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {available.map((s) => s.medicine ? (
                <li
                  key={s.medicine?.id}
                  className="flex items-center justify-between gap-3 py-2 text-sm"
                >
                  <Link
                    to="/medicaments/$id"
                    params={{ id: s.medicine.id }}
                    search={{ demo: false }}
                    className="font-semibold text-foreground"
                  >
                    {s.medicine?.name}{" "}
                    {s.medicine?.dosage && s.medicine.dosage !== "—" ? s.medicine.dosage : ""}
                    <span className="block text-xs font-normal text-muted-foreground">
                      {s.medicine?.form}
                    </span>
                  </Link>
                  <span className="text-right text-xs text-muted-foreground">
                    <span className="block font-semibold text-success">{s.quantity} en stock</span>
                    {s.price_fcfa != null && (
                      <span className="block">{s.price_fcfa.toLocaleString("fr-FR")} FCFA</span>
                    )}
                  </span>
                </li>
              ) : null)}
            </ul>
          )}
          {demo && (
            <section className="mt-6 border-t border-border pt-4">
              <h2 className="font-bold text-secondary-foreground">Stocks indicatifs — Soutenance</h2>
              {demoStock.isError && <p role="alert" className="mt-2 text-destructive">Impossible de charger les stocks de démonstration.</p>}
              {demoStock.isLoading && <p className="mt-2 text-muted-foreground">Chargement…</p>}
              {demoStock.data?.length === 0 && <p className="mt-2 text-muted-foreground">Aucun stock de démonstration.</p>}
              <ul className="mt-2 divide-y divide-border">
                {demoStock.data?.map((s) => s.medicine ? (
                  <li key={s.medicine.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
                    <Link className="font-semibold text-primary" to="/medicaments/$id" params={{ id: s.medicine.id }} search={{ demo: true }}>{s.medicine.name} {s.medicine.dosage === "—" ? "" : s.medicine.dosage}</Link>
                    <span className="text-secondary-foreground">{s.quantity} unités fictives · {s.price_fcfa.toLocaleString("fr-FR")} FCFA indicatifs</span>
                  </li>
                ) : null)}
              </ul>
            </section>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function InfoCard({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        {icon} {label}
      </p>
      <div className="mt-1 text-[17px] font-semibold text-foreground">{children}</div>
    </div>
  );
}
