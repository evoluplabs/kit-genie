import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  User, Bell, MessageCircle, Info, Target, ChevronRight,
  CheckCircle2, AlertTriangle, Eye, EyeOff, ExternalLink,
  TrendingUp, DollarSign, Trash2,
} from "lucide-react";
import { useDb } from "@/hooks/use-db";
import { profileRepo, settingsRepo, dbReset } from "@/services/db";
import { brl, cls } from "@/lib/format";
import { PageHeader } from "@/components/app/app-shell";
import { toast } from "sonner";

export const Route = createFileRoute("/app/settings")({ component: SettingsPage });

/* ─── Tipos de seção ────────────────────────────────────────── */
type Section = "perfil" | "metas" | "notificacoes" | "whatsapp" | "sobre";

function SettingsPage() {
  const profile  = useDb(() => profileRepo.get());
  const settings = useDb(() => settingsRepo.get());
  const [active, setActive] = React.useState<Section>("perfil");

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Configurações"
        subtitle="Personalize o sistema do seu jeito"
      />

      <div className="grid lg:grid-cols-[220px_1fr] gap-6 items-start">
        {/* Sidebar nav */}
        <nav className="rounded-2xl border border-border bg-card overflow-hidden">
          {(
            [
              { id: "perfil",        icon: <User className="size-4" />,          label: "Meu negócio" },
              { id: "metas",         icon: <Target className="size-4" />,         label: "Metas do mês" },
              { id: "notificacoes",  icon: <Bell className="size-4" />,           label: "Notificações" },
              { id: "whatsapp",      icon: <MessageCircle className="size-4" />,  label: "WhatsApp Premium" },
              { id: "sobre",         icon: <Info className="size-4" />,           label: "Sobre o app" },
            ] as { id: Section; icon: React.ReactNode; label: string }[]
          ).map(item => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={cls(
                "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-left border-b border-border last:border-0",
                active === item.id
                  ? "bg-primary/5 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-surface hover:text-foreground"
              )}
            >
              <span className={cls(active === item.id ? "text-primary" : "opacity-50")}>{item.icon}</span>
              {item.label}
              {active === item.id && <ChevronRight className="size-3.5 ml-auto" />}
            </button>
          ))}
        </nav>

        {/* Conteúdo */}
        <div>
          {active === "perfil"       && <ProfileSection profile={profile} />}
          {active === "metas"        && <GoalsSection settings={settings} />}
          {active === "notificacoes" && <NotificationsSection settings={settings} />}
          {active === "whatsapp"     && <WhatsAppSection profile={profile} />}
          {active === "sobre"        && <AboutSection />}
        </div>
      </div>

      <style>{`
        .inp {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 0.625rem;
          border: 1px solid var(--border);
          background: var(--card);
          font-size: 0.875rem;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .inp:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 15%, transparent);
        }
      `}</style>
    </div>
  );
}

