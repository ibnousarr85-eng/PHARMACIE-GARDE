import { useId } from "react";
import { ChevronUp, Loader2, LocateFixed, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SENEGAL_CITIES } from "@/lib/cities";
import { useUserLocation } from "@/lib/location";

export function LocationPicker() {
  const { location, locating, error, requestGps, setCity } = useUserLocation();
  const cityId = useId();

  return (
    <div className="rounded-2xl border border-border bg-muted">
      <Button
        type="button"
        variant="ghost"
        onClick={() => requestGps()}
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
        {locating ? <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" /> : <ChevronUp className="h-5 w-5 shrink-0 text-foreground" />}
      </Button>

      <div className="border-t border-border p-4 pt-3">
        <Button
          type="button"
          variant="ghost"
          disabled={locating}
          onClick={() => requestGps()}
          className="h-auto w-full justify-start whitespace-normal rounded-full bg-background px-3 py-3 font-semibold text-primary"
        >
          {locating ? <Loader2 className="animate-spin" /> : <LocateFixed />}
          Utiliser ma position actuelle (GPS)
        </Button>
        {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
        <div className="mt-3">
          <label htmlFor={cityId} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Ou choisir une ville
          </label>
          <select
            id={cityId}
            aria-label="Choisir une ville"
            disabled={locating}
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
            value={location?.source === "city" ? location.label : ""}
            onChange={(e) => {
              setCity(e.target.value);
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
      </div>
    </div>
  );
}
