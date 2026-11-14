CREATE TABLE public.pharmacy_demo_stock (
 pharmacy_id uuid NOT NULL REFERENCES public.pharmacies(id),
 medicine_id uuid NOT NULL REFERENCES public.medicines(id),
 quantity integer NOT NULL CHECK (quantity > 0),
 price_fcfa integer NOT NULL CHECK (price_fcfa > 0),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (pharmacy_id, medicine_id)
);
GRANT SELECT ON public.pharmacy_demo_stock TO anon, authenticated;
GRANT ALL ON public.pharmacy_demo_stock TO service_role;
ALTER TABLE public.pharmacy_demo_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public demonstration stock reads" ON public.pharmacy_demo_stock FOR SELECT TO anon, authenticated USING (true);
COMMENT ON TABLE public.pharmacy_demo_stock IS 'Soutenance only: synthetic quantities and prices, never verified availability. Separate from pharmacy_stock.';
CREATE FUNCTION public.demo_pharmacies_with_medicine(p_medicine_id uuid, p_lat double precision, p_lng double precision)
RETURNS TABLE(id uuid, name text, address text, locality text, city text, phone text, opening_hours text, lat double precision, lng double precision, on_duty boolean, duty_publication text, quantity integer, price_fcfa integer, stock_updated_at timestamptz, distance_km double precision)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
 SELECT p.id,p.name,p.address,p.locality,p.city,p.phone,p.opening_hours,p.lat,p.lng,
 (p.is_on_duty AND p.duty_starts_at <= now() AND p.on_duty_until > now()),p.duty_publication,
 s.quantity,s.price_fcfa,s.updated_at,public.distance_km(p_lat,p_lng,p.lat,p.lng)
 FROM public.pharmacy_demo_stock s JOIN public.pharmacies p ON p.id=s.pharmacy_id
 WHERE s.medicine_id=p_medicine_id
 ORDER BY public.distance_km(p_lat,p_lng,p.lat,p.lng),p.id LIMIT 8;
$$;
REVOKE ALL ON FUNCTION public.demo_pharmacies_with_medicine(uuid,double precision,double precision) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.demo_pharmacies_with_medicine(uuid,double precision,double precision) TO anon,authenticated,service_role;