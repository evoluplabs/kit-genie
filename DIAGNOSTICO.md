# Diagnóstico do Kit Genie / Pink Love Gestão (branch `claude/optimistic-cannon-NFh28`)

## Contexto

Depois de várias rodadas de correções e das 5 sugestões do CEO já implementadas, o usuário pediu um "raio-x" completo: o que está pronto hoje, o que está com bug/dívida técnica, e o que vale a pena construir a seguir. Este documento é esse raio-x — feito por exploração completa do repositório (rotas, modelo de dados, Cloud Functions, regras de segurança, tooling) — mais uma lista priorizada de sugestões, com as decisões do responsável pelo produto registradas abaixo de cada seção.

## Correção importante sobre o modelo de negócio

O sistema **não é vendido diretamente para uma decoradora grande como cliente enterprise**. É um **produto isca de venda genérica**: a decoradora (ou qualquer criador de conteúdo do nicho) divulga o produto para sua audiência/seguidores, e **qualquer comprador individual** adquire sua própria instância do sistema — fácil de configurar e usar sozinho. O objetivo é alto volume de vendas a valor único baixo (R$47), com potencial de lucro vindo da escala e de upgrades para planos recorrentes (WhatsApp, automações etc.).

Isso muda o eixo do diagnóstico: o risco central não é "falta de feature X para fechar uma conta grande", e sim **garantir que o custo de infraestrutura por comprador fique baixo e prevísivel em escala**, já que a maioria vai pagar uma única vez e usar o sistema indefinidamente.

## O que está pronto hoje

**Páginas do app** (todas atrás do gate de auth+onboarding em `app.tsx`):
- **Dashboard** (`app.index.tsx`) — KPIs do mês, meta (fixa ou % de crescimento), alertas de devolução/recebíveis, próximos eventos, estoque baixo, ranking de kits campeões, insights de negócio (dia mais movimentado, taxa de cancelamento, clientes recorrentes).
- **Kits & BOM** (`app.kits.tsx`) — CRUD de kits, tiers Bronze/Prata/Ouro (preço e lista de materiais próprios por tier), upload de imagem, cálculo de margem.
- **Acervo** (`app.components.tsx`) — CRUD de componentes/materiais, estoque, reutilizável vs. consumível, alerta de estoque baixo.
- **Locações & Agenda** (`app.sales.tsx`, a maior página, ~1360 linhas) — tabela + calendário, criação/edição com tiers e itens extra, frete, alerta de conflito de datas, checklist de entrega, orçamento copiável (texto formatado p/ WhatsApp), modal de detalhes com BOM completo, geração de **contrato em PDF** (`ContractModal` + jsPDF), upload de foto do evento.
- **Finanças** (`app.finance.tsx`) — lançamentos de custo (pessoal/profissional, único/mensal/anual), KPIs, filtros.
- **Clientes** (`app.customers.tsx`) — CRM derivado das vendas (sem coleção própria): LTV, tiers de fidelidade (VIP/Fiel/Regular/Nova), previsão de próxima compra, drawer com histórico/métricas.
- **Relatórios** (`app.reports.tsx`) — export CSV (vendas, estoque, financeiro, kits/BOM).
- **Configurações** (`app.settings.tsx`) — perfil do negócio, metas, notificações (estoque baixo + relatório semanal por e-mail), integração WhatsApp Premium (Z-API), reset de dados.
- **Onboarding** (wizard de 5 passos), **Login/Signup/Reset de senha**, **Landing page** pública.
- **Sino de notificações** no shell — eventos em 48h e devoluções atrasadas/próximas, tudo client-side.

**Infra / backend:**
- Firebase Auth (só e-mail/senha), Firestore em tempo real (`onSnapshot`), Storage.
- Multi-tenant simples: cada usuário isolado em `users/{uid}/...`, sem times/múltiplos usuários por conta.
- Cloud Functions: `weeklyReport` (e-mail semanal), `onComponentLowStock` (alerta), `whatsappWebhook`/bot conversacional (Z-API, agenda via WhatsApp), `assistant` (IA via Claude — **desativado/comentado**).
- Monetização via link externo Hotmart, sem provisionamento automático de conta (webhook não implementado).

## Bugs e dívida técnica encontrados

1. **Bot do WhatsApp grava vendas com schema errado** — `whatsapp/bot.ts` e `assistant-executor.ts` escrevem `Sale` direto no Firestore usando campos que não existem no tipo real (`kitName`/`clientName`/`price` em vez de `kitNameSnapshot`/`customerName`/`totalPrice`), e usam `.add()` (auto-ID) em vez do padrão `id == doc.id` usado pelo resto do app. Vendas criadas pelo bot provavelmente **não aparecem corretamente** no app (ou quebram a tela de vendas).
2. **Drift de schema**: o webhook do WhatsApp lê `profile.zapiInstance`/`zapiToken`, mas isso não existe no tipo `Profile` compartilhado — sinal de que o schema do client e das functions divergiram.
3. **Feature fantasma**: `AssistantOrb` (widget de chat/voz flutuante com IA) está totalmente construído mas **não é importado em lugar nenhum** — não aparece pra usuário nenhum. A function `assistant` que ele chamaria está comentada.
4. **Sem entidade `Client` própria** — nome/telefone do cliente é só texto duplicado em cada venda; não há dedupe, edição centralizada, nem histórico fora do que é derivado das vendas.
5. `Sale` não tem `updatedAt` — edições não são auditadas.
6. Excluir um Kit não limpa `Sale.kitId` órfão em vendas antigas.
7. `useDb` re-renderiza todos os consumidores em qualquer mudança do cache (sem seletor memoizado) — não é bug hoje, mas não escala bem.
8. Regras do Firestore são só "dono pode ler/escrever tudo", sem validação de schema/valor (não impede status inválido, estoque negativo etc. — validação só existe no client).
9. `storage.rules` permite leitura pública tanto em `kits/` quanto em `events/` — fotos de evento de cliente ficam acessíveis por URL direta, mesmo sem estarem "privadas".
10. Busca de instância do WhatsApp no webhook faz **scan completo de todos os usuários** por request — não escala com a base de clientes.
11. **Zero testes automatizados e zero CI** (`.github/` nem existe) — toda a qualidade depende de QA manual (há até um checklist manual em `PROXIMOS_PASSOS.md`).
12. `jspdf` só é usado no contrato de vendas — não há geração de PDF em Relatórios/Orçamento (roadmap interno já lista "PDF de orçamento" como pendente).
13. README declara todas as features como "Completo", mas isso não reflete o bot do WhatsApp com bug de schema nem o assistente desativado — vale atualizar a documentação junto com qualquer correção.

## Sugestões de melhoria (priorizadas) — com decisões

**Prioridade alta — corrigir antes de expandir: ✅ TODAS APROVADAS**
- A) ✅ Aprovado. Corrigir o schema das vendas criadas pelo bot do WhatsApp e pelo assistant executor para usar os mesmos campos de `Sale` do app.
- B) ✅ Aprovado. Adicionar validação de schema básica nas regras do Firestore e revisar leitura pública de fotos de evento.
- C) ✅ Aprovado, **com ressalva**: em vez de "reativar ou remover", o `AssistantOrb` deve ficar **totalmente funcional, mas atrás de um toggle boolean** (ligar/desligar por conta) — provavelmente em Configurações, e por ser um recurso com custo variável (chamadas à API da Claude), é candidato natural a ficar restrito a um plano pago (ver seção de modelo de negócio abaixo).

**Prioridade média — fortalece o produto:**
- D) **Aprovado com ressalva importante** — ver "Entidade Client x custo de infraestrutura" abaixo. Não deve ser implementada da forma óbvia (nova coleção sempre-ativa) sem antes resolver o modelo de custo.
- E) ✅ Aprovado. `updatedAt` em `Sale` + limpeza de `kitId` órfão.
- F) ✅ Aprovado. PDF de orçamento para cliente.
- G) ✅ Aprovado. Login com Google.

**Prioridade baixa / infraestrutura: ✅ TODAS APROVADAS**
- H) ✅ Aprovado. Testes automatizados mínimos + CI simples.
- I) ✅ Aprovado. Otimizar busca de instância do WhatsApp no webhook.

## Entidade `Client` x custo de infraestrutura (ponto levantado pelo usuário)

Preocupação: como o produto é vendido a **valor único** para um público amplo (potencialmente centenas/milhares de compradores individuais), qualquer aumento de leitura/escrita/armazenamento por conta (como uma nova coleção `clients` sempre sincronizada em tempo real) aumenta o custo de Firebase **por comprador**, sem receita recorrente correspondente para cobrir isso na maioria dos casos. Hoje não existe nenhuma segmentação de plano — é tudo liberado de uma vez pelo valor único, o que é estruturalmente incompatível com escala se o custo de infraestrutura crescer junto com o número de usuários gratuitos/vitalícios.

Este ponto vale para `Client` e para **qualquer feature nova daqui pra frente** (inclusive o `AssistantOrb`, que tem custo de API por mensagem). Três caminhos possíveis foram levantados — **nenhum foi escolhido ainda, é uma decisão pendente do usuário**:

1. **Gating por plano + limites** — o plano vitalício (R$47) vira um "plano básico" sem automações (sem bot WhatsApp, sem IA, sem sync em tempo real ilimitado, com histórico/imagens limitados). Tudo que gera custo variável (Cloud Functions, chamadas de IA, WhatsApp, backups/sync ilimitado) fica atrás de um plano recorrente. Mais rápido de implementar, não exige reescrever a arquitetura atual (Firestore multi-tenant compartilhado).
2. **Local-first para o plano vitalício** — dados do comprador vitalício ficam **no navegador dele** (ex.: IndexedDB), com **zero custo de Firebase** para esse usuário; a nuvem (sync entre dispositivos, backup, automações) só entra no plano pago. Resolve o problema de raiz, mas exige reescrever a camada de dados (`services/db`) para funcionar offline por padrão — é o cenário mais próximo do que o usuário descreveu como "cada comprador ter seu próprio banco de dados/planilha", só que implementado no dispositivo do próprio comprador em vez de infraestrutura própria por cliente (que seria inviável de provisionar automaticamente em escala).
3. **Manter Firestore compartilhado, mas reduzir custo por conta** — sem gating de plano: limitar janelas de histórico sincronizado em tempo real (ex.: só os últimos 12 meses ficam com `onSnapshot`, o resto é arquivado), comprimir/redimensionar imagens antes do upload, e adicionar limites de armazenamento por conta nas regras do Storage. Reduz custo mas não resolve o problema de fundo (crescimento linear de custo com a base de usuários vitalícios).

Essas três opções serão levadas para decisão do usuário antes de qualquer implementação (nenhuma foi escolhida ainda). A entidade `Client` (item D) deve ser desenhada em conjunto com essa decisão — por exemplo, implementada sem um listener `onSnapshot` sempre ativo, para não adicionar custo fixo por conta antes do modelo de plano estar definido.

## Modelo de negócio atual

- **Modelo real**: produto isca de venda em massa/genérica — qualquer seguidor/comprador da audiência de uma decoradora (ou de qualquer divulgador) pode comprar sua própria instância do sistema, com setup fácil e uso individual. Não é uma venda B2B para uma única operação grande.
- **Monetização**: acesso vitalício por **R$ 47** via checkout externo Hotmart (link, sem integração/webhook — a liberação de conta hoje não é automática, é manual/fora do app).
- **Upsell recorrente**: módulo "WhatsApp Premium" a **R$ 9,90/mês**, que liga a agenda a um bot conversacional via Z-API.
- **Risco estrutural identificado**: o valor único (R$47) não cobre custo de infraestrutura recorrente se o número de usuários crescer com todas as features liberadas — ver seção acima. Isso é o ponto mais crítico do modelo de negócio hoje, e precisa de uma solução antes de escalar as vendas.
- **Não existe hoje**: segmentação clara de planos com funcionalidades por nível, provisionamento automático de conta pós-compra, ou qualquer controle de custo por usuário.

### Multiusuário/permissões por equipe
Mesmo não sendo o ponto central (o produto não é vendido a uma operação grande específica), o usuário confirma que o sistema **seria melhor com multiusuário/permissões por equipe**, já que alguns compradores individuais podem ter equipe própria (atendimento, montagem, financeiro). Fica registrado como melhoria desejável, não bloqueante — e também deve considerar o modelo de custo por conta ao ser desenhado (mais usuários por conta = mais uso, então provavelmente é uma feature de plano pago).

## Sugestões de novas features de produto — decisões

Além dos itens de dívida técnica listados acima:

1. **Contas multiusuário com papéis** — desejável, ver nota acima; provavelmente feature de plano pago dado o aumento de uso por conta.
2. Múltiplas unidades/filiais — mantido como sugestão, não discutido ainda.
3. **PDF de orçamento para o cliente final** — ✅ aprovado (mesmo item F acima).
4. **Login com Google** — ✅ aprovado (mesmo item G acima).
5. Provisionamento automático de conta via webhook — mantido como sugestão, ganha ainda mais importância dado o volume de vendas esperado (venda genérica em massa, não poucas contas manuais).
6. **Plano de assinatura recorrente nativo com níveis** — este é agora o ponto central do modelo de negócio (ver seção "Entidade Client x custo de infraestrutura"), não apenas uma sugestão secundária.
7. **`AssistantOrb` com toggle** — ✅ aprovado com ressalva, ver item C acima.
8. Histórico auditável de estoque e de edições em vendas — mantido como sugestão.
9. Integração com Google Calendar — mantido como sugestão.

## Próximo passo

Decisões de escopo já registradas acima. O ponto em aberto que bloqueia o desenho de várias features (entidade `Client`, `AssistantOrb`, e qualquer automação futura) é a escolha do modelo de custo/plano (as 3 opções listadas). Assim que essa decisão for tomada, o próximo ciclo de trabalho pode: (1) implementar os itens de prioridade alta já aprovados, (2) desenhar a entidade `Client` e o toggle do `AssistantOrb` já alinhados ao modelo de plano escolhido.
