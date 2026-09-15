import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({ component: ResetPasswordPage });

function ResetPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Digite seu e-mail"); return; }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch {
      toast.error("Não foi possível enviar. Verifique o e-mail informado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card rounded-3xl p-8 border border-border shadow-soft">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-primary mb-2">Decora Gestão</h1>
          <p className="text-sm text-muted-foreground">Recuperar senha</p>
        </div>

        {sent ? (
          <div className="text-center space-y-5">
            <div className="text-5xl">📧</div>
            <p className="text-sm text-foreground">
              Link de recuperação enviado para <strong>{email}</strong>.
              Verifique sua caixa de entrada (e o spam).
            </p>
            <Link
              to="/login"
              className="block w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary-dark transition-colors text-center"
            >
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                E-mail da conta
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="inp"
                placeholder="seu@email.com"
                autoComplete="email"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              {loading ? "Enviando..." : "Enviar link de recuperação"}
            </button>
            <Link to="/login" className="block text-center text-xs text-muted-foreground hover:underline">
              Voltar para o login
            </Link>
          </form>
        )}
      </div>
      <style>{`.inp{width:100%;padding:0.5rem 0.75rem;border-radius:0.625rem;border:1px solid var(--border);background:var(--background);font-size:0.875rem;outline:none;transition:border-color .15s}.inp:focus{border-color:var(--primary)}`}</style>
    </div>
  );
}
