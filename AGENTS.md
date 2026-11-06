<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Architecture rules

- Pharmacy rows come from an OpenStreetMap import (`osm_id`, `source='osm'`) plus pharmacist-added rows (`source='pharmacist'`); never invent pharmacy data — real data only.
- Nearest-pharmacy search runs in the database (`nearest_pharmacies` / `pharmacies_with_medicine` RPCs, haversine) so the browser never downloads the whole country.
- Geographic pharmacy filtering uses `nearest_pharmacies_filtered` and official OCHA COD-AB v02 department polygons (including Keur Massar); choices come from `pharmacy_geographic_options`, and URL geographic selections never change LocationProvider's GPS coordinates. Boundary source: https://data.humdata.org/dataset/cod-ab-sen; import the ADM2 GeoJSON into pharmacy_departments using its codes, names and geometry.
- A pharmacist account owns at most one pharmacy via `pharmacies.owner_id`; pharmacists only file `pharmacy_requests`, and ownership is set (or a pharmacist pharmacy created) solely by the admin-only `review_pharmacy_request` RPC (a trigger blocks other owner_id edits) so stock RLS can trust it.
- Admins are rows in `user_roles` checked with `has_role`; never derive admin status from profile data or client storage.
- Navigation (bottom tab bar below `md`, `TopNav` header at `md+`) and the `BackLink` pill live in `AppShell`, so every page gets the same navigation.
- Stock writes go straight from the browser with RLS checking pharmacy ownership; no server function needed.
- User position lives in `LocationProvider` (src/lib/location.tsx), persisted in localStorage, with a city fallback list when GPS is denied.
- Public detail pages load via `src/lib/public.functions.ts` (publishable-key server client) so SSR can set per-page titles.
- UI is mobile-first: below `md` it stays the max-w-md phone frame from the mockups; `md:` classes add the wide desktop/tablet layout, and `AppShell` `footer` is mobile-only.
- Interactive maps use Leaflet imported dynamically inside effects (`PharmacyMap`) and mounted only at md+, so SSR never evaluates it.
