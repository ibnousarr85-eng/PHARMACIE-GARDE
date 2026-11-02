import { Search } from "lucide-react";
import type { InputHTMLAttributes } from "react";

export function SearchInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-border bg-muted px-4 py-4 focus-within:ring-2 focus-within:ring-ring">
      <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
      <input
        {...props}
        className="w-full bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
      />
    </label>
  );
}

export function Chip({ active, children, onClick }: { active?: boolean; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground/80 hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}
