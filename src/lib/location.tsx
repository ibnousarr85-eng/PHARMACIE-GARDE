import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { SENEGAL_CITIES } from "./cities";

export type UserLocation = {
  lat: number;
  lng: number;
  label: string;
  source: "gps" | "city";
};

type Ctx = {
  location: UserLocation | null;
  locating: boolean;
  error: string | null;
  requestGps: () => Promise<UserLocation | null>;
  setCity: (name: string) => void;
};

const LocationContext = createContext<Ctx | null>(null);
const KEY = "garde.location";

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setLocation(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const save = (loc: UserLocation) => {
    setLocation(loc);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(loc));
    } catch {
      /* ignore */
    }
  };

  const requestGps = useCallback(() => {
    return new Promise<UserLocation | null>((resolve) => {
      if (!("geolocation" in navigator)) {
        setError("La géolocalisation n'est pas disponible sur cet appareil.");
        resolve(null);
        return;
      }
      setLocating(true);
      setError(null);
      const onSuccess = (pos: GeolocationPosition) => {
          const loc: UserLocation = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            label: "Ma position actuelle",
            source: "gps",
          };
          save(loc);
          setError(null);
          setLocating(false);
          resolve(loc);
      };
      const onFailure = (error: GeolocationPositionError) => {
          const messages: Record<number, string> = {
            1: "Autorisation de localisation refusée. Veuillez autoriser l'accès au GPS dans les paramètres de votre navigateur.",
            2: "Signal GPS introuvable sur votre appareil. Activez votre localisation ou choisissez votre ville.",
            3: "Délai de localisation dépassé. Réessayez ou choisissez votre ville ci-dessous.",
          };
          setError(messages[error.code] ?? "Localisation indisponible. Réessayez ou choisissez votre ville ci-dessous.");
          setLocating(false);
          resolve(null);
      };
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        (error) => {
          if (error.code === 2 || error.code === 3) {
            navigator.geolocation.getCurrentPosition(
              onSuccess,
              onFailure,
              { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
            );
            return;
          }
          onFailure(error);
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
      );
    });
  }, []);

  const setCity = useCallback((name: string) => {
    const c = SENEGAL_CITIES.find((x) => x.name === name);
    if (c) save({ lat: c.lat, lng: c.lng, label: c.name, source: "city" });
  }, []);

  return (
    <LocationContext.Provider value={{ location, locating, error, requestGps, setCity }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useUserLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useUserLocation must be used inside LocationProvider");
  return ctx;
}

export const DEFAULT_LOCATION: UserLocation = {
  lat: 14.6934,
  lng: -17.4479,
  label: "Dakar",
  source: "city",
};
