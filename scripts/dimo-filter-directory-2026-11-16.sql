-- DIMO pages retrieved through web search on 2026-11-16.
-- Preserve exact existing coordinates, names, duty history and stocks.
-- Phones identify the source for address-only enrichment; missing schedules stay NULL.
begin;
with evidence(id,expected_name,expected_phone,address,phone,hours,url) as (values
 ('c34bff31-999b-49a0-a8af-eae0494d7683'::uuid,'Pharmacie Fatou Ideu Si',null,'Rue GY 316, Grand Yoff, Dakar','+221338278720','Ouvert tous les jours, 7h – 23h.','https://dimomed.com/structures-de-sante/pharmacie-fatou-ideu-sy/'),
 ('6ac316d5-124c-423d-a4d5-21aac1651ff6'::uuid,'Pharmacie El Hadji Haidra et Awa',null,'CICES Foire n°158, Dakar','+221338276904','Ouvert du lundi au samedi, 8h – 23h. Le dimanche, 10h – 22h.','https://dimomed.com/structures-de-sante/pharmacie-el-hadji-aidara-awa/'),
 ('0e663252-9426-4747-b5ea-ba7c72dc33a5'::uuid,'Pharmacie Ouest Foire','338207071','Ouest Foire VDN, à côté de l’école japonaise, Dakar','+221338207071',null,'https://dimomed.com/structures-de-sante/pharmacie-ouest-foire/'),
 ('d79e28f2-b89b-4cdf-8760-5a618a1c7927'::uuid,'Pharmacie Sainte-Face','338271059','HLM Grand Yoff n°1222, en face du stade Léopold Sédar Senghor, Dakar','+221338271059',null,'https://dimomed.com/structures-de-sante/pharmacie-sainte/'),
 ('afc0ed5f-2e1d-4c4c-b24b-db54535dd3da'::uuid,'Pharmacie Anarogil','338671090','Liberté 6 Extension CPI n°100 VDN, Dakar','+221338671090',null,'https://dimomed.com/structures-de-sante/pharmacie-anarogil/'),
 ('e1aaf3eb-f7e2-49e0-85db-c8c96eb83986'::uuid,'PHARMACIE AL MAHDI','338209430','Rue Seydina Thiaw, Yoff Layène, Dakar','+221338209430',null,'https://dimomed.com/structures-de-sante/pharmacie-al-mahdi/'),
 ('5ad5168f-0049-482b-82df-a1182de886c6'::uuid,'Pharmacie Khar Yalla','338274106','Grand Yoff Catt Urban, Dakar','+221338274106',null,'https://dimomed.com/structures-de-sante/pharmacie-khar-yalla/'),
 ('fb5603fb-3af4-48ca-bed1-d68a386f6a21'::uuid,'Lamine Konaté','338274303','Grand Yoff, avenue Hyacinthe Thiandoum n°161, Dakar','+221338274303',null,'https://dimomed.com/structures-de-sante/pharmacie-lamine-konate/'),
 ('7862dfd0-00ec-4396-9600-a80066d4f8e1'::uuid,'Pharmacie Maty','338274419','Rond-point lot 15, Dakar','+221338274419',null,'https://dimomed.com/structures-de-sante/pharmacie-maty/'),
 ('8f68cc34-d3b8-4094-8ebc-0a5a7ee1f75a'::uuid,'Pharmacie Ama Ndiaye','338209988','Ouest Foire, près du pont Yoff, Dakar','+221338209988','Ouvert tous les jours, 8h – 23h.','https://dimomed.com/structures-de-sante/pharmacie-ama-ndiaye/')
)
update public.pharmacies p set
 address=e.address,
 phone=e.phone,
 habitual_hours=coalesce(nullif(trim(p.habitual_hours),''),e.hours),
 information_source=case when coalesce(p.information_source,'osm')='osm' then 'DIMO Santé — '||e.url when position(e.url in p.information_source)>0 then p.information_source else p.information_source||'; DIMO Santé — '||e.url end,
 checked_at=now(),
 validation_status=case when p.validation_status='unverified' then 'source_checked' else p.validation_status end
from evidence e where p.id=e.id and lower(p.name)=lower(e.expected_name) and p.city='Dakar'
 and (e.expected_phone is null and p.phone is null or right(regexp_replace(p.phone,'[^0-9]','','g'),9)=e.expected_phone);
commit;