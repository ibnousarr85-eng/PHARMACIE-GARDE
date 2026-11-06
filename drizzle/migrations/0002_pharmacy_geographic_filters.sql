CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;
CREATE TABLE public.pharmacy_departments (
 code text PRIMARY KEY, department text NOT NULL, region text NOT NULL,
 boundary_geojson text NOT NULL,
 boundary extensions.geometry(MultiPolygon,4326) GENERATED ALWAYS AS (extensions.ST_Multi(extensions.ST_SetSRID(extensions.ST_GeomFromGeoJSON(boundary_geojson),4326))) STORED,
 source text NOT NULL DEFAULT 'OCHA COD-AB Sénégal v02, 2024-05-20 — https://data.humdata.org/dataset/cod-ab-sen'
);
GRANT SELECT ON public.pharmacy_departments TO anon, authenticated;
GRANT ALL ON public.pharmacy_departments TO service_role;
ALTER TABLE public.pharmacy_departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public administrative boundaries" ON public.pharmacy_departments FOR SELECT TO anon, authenticated USING (true);
CREATE INDEX pharmacy_departments_boundary_idx ON public.pharmacy_departments USING gist(boundary);
CREATE OR REPLACE FUNCTION public.pharmacy_geographic_options()
RETURNS TABLE(region text, department text, city text)
LANGUAGE sql STABLE SET search_path=public AS $$
 SELECT DISTINCT d.region,d.department,NULLIF(btrim(p.city),'') FROM pharmacy_departments d
 LEFT JOIN pharmacies p ON extensions.ST_Covers(d.boundary,extensions.ST_SetSRID(extensions.ST_MakePoint(p.lng,p.lat),4326))
 ORDER BY d.region,d.department,3;
$$;
GRANT EXECUTE ON FUNCTION public.pharmacy_geographic_options() TO anon,authenticated;
CREATE OR REPLACE FUNCTION public.nearest_pharmacies_filtered(
 p_lat double precision,p_lng double precision,p_search text DEFAULT NULL,p_max_km double precision DEFAULT NULL,
 p_on_duty boolean DEFAULT false,p_with_phone boolean DEFAULT false,p_limit integer DEFAULT 50,
 p_region text DEFAULT NULL,p_department text DEFAULT NULL,p_city text DEFAULT NULL)
RETURNS TABLE(id uuid,name text,address text,locality text,city text,phone text,opening_hours text,
 lat double precision,lng double precision,on_duty boolean,on_duty_until timestamptz,distance_km double precision)
LANGUAGE sql STABLE SET search_path=public AS $$
 SELECT p.id,p.name,p.address,p.locality,p.city,p.phone,p.opening_hours,p.lat,p.lng,
 (p.is_on_duty AND (p.on_duty_until IS NULL OR p.on_duty_until>now())),p.on_duty_until,
 public.distance_km(p_lat,p_lng,p.lat,p.lng) AS distance_km
 FROM pharmacies p
 WHERE (p_search IS NULL OR p_search='' OR p.name ILIKE '%'||p_search||'%' OR p.locality ILIKE '%'||p_search||'%' OR p.city ILIKE '%'||p_search||'%' OR p.address ILIKE '%'||p_search||'%')
 AND (p_max_km IS NULL OR public.distance_km(p_lat,p_lng,p.lat,p.lng)<=p_max_km)
 AND (NOT p_on_duty OR (p.is_on_duty AND (p.on_duty_until IS NULL OR p.on_duty_until>now())))
 AND (NOT p_with_phone OR p.phone IS NOT NULL)
 AND (NULLIF(p_city,'') IS NULL OR btrim(p.city)=p_city)
 AND ((NULLIF(p_region,'') IS NULL AND NULLIF(p_department,'') IS NULL) OR EXISTS (
 SELECT 1 FROM pharmacy_departments d WHERE (NULLIF(p_region,'') IS NULL OR d.region=p_region)
 AND (NULLIF(p_department,'') IS NULL OR d.department=p_department)
 AND extensions.ST_Covers(d.boundary,extensions.ST_SetSRID(extensions.ST_MakePoint(p.lng,p.lat),4326))))
 ORDER BY distance_km,p.id LIMIT LEAST(GREATEST(p_limit,1),200);
$$;
GRANT EXECUTE ON FUNCTION public.nearest_pharmacies_filtered(double precision,double precision,text,double precision,boolean,boolean,integer,text,text,text) TO anon,authenticated;