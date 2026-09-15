import * as React from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "@/services/auth/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { signIn, user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!authLoading && user) nav({ to: "/app" });
  }, [user, authLoading, nav]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Preencha e-mail e senha"); return; }
    setLoading(true);
    try {
      await signIn(email, password);
      nav({ to: "/app" });
    } catch {
      toast.error("E-mail ou senha incorretos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card rounded-3xl p-8 border border-border shadow-soft">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-primary mb-2">Decora Gestão</h1>
          <p className="text-sm text-muted-foreground">Entre na sua conta</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="inp"
              placeholder="seu@email.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="inp"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading || authLoading}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary-dark disabled:opacity-50 transition-colors"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <div className="text-center mt-6 space-y-3">
          <Link to="/reset-password" className="text-xs text-primary font-semibold hover:underline block">
            Esqueci minha senha
          </Link>
          <div className="border-t border-border pt-3">
            <Link to="/signup" className="text-xs text-muted-foreground hover:text-foreground hover:underline block">
              Primeiro acesso? Criar conta →
            </Link>
          </div>
        </div>
      </div>
      <style>{`.inp{width:100%;padding:0.5rem 0.75rem;border-radius:0.625rem;border:1px solid var(--border);background:var(--background);font-size:0.875rem;outline:none;transition:border-color .15s}.inp:focus{border-color:var(--primary)}`}</style>
    </div>
  );
}
