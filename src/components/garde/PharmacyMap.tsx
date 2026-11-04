import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";

export type MapPharmacy = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  on_duty: boolean;
  phone: string | null;
};

/** True only once we know the screen is tablet/desktop width (md+). */
export function useIsWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const on = () => setWide(mql.matches);
    on();
    mql.addEventListener("change", on);
    return () => mql.removeEventListener("change", on);
  }, []);
  return wide;
}

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

/**
 * Interactive OpenStreetMap of pharmacies. Leaflet is imported dynamically
 * after mount so SSR never evaluates it.
 */
export function PharmacyMap({
  pharmacies,
  center,
  className,
}: {
  pharmacies: MapPharmacy[];
  center: { lat: number; lng: number };
  className?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const layer = useRef<LayerGroup | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !el.current || map.current) return;
      const m = L.map(el.current, { zoomControl: true, scrollWheelZoom: false }).setView(
        [center.lat, center.lng],
        13,
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© contributeurs OpenStreetMap",
      }).addTo(m);
      map.current = m;
      layer.current = L.layerGroup().addTo(m);
      setReady(true);
    })();
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || !map.current || !layer.current) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !map.current || !layer.current) return;
      const g = layer.current;
      g.clearLayers();
      L.circleMarker([center.lat, center.lng], { radius: 9, className: "garde-marker-me" })
        .bindTooltip("Vous êtes ici")
        .addTo(g);
      const pts: [number, number][] = [[center.lat, center.lng]];
      for (const p of pharmacies) {
        pts.push([p.lat, p.lng]);
        L.circleMarker([p.lat, p.lng], {
          radius: 8,
          className: p.on_duty ? "garde-marker garde-marker-duty" : "garde-marker",
        })
          .bindPopup(
            `<strong>${escapeHtml(p.name)}</strong>` +
              (p.phone
                ? `<br/><a href="tel:${escapeHtml(p.phone.replace(/\s/g, ""))}">${escapeHtml(p.phone)}</a>`
                : "") +
              `<br/><a href="/pharmacies/${encodeURIComponent(p.id)}">Voir les détails</a>`,
          )
          .addTo(g);
      }
      map.current.invalidateSize();
      if (pts.length > 1)
        map.current.fitBounds(L.latLngBounds(pts), { padding: [30, 30], maxZoom: 15 });
      else map.current.setView([center.lat, center.lng], 13);
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, pharmacies, center.lat, center.lng]);

  return (
    <div
      ref={el}
      className={`isolate z-0 ${className ?? ""}`}
      role="region"
      aria-label="Carte des pharmacies"
    />
  );
}
