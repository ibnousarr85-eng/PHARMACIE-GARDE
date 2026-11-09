ALTER TABLE public.pharmacies ADD COLUMN duty_publication text, ADD COLUMN duty_starts_at timestamptz;
CREATE OR REPLACE FUNCTION public.admin_update_pharmacy(p_id uuid, p_phone text DEFAULT NULL, p_opening_hours text DEFAULT NULL, p_on_duty boolean DEFAULT NULL, p_publication text DEFAULT NULL, p_starts_at timestamptz DEFAULT NULL, p_until timestamptz DEFAULT NULL, p_update_contact boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Accès réservé aux administrateurs'; END IF;
 IF p_update_contact AND NULLIF(btrim(p_phone),'') IS NOT NULL AND p_phone !~ '^\+221[0-9]{9}$' THEN RAISE EXCEPTION 'Numéro Sénégal attendu : +221 et neuf chiffres'; END IF;
 IF p_on_duty IS TRUE AND (NULLIF(btrim(p_publication),'') IS NULL OR p_starts_at IS NULL OR p_until IS NULL OR p_starts_at > now() OR p_until <= now() OR p_until <= p_starts_at) THEN RAISE EXCEPTION 'Publication vérifiée et période de garde actuelle requises'; END IF;
 UPDATE public.pharmacies SET
 phone = CASE WHEN p_update_contact THEN NULLIF(btrim(p_phone),'') ELSE phone END,
 opening_hours = CASE WHEN p_update_contact THEN NULLIF(btrim(p_opening_hours),'') ELSE opening_hours END,
 is_on_duty = COALESCE(p_on_duty,is_on_duty),
 on_duty_until = CASE WHEN p_on_duty IS TRUE THEN p_until WHEN p_on_duty IS FALSE THEN NULL ELSE on_duty_until END,
 duty_publication = CASE WHEN p_on_duty IS TRUE THEN btrim(p_publication) ELSE duty_publication END,
 duty_starts_at = CASE WHEN p_on_duty IS TRUE THEN p_starts_at ELSE duty_starts_at END,
 updated_at = now()
 WHERE id=p_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Pharmacie introuvable'; END IF;
END; $$;
REVOKE ALL ON FUNCTION public.admin_update_pharmacy(uuid,text,text,boolean,text,timestamptz,timestamptz,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_pharmacy(uuid,text,text,boolean,text,timestamptz,timestamptz,boolean) TO authenticated;