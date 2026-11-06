import { describe, expect, it } from "vitest";
import { changeGeography, geographicChoices } from "@/lib/geography";

const rows = [
  { region: "Dakar", department: "Dakar", city: "Dakar" },
  { region: "Dakar", department: "Keur Massar", city: "Yeumbeul" },
  { region: "Thiès", department: "Mbour", city: "Mbour" },
  { region: "Thiès", department: "Tivaouane", city: null },
];
describe("Geographic pharmacy filters", () => {
  it("restricts departments to the selected region", () => {
    expect(geographicChoices(rows, { region: "Dakar" }).departments).toEqual(["Dakar", "Keur Massar"]);
  });
  it("restricts cities to the selected department", () => {
    expect(geographicChoices(rows, { region: "Dakar", departement: "Keur Massar" }).cities).toEqual(["Yeumbeul"]);
  });
  it("clears department and city when region changes", () => {
    expect(changeGeography({ region: "Dakar", departement: "Keur Massar", ville: "Yeumbeul" }, "region", "Thiès")).toEqual({ region: "Thiès", departement: undefined, ville: undefined });
  });
  it("clears the city when department changes", () => {
    expect(changeGeography({ region: "Dakar", departement: "Dakar", ville: "Dakar" }, "departement", "Keur Massar")).toEqual({ region: "Dakar", departement: "Keur Massar", ville: undefined });
  });
});