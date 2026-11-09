-- À exécuter uniquement avec l'outil privilégié de changement de données.
-- Données fournies par l'utilisateur : DIMO, non confirmées SPPS/ARP.
-- Ne crée aucune officine et ne modifie ni propriétaires ni permissions.
-- Les UUID audités, noms et villes doivent tous correspondre ; aucune recherche
-- approximative ne peut modifier une autre officine. Réexécution idempotente.
-- Non appliqués : Abdoul Aziz Vezia (nom/ville différents malgré même téléphone),
-- Ainoumadi (Ainoumady à Keur Massar, identité non établie), Anna Kadet,
-- Cheikh Ahmadou Bamba à Dakar, Al Bouchra et Albert Faye à Thiès,
-- Al Fayda et Boulevard à Kaolack (aucune correspondance dans la ville).
WITH rotation(id, name_pattern, city_key, phone, opening_hours, starts_at, until_at) AS (
  VALUES
    ('fe8c437e-ca9c-4233-a13f-3d3ac829bc27'::uuid, '%guigon%', 'dakar', '+221338230333', '07h-22h', '2026-11-09T00:00:00Z'::timestamptz, '2026-11-16T23:59:59Z'::timestamptz),
    ('eae78c49-4b24-4b61-9691-c5db8305a9e9'::uuid, '%aminata%', 'pikine', '+221338549582', '08h-23h', '2026-11-09T00:00:00Z'::timestamptz, '2026-11-16T23:59:59Z'::timestamptz),
    ('021d1dda-1547-4dc8-8f10-98a99026fc92'::uuid, '%atlantique%', 'dakar', '+221338602424', '09h-23h', '2026-11-09T00:00:00Z'::timestamptz, '2026-11-16T23:59:59Z'::timestamptz),
    ('9e2ca8b4-66cd-4e1a-a332-4aca6f89c30e'::uuid, '%ceerno%yaal%', 'pikine', '+221338357850', '08h-23h', '2026-11-09T00:00:00Z'::timestamptz, '2026-11-16T23:59:59Z'::timestamptz),
    ('247dd51a-c1ff-4982-ba10-ed90c1706276'::uuid, '%centrale%', 'rufisque', '+221338360059', '08h-22h', '2026-11-09T00:00:00Z'::timestamptz, '2026-11-16T23:59:59Z'::timestamptz),
    ('28585cc0-371b-43b4-b007-f58c7e54db09'::uuid, '%renaissance%', 'dakar', '+221338602482', '24h/24', '2026-11-09T00:00:00Z'::timestamptz, '2026-11-16T23:59:59Z'::timestamptz),
    ('2384d2cc-d758-46e6-bfad-a08459e97919'::uuid, '%cite%avion%', 'dakar', '+221338606161', '08h-23h', '2026-11-09T00:00:00Z'::timestamptz, '2026-11-16T23:59:59Z'::timestamptz),
    ('1b56a5de-fdd9-48e7-bd53-5a5a298001bb'::uuid, '%mame%awa%', 'saint-louis', '+221339615253', '24h/24', '2026-11-07T00:00:00Z'::timestamptz, '2026-11-14T23:59:59Z'::timestamptz)
)
UPDATE public.pharmacies AS p
SET is_on_duty = true,
    duty_starts_at = r.starts_at,
    on_duty_until = r.until_at,
    duty_publication = CASE WHEN r.city_key = 'saint-louis'
      THEN 'DIMO Santé (rotation 07-14 nov 2026 - non confirmée SPPS/ARP)'
      ELSE 'DIMO Santé (rotation 09-16 nov 2026 - non confirmée SPPS/ARP)' END,
    phone = r.phone,
    opening_hours = r.opening_hours,
    updated_at = now()
FROM rotation AS r
WHERE p.id = r.id
  AND translate(lower(p.name), 'àâäéèêëîïôöùûüç', 'aaaeeeeiioouuuc') ILIKE r.name_pattern
  AND translate(lower(p.city), 'àâäéèêëîïôöùûüç', 'aaaeeeeiioouuuc') = r.city_key
RETURNING p.id, p.name, p.city, p.phone, p.opening_hours,
          p.is_on_duty, p.duty_starts_at, p.on_duty_until, p.duty_publication;