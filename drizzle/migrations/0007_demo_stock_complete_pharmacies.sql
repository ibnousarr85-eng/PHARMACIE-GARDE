CREATE OR REPLACE FUNCTION public.demo_pharmacies_with_medicine(p_medicine_id uuid, p_lat double precision, p_lng double precision)
 RETURNS TABLE(id uuid, name text, address text, locality text, city text, phone text, opening_hours text, lat double precision, lng double precision, on_duty boolean, duty_publication text, quantity integer, price_fcfa integer, stock_updated_at timestamp with time zone, distance_km double precision)
 LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$
 SELECT p.id,p.name,p.address,p.locality,p.city,p.phone,p.habitual_hours,p.lat,p.lng,
 EXISTS(SELECT 1 FROM public.pharmacy_duty_at(p.id)),p.duty_publication,
 s.quantity,s.price_fcfa,s.updated_at,public.distance_km(p_lat,p_lng,p.lat,p.lng)
 FROM public.pharmacy_demo_stock s JOIN public.pharmacies p ON p.id=s.pharmacy_id
 WHERE s.medicine_id=p_medicine_id
   AND p.phone IS NOT NULL AND p.address IS NOT NULL AND p.habitual_hours IS NOT NULL
 ORDER BY public.distance_km(p_lat,p_lng,p.lat,p.lng),p.id LIMIT 12;
$function$;