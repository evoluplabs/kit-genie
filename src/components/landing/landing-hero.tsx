import { Link } from "@tanstack/react-router";

export function LandingHero() {
  return (
    <header className="relative overflow-hidden bg-card border-b border-pink-100/60 bg-soft-grain">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-24 grid lg:grid-cols-[1.05fr_1fr] gap-12 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 bg-primary-soft border border-primary/15 px-4 py-1.5 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-70"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Lançamento · Preço de fundação</span>
          </div>

          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight text-balance">
            Gerencie suas festas<br className="hidden md:inline" /> <span className="text-primary italic">por voz</span> — sem planilha.
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl text-pretty">
            Fale um comando e o sistema registra a venda, atualiza o estoque e responde o cliente.
            Feito para decoradoras de pegue-e-monte, montagem e locação que cansaram de planilha.
          </p>

          <div className="flex flex-wrap gap-4 items-center">
            <a
              href="#oferta"
              className="bg-foreground text-background px-7 py-4 rounded-2xl font-bold text-base hover:scale-[1.02] active:scale-[0.99] transition-transform shadow-soft"
            >
              Quero experimentar
            </a>
            <a
              href="#como-funciona"
              className="px-5 py-4 rounded-2xl font-semibold text-base text-primary-dark hover:bg-primary-soft transition-colors"
            >
              Ver como funciona →
            </a>
          </div>

          {/* Social proof strip */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex -space-x-2">
                {["C","M","P","F"].map(l => (
                  <div key={l} className="size-8 rounded-full bg-primary-soft border-2 border-card grid place-items-center text-xs font-bold text-primary">{l}</div>
                ))}
              </div>
              <div>
                <div className="flex gap-0.5 text-amber-400 text-xs">★★★★★</div>
                <span className="text-xs text-muted-foreground">"Registrei 3 vendas sem abrir planilha nenhuma." — Camila R., SP</span>
              </div>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>🔒 Pagamento seguro</span>
              <span>✅ 7 dias de garantia</span>
              <span>⚡ Acesso imediato</span>
            </div>
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="relative">
          <div className="absolute -inset-8 bg-primary/15 blur-3xl rounded-full -z-10" />
          <div className="relative rounded-3xl bg-card border border-pink-100 shadow-glow overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2 bg-surface">
              <span className="size-2.5 rounded-full bg-rose-300" />
              <span className="size-2.5 rounded-full bg-amber-300" />
              <span className="size-2.5 rounded-full bg-emerald-300" />
              <span className="ml-3 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Painel · Decora</span>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2 rounded-2xl bg-primary-dark text-primary-foreground p-5">
                <div className="text-xs uppercase tracking-widest opacity-70 mb-1">Faturamento do mês</div>
                <div className="font-display text-3xl italic">R$ 14.850,00</div>
                <div className="mt-3 flex gap-6 text-[11px]">
                  <span className="text-emerald-300 font-semibold">↑ 22% vs mês anterior</span>
                  <span className="opacity-70">12 eventos</span>
                </div>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Kits ativos</div>
                <div className="font-display text-2xl mt-1">28</div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-2">fim de semana cheio</div>
              </div>
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
                <div className="text-[10px] font-bold uppercase text-destructive tracking-wider">Estoque baixo</div>
                <div className="font-display text-2xl mt-1">3 itens</div>
                <div className="text-[11px] text-muted-foreground mt-2">balão rosa em 4 kits</div>
              </div>
              {/* Assistente orb preview */}
              <div className="col-span-2 rounded-2xl bg-primary-soft border border-primary/20 p-4 flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary grid place-items-center shrink-0">
                  <span className="text-primary-foreground text-sm">✨</span>
                </div>
                <div className="flex-1 text-xs">
                  <div className="font-semibold text-primary-dark mb-0.5">🎤 "Vendi o kit Batman, cliente Joana, dia 22"</div>
                  <div className="text-muted-foreground">✅ Venda registrada · estoque atualizado · R$ 850</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
