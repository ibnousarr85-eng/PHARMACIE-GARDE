// Coordinates of Senegal's main towns (from OpenStreetMap), used when GPS is unavailable.
export type City = { name: string; lat: number; lng: number };

export const SENEGAL_CITIES: City[] = [
  { name: "Dakar", lat: 14.6934, lng: -17.4479 },
  { name: "Pikine", lat: 14.7515, lng: -17.3964 },
  { name: "Guédiawaye", lat: 14.7771, lng: -17.3901 },
  { name: "Rufisque", lat: 14.7164, lng: -17.2738 },
  { name: "Thiès", lat: 14.8255, lng: -17.0997 },
  { name: "Mbour", lat: 14.4207, lng: -16.9715 },
  { name: "Saint-Louis", lat: 16.028, lng: -16.5049 },
  { name: "Kaolack", lat: 14.1388, lng: -16.0764 },
  { name: "Touba", lat: 14.8646, lng: -15.876 },
  { name: "Mbacké", lat: 14.7971, lng: -15.9067 },
  { name: "Diourbel", lat: 14.6546, lng: -16.2278 },
  { name: "Bambey", lat: 14.6955, lng: -16.4493 },
  { name: "Louga", lat: 15.6119, lng: -16.2233 },
  { name: "Tivaouane", lat: 14.9515, lng: -16.8129 },
  { name: "Fatick", lat: 14.334, lng: -16.4042 },
  { name: "Joal-Fadiouth", lat: 14.1583, lng: -16.8355 },
  { name: "Kaffrine", lat: 14.102, lng: -15.5484 },
  { name: "Ziguinchor", lat: 12.5635, lng: -16.2725 },
  { name: "Kolda", lat: 12.8921, lng: -14.9401 },
  { name: "Sédhiou", lat: 12.7099, lng: -15.5573 },
  { name: "Tambacounda", lat: 13.7693, lng: -13.6683 },
  { name: "Kédougou", lat: 12.5571, lng: -12.1856 },
  { name: "Matam", lat: 15.6566, lng: -13.2559 },
  { name: "Richard-Toll", lat: 16.4663, lng: -15.6884 },
];
