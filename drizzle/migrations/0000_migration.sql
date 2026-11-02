
CREATE TABLE public.pharmacies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  osm_id text UNIQUE,
  name text NOT NULL,
  address text,
  locality text,
  city text,
  phone text,
  opening_hours text,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  is_on_duty boolean NOT NULL DEFAULT false,
  on_duty_until timestamptz,
  source text NOT NULL DEFAULT 'osm',
  owner_id uuid UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pharmacies TO anon;
GRANT SELECT, INSERT, UPDATE ON public.pharmacies TO authenticated;
GRANT ALL ON public.pharmacies TO service_role;
ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pharmacies are public" ON public.pharmacies FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Pharmacists add their own pharmacy" ON public.pharmacies FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND source = 'pharmacist');
CREATE POLICY "Owners update their pharmacy" ON public.pharmacies FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE TABLE public.medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  dosage text,
  form text,
  package text,
  category text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name, dosage, form)
);
GRANT SELECT ON public.medicines TO anon;
GRANT SELECT, INSERT ON public.medicines TO authenticated;
GRANT ALL ON public.medicines TO service_role;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Medicines are public" ON public.medicines FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Pharmacists add medicines" ON public.medicines FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND EXISTS (SELECT 1 FROM public.pharmacies p WHERE p.owner_id = auth.uid()));

CREATE TABLE public.pharmacy_stock (
  pharmacy_id uuid NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  medicine_id uuid NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  price_fcfa integer CHECK (price_fcfa IS NULL OR price_fcfa >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (pharmacy_id, medicine_id)
);
GRANT SELECT ON public.pharmacy_stock TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pharmacy_stock TO authenticated;
GRANT ALL ON public.pharmacy_stock TO service_role;
ALTER TABLE public.pharmacy_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Stock is public" ON public.pharmacy_stock FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Owners insert stock" ON public.pharmacy_stock FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.pharmacies p WHERE p.id = pharmacy_id AND p.owner_id = auth.uid()));
CREATE POLICY "Owners update stock" ON public.pharmacy_stock FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pharmacies p WHERE p.id = pharmacy_id AND p.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.pharmacies p WHERE p.id = pharmacy_id AND p.owner_id = auth.uid()));
CREATE POLICY "Owners delete stock" ON public.pharmacy_stock FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pharmacies p WHERE p.id = pharmacy_id AND p.owner_id = auth.uid()));

CREATE INDEX pharmacy_stock_medicine_idx ON public.pharmacy_stock (medicine_id);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER pharmacies_touch BEFORE UPDATE ON public.pharmacies FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER stock_touch BEFORE UPDATE ON public.pharmacy_stock FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Owners can't change ownership / source through updates
CREATE OR REPLACE FUNCTION public.protect_pharmacy_owner() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_setting('garde.claiming', true) = 'on' THEN RETURN NEW; END IF;
  NEW.owner_id = OLD.owner_id; NEW.source = OLD.source; NEW.osm_id = OLD.osm_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER pharmacies_protect BEFORE UPDATE ON public.pharmacies FOR EACH ROW EXECUTE FUNCTION public.protect_pharmacy_owner();

CREATE OR REPLACE FUNCTION public.claim_pharmacy(p_pharmacy_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Connexion requise'; END IF;
  IF EXISTS (SELECT 1 FROM pharmacies WHERE owner_id = auth.uid()) THEN
    RAISE EXCEPTION 'Votre compte gère déjà une pharmacie';
  END IF;
  PERFORM set_config('garde.claiming', 'on', true);
  UPDATE pharmacies SET owner_id = auth.uid() WHERE id = p_pharmacy_id AND owner_id IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cette pharmacie est déjà gérée par un autre compte'; END IF;
  PERFORM set_config('garde.claiming', 'off', true);
END; $$;
REVOKE EXECUTE ON FUNCTION public.claim_pharmacy(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_pharmacy(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.distance_km(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
RETURNS double precision LANGUAGE sql IMMUTABLE AS $$
  SELECT 6371 * 2 * asin(sqrt(power(sin(radians(lat2 - lat1) / 2), 2) + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)));
$$;

CREATE OR REPLACE FUNCTION public.nearest_pharmacies(
  p_lat double precision, p_lng double precision,
  p_search text DEFAULT NULL, p_max_km double precision DEFAULT NULL,
  p_on_duty boolean DEFAULT false, p_with_phone boolean DEFAULT false, p_limit integer DEFAULT 50)
RETURNS TABLE (id uuid, name text, address text, locality text, city text, phone text, opening_hours text,
  lat double precision, lng double precision, on_duty boolean, on_duty_until timestamptz, distance_km double precision)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT p.id, p.name, p.address, p.locality, p.city, p.phone, p.opening_hours, p.lat, p.lng,
    (p.is_on_duty AND (p.on_duty_until IS NULL OR p.on_duty_until > now())) AS on_duty,
    p.on_duty_until,
    public.distance_km(p_lat, p_lng, p.lat, p.lng) AS distance_km
  FROM pharmacies p
  WHERE (p_search IS NULL OR p_search = '' OR p.name ILIKE '%' || p_search || '%' OR p.locality ILIKE '%' || p_search || '%' OR p.city ILIKE '%' || p_search || '%' OR p.address ILIKE '%' || p_search || '%')
    AND (p_max_km IS NULL OR public.distance_km(p_lat, p_lng, p.lat, p.lng) <= p_max_km)
    AND (NOT p_on_duty OR (p.is_on_duty AND (p.on_duty_until IS NULL OR p.on_duty_until > now())))
    AND (NOT p_with_phone OR p.phone IS NOT NULL)
  ORDER BY distance_km
  LIMIT LEAST(GREATEST(p_limit, 1), 200);
$$;
GRANT EXECUTE ON FUNCTION public.nearest_pharmacies(double precision, double precision, text, double precision, boolean, boolean, integer) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.pharmacies_with_medicine(p_medicine_id uuid, p_lat double precision, p_lng double precision, p_limit integer DEFAULT 30)
RETURNS TABLE (id uuid, name text, address text, locality text, city text, phone text,
  lat double precision, lng double precision, on_duty boolean, quantity integer, price_fcfa integer,
  stock_updated_at timestamptz, distance_km double precision)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT p.id, p.name, p.address, p.locality, p.city, p.phone, p.lat, p.lng,
    (p.is_on_duty AND (p.on_duty_until IS NULL OR p.on_duty_until > now())),
    s.quantity, s.price_fcfa, s.updated_at,
    public.distance_km(p_lat, p_lng, p.lat, p.lng) AS distance_km
  FROM pharmacy_stock s JOIN pharmacies p ON p.id = s.pharmacy_id
  WHERE s.medicine_id = p_medicine_id AND s.quantity > 0
  ORDER BY distance_km
  LIMIT LEAST(GREATEST(p_limit, 1), 100);
$$;
GRANT EXECUTE ON FUNCTION public.pharmacies_with_medicine(uuid, double precision, double precision, integer) TO anon, authenticated;
