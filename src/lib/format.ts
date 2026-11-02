export function formatDistance(km: number | null | undefined) {
  if (km == null) return "";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(km < 10 ? 1 : 0).replace(".", ",")} km`;
}

export function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function directionsHref(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

const DAYS: Record<string, string> = {
  Mo: "Lun", Tu: "Mar", We: "Mer", Th: "Jeu", Fr: "Ven", Sa: "Sam", Su: "Dim", PH: "Fériés",
};

// Light translation of OpenStreetMap opening_hours into French.
export function formatHours(h: string | null | undefined) {
  if (!h) return null;
  if (h.trim() === "24/7") return "Ouverte 24h/24, 7j/7";
  return h
    .replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su|PH)\b/g, (d) => DAYS[d] ?? d)
    .replace(/\boff\b/g, "fermé")
    .replace(/;\s*/g, " · ");
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("fr-FR", {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}
