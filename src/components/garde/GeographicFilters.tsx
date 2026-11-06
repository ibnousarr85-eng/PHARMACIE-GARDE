import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { changeGeography, geographicChoices, type GeographicOption, type GeographicSelection } from "@/lib/geography";

export function GeographicFilters({ rows, selected, onChange }: {
  rows: GeographicOption[];
  selected: GeographicSelection;
  onChange: (value: GeographicSelection) => void;
}) {
  const choices = geographicChoices(rows, selected);
  const fields = [
    { key: "region", label: "Région", all: "Toutes les régions", options: choices.regions },
    { key: "departement", label: "Département", all: "Tous les départements", options: choices.departments },
    { key: "ville", label: "Ville", all: "Toutes les villes", options: choices.cities },
  ] as const;
  return (
    <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[repeat(3,minmax(0,1fr))_auto] md:items-end">
      {fields.map((field) => (
        <div key={field.key} className="min-w-0 space-y-1.5">
          <label htmlFor={`geo-${field.key}`} className="text-sm font-semibold text-foreground">{field.label}</label>
          <Select value={selected[field.key] || "__all"} onValueChange={(value) => onChange(changeGeography(selected, field.key, value === "__all" ? "" : value))}>
            <SelectTrigger id={`geo-${field.key}`} aria-label={field.label} className="h-12 rounded-xl bg-muted">
              <SelectValue placeholder={field.all} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">{field.all}</SelectItem>
              {field.options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      ))}
      <Button type="button" variant="outline" size="icon" className="h-12 w-12 rounded-xl" aria-label="Réinitialiser les filtres géographiques" title="Réinitialiser les filtres géographiques" disabled={!selected.region && !selected.departement && !selected.ville} onClick={() => onChange({ region: undefined, departement: undefined, ville: undefined })}>
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}