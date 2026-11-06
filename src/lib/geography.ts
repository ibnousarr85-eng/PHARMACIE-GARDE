export type GeographicSelection = { region?: string; departement?: string; ville?: string };
export type GeographicOption = { region: string; department: string; city: string | null };

export function changeGeography(current: GeographicSelection, field: keyof GeographicSelection, value: string): GeographicSelection {
  const next = value || undefined;
  if (field === "region") return { region: next, departement: undefined, ville: undefined };
  if (field === "departement") return { ...current, departement: next, ville: undefined };
  return { ...current, ville: next };
}

export function geographicChoices(rows: GeographicOption[], selected: GeographicSelection) {
  const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b, "fr"));
  const inRegion = rows.filter((row) => !selected.region || row.region === selected.region);
  const inDepartment = inRegion.filter((row) => !selected.departement || row.department === selected.departement);
  return {
    regions: unique(rows.map((row) => row.region)),
    departments: unique(inRegion.map((row) => row.department)),
    cities: unique(inDepartment.flatMap((row) => row.city ? [row.city] : [])),
  };
}