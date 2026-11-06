import { useId, useState } from "react";
import { Loader2, LocateFixed, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SENEGAL_CITIES } from "@/lib/cities";
import { useUserLocation } from "@/lib/location";

export function LocationPicker() {
  const { location, locating, error, requestGps, setCity } = useUserLocation();
  const [open, setOpen] = useState(false);
  const cityId = useId();
  const manual = open || location?.source === "city";

  const activateGps = async () => {
    const loc = await requestGps();
    if (loc) setOpen(false);
  };

  return (
    <div className="rounded-2xl border border-border bg-muted">
      <Button
        type="button"
        variant="ghost"
        onClick={activateGps}
        disabled={locating}
        className="h-auto w-full justify-start gap-4 whitespace-normal rounded-2xl p-4 text-left"
        aria-busy={locating}
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
        {locating ? <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" /> : <LocateFixed className="h-5 w-5 shrink-0 text-primary" />}
      </Button>

      <div className="border-t border-border p-4 pt-3">
        <Button
          type="button"
          variant="outline"
          disabled={locating}
          onClick={() => manual ? activateGps() : setOpen(true)}
          className="h-auto w-full whitespace-normal rounded-xl px-3 py-2.5 font-semibold text-primary"
        >
          {manual ? <LocateFixed /> : <MapPin />}
          {manual ? "Utiliser le GPS" : "Choisir une ville"}
        </Button>
        {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
        {manual && (
          <div className="mt-3">
          <label htmlFor={cityId} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Choisir une ville
          </label>
          <select
            id={cityId}
            disabled={locating}
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
    </div>
  );
}
