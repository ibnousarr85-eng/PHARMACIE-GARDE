import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminPharmacies } from "@/components/garde/AdminPharmacies";

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), city: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({ Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span> }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  rpc: mocks.rpc,
  from: () => {
    const query = {
      select: () => query,
      order: () => query,
      eq: (_field: string, city: string) => { mocks.city(city); return query; },
      or: () => query,
      range: async () => ({ data: [{ id: "fixture", name: "Pharmacie test non publiée", address: "", city: "Dakar", phone: "", opening_hours: "", is_on_duty: false, on_duty_until: null }], count: 1, error: null }),
    };
    return query;
  },
} }));

afterEach(() => { cleanup(); vi.clearAllMocks(); });
function open() {
  mocks.rpc.mockResolvedValue({ data: [], error: null });
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><AdminPharmacies /></QueryClientProvider>);
}
describe("Admin pharmacy controls", () => {
  it("searches Dakar and saves contact fields through the restricted RPC", async () => {
    open();
    const phone = await screen.findByRole("textbox", { name: "Téléphone — Pharmacie test non publiée" });
    expect(mocks.city).toHaveBeenCalledWith("Dakar");
    fireEvent.change(phone, { target: { value: "33 823 03 33" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Horaires — Pharmacie test non publiée" }), { target: { value: "Mo-Sa 08:00-22:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer les coordonnées" }));
    await waitFor(() => expect(mocks.rpc).toHaveBeenCalledWith("admin_update_pharmacy", {
      p_id: "fixture", p_update_contact: true, p_phone: "+221338230333", p_opening_hours: "Mo-Sa 08:00-22:00",
    }));
  });
  it("does not activate duty by clicking the switch alone", async () => {
    open();
    fireEvent.click(await screen.findByRole("switch"));
    expect(mocks.rpc.mock.calls.filter(([name]) => name === "admin_update_pharmacy")).toHaveLength(0);
    expect(screen.getByLabelText("Publication de garde vérifiée")).toBeInTheDocument();
  });
});