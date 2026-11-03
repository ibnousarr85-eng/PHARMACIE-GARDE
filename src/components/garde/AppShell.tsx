import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { ChevronLeft, Home, Pill, Plus, Store, Building2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

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

/**
 * Clear "Retour" pill. With `to`, always goes there; otherwise goes back in
 * history, or to `fallback` when the page was opened directly.
 */
export function BackLink({ to, fallback = "/", label = "Retour" }: { to?: string; fallback?: string; label?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        if (to) router.navigate({ to });
        else if (router.history.canGoBack()) router.history.back();
        else router.navigate({ to: fallback });
      }}
      className="inline-flex h-10 items-center gap-1 self-start rounded-full bg-secondary pl-2 pr-4 text-[15px] font-semibold text-secondary-foreground shadow-[var(--shadow-card)] transition-colors hover:bg-secondary/80"
    >
      <ChevronLeft className="h-5 w-5" strokeWidth={2.5} /> {label}
    </button>
  );
}

const TABS = [
  { to: "/", label: "Accueil", icon: Home, match: (p: string) => p === "/" },
  { to: "/pharmacies", label: "Pharmacies", icon: Building2, match: (p: string) => p.startsWith("/pharmacies") },
  { to: "/medicaments", label: "Médicaments", icon: Pill, match: (p: string) => p.startsWith("/medicaments") },
  {
    to: "/espace-pharmacien",
    label: "Espace Pharmacien",
    icon: Store,
    match: (p: string) => p.startsWith("/espace-pharmacien") || p.startsWith("/auth") || p.startsWith("/admin"),
  },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_20px_-12px_oklch(0.3_0.08_258/0.35)] backdrop-blur"
    >
      <ul className="grid grid-cols-4">
        {TABS.map(({ to, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={to} className="min-w-0">
              <Link
                to={to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 px-1 pb-2 pt-2.5 text-[11px] font-semibold leading-tight transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-12 items-center justify-center rounded-full transition-colors",
                    active && "bg-secondary",
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                </span>
                <span className="w-full truncate text-center">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
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
        <footer className="bg-wave px-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-1 text-center text-xs text-muted-foreground">
          GARDE — Votre santé, près de vous. · Données pharmacies © contributeurs OpenStreetMap
        </footer>
      </div>
      <BottomNav />
    </div>
  );
}
