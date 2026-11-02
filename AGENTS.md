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
- A pharmacist account owns at most one pharmacy via `pharmacies.owner_id`; ownership changes only through the `claim_pharmacy` RPC (a trigger blocks other owner_id edits) so stock RLS can trust it.
- Stock writes go straight from the browser with RLS checking pharmacy ownership; no server function needed.
- User position lives in `LocationProvider` (src/lib/location.tsx), persisted in localStorage, with a city fallback list when GPS is denied.
- Public detail pages load via `src/lib/public.functions.ts` (publishable-key server client) so SSR can set per-page titles.
- UI is mobile-first inside `AppShell` (max-w-md) to match the phone mockups.
