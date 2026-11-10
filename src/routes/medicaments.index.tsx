import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Info, Loader2, Pill } from "lucide-react";
import { z } from "zod";
import { AppShell, BackLink } from "@/components/garde/AppShell";
import { Chip, SearchInput } from "@/components/garde/SearchInput";
import { Button } from "@/components/ui/button";
import { medicineSearchQuery } from "@/lib/pharmacies";

const QUICK = ["Doliprane", "Coartem", "Spasfon", "Amoxicilline", "Smecta"];

export const Route = createFileRoute("/medicaments/")({
  validateSearch: z.object({ q: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Rechercher un médicament — GARDE" },
      { name: "description", content: "Cherchez un médicament et trouvez les pharmacies proches qui l'ont en stock au Sénégal." },
      { property: "og:title", content: "Rechercher un médicament — GARDE" },
      { property: "og:description", content: "Trouvez les pharmacies proches qui ont votre médicament en stock." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MedicinesPage,
});

function MedicinesPage() {
  const { q = "" } = Route.useSearch();
  const navigate = useNavigate({ from: "/medicaments/" });
  const [text, setText] = useState(q);
  const { data, isLoading } = useQuery(medicineSearchQuery(q));

  const search = (term: string) => navigate({ search: { q: term || undefined } });

  return (
    <AppShell>
      <BackLink to="/" />
      <h1 className="mt-3 text-[30px] font-extrabold tracking-tight text-foreground md:text-4xl">Rechercher un médicament</h1>
      <p className="mb-5 text-muted-foreground">Trouvez les pharmacies proches qui l'ont en stock.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          search(text.trim());
        }}
        className="space-y-4 md:grid md:grid-cols-[minmax(0,1fr)_auto] md:gap-4 md:space-y-0"
      >
        <SearchInput value={text} onChange={(e) => setText(e.target.value)} placeholder="Nom du médicament…" aria-label="Nom du médicament" />
        <Button type="submit" size="lg" className="h-14 w-full rounded-2xl text-lg font-bold shadow-[var(--shadow-soft)] md:w-auto md:px-10">
          Rechercher
        </Button>
      </form>

      <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0">
        {QUICK.map((c) => (
          <Chip
            key={c}
            active={q.toLowerCase() === c.toLowerCase()}
            onClick={() => {
              setText(c);
              search(c);
            }}
          >
            {c}
          </Chip>
        ))}
      </div>

      <h2 className="mb-3 mt-6 text-2xl font-bold text-foreground">{q ? "Résultats de recherche" : "Médicaments courants"}</h2>

      {isLoading && (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      {data && data.length === 0 && (
        <p className="rounded-3xl border border-dashed border-border p-6 text-center text-muted-foreground">
          Aucun médicament trouvé pour « {q} ».
        </p>
      )}
      <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 lg:grid-cols-3">
        {data?.map((m, i) => (
          <article key={m.id} className="flex flex-col rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <h3 className="text-xl font-bold text-foreground">
              {m.name} {m.dosage && m.dosage !== "—" ? m.dosage : ""}
            </h3>
            <p className="mt-2 flex items-center gap-2 text-[15px] text-muted-foreground">
              <Pill className="h-4 w-4 text-destructive" /> Forme : {m.form}
              {m.package ? ` • ${m.package}` : ""}
            </p>
            <p className="mt-3 flex items-start gap-2 rounded-xl border-l-4 border-primary bg-muted p-3 text-sm text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {m.category ? `${m.category}. ` : ""}Stock mis à jour par les pharmacies.
            </p>
            <div className="flex-1" />
            <Button
              asChild
              size="lg"
              variant={i === 0 ? "default" : "outline"}
              className={`mt-4 h-12 w-full rounded-2xl text-base font-bold ${i === 0 ? "" : "border-primary text-primary"}`}
            >
              <Link to="/medicaments/$id" params={{ id: m.id }}>
                Consulter les pharmacies
              </Link>
            </Button>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
