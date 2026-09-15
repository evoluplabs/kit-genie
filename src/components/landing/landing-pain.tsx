const BEFORE = [
  "Kit separado… ou tá? Precisa confirmar com a menina que ajudou",
  "Dois clientes pra mesma data. A segunda já deu sinal.",
  "Quanto custou esse evento mesmo? Tem nota aqui no celular…",
  "WhatsApp lotado de orçamento que nunca respondeu",
  "Planilha do ano passado ainda em aberto",
];

const AFTER = [
  "Estoque atualizado em tempo real a cada venda confirmada",
  "Conflito de data bloqueado antes de você confirmar",
  "Lucro real visível, separado de gastos pessoais",
  "Orçamento respondido em segundos — manual ou automático",
  "Agenda do fim de semana inteira visível com um clique",
];

export function LandingPain() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <span className="text-xs font-bold uppercase tracking-widest text-primary">O dia a dia real</span>
        <h2 className="font-display text-4xl md:text-5xl mt-3 text-balance">
          Você ainda gerencia assim?
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Antes */}
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-10 rounded-full bg-destructive/10 grid place-items-center text-xl">😩</div>
            <div>
              <div className="font-bold text-destructive">Sem o Decora Gestão</div>
              <div className="text-xs text-muted-foreground">O que acontece toda semana</div>
            </div>
          </div>
          <ul className="space-y-3">
            {BEFORE.map(t => (
              <li key={t} className="flex gap-3 items-start text-sm">
                <span className="text-destructive mt-0.5 shrink-0">✗</span>
                <span className="text-foreground/75">{t}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Depois */}
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-10 rounded-full bg-emerald-100 grid place-items-center text-xl">✨</div>
            <div>
              <div className="font-bold text-emerald-700">Com o Decora Gestão</div>
              <div className="text-xs text-muted-foreground">Como fica a partir do primeiro dia</div>
            </div>
          </div>
          <ul className="space-y-3">
            {AFTER.map(t => (
              <li key={t} className="flex gap-3 items-start text-sm">
                <span className="text-emerald-600 mt-0.5 shrink-0">✓</span>
                <span className="text-foreground/80">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
