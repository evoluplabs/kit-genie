# Diagnóstico do Kit Genie / Pink Love Gestão (branch `claude/optimistic-cannon-NFh28`)

## Contexto

Depois de várias rodadas de correções e das 5 sugestões do CEO já implementadas, o usuário pediu um "raio-x" completo: o que está pronto hoje, o que está com bug/dívida técnica, e o que vale a pena construir a seguir. Este documento é esse raio-x — feito por exploração completa do repositório (rotas, modelo de dados, Cloud Functions, regras de segurança, tooling) — mais uma lista priorizada de sugestões.

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

## Sugestões de melhoria (priorizadas)

**Prioridade alta — corrigir antes de expandir:**
- A) Corrigir o schema das vendas criadas pelo bot do WhatsApp e pelo assistant executor para usar os mesmos campos de `Sale` do app (evita vendas "invisíveis" ou quebradas).
- B) Adicionar validação de schema básica nas regras do Firestore (status enum, estoque ≥ 0, etc.) e revisar se fotos de evento devem continuar com leitura pública.
- C) Decidir o destino do `AssistantOrb`/function `assistant`: reativar (falta só a secret `ANTHROPIC_API_KEY` e montar o componente) ou remover o código morto.

**Prioridade média — fortalece o produto:**
- D) Entidade `Client` própria (cadastro dedicado, com histórico e dados de contato centralizados) em vez de derivar tudo de `customerName`/`customerPhone` nas vendas.
- E) `updatedAt` em `Sale` + limpeza de `kitId` órfão ao excluir um Kit.
- F) PDF de orçamento para cliente (reaproveitando o `jspdf` já usado no contrato).
- G) Login com Google (mencionado no roadmap interno, ainda não implementado).

**Prioridade baixa / infraestrutura:**
- H) Testes automatizados mínimos (ex.: Vitest para a camada `services/db`) + um workflow simples de CI (lint + build) no GitHub Actions.
- I) Otimizar a busca de instância do WhatsApp no webhook (índice/lookup em vez de scan completo).

## Modelo de negócio atual (para apresentar à decoradora)

- **Monetização**: acesso vitalício por **R$ 47** via checkout externo Hotmart (link, sem integração/webhook — a liberação de conta hoje não é automática, é manual/fora do app).
- **Upsell recorrente**: módulo "WhatsApp Premium" a **R$ 9,90/mês**, que liga a agenda a um bot conversacional via Z-API (cliente final agenda kit/data direto pelo WhatsApp da decoradora).
- **Posicionamento**: ferramenta de gestão vertical para negócios de decoração de festas — cobre o ciclo completo (catálogo de kits com BOM, controle de estoque de materiais reutilizáveis vs. consumíveis, agenda de locações/eventos, financeiro, relacionamento com cliente/CRM leve, relatórios).
- **Estrutura de conta**: uma conta = um negócio (owner único), sem múltiplos usuários/permissões, sem plano por número de usuários ou de eventos. Isso é uma limitação relevante para vender a uma decoradora **já grande**, que provavelmente tem equipe (atendimento, montagem, financeiro) e não apenas o dono operando o sistema.
- **Não existe hoje**: cobrança recorrente gerenciada dentro do produto (é só um link Hotmart), planos por volume/funcionalidade, contrato de nível de serviço, onboarding assistido, ou qualquer diferenciação de preço por tamanho de operação.

### Pontos a considerar ao vender para uma decoradora grande
- Falta de **multiusuário/permissões por equipe** tende a ser o maior obstáculo comercial — uma operação grande normalmente quer login separado para atendimento, estoque/montagem e financeiro, com visibilidade restrita por papel.
- O modelo de preço atual (pagamento único vitalício + upsell fixo de R$9,90) foi pensado para operação solo/pequena; uma conta grande pode justificar um **plano corporativo/anual** com suporte dedicado, mais um modelo de precificação por volume de eventos ou de usuários.
- A geração de contrato em PDF já existe (ContractModal + jsPDF na tela de vendas) — é um diferencial já pronto para mostrar na demo.
- O CRM de clientes (LTV, fidelidade, previsão de recompra) e o dashboard com insights de negócio são pontos fortes para destacar como "inteligência", não só operação.

## Sugestões de novas features de produto (visão comercial, não só técnica)

Além dos itens de dívida técnica listados acima, para fortalecer a proposta a um cliente grande:

1. **Contas multiusuário com papéis** (dono, atendimento, montagem/logística, financeiro) — hoje é o maior gap frente a uma operação com equipe.
2. **Múltiplas unidades/filiais** sob uma mesma conta (se a decoradora atua em mais de uma cidade/base de estoque).
3. **PDF de orçamento para o cliente final** (não só o contrato) — reaproveita o jsPDF já integrado.
4. **Login com Google** — reduz fricção de onboarding de equipe.
5. **Provisionamento automático de conta via webhook Hotmart** (ou outro gateway) — hoje é manual, o que não escala para vender em maior volume.
6. **Plano de assinatura recorrente nativo** (não só o pagamento vitalício + upsell fixo) — permite precificar por volume/uso ao vender para operações maiores.
7. **Reativar (ou remover) o assistente de IA** (`AssistantOrb`) — já construído (voz + texto), pode ser um diferencial forte de demo se ligado corretamente; hoje está invisível para o usuário.
8. **Histórico auditável de estoque e de edições em vendas** (`updatedAt`, log de ajustes de estoque) — importante para operações maiores com mais gente tocando o sistema.
9. **Integração com Google Calendar** (já citada no roadmap interno) — facilita adoção por equipes que já usam agenda compartilhada.

## Próximo passo

Este documento é só o diagnóstico. Quando o usuário decidir quais itens priorizar (bugs, features de produto, ou infraestrutura), o próximo ciclo de trabalho pode focar neles.
