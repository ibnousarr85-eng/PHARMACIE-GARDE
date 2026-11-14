import { FlaskConical } from "lucide-react";

export function DemoNotice() {
  return (
    <aside className="my-4 border-l-4 border-primary bg-secondary p-4 text-secondary-foreground" role="note">
      <p className="flex items-start gap-2 font-bold"><FlaskConical className="mt-0.5 h-5 w-5 shrink-0" />Données de démonstration (Soutenance)</p>
      <p className="mt-2 text-sm">Quantités fictives et prix indicatifs en FCFA. Disponibilité non confirmée par les pharmacies. Les numéros d’appel sont réels.</p>
    </aside>
  );
}