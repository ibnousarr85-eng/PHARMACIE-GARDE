import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell, BackLink } from "@/components/garde/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Espace pharmacien — Connexion | GARDE" },
      { name: "description", content: "Connectez-vous pour gérer le stock et la garde de votre pharmacie sur GARDE." },
      { property: "og:title", content: "Espace pharmacien — GARDE" },
      { property: "og:description", content: "Gérez le stock et la garde de votre pharmacie." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/espace-pharmacien" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/espace-pharmacien" });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/espace-pharmacien" });
        else toast.success("Compte créé. Confirmez votre adresse e-mail pour continuer.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de la connexion");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/auth` });
    if (result.error) {
      toast.error("Connexion Google impossible");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/espace-pharmacien" });
  };

  return (
    <AppShell size="narrow">
      <BackLink to="/" />
      <h1 className="mt-3 text-[28px] font-extrabold tracking-tight text-foreground">Espace pharmacien</h1>
      <p className="mb-6 text-muted-foreground">
        {mode === "signin" ? "Connectez-vous pour mettre à jour votre stock et votre garde." : "Créez votre compte pharmacien."}
      </p>

      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-xl"
          />
        </div>
        <Button type="submit" disabled={busy} size="lg" className="h-14 w-full rounded-2xl text-lg font-bold">
          {mode === "signin" ? "Se connecter" : "Créer mon compte"}
        </Button>
      </form>

      <div className="my-4 text-center text-sm text-muted-foreground">ou</div>
      <Button type="button" variant="outline" size="lg" onClick={google} className="h-12 w-full rounded-2xl font-semibold">
        Continuer avec Google
      </Button>

      <button
        type="button"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="mt-6 text-sm font-semibold text-primary"
      >
        {mode === "signin" ? "Pas encore de compte ? Créer un compte" : "Déjà un compte ? Se connecter"}
      </button>
    </AppShell>
  );
}
