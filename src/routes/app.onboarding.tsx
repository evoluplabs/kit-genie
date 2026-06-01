import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Sparkles, ArrowRight, ArrowLeft, Star, Package, Calendar, TrendingUp } from "lucide-react";
import { profileRepo } from "@/services/db";
import { cls } from "@/lib/format";
import { useAuth } from "@/services/auth/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/app/onboarding")({
  component: Onboarding,
  beforeLoad: ({ context }) => {
    const profile = profileRepo.get();
    if (profile?.onboardingCompleted) {
      throw new Error("redirect:/app");
    }
  },
});

const THEMES = [
  "Mickey", "Minnie", "Batman", "Princesas", "Safari",
  "Jardim", "Astronauta", "Dinossauros", "Frozen", "Unicórnio",
  "Bailarina", "Carrinhos", "Fundo do Mar", "Floresta", "Circo",
  "Super Heróis", "Boho", "Tropical", "Personalizado",
];

const WORK_TYPES = [
  {
    v: "pegue_monte",
    label: "Pegue e monte",
    desc: "Cliente retira o kit montado e instala em casa. Prático, sem deslocamento para você.",
    emoji: "📦",
  },
  {
    v: "locacao",
    label: "Festa na mesa",
    desc: "Kit completo para decoração de mesa — balões, topos, cenários e muito mais.",
    emoji: "🎂",
  },
] as const;

/* ─── Dados do painel esquerdo por step ────────────────────── */
const PANELS = [
  {
    accent: "#F9A8C9",
    bg: "from-pink-100 to-rose-50",
    emoji: "✨",
    headline: "Seu ateliê merece um sistema à altura",
    sub: "Em menos de 2 minutos você terá controle total de kits, estoque e locações.",
    items: ["Cadastro gratuito", "Dados na nuvem", "Funciona no celular"],
  },
  {
    accent: "#FBC4AB",
    bg: "from-orange-100 to-amber-50",
    emoji: "🎀",
    headline: "Conta pra gente sobre seu negócio",
    sub: "Essas informações aparecem nos seus relatórios e no resumo semanal.",
    items: ["Nome personalizado", "WhatsApp integrado", "Relatório no seu e-mail"],
  },
  {
    accent: "#C9B8F5",
    bg: "from-violet-100 to-purple-50",
    emoji: "🎨",
    headline: "Cada tema vira um kit no sistema",
    sub: "Você cadastra os materiais de cada tema e o estoque é descontado automaticamente.",
    items: ["Kits com lista de materiais", "Estoque automático", "Sem planilha"],
  },
  {
    accent: "#A8D8C2",
    bg: "from-emerald-100 to-teal-50",
    emoji: "🗓️",
    headline: "Do orçamento à entrega, tudo registrado",
    sub: "Cada tipo de serviço tem um fluxo diferente — o sistema se adapta ao seu jeito de trabalhar.",
    items: ["Agenda visual", "Status de cada locação", "Histórico completo"],
  },
  {
    accent: "#F9A8C9",
    bg: "from-pink-100 to-fuchsia-50",
    emoji: "🎉",
    headline: "Você está pronta para começar!",
    sub: "Seu sistema já vem com exemplos para você explorar antes de cadastrar os seus dados.",
    items: ["4 kits de exemplo", "10 componentes pré-cadastrados", "Dashboard com dados reais"],
  },
];

