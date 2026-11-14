import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { activeDuty } from "@/lib/duty";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const getPharmacyPublic = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { data: row, error } = await publicClient()
      .from("pharmacies")
      .select("id, name, address, locality, city, commune, region, department, phone, habitual_hours, information_source, checked_at, validation_status, lat, lng, owner_id, updated_at")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    const { owner_id, ...rest } = row;
    const { data: rotations, error: rotationError } = await publicClient().from("duty_rotations").select("*").eq("pharmacy_id", data.id).order("starts_at", { ascending: false });
    if (rotationError) throw new Error(rotationError.message);
    const duty = activeDuty(rotations ?? []);
    return { ...rest, opening_hours: row.habitual_hours, managed: owner_id != null, on_duty: duty != null, on_duty_until: duty?.ends_at ?? null, duty, rotations: rotations ?? [] };
  });

export const getMedicinePublic = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { data: row, error } = await publicClient().from("medicines").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });
