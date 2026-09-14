import * as React from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "@/services/auth/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({ component: SignupPage });

function SignupPage() {
  const { signUp, user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!authLoading && user) nav({ to: "/app" });
  }, [user, authLoading, nav]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) { toast.error("Preencha todos os campos"); return; }
    if (password.length < 6) { toast.error("A senha precisa ter ao menos 6 caracteres"); return; }
    if (password !== confirm) { toast.error("As senhas não coincidem"); return; }
    setLoading(true);
    try {
      await signUp(email, password, name);
      nav({ to: "/app/onboarding" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("email-already-in-use")) {
        toast.error("Este e-mail já está cadastrado. Tente fazer login.");
      } else if (msg.includes("invalid-email")) {
        toast.error("E-mail inválido.");
      } else {
        toast.error("Erro ao criar conta. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card rounded-3xl p-8 border border-border shadow-soft">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-primary mb-2">Decora Gestão</h1>
          <p className="text-sm text-muted-foreground">Crie sua conta gratuitamente</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Seu nome</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="inp"
              placeholder="Como você se chama?"
              autoComplete="name"
            />
          </div>
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
              placeholder="mínimo 6 caracteres"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Confirmar senha</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="inp"
              placeholder="repita a senha"
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading || authLoading}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary-dark disabled:opacity-50 transition-colors"
          >
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>
        <div className="text-center mt-6">
          <div className="border-t border-border pt-3">
            <Link to="/login" className="text-xs text-muted-foreground hover:text-foreground hover:underline block">
              Já tem conta? Entrar →
            </Link>
          </div>
        </div>
      </div>
      <style>{`.inp{width:100%;padding:0.5rem 0.75rem;border-radius:0.625rem;border:1px solid var(--border);background:var(--background);font-size:0.875rem;outline:none;transition:border-color .15s}.inp:focus{border-color:var(--primary)}`}</style>
    </div>
  );
}
