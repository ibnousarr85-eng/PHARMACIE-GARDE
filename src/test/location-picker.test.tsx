import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocationPicker } from "@/components/garde/LocationPicker";
import { LocationProvider, useUserLocation } from "@/lib/location";

function Position() {
  const { location } = useUserLocation();
  return <output data-testid="position">{JSON.stringify(location)}</output>;
}

const getCurrentPosition = vi.fn();

function mount() {
  render(<LocationProvider><LocationPicker /><Position /></LocationProvider>);
}

describe("Location picker", () => {
  beforeEach(() => {
    localStorage.clear();
    getCurrentPosition.mockReset();
    getCurrentPosition.mockImplementation((success) => success({ coords: { latitude: 14.7771, longitude: -17.3901 } }));
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition } });
  });
  afterEach(cleanup);

  it.each(["Votre localisation", "Utiliser ma position actuelle"])("requests GPS directly when clicking %s", async (label) => {
    mount();
    fireEvent.click(screen.getByText(label));
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(JSON.parse(screen.getByTestId("position").textContent ?? "null")).toMatchObject({ lat: 14.7771, lng: -17.3901, source: "gps" }));
  });

  it("switches to a manual city and back to GPS without changing position on mode selection", async () => {
    mount();
    fireEvent.click(screen.getByText("Votre localisation"));
    expect(JSON.parse(screen.getByTestId("position").textContent ?? "null").source).toBe("gps");
    fireEvent.change(screen.getByRole("combobox", { name: "Choisir une ville" }), { target: { value: "Thiès" } });
    expect(JSON.parse(screen.getByTestId("position").textContent ?? "null")).toMatchObject({ lat: 14.8255, lng: -17.0997, source: "city" });
    fireEvent.click(screen.getByRole("button", { name: "Utiliser ma position actuelle (GPS)" }));
    await waitFor(() => expect(JSON.parse(screen.getByTestId("position").textContent ?? "null")).toMatchObject({ lat: 14.7771, lng: -17.3901, source: "gps" }));
  });

  it("keeps manual choice available after GPS permission is denied", async () => {
    getCurrentPosition.mockImplementation((_success, failure) => failure({ code: 1 }));
    mount();
    fireEvent.click(screen.getByText("Votre localisation"));
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByRole("combobox", { name: "Choisir une ville" }), { target: { value: "Dakar" } });
    await waitFor(() => expect(JSON.parse(screen.getByTestId("position").textContent ?? "null").source).toBe("city"));
  });

  it("offers GPS and a city immediately without a mode switch", () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Utiliser ma position actuelle (GPS)" }));
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByRole("combobox", { name: "Choisir une ville" }), { target: { value: "Dakar" } });
    expect(JSON.parse(screen.getByTestId("position").textContent ?? "null").source).toBe("city");
  });

  it.each([2, 3])("retries error code %s with a lower-accuracy 15-second request", async (code) => {
    getCurrentPosition.mockImplementationOnce((_success, failure) => failure({ code }));
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Utiliser ma position actuelle (GPS)" }));
    expect(getCurrentPosition).toHaveBeenCalledTimes(2);
    expect(getCurrentPosition.mock.calls[0]?.[2]).toEqual({ enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
    expect(getCurrentPosition.mock.calls[1]?.[2]).toEqual({ enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 });
    await waitFor(() => expect(JSON.parse(screen.getByTestId("position").textContent ?? "null")).toMatchObject({ lat: 14.7771, lng: -17.3901, source: "gps" }));
  });

  it.each([1, 2, 3])("stops after the final error code %s and preserves the selected city", (code) => {
    getCurrentPosition.mockImplementation((_success, failure) => failure({ code: 3 }));
    getCurrentPosition.mockImplementationOnce((_success, failure) => failure({ code: 3 }));
    getCurrentPosition.mockImplementationOnce((_success, failure) => failure({ code }));
    mount();
    fireEvent.change(screen.getByRole("combobox", { name: "Choisir une ville" }), { target: { value: "Thiès" } });
    fireEvent.click(screen.getByRole("button", { name: "Utiliser ma position actuelle (GPS)" }));
    expect(getCurrentPosition).toHaveBeenCalledTimes(2);
    expect(JSON.parse(screen.getByTestId("position").textContent ?? "null")).toMatchObject({ lat: 14.8255, lng: -17.0997, source: "city" });
    expect(screen.getByRole("button", { name: "Utiliser ma position actuelle (GPS)" })).toBeEnabled();
  });

  it("does not retry permission denial and allows a subsequent successful request", async () => {
    getCurrentPosition.mockImplementationOnce((_success, failure) => failure({ code: 1 }));
    mount();
    fireEvent.click(screen.getByText("Votre localisation"));
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Utiliser ma position actuelle (GPS)" }));
    await waitFor(() => expect(JSON.parse(screen.getByTestId("position").textContent ?? "null")).toMatchObject({ source: "gps" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps the request busy until the fallback resolves", async () => {
    let finish: PositionCallback | undefined;
    getCurrentPosition.mockImplementationOnce((_success, failure) => failure({ code: 3 }));
    getCurrentPosition.mockImplementationOnce((success) => { finish = success; });
    mount();
    fireEvent.click(screen.getByText("Votre localisation"));
    expect(getCurrentPosition).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: "Utiliser ma position actuelle (GPS)" })).toBeDisabled();
    act(() => finish?.({ coords: { latitude: 14.7771, longitude: -17.3901 } } as GeolocationPosition));
    await waitFor(() => expect(screen.getByRole("button", { name: "Utiliser ma position actuelle (GPS)" })).toBeEnabled());
  });
});