import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

const QA = [
  {
    q: "Preciso entender de tecnologia pra usar?",
    a: "Não. O sistema foi criado justamente pra decoradoras que cansaram de planilha. O onboarding te conduz passo a passo no cadastro dos primeiros kits e componentes — se você usa WhatsApp, você usa o Decora Gestão.",
  },
  {
    q: "Como funciona o assistente por voz?",
    a: "É um botão de microfone que fica disponível em todas as telas do app. Você clica, fala o comando em português — como 'vendi o kit Mickey, cliente Joana, dia 22' — e o sistema registra automaticamente. Funciona por texto também, sem custo adicional.",
  },
  {
    q: "E se eu trabalhar com 20 temas diferentes?",
    a: "Esse é exatamente o ponto forte. Cadastre cada componente UMA vez (ex: balão rosa metalizado) e use em quantos kits quiser. O sistema entende a reutilização e avisa quando alguma peça vai faltar.",
  },
  {
    q: "Como funciona o bot de atendimento no WhatsApp?",
    a: "O controle de estoque, financeiro e o assistente por voz são vitalícios e já estão no plano base. O bot que responde *seus clientes* pelo WhatsApp é um upgrade opcional de R$ 9,90/mês — você só paga se precisar. Cancele quando quiser.",
  },
  {
    q: "Já uso planilha e funciona. Por que mudar?",
    a: "Planilha não avisa quando vai faltar peça, não bloqueia datas duplicadas e não calcula o lucro real separando custos pessoais dos empresariais. Você sabe quanto ganhou de verdade no último mês? O Decora Gestão mostra isso com um clique.",
  },
  {
    q: "Posso exportar meus dados pro contador?",
    a: "Sim. Exportação em CSV e PDF de vendas, fluxo de caixa, estoque e custos a qualquer momento, com um clique.",
  },
  {
    q: "É realmente vitalício, sem mensalidade?",
    a: "Sim. Pagamento único na Hotmart, acesso para sempre, com todas as atualizações futuras inclusas. Nenhuma cobrança mensal surpresa.",
  },
  {
    q: "Tem garantia?",
    a: "7 dias de garantia incondicional. Se não amar, devolvemos 100% do valor — sem perguntas, sem burocracia, direto pela Hotmart.",
  },
];

export function LandingFaq() {
  return (
    <section id="faq" className="max-w-3xl mx-auto px-6 py-24">
      <div className="text-center mb-12">
        <span className="text-xs font-bold uppercase tracking-widest text-primary">Tira-dúvidas</span>
        <h2 className="font-display text-4xl md:text-5xl mt-3">Perguntas frequentes</h2>
      </div>
      <Accordion type="single" collapsible className="space-y-3">
        {QA.map((item, i) => (
          <AccordionItem key={item.q} value={`q-${i}`} className="border border-border rounded-2xl px-5 bg-card">
            <AccordionTrigger className="text-left font-semibold hover:no-underline">{item.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm leading-relaxed">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
