const DEMO_MESSAGES = [
  { type: "user", audio: true, text: '"Vendi o Kit Batman, cliente Joana, dia 22, 850 reais"' },
  { type: "bot", text: "✅ Venda registrada!\n📦 Kit Batman · 22/10 · Joana · R$ 850\nEstoque atualizado automaticamente." },
  { type: "user", audio: false, text: "Quanto tenho de balão azul?" },
  { type: "bot", text: "🔵 Balão azul metalizado: 23 unidades\n(Mínimo: 10 · Status: ✅ OK)" },
  { type: "user", audio: true, text: '"Como foram minhas vendas essa semana?"' },
  { type: "bot", text: "📊 Semana 14–20/10 · 4 eventos\nFaturamento: R$ 3.200\nLucro estimado: R$ 2.100" },
];

export function LandingAudioBot() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-24">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        {/* Copy */}
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Incluso no plano base</span>
          <h2 className="font-display text-4xl md:text-5xl mt-3 mb-6 text-balance">
            Fale, ele faz — <span className="italic text-primary">seu assistente pessoal no app</span>.
          </h2>
          <p className="text-muted-foreground mb-8 text-pretty leading-relaxed">
            Funciona por voz ou texto, em português, do jeito que você fala.
            Disponível em qualquer tela do app — sem interromper o que está fazendo,
            sem sair do galpão, sem abrir nada novo. É como ter um assistente que
            entende "vendi o kit, cliente tal, dia tal" e já resolve tudo.
          </p>
          <ul className="space-y-4">
            {[
              { icon: "🎤", label: "Por voz", desc: "Clica no mic, fala, pronto — transcrição e execução automática" },
              { icon: "💬", label: "Por texto", desc: "Digita o comando como se fosse uma mensagem de WhatsApp" },
              { icon: "🔒", label: "Sem custo extra", desc: "Incluso no plano base, sem API paga, sem mensalidade adicional" },
            ].map(item => (
              <li key={item.label} className="flex gap-4 items-start">
                <div className="size-10 rounded-xl bg-primary-soft grid place-items-center text-lg shrink-0">{item.icon}</div>
                <div>
                  <div className="font-semibold text-sm">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* App mockup with orb */}
        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute -inset-6 bg-primary/8 blur-3xl rounded-full -z-10" />

          {/* App window */}
          <div className="bg-card rounded-3xl border border-border shadow-glow overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2 bg-surface">
              <span className="size-2.5 rounded-full bg-rose-300" />
              <span className="size-2.5 rounded-full bg-amber-300" />
              <span className="size-2.5 rounded-full bg-emerald-300" />
              <span className="ml-3 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Decora · Vendas</span>
            </div>

            {/* Assistant panel */}
            <div className="p-4">
              <div className="bg-primary-dark rounded-2xl overflow-hidden mb-4">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                  <div className="size-6 rounded-full bg-white/20 grid place-items-center text-xs">✨</div>
                  <span className="text-xs text-white font-bold">Assistente Decora</span>
                  <span className="ml-auto text-[10px] text-white/60">voz ou texto</span>
                </div>
                <div className="p-3 space-y-2 max-h-52 overflow-hidden">
                  {DEMO_MESSAGES.map((m, i) => (
                    <div key={i} className={`flex ${m.type === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`text-[10px] max-w-[85%] px-2.5 py-1.5 rounded-xl leading-relaxed whitespace-pre-line ${
                        m.type === "user"
                          ? "bg-white/20 text-white rounded-tr-sm"
                          : "bg-white/10 text-white/90 rounded-tl-sm"
                      }`}>
                        {m.audio && <span className="mr-1 opacity-70">🎤</span>}
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 px-3 py-2 border-t border-white/10">
                  <div className="flex-1 bg-white/10 rounded-lg px-3 py-1.5 text-[10px] text-white/50">Digite ou fale um comando...</div>
                  <div className="size-7 rounded-full bg-primary grid place-items-center">
                    <span className="text-[10px]">🎤</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating orb hint */}
          <div className="absolute -bottom-3 -right-3 size-14 rounded-full bg-primary shadow-glow flex items-center justify-center">
            <span className="text-primary-foreground text-xl">✨</span>
            <span className="absolute -top-1 -right-1 size-3 rounded-full bg-emerald-400 border-2 border-white" />
          </div>
        </div>
      </div>
    </section>
  );
}
