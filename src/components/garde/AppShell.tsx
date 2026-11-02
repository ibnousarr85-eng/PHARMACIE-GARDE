import { Link, useRouter } from "@tanstack/react-router";
import { ChevronLeft, Plus } from "lucide-react";
import type { ReactNode } from "react";

export function BrandHeader() {
  return (
    <Link to="/" className="flex items-center gap-4" aria-label="GARDE — accueil">
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
        <Plus className="h-9 w-9" strokeWidth={3} />
      </span>
      <span className="flex flex-col">
        <span className="text-3xl font-extrabold leading-none tracking-tight text-foreground">GARDE</span>
        <span className="mt-1 text-[15px] font-medium text-foreground/85">Votre santé, près de vous.</span>
      </span>
    </Link>
  );
}

export function BackLink({ to }: { to?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (to ? router.navigate({ to }) : router.history.back())}
      className="inline-flex items-center gap-1 text-[15px] font-semibold text-primary"
    >
      <ChevronLeft className="h-4 w-4" strokeWidth={2.5} /> Retour
    </button>
  );
}

export function AppShell({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/60">
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-background">
        {/* decorative blobs */}
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-16 h-80 w-80 rounded-full bg-blob" />
        <div aria-hidden className="pointer-events-none absolute -left-28 top-40 h-72 w-72 rounded-full bg-blob/70" />

        <div className="relative z-10 flex flex-1 flex-col px-5 pb-6 pt-8">
          <header className="mb-6">
            <BrandHeader />
          </header>
          <main className="flex flex-1 flex-col">{children}</main>
        </div>

        {footer && <div className="relative z-10 px-5 pb-6">{footer}</div>}

        <svg aria-hidden viewBox="0 0 400 40" preserveAspectRatio="none" className="relative h-10 w-full text-wave">
          <path d="M0 18 C 80 2, 160 30, 240 16 S 360 6, 400 14 L400 40 L0 40 Z" fill="currentColor" />
        </svg>
        <footer className="bg-wave px-5 pb-4 pt-1 text-center text-xs text-muted-foreground">
          GARDE — Votre santé, près de vous. · Données pharmacies © contributeurs OpenStreetMap
        </footer>
      </div>
    </div>
  );
}
