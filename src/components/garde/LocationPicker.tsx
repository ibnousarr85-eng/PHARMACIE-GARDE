import { useState } from "react";
import { ChevronDown, Loader2, LocateFixed, MapPin } from "lucide-react";
import { SENEGAL_CITIES } from "@/lib/cities";
import { useUserLocation } from "@/lib/location";

export function LocationPicker() {
  const { location, locating, error, requestGps, setCity } = useUserLocation();
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-muted">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-4 p-4 text-left"
        aria-expanded={open}
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
          <MapPin className="h-6 w-6" />
        </span>
        <span className="flex-1">
          <span className="block font-bold text-foreground">Votre localisation</span>
          <span className="block text-sm font-semibold text-primary">
            {locating
              ? "Localisation en cours…"
              : location
                ? location.label
                : "Utiliser ma position actuelle"}
          </span>
        </span>
        <ChevronDown
          className={`h-5 w-5 text-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-border p-4 pt-3">
          <button
            type="button"
            onClick={async () => {
              const loc = await requestGps();
              if (loc) setOpen(false);
            }}
            className="mb-3 flex w-full items-center gap-2 rounded-xl bg-background px-3 py-2.5 text-sm font-semibold text-primary"
          >
            {locating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LocateFixed className="h-4 w-4" />
            )}
            Utiliser ma position actuelle (GPS)
          </button>
          {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Ou choisir une ville
          </label>
          <select
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
            value={location?.source === "city" ? location.label : ""}
            onChange={(e) => {
              setCity(e.target.value);
              setOpen(false);
            }}
          >
            <option value="" disabled>
              Sélectionner…
            </option>
            {SENEGAL_CITIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
