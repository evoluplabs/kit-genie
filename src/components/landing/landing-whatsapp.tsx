export function LandingWhatsapp() {
  return (
    <section className="bg-surface py-24">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Bot premium · R$ 9,90/mês</span>
          <h2 className="font-display text-4xl md:text-5xl mt-3 mb-6 text-balance">
            Seus clientes também <span className="italic text-primary">têm uma assistente</span>.
          </h2>
          <p className="text-muted-foreground mb-6 text-pretty leading-relaxed">
            Sabe aquela cliente que manda mensagem às 23h perguntando se tem Kit Jardim pra semana que vem?
            Com a automação, o sistema responde na hora — com disponibilidade real, preço e opção de já confirmar.
            Você só aparece quando a venda está fechada.
          </p>
          <ul className="space-y-3 text-sm">
            {[
              "Cliente pergunta disponibilidade → sistema responde com estoque real",
              "Confirmou? Peças já bloqueadas na data do evento",
              "Vai faltar alguma peça? Alerta no seu painel antes do problema",
              "Registrou manualmente? Estoque já atualizado sozinho",
            ].map(t => (
              <li key={t} className="flex gap-3 items-start">
                <span className="mt-1.5 size-2 rounded-full bg-primary shrink-0" />
                <span className="text-foreground/80">{t}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 inline-flex items-center gap-2 bg-secondary px-4 py-2 rounded-full text-sm text-muted-foreground">
            <span>🟢</span>
            <span>Requer plano Z-API gratuito + configuração simples</span>
          </div>
        </div>

        {/* WhatsApp mockup */}
        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute -inset-6 bg-primary/10 blur-3xl rounded-full -z-10" />
          <div className="bg-card rounded-[2.5rem] border border-border shadow-glow overflow-hidden">
            <div className="bg-emerald-700 text-white px-5 py-4 flex items-center gap-3">
              <div className="size-10 rounded-full bg-emerald-500 grid place-items-center font-bold">DG</div>
              <div>
                <div className="font-semibold text-sm">Decora Gestão</div>
                <div className="text-[10px] opacity-80">online · respondendo automaticamente</div>
              </div>
            </div>
            <div className="p-5 space-y-3 bg-[#efeae2] min-h-[380px]">
              <Msg side="left">Oi! Vi seu Insta, tem Kit Jardim Encantado pra 14/09?</Msg>
              <Msg side="right">Oi! 💕 Tenho sim! O Kit Jardim tá disponível nessa data. Investimento a partir de R$ 750. Posso mandar as fotos?</Msg>
              <Msg side="left">Manda!</Msg>
              <Msg side="right">📸 [Kit Jardim Encantado] Vem com arco floral, mesa + painel. Fechamos?</Msg>
              <Msg side="left">Pode ser! Vou confirmar o pix amanhã</Msg>
              <Msg side="right" small>✓ Pré-reserva criada · sua agenda atualizada · você foi notificada</Msg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Msg({ children, side, small }: { children: React.ReactNode; side: "left" | "right"; small?: boolean }) {
  const isRight = side === "right";
  return (
    <div className={`flex ${isRight ? "justify-end" : "justify-start"}`}>
      <div className={`${small ? "text-[10px] italic opacity-80" : "text-xs"} max-w-[85%] px-3 py-2 rounded-2xl ${isRight ? "bg-[#dcf8c6] rounded-tr-sm" : "bg-white rounded-tl-sm"} shadow-sm`}>
        {children}
      </div>
    </div>
  );
}

// React needs to be in scope for JSX
import React from "react";
