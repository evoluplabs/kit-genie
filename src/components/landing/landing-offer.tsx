import { Link } from "@tanstack/react-router";

const HOTMART_BASE = import.meta.env.VITE_HOTMART_URL_BASE ?? "https://hotmart.com/produto/decora-gestao-base";
const HOTMART_PREMIUM = import.meta.env.VITE_HOTMART_URL_PREMIUM ?? "https://hotmart.com/produto/decora-gestao-premium";

const INCLUSO = [
  "Acesso vitalício ao sistema (sem mensalidade)",
  "Controle ilimitado de kits e componentes",
  "Assistente por voz/texto nativo no app",
  "Dashboard financeiro + fluxo de caixa real",
  "Relatórios semanais por e-mail automático",
  "Exportação CSV / PDF para contador",
  "Agenda com bloqueio automático de datas",
  "Todas as atualizações futuras inclusas",
];

const UPGRADE_INCLUSO = [
  "Bot responde clientes 24h no WhatsApp",
  "Nunca mais cliente sem resposta",
  "Você só aparece quando a venda está fechada",
];

export function LandingOffer() {
  return (
    <section id="oferta" className="px-6 py-24">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Oferta de fundação</span>
          <h2 className="font-display text-4xl md:text-5xl mt-3 mb-5 text-balance">
            Um negócio organizado. <span className="italic text-primary">Para sempre.</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Enquanto você usa planilha, outras decoradoras já estão com o estoque no automático.
            Garanta agora com o preço de fundação — sem mensalidade, sem surpresa, sem prazo de validade.
          </p>
        </div>

        <div className="mb-10 rounded-[2rem] bg-gradient-to-br from-primary-soft via-card to-card border border-primary/15 p-8 shadow-glow">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">O que está incluso no plano base</p>
          <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-2.5">
            {INCLUSO.map(t => (
              <li key={t} className="flex gap-3 items-start text-sm">
                <span className="mt-0.5 size-5 rounded-full bg-emerald-100 grid place-items-center shrink-0">
                  <span className="size-2 rounded-full bg-emerald-600" />
                </span>
                <span className="text-foreground/85">{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Card Base */}
          <div className="bg-card rounded-3xl p-8 border border-border shadow-soft text-center flex flex-col">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Pagamento único · vitalício</p>
            <div className="mb-1">
              <span className="text-sm text-muted-foreground line-through font-medium">De R$ 97,00</span>
            </div>
            <div className="font-display text-6xl text-primary mb-1 leading-none">
              <span className="text-2xl align-top mr-1">R$</span>47
            </div>
            <p className="text-xs text-amber-600 font-semibold mb-1">⏳ Preço de fundação — sobe após as primeiras vagas</p>
            <p className="text-xs text-muted-foreground mb-6">acesso para sempre · sem mensalidade</p>
            <div className="mt-auto space-y-3">
              <a
                href={HOTMART_BASE}
                target="_blank"
                rel="noreferrer"
                className="block w-full rounded-2xl bg-primary text-primary-foreground py-4 font-bold text-base hover:bg-primary-dark transition-colors"
              >
                Comprar agora na Hotmart
              </a>
              <Link to="/app" className="block text-xs text-primary font-semibold hover:underline">
                ou explore o sistema antes →
              </Link>
              <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
                <span>🛡️</span>
                <span>7 dias de garantia incondicional — 100% do valor de volta, sem perguntas</span>
              </div>
            </div>
          </div>

          {/* Card Upgrade */}
          <div className="bg-card rounded-3xl p-8 border border-emerald-200 shadow-soft text-center flex flex-col relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <span className="text-[9px] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">Upgrade opcional</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">+ Automação WhatsApp para clientes</p>
            <div className="font-display text-6xl text-emerald-600 mb-1 leading-none">
              <span className="text-2xl align-top mr-1">R$</span>9<span className="text-3xl">,90</span>
            </div>
            <p className="text-xs text-muted-foreground mb-5 font-medium">por mês · cancele quando quiser</p>
            <ul className="space-y-2 mb-6 text-left">
              {UPGRADE_INCLUSO.map(t => (
                <li key={t} className="flex gap-3 items-start text-sm">
                  <span className="mt-0.5 size-5 rounded-full bg-emerald-100 grid place-items-center shrink-0">
                    <span className="size-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-foreground/85">{t}</span>
                </li>
              ))}
            </ul>
            <div className="mt-auto space-y-3">
              <a
                href={HOTMART_PREMIUM}
                target="_blank"
                rel="noreferrer"
                className="block w-full rounded-2xl bg-emerald-600 text-white py-4 font-bold text-base hover:bg-emerald-700 transition-colors"
              >
                Adicionar automação
              </a>
              <p className="text-[10px] text-muted-foreground tracking-wide">
                Disponível após ativar o plano base · requer conta Z-API gratuita
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