/* ─── Componente principal ──────────────────────────────────── */
function Onboarding() {
  const nav = useNavigate();
  const { user, signUp } = useAuth();
  const [step, setStep]   = React.useState(user ? 1 : 0);
  const [dir,  setDir]    = React.useState<1 | -1>(1);
  const [animKey, setAnimKey] = React.useState(0);

  const [email,        setEmail]        = React.useState(user?.email ?? "");
  const [password,     setPassword]     = React.useState("");
  const [confirmPass,  setConfirmPass]  = React.useState("");
  const [businessName, setBusinessName] = React.useState("");
  const [ownerName,    setOwnerName]    = React.useState(user?.name ?? "");
  const [phone,        setPhone]        = React.useState("");
  const [themes,       setThemes]       = React.useState<string[]>([]);
  const [workTypes,    setWorkTypes]    = React.useState<Array<"decoracao" | "pegue_monte" | "locacao">>([]);
  const [loading,      setLoading]      = React.useState(false);
  const [errors,       setErrors]       = React.useState<Record<string, string>>({});

  const TOTAL = PANELS.length;
  const panel = PANELS[step];

  const goTo = (next: number) => {
    setDir(next > step ? 1 : -1);
    setAnimKey(k => k + 1);
    setStep(next);
    setErrors({});
  };

  const toggle = <T,>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

  const validateStep0 = () => {
    const e: Record<string, string> = {};
    if (!ownerName.trim())          e.ownerName = "Por favor, diga seu nome.";
    if (!email.includes("@"))       e.email = "Digite um e-mail válido.";
    if (password.length < 6)        e.password = "A senha precisa ter pelo menos 6 caracteres.";
    if (password !== confirmPass)   e.confirmPass = "As senhas não coincidem.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!businessName.trim()) e.businessName = "Coloque o nome do seu negócio para continuar.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleStep0 = async () => {
    if (!validateStep0()) return;
    setLoading(true);
    try {
      await signUp(email, password, ownerName);
      goTo(1);
    } catch (err: any) {
      setErrors({ email: err?.message ?? "Erro ao criar conta. Tente novamente." });
    } finally {
      setLoading(false);
    }
  };

  const finish = () => {
    profileRepo.upsert({
      businessName: businessName || "Meu Ateliê",
      ownerName: ownerName || user?.name || "Decoradora",
      phone,
      email: user?.email,
      themes,
      workTypes,
      onboardingCompleted: true,
    });
    toast.success("Bem-vinda ao Pink Love Gestão! 💕");
    nav({ to: "/app" });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden bg-white">

      {/* ── Painel esquerdo (visual) ─────────────────────────── */}
      <div
        className={cls("relative lg:w-[42%] lg:min-h-screen flex flex-col justify-between p-8 lg:p-12 overflow-hidden bg-gradient-to-br transition-all duration-700", panel.bg)}
        key={`panel-${step}`}
      >
        <BgDecorations step={step} />

        <div className="relative z-10 flex items-center gap-2">
          <div className="size-8 rounded-xl bg-white/80 backdrop-blur grid place-items-center shadow-sm">
            <Sparkles className="size-4" style={{ color: panel.accent }} />
          </div>
          <span className="font-bold text-gray-800 text-sm tracking-wide">Pink Love Gestão</span>
        </div>

        <div className="relative z-10 space-y-6 py-12 lg:py-0">
          <div key={`emoji-${step}`} className="text-6xl" style={{ animation: "popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}>
            {panel.emoji}
          </div>
          <div key={`text-${step}`} style={{ animation: "fadeUp 0.4s ease" }}>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-gray-800 leading-tight mb-3">{panel.headline}</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{panel.sub}</p>
          </div>
          <ul className="space-y-2.5" key={`items-${step}`} style={{ animation: "fadeUp 0.5s ease 0.1s both" }}>
            {panel.items.map(item => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                <span className="size-5 rounded-full flex items-center justify-center shrink-0" style={{ background: panel.accent + "40" }}>
                  <Check className="size-3" style={{ color: panel.accent.replace("9", "6") }} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 flex gap-2">
          {PANELS.map((_, i) => (
            <div key={i} className="h-1.5 rounded-full transition-all duration-500"
              style={{ background: i === step ? panel.accent : panel.accent + "40", width: i === step ? "2rem" : "0.5rem" }}
            />
          ))}
        </div>
      </div>

      {/* ── Painel direito (formulário) ──────────────────────── */}
      <div className="flex-1 flex flex-col justify-center p-8 lg:p-16 xl:p-24 overflow-y-auto">
        <div key={`form-${animKey}`} className="w-full max-w-md mx-auto" style={{ animation: "slideIn 0.35s ease" }}>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">Passo {step + 1} de {TOTAL}</p>

          {step === 0 && (
            <StepShell title="Vamos criar sua conta" subtitle="É rapidinho — só precisamos do básico para começar.">
              <Field label="Como você se chama?" error={errors.ownerName}>
                <input value={ownerName} onChange={e => setOwnerName(e.target.value)} className="inp" placeholder="Seu nome completo" autoFocus />
              </Field>
              <Field label="Seu e-mail" error={errors.email}>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="inp" placeholder="seu@email.com" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Senha" error={errors.password}>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="inp" placeholder="mín. 6 caracteres" />
                </Field>
                <Field label="Confirmar senha" error={errors.confirmPass}>
                  <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} className="inp" placeholder="repita a senha" onKeyDown={e => e.key === "Enter" && handleStep0()} />
                </Field>
              </div>
              <NavBar next={{ label: loading ? "Criando conta…" : "Criar conta", onClick: handleStep0, disabled: loading }} />
              <p className="text-center text-xs text-muted-foreground mt-4">
                Já tem conta?{" "}<a href="/login" className="text-primary font-semibold hover:underline">Entrar</a>
              </p>
            </StepShell>
          )}

          {step === 1 && (
            <StepShell title={`Olá, ${ownerName.split(" ")[0] || "querida"} 💕`} subtitle="Conta um pouco sobre o seu ateliê.">
              <Field label="Nome do seu negócio" error={errors.businessName} hint='Ex: "Festa em Flor Decorações" ou "Ateliê da Ana"'>
                <input value={businessName} onChange={e => setBusinessName(e.target.value)} className="inp" placeholder="Nome que vai aparecer nos relatórios" autoFocus onKeyDown={e => e.key === "Enter" && validateStep1() && goTo(2)} />
              </Field>
              <Field label="WhatsApp (opcional)" hint="Para o atendimento automático">
                <input value={phone} onChange={e => setPhone(e.target.value)} className="inp" placeholder="(11) 99999-9999" />
              </Field>
              <NavBar back={{ onClick: () => goTo(0) }} next={{ label: "Continuar", onClick: () => validateStep1() && goTo(2) }} />
            </StepShell>
          )}

          {step === 2 && (
            <StepShell title="Com quais temas você trabalha?" subtitle="Selecione os temas do seu ateliê. Você pode editar isso depois.">
              <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto pr-1 -mr-1">
                {THEMES.map(t => {
                  const active = themes.includes(t);
                  return (
                    <button key={t} type="button" onClick={() => setThemes(prev => toggle(prev, t))}
                      className={cls("px-3.5 py-1.5 rounded-full text-sm font-medium border-2 transition-all",
                        active ? "bg-primary text-primary-foreground border-primary scale-105 shadow-sm" : "bg-card border-border text-foreground hover:border-primary/40 hover:bg-primary/5")}>
                      {active && <Check className="size-3 inline mr-1 -mt-0.5" />}
                      {t}
                    </button>
                  );
                })}
              </div>
              {themes.length > 0 && (
                <p className="text-xs text-primary font-semibold">✓ {themes.length} tema{themes.length !== 1 ? "s" : ""} selecionado{themes.length !== 1 ? "s" : ""}</p>
              )}
              <NavBar back={{ onClick: () => goTo(1) }} next={{ label: "Continuar", onClick: () => goTo(3) }} />
            </StepShell>
          )}

          {step === 3 && (
            <StepShell title="Como você trabalha?" subtitle="Marque o que faz parte do seu serviço. Pode ser mais de um.">
              <div className="space-y-3">
                {WORK_TYPES.map(wt => {
                  const active = workTypes.includes(wt.v);
                  return (
                    <button key={wt.v} type="button" onClick={() => setWorkTypes(prev => toggle(prev, wt.v))}
                      className={cls("w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-4",
                        active ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30 hover:bg-surface")}>
                      <span className="text-2xl shrink-0 mt-0.5">{wt.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className={cls("font-semibold text-sm", active ? "text-primary" : "")}>{wt.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{wt.desc}</div>
                      </div>
                      <div className={cls("size-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all", active ? "bg-primary border-primary" : "border-border")}>
                        {active && <Check className="size-3 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              <NavBar
                back={{ onClick: () => goTo(2) }}
                next={{ label: "Continuar", onClick: () => workTypes.length > 0 ? goTo(4) : setErrors({ workTypes: "Selecione pelo menos um tipo de serviço." }) }}
              />
              {errors.workTypes && <p className="text-xs text-destructive text-center -mt-2">{errors.workTypes}</p>}
            </StepShell>
          )}

          {step === 4 && (
            <StepShell title="Tudo pronto! 🎉" subtitle="Seu sistema está configurado. Veja o que já vem cadastrado para te ajudar:">
              <div className="space-y-3">
                {[
                  { icon: <Package className="size-4" />,    color: "pink",    text: "4 kits de exemplo (Pegue e monte + Festa na mesa)" },
                  { icon: <Star className="size-4" />,       color: "violet",  text: "10 componentes pré-cadastrados com estoque inicial" },
                  { icon: <Calendar className="size-4" />,   color: "blue",    text: "Locações de exemplo para ver o dashboard em ação" },
                  { icon: <TrendingUp className="size-4" />, color: "emerald", text: "Relatórios e metas funcionando desde o primeiro dia" },
                ].map((item, i) => (
                  <div key={i}
                    className={cls("flex items-center gap-3 p-3 rounded-xl border",
                      item.color === "pink"    ? "bg-pink-50 border-pink-100 text-pink-700" :
                      item.color === "violet"  ? "bg-violet-50 border-violet-100 text-violet-700" :
                      item.color === "blue"    ? "bg-blue-50 border-blue-100 text-blue-700" :
                      "bg-emerald-50 border-emerald-100 text-emerald-700"
                    )}
                    style={{ animation: `fadeUp 0.4s ease ${i * 0.08}s both` }}
                  >
                    <span className="shrink-0 opacity-70">{item.icon}</span>
                    <span className="text-sm font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground bg-surface border border-border rounded-xl p-3 leading-relaxed">
                💡 Você pode apagar os dados de exemplo a qualquer momento em <strong>Configurações → Sobre o app</strong>.
              </p>
              <NavBar back={{ onClick: () => goTo(3) }} next={{ label: "Entrar no meu sistema →", onClick: finish, highlight: true }} />
            </StepShell>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.5) rotate(-10deg); } to { opacity: 1; transform: scale(1) rotate(0deg); } }
        @keyframes float { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-12px) rotate(5deg); } }
        @keyframes floatAlt { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-8px) rotate(-4deg); } }
        .inp { width: 100%; padding: 0.625rem 0.875rem; border-radius: 0.75rem; border: 1.5px solid var(--border); background: var(--card); font-size: 0.9rem; transition: border-color 0.15s, box-shadow 0.15s; }
        .inp:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px color-mix(in oklab, var(--primary) 15%, transparent); }
        .inp::placeholder { color: var(--muted-foreground); opacity: 0.6; }
      `}</style>
    </div>
  );
}

function BgDecorations({ step }: { step: number }) {
  const shapes = [
    { size: 120, top: "8%",  right: "-5%",  delay: "0s",   opacity: 0.25, shape: "circle" },
    { size: 80,  top: "55%", right: "10%",  delay: "0.5s", opacity: 0.2,  shape: "circle" },
    { size: 60,  top: "30%", left:  "-3%",  delay: "1s",   opacity: 0.15, shape: "square" },
    { size: 40,  top: "75%", left:  "15%",  delay: "0.3s", opacity: 0.2,  shape: "circle" },
    { size: 160, bottom: "5%", right: "-8%", delay: "0.8s",opacity: 0.12, shape: "circle" },
  ];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {shapes.map((s, i) => (
        <div key={`${step}-${i}`} className="absolute rounded-full"
          style={{ width: s.size, height: s.size, top: s.top, bottom: (s as any).bottom, left: (s as any).left, right: s.right, background: "white", opacity: s.opacity, borderRadius: s.shape === "square" ? "24px" : "50%", animation: `${i % 2 === 0 ? "float" : "floatAlt"} ${3 + i * 0.7}s ease-in-out infinite`, animationDelay: s.delay }} />
      ))}
    </div>
  );
}

function StepShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div style={{ animation: "fadeUp 0.35s ease" }}>
        <h1 className="font-display text-3xl font-bold leading-tight tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{subtitle}</p>
      </div>
      <div className="space-y-4" style={{ animation: "fadeUp 0.4s ease 0.05s both" }}>{children}</div>
    </div>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">{label}</label>
      {children}
      {hint && !error && <p className="text-[11px] text-muted-foreground leading-relaxed">{hint}</p>}
      {error && <p className="text-[11px] text-destructive font-medium">{error}</p>}
    </div>
  );
}

function NavBar({ back, next }: { back?: { onClick: () => void }; next?: { label: string; onClick: () => void; disabled?: boolean; highlight?: boolean } }) {
  return (
    <div className="flex items-center justify-between pt-2">
      {back ? (
        <button onClick={back.onClick} className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-xl hover:bg-surface">
          <ArrowLeft className="size-3.5" /> Voltar
        </button>
      ) : <span />}
      {next && (
        <button onClick={next.onClick} disabled={next.disabled}
          className={cls("flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all",
            next.highlight ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg hover:-translate-y-0.5" : "bg-primary text-primary-foreground hover:bg-primary/90",
            next.disabled ? "opacity-50 cursor-not-allowed" : "")}>
          {next.label}
          {!next.disabled && <ArrowRight className="size-3.5" />}
        </button>
      )}
    </div>
  );
}