/* ─── Seção: Perfil ─────────────────────────────────────────── */
function ProfileSection({ profile }: { profile: any }) {
  const [businessName, setBusinessName] = React.useState(profile?.businessName ?? "");
  const [ownerName,    setOwnerName]    = React.useState(profile?.ownerName ?? "");
  const [phone,        setPhone]        = React.useState(profile?.phone ?? "");
  const [email,        setEmail]        = React.useState(profile?.email ?? "");
  const [cnpj,         setCnpj]         = React.useState((profile as any)?.cnpj ?? "");
  const [address,      setAddress]      = React.useState((profile as any)?.address ?? "");

  React.useEffect(() => {
    if (profile) {
      setBusinessName(profile.businessName);
      setOwnerName(profile.ownerName);
      setPhone(profile.phone ?? "");
      setEmail(profile.email ?? "");
      setCnpj((profile as any).cnpj ?? "");
      setAddress((profile as any).address ?? "");
    }
  }, [profile]);

  const save = () => {
    if (!profile) return;
    profileRepo.upsert({ ...profile, businessName, ownerName, phone, email, cnpj, address } as any);
    toast.success("Perfil atualizado!");
  };

  return (
    <SectionCard
      icon={<User className="size-4 text-primary" />}
      title="Meu negócio"
      desc="Informações sobre você e sua empresa de decoração."
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Nome do negócio" hint="Ex: Festa em Flor Decorações">
          <input value={businessName} onChange={e => setBusinessName(e.target.value)} className="inp" placeholder="Nome da sua empresa" />
        </Field>
        <Field label="Seu nome">
          <input value={ownerName} onChange={e => setOwnerName(e.target.value)} className="inp" placeholder="Como quer ser chamada" />
        </Field>
        <Field label="WhatsApp de contato" hint="Usado no resumo semanal">
          <input value={phone} onChange={e => setPhone(e.target.value)} className="inp" placeholder="(11) 99999-9999" />
        </Field>
        <Field label="E-mail">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="inp" placeholder="seu@email.com" />
        </Field>
        <Field label="CNPJ ou CPF" hint="Aparece nos contratos gerados automaticamente">
          <input value={cnpj} onChange={e => setCnpj(e.target.value)} className="inp" placeholder="00.000.000/0001-00" />
        </Field>
        <Field label="Endereço completo" hint="Aparece nos contratos e documentos oficiais">
          <input value={address} onChange={e => setAddress(e.target.value)} className="inp" placeholder="Rua, número, bairro, cidade — UF" />
        </Field>
      </div>
      <SaveBar onSave={save} />
    </SectionCard>
  );
}

/* ─── Seção: Metas ──────────────────────────────────────────── */
function GoalsSection({ settings }: { settings: any }) {
  const [mode,       setMode]       = React.useState<"fixo" | "crescimento">(
    settings.goalAmount > 0 ? "fixo" : "crescimento"
  );
  const [goalAmount, setGoalAmount] = React.useState(String(settings.goalAmount ?? ""));
  const [growthPct,  setGrowthPct]  = React.useState(String(settings.goalGrowthPct ?? 10));

  const save = () => {
    settingsRepo.update({
      goalAmount:    mode === "fixo" ? Number(goalAmount) || 0 : 0,
      goalGrowthPct: mode === "crescimento" ? Number(growthPct) || 10 : 10,
    });
    toast.success("Meta salva! O dashboard já está atualizado 🎯");
  };

  return (
    <SectionCard
      icon={<Target className="size-4 text-primary" />}
      title="Meta de faturamento do mês"
      desc="Defina o quanto quer faturar todo mês. O dashboard mostra em tempo real o quanto você já conquistou."
    >
      {/* Escolha do modo */}
      <div className="grid sm:grid-cols-2 gap-3 mb-5">
        <ModeCard
          active={mode === "fixo"}
          onClick={() => setMode("fixo")}
          icon={<DollarSign className="size-5" />}
          title="Valor fixo"
          desc="Você escolhe um valor exato. Ex: quero faturar R$ 3.000 este mês."
        />
        <ModeCard
          active={mode === "crescimento"}
          onClick={() => setMode("crescimento")}
          icon={<TrendingUp className="size-5" />}
          title="Meta de crescimento"
          desc="O sistema calcula a meta automaticamente com base no mês anterior."
        />
      </div>

      {mode === "fixo" && (
        <Field
          label="Quanto você quer faturar este mês?"
          hint="Coloque o total que deseja receber com todas as suas festas somadas."
        >
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">R$</span>
            <input
              type="number"
              min={0}
              step={100}
              value={goalAmount}
              onChange={e => setGoalAmount(e.target.value)}
              className="inp pl-9"
              placeholder="3000"
            />
          </div>
          {Number(goalAmount) > 0 && (
            <p className="text-xs text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2 mt-2 font-medium">
              ✓ Sua meta é de <strong>{brl(Number(goalAmount))}</strong> por mês.
            </p>
          )}
        </Field>
      )}

      {mode === "crescimento" && (
        <Field
          label="Quanto a mais do que o mês passado você quer crescer?"
          hint="Se você faturou R$ 2.000 no mês passado e escolher 10%, sua meta será R$ 2.200 automaticamente."
        >
          <div className="relative">
            <input
              type="number"
              min={1}
              max={200}
              step={1}
              value={growthPct}
              onChange={e => setGrowthPct(e.target.value)}
              className="inp pr-8"
              placeholder="10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">%</span>
          </div>

          {/* Régua visual */}
          <div className="mt-3 flex gap-2 flex-wrap">
            {[5, 10, 15, 20, 30].map(v => (
              <button
                key={v}
                onClick={() => setGrowthPct(String(v))}
                className={cls(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors",
                  String(v) === growthPct
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:bg-surface"
                )}
              >
                +{v}%
              </button>
            ))}
          </div>

          <div className="mt-3 rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs text-blue-800 space-y-1">
            <p className="font-semibold">Como funciona na prática:</p>
            <p>Se em maio você faturou <strong>R$ 2.000</strong> e escolheu <strong>+{growthPct}%</strong>, sua meta de junho será <strong>{brl(2000 * (1 + Number(growthPct) / 100))}</strong>.</p>
            <p className="opacity-70">Quando você ainda não tem vendas no mês anterior, usamos R$ 2.000 como ponto de partida.</p>
          </div>
        </Field>
      )}

      <SaveBar onSave={save} label="Salvar meta" />
    </SectionCard>
  );
}

/* ─── Seção: Notificações ───────────────────────────────────── */
function NotificationsSection({ settings }: { settings: any }) {
  return (
    <SectionCard
      icon={<Bell className="size-4 text-primary" />}
      title="Notificações"
      desc="Escolha quando e como o sistema deve te avisar."
    >
      <div className="space-y-2">
        <Toggle
          label="Avisar quando o estoque ficar baixo"
          desc="Você verá um alerta no painel sempre que algum material estiver acabando. Assim você nunca fica sem peças na hora H."
          checked={settings.notifyLowStock}
          onChange={v => { settingsRepo.update({ notifyLowStock: v }); toast.success(v ? "Alerta de estoque ativado" : "Alerta desativado"); }}
        />
        <Toggle
          label="Receber resumo semanal por e-mail"
          desc="Toda segunda-feira você recebe um resuminho no e-mail com suas vendas, estoque e dinheiro da semana. Ótimo pra ter tudo na palma da mão."
          checked={settings.notifyWeeklyReport}
          onChange={v => { settingsRepo.update({ notifyWeeklyReport: v }); toast.success(v ? "Resumo semanal ativado" : "Resumo desativado"); }}
        />
      </div>

      {settings.notifyWeeklyReport && (
        <div className="mt-4 space-y-3">
          <Field label="Para qual e-mail enviar o resumo semanal?" hint="Pode ser o mesmo e-mail do cadastro ou um diferente.">
            <input
              value={settings.weeklyReportEmail ?? ""}
              onChange={e => settingsRepo.update({ weeklyReportEmail: e.target.value })}
              className="inp"
              placeholder="seu@email.com"
            />
          </Field>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-border">
        <Field
          label="Sensibilidade do alerta de estoque"
          hint="Com 1×, o sistema avisa quando o estoque chega exatamente no mínimo. Com 1,5×, ele avisa um pouco antes — mais seguro para quem não quer correr risco."
        >
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={3}
              step={0.5}
              value={settings.lowStockMultiplier}
              onChange={e => settingsRepo.update({ lowStockMultiplier: Number(e.target.value) })}
              className="flex-1 accent-[var(--primary)]"
            />
            <span className="text-sm font-bold w-8 shrink-0 text-right">{settings.lowStockMultiplier}×</span>
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-0.5">
            <span>No limite</span>
            <span>Com folga</span>
            <span>Bem antecipado</span>
          </div>
        </Field>
      </div>
    </SectionCard>
  );
}

/* ─── Seção: WhatsApp ───────────────────────────────────────── */
function WhatsAppSection({ profile }: { profile: any }) {
  const [zapiInstance, setZapiInstance] = React.useState((profile as any)?.zapiInstance ?? "");
  const [zapiToken,    setZapiToken]    = React.useState((profile as any)?.zapiToken ?? "");
  const [showToken,    setShowToken]    = React.useState(false);
  const [saving,       setSaving]       = React.useState(false);

  React.useEffect(() => {
    if (profile) {
      setZapiInstance((profile as any).zapiInstance ?? "");
      setZapiToken((profile as any).zapiToken ?? "");
    }
  }, [profile]);

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      profileRepo.upsert({ ...profile, zapiInstance, zapiToken } as any);
      toast.success("WhatsApp configurado! O bot já está pronto para responder 🤖");
    } finally {
      setSaving(false);
    }
  };

  const isConfigured = zapiInstance && zapiToken;

  return (
    <SectionCard
      icon={<MessageCircle className="size-4 text-emerald-600" />}
      title="WhatsApp Premium"
      badge={{ label: "R$ 9,90/mês", color: "emerald" }}
      desc="Conecte seu WhatsApp e o sistema responde orçamentos automaticamente para você, mesmo quando você está ocupada ou dormindo."
    >
      {/* Status */}
      <div className={cls(
        "flex items-center gap-3 rounded-xl p-3 mb-5 text-sm",
        isConfigured ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"
      )}>
        {isConfigured
          ? <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
          : <AlertTriangle className="size-4 text-amber-600 shrink-0" />}
        <span className={isConfigured ? "text-emerald-800" : "text-amber-800"}>
          {isConfigured
            ? "Bot configurado e pronto para uso."
            : "Bot ainda não configurado. Siga os passos abaixo para ativar."}
        </span>
      </div>

      {/* Passo a passo */}
      <div className="rounded-xl bg-surface border border-border p-4 mb-5 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Como ativar em 3 passos</p>
        {[
          { n: 1, text: "Acesse z-api.io e crie uma conta gratuita", link: "https://z-api.io" },
          { n: 2, text: "Crie uma instância, conecte seu celular pelo QR Code e copie o ID e o Token." },
          { n: 3, text: "Cole os dados abaixo e salve. Pronto — o bot já começa a funcionar!" },
        ].map(step => (
          <div key={step.n} className="flex items-start gap-3">
            <span className="size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{step.n}</span>
            <p className="text-sm text-muted-foreground">
              {step.text}
              {step.link && (
                <a href={step.link} target="_blank" rel="noreferrer" className="text-primary underline ml-1 inline-flex items-center gap-0.5">
                  {step.link} <ExternalLink className="size-3" />
                </a>
              )}
            </p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="ID da instância Z-API" hint="Código que aparece no painel Z-API, ex: 3D1234567890A">
          <input value={zapiInstance} onChange={e => setZapiInstance(e.target.value)} className="inp" placeholder="Ex: 3D1234567890A" />
        </Field>
        <Field label="Token da instância" hint="Chave secreta — não compartilhe com ninguém.">
          <div className="relative">
            <input
              type={showToken ? "text" : "password"}
              value={zapiToken}
              onChange={e => setZapiToken(e.target.value)}
              className="inp pr-10"
              placeholder="Token secreto"
            />
            <button onClick={() => setShowToken(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
      </div>

      <div className="mt-4 rounded-xl bg-surface border border-border p-3">
        <p className="text-[11px] font-bold text-muted-foreground mb-1">URL do Webhook — cole no painel Z-API</p>
        <code className="text-xs font-mono break-all text-foreground">
          https://us-central1-decora-gestao.cloudfunctions.net/whatsappWebhook
        </code>
      </div>

      <SaveBar onSave={save} saving={saving} label={saving ? "Salvando..." : "Ativar bot WhatsApp"} variant="emerald" />
    </SectionCard>
  );
}

/* ─── Seção: Sobre ──────────────────────────────────────────── */
function AboutSection() {
  const reset = () => {
    if (confirm("Tem certeza? Isso apaga TODOS os seus dados. Esta ação não pode ser desfeita.")) {
      dbReset();
      toast.success("Dados resetados");
      window.location.reload();
    }
  };

  return (
    <SectionCard
      icon={<Info className="size-4 text-primary" />}
      title="Sobre o Decora Gestão"
      desc="Informações sobre o sistema."
    >
      <div className="space-y-4 text-sm text-muted-foreground">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Versão",      value: "1.0.0" },
            { label: "Plataforma",  value: "Web + PWA" },
            { label: "Banco",       value: "Firebase Firestore" },
            { label: "Sincronismo", value: "Tempo real" },
          ].map(r => (
            <div key={r.label} className="rounded-xl bg-surface border border-border p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-1">{r.label}</p>
              <p className="font-semibold text-foreground text-sm">{r.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-blue-800 text-xs space-y-1">
          <p className="font-semibold">💾 Seus dados estão seguros</p>
          <p>Tudo é salvo automaticamente na nuvem. Se fechar o app, seu celular travar ou a internet cair, nenhum dado é perdido — tudo fica guardado e sincroniza quando a conexão voltar.</p>
        </div>

        <div className="pt-2 border-t border-border">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Zona de perigo</p>
          <button
            onClick={reset}
            className="flex items-center gap-2 text-sm text-red-600 font-semibold hover:bg-red-50 px-3 py-2.5 rounded-xl border border-red-200 transition-colors"
          >
            <Trash2 className="size-4" /> Apagar todos os dados
          </button>
          <p className="text-[11px] text-muted-foreground mt-2">
            Isso remove permanentemente todas as suas vendas, kits, componentes e configurações. Não tem como desfazer.
          </p>
        </div>
      </div>
    </SectionCard>
  );
}

/* ─── Componentes auxiliares ────────────────────────────────── */
function SectionCard({ icon, title, badge, desc, children }: {
  icon: React.ReactNode; title: string; badge?: { label: string; color: string };
  desc: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <h3 className="font-bold text-base">{title}</h3>
          {badge && (
            <span className={cls(
              "text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ml-1",
              badge.color === "emerald" ? "bg-emerald-100 text-emerald-700" : "bg-primary/10 text-primary"
            )}>
              {badge.label}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}

function ModeCard({ active, onClick, icon, title, desc }: {
  active: boolean; onClick: () => void;
  icon: React.ReactNode; title: string; desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cls(
        "text-left p-4 rounded-xl border-2 transition-all space-y-2",
        active ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 hover:bg-surface"
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cls("transition-colors", active ? "text-primary" : "text-muted-foreground")}>{icon}</span>
        <span className={cls("font-bold text-sm", active ? "text-primary" : "")}>{title}</span>
        {active && <CheckCircle2 className="size-4 text-primary ml-auto" />}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </button>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground leading-relaxed">{hint}</p>}
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }: {
  label: string; desc: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 p-4 rounded-xl border border-border hover:bg-surface cursor-pointer transition-colors">
      <div className="mt-0.5 shrink-0">
        <div
          onClick={() => onChange(!checked)}
          className={cls(
            "relative w-9 h-5 rounded-full transition-colors cursor-pointer",
            checked ? "bg-primary" : "bg-border"
          )}
        >
          <div className={cls(
            "absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5"
          )} />
        </div>
      </div>
      <div>
        <p className="font-semibold text-sm leading-tight">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </label>
  );
}

function SaveBar({ onSave, saving, label = "Salvar", variant = "primary" }: {
  onSave: () => void; saving?: boolean; label?: string; variant?: "primary" | "emerald";
}) {
  return (
    <div className="flex justify-end pt-4 border-t border-border mt-2">
      <button
        onClick={onSave}
        disabled={saving}
        className={cls(
          "px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50",
          variant === "emerald"
            ? "bg-emerald-600 text-white hover:bg-emerald-700"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        {label}
      </button>
    </div>
  );
}