CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read their own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.pharmacy_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  contact_email text,
  pharmacy_id uuid REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  name text,
  address text,
  city text,
  phone text,
  opening_hours text,
  lat double precision,
  lng double precision,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (pharmacy_id IS NOT NULL OR (name IS NOT NULL AND lat IS NOT NULL AND lng IS NOT NULL))
);
CREATE UNIQUE INDEX pharmacy_requests_one_pending_per_user ON public.pharmacy_requests (user_id) WHERE status = 'pending';
CREATE INDEX pharmacy_requests_status_idx ON public.pharmacy_requests (status, created_at DESC);

GRANT SELECT, INSERT, DELETE ON public.pharmacy_requests TO authenticated;
GRANT ALL ON public.pharmacy_requests TO service_role;
ALTER TABLE public.pharmacy_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requesters and admins read requests" ON public.pharmacy_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Pharmacists submit a request" ON public.pharmacy_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND NOT EXISTS (SELECT 1 FROM public.pharmacies p WHERE p.owner_id = auth.uid()));
CREATE POLICY "Pharmacists cancel their pending request" ON public.pharmacy_requests FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending');

-- Force trusted values on insert so requesters cannot pre-approve themselves or fake their e-mail.
CREATE OR REPLACE FUNCTION public.prepare_pharmacy_request()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.user_id := auth.uid();
  NEW.contact_email := auth.jwt() ->> 'email';
  NEW.status := 'pending';
  NEW.admin_note := NULL;
  NEW.reviewed_by := NULL;
  NEW.reviewed_at := NULL;
  RETURN NEW;
END; $$;
CREATE TRIGGER pharmacy_requests_prepare BEFORE INSERT ON public.pharmacy_requests
  FOR EACH ROW EXECUTE FUNCTION public.prepare_pharmacy_request();

-- Admin review: approving links the account to the pharmacy (or creates it).
CREATE OR REPLACE FUNCTION public.review_pharmacy_request(p_request_id uuid, p_approve boolean, p_note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.pharmacy_requests%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Réservé aux administrateurs'; END IF;
  SELECT * INTO r FROM public.pharmacy_requests WHERE id = p_request_id AND status = 'pending' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Demande introuvable ou déjà traitée'; END IF;

  IF p_approve THEN
    IF EXISTS (SELECT 1 FROM public.pharmacies WHERE owner_id = r.user_id) THEN
      RAISE EXCEPTION 'Ce compte gère déjà une pharmacie';
    END IF;
    PERFORM set_config('garde.claiming', 'on', true);
    IF r.pharmacy_id IS NOT NULL THEN
      UPDATE public.pharmacies SET owner_id = r.user_id WHERE id = r.pharmacy_id AND owner_id IS NULL;
      IF NOT FOUND THEN RAISE EXCEPTION 'Cette pharmacie est déjà gérée par un autre compte'; END IF;
    ELSE
      INSERT INTO public.pharmacies (name, address, city, phone, opening_hours, lat, lng, owner_id, source)
      VALUES (r.name, r.address, r.city, r.phone, r.opening_hours, r.lat, r.lng, r.user_id, 'pharmacist');
    END IF;
    PERFORM set_config('garde.claiming', 'off', true);
    UPDATE public.pharmacy_requests
      SET status = 'rejected', admin_note = 'Pharmacie attribuée à un autre compte', reviewed_by = auth.uid(), reviewed_at = now()
      WHERE status = 'pending' AND id <> r.id AND r.pharmacy_id IS NOT NULL AND pharmacy_id = r.pharmacy_id;
  END IF;

  UPDATE public.pharmacy_requests
    SET status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
        admin_note = NULLIF(trim(coalesce(p_note, '')), ''),
        reviewed_by = auth.uid(), reviewed_at = now()
    WHERE id = r.id;
END; $$;
REVOKE EXECUTE ON FUNCTION public.review_pharmacy_request(uuid, boolean, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.review_pharmacy_request(uuid, boolean, text) TO authenticated;

-- Pharmacists can no longer link themselves or add pharmacies directly.
DROP POLICY IF EXISTS "Pharmacists add their own pharmacy" ON public.pharmacies;
DROP FUNCTION IF EXISTS public.claim_pharmacy(uuid);