# Plano: projeto gêmeo do Pink Love para nail designer (repo `nail-genie` / `designMika`)

## Contexto

A esposa do dono está começando um negócio de design de unhas (fibra de vidro, gel, esmaltação). O sistema que já construímos para decoradoras de festa (`kit-genie`) tem a mesma espinha dorsal que esse nicho precisa: muitos insumos, "pacotes" com lista de materiais, agenda, financeiro e clientes recorrentes. A ideia é criar um **repositório novo e independente**, gêmeo do atual, adaptado ao nicho. O repositório de destino real é `AlveDev/designMika`.

A pesquisa de mercado confirmou o encaixe e trouxe três achados que mudam o desenho:

1. **A dor nº 1 é não saber o custo real por atendimento.** Referência de mercado: ~R$ 16 de material num alongamento (gel R$ 3,60 + tips R$ 2,25 + lixas R$ 2,00 + descartáveis R$ 4,00 + primer/top/cor). O discurso recorrente do nicho é "faturei R$ 7.800 e sobrou R$ 1.140". Nosso motor de BOM já resolve exatamente isso.
2. **O mercado de *agenda* está saturado** (Simples Agenda e Agendali a R$ 39,90/mês, TopAgenda e Prit freemium, Naild focado no nicho). Mas **nenhum app para autônoma faz ficha técnica de insumo por serviço com custo real** — isso só existe na camada cara de salão (Trinks R$ 76/mês, Avec R$ 88,90/mês, Belasis). O posicionamento certo é **lucro por atendimento**, não agenda.
3. **A recorrência é o ativo mais valioso**: manutenção a cada 15–21 dias, previsível, e "cliente que some" é dor conhecida. A lógica de frequência média + previsão da próxima visita já existe em `app.customers.tsx` e vira feature-âncora.

Validação de preço: planilhas de precificação/estoque para nail já vendem R$ 17–150 em pagamento único no Hotmart — elas pagam por isso e têm aversão a mensalidade.

## Antes de começar (checklist para a sessão nova)

1. **Verificar o estado atual do `AlveDev/designMika`** antes de escrever qualquer coisa — não assumir que está vazio. Rodar `git clone`/explorar o conteúdo primeiro. Se já existir algo (scaffold do Lovable, protótipo, etc.), reconciliar com este plano em vez de sobrescrever.
2. **Método recomendado para trazer o código do `kit-genie`**: esta sessão que escreveu o plano nunca teve acesso de escrita simultâneo aos dois repositórios (só leitura em `kit-genie`), por isso todo o trabalho de hoje foi feito arquivo por arquivo via API do GitHub. A sessão nova tem acesso real aos dois — o caminho mais rápido e seguro é:
   ```bash
   git clone https://github.com/AlveDev/designMika.git
   cd designMika
   git remote add kit-genie https://github.com/AlveDev/kit-genie.git
   git fetch kit-genie claude/optimistic-cannon-NFh28
   # trazer arquivos específicos da lista "Copiar literal" abaixo, ex.:
   git checkout kit-genie/claude/optimistic-cannon-NFh28 -- src/components/ui
   git checkout kit-genie/claude/optimistic-cannon-NFh28 -- src/lib
   # etc — depois `git commit` normalmente no designMika
   ```
   Isso preserva os arquivos exatamente como estão (sem risco de erro de transcrição) e é muito mais rápido que recriar cada componente via edição manual.
3. **Ler este arquivo inteiro antes de agir**, incluindo o apêndice com os dados brutos da pesquisa de mercado no final — evita ter que repetir a pesquisa quando chegar a hora de escrever `seed.ts` (F0) ou a copy da landing (F3).

## Decisões já tomadas

- **Foco do primeiro ciclo**: app funcional para a esposa usar de verdade (ela é a primeira usuária real). Landing/Hotmart ficam para depois.
- **Agenda por horário e duração já no primeiro ciclo** (é estrutural — fazer depois obrigaria refazer a maior tela).
- **Repositório novo e independente**, sem núcleo compartilhado.
- **Nome provisório `nail-genie`** no código; marca definida depois (candidato do posicionamento: algo em torno de "lucro na unha", evitando mais um "Agenda").

**Ponto de partida**: fork do `kit-genie` no HEAD atual da branch `claude/optimistic-cannon-NFh28` (`864964c`) — importante porque esse commit já inclui a arquitetura sem `onSnapshot` (botão "Atualizar" + `refreshDb`), então o gêmeo nasce com o custo de Firestore já resolvido.

## Modelo de domínio (`src/services/db/types.ts`)

| Nova entidade | Vem de | Mudança essencial |
|---|---|---|
| `Supply` (insumo consumível) | `Component` | unidade real (g/ml/cm/un), embalagem e custo unitário derivado |
| `Tool` (durável) | `Component.reusable` | coleção separada, **não** entra no custo por atendimento |
| `Service` | `Kit` | ganha `durationMin` e `maintenanceIntervalDays` |
| `ServiceItem` | `KitItem` | ganha `perNail` (consumo por unha vs por atendimento) |
| `ServiceAddon` | `KitTier` | nail art / francesinha, não bronze/prata/ouro |
| `Appointment` | `Sale` | `eventDate`+`returnDate` → `startAt`/`endAt` |
| `Client` | *nova* (era derivada) | ver decisão abaixo |
| `Anamnesis`, `NailRecord` | *novas* | embutidas, não coleções |

Campos-chave:

```ts
type SupplyUnit = "g" | "ml" | "cm" | "un" | "par";

Supply: id, name, category, brand?, colorName?, colorHex?, unit, packSize, packCost,
  unitCost /* = packCost/packSize, recalculado no save */, stock, minStock,
  grit? /* granulação da lixa */, openedAt?, shelfLifeDays?, notes, createdAt, updatedAt

Service: id, name, category("alongamento"|"manutencao"|"esmaltacao"|"manicure"|"blindagem"|"remocao"|"nail_art"),
  technique("fibra"|"molde_f1"|"tips"|"acrigel"|"banho_gel"|"gel"|"tradicional"),
  durationMin, bufferMin?, price, items: ServiceItem[], addons?, maintenanceIntervalDays,
  firstMaintenanceIntervalDays?, imageUrl?, active, createdAt, updatedAt

ServiceItem: supplyId, qty /* aceita fração: 0.15g/unha, 0.5 lixa */, perNail: boolean

Appointment: id, clientId, clientNameSnapshot, serviceId, serviceNameSnapshot, addons[],
  startAt, endAt, nailCount, status("agendado"|"confirmado"|"em_atendimento"|"concluido"|"faltou"|"cancelado"),
  price, discount?, deposit:{amount, paidAt?, method:"pix"}, paidAmount,
  paymentMethod("pix"|"dinheiro"|"debito"|"credito"|"fiado"), cardFeePct?,
  materialCostSnapshot?, consumption?: {supplyId, qty}[] /* congelado na conclusão */,
  nailRecord?: NailRecord[], photos?: {beforeUrl?, afterUrl?}, maintenanceOfId?,
  nextSuggestedAt?, notes?, source, createdAt

NailRecord: { hand:"D"|"E", finger:1..5, shape?, tipSize?, status?("ok"|"descolou"|"trincou"|"quebrou"), colorSupplyId?, art? }

Client: id, name, phone, instagram?, birthday?, notes?, anamnesis?: Anamnesis,
  alertFlags: string[], lastVisitAt?, visitCount, avgFreqDays?, nextExpectedAt?,
  status("nova"|"ativa"|"em_risco"|"sumida"), createdAt, updatedAt

Anamnesis: filledAt, allergies{esmalte, acrilato, acetona, latex, outros?},
  conditions{onicomicose, psoriase, diabetes, gestante, onicofagia, outros?},
  medications?, previousProcedures?, observations?, consentAccepted, consentAt?

Settings += hourlyRate, targetMarginPct, fixedCostMonthly?, expectedServicesPerMonth,
  cardFeePct, pixKey?, depositPolicy{mode, value, cancelWindowHours},
  agenda{workDays, startTime, endTime, stepMin, bufferMin, lunch?},
  recurrence{riskFactor, lostAfterDays}
```

Firestore: `users/{uid}/{supplies|tools|services|clients|appointments|costs}` + `meta/{profile,settings}`. `firestore.rules` e `storage.rules` copiados sem alteração.

**`Client` vira entidade real** (na origem era derivada agrupando vendas por nome): a anamnese precisa existir *antes* do primeiro atendimento; alergia a acrilato é dado de segurança e não pode ficar espalhado em N atendimentos; agrupar por nome quebra com "Ju"/"Juliana"; e a recorrência precisa de `nextExpectedAt` consultável pelas Cloud Functions. Os agregados (total gasto, serviço favorito, tier) continuam calculados no cliente sobre o cache — reaproveitando `buildCustomers` de `app.customers.tsx`.

## Os três motores novos (é aqui que mora o produto)

**`src/services/pricing.ts` — custo e preço** (o diferencial competitivo):
```
qtyFor(item, nailCount) = item.perNail ? item.qty * nailCount : item.qty
materialCost(serviceId, {nailCount, addonIds}) → { total, lines[] }
laborCost(min) = settings.hourlyRate * min/60
overhead() = fixedCostMonthly / expectedServicesPerMonth
suggest(serviceId) → { material, labor, overhead, suggested, currentPrice, deltaPct }
realProfit(appt) = paidAmount*(1-cardFeePct/100) - materialCostSnapshot - labor - overhead
```
Aparece em: painel "Custo & Preço" ao vivo no editor de serviço (tabela igual à referência de R$ 15,93, com badge "R$ X abaixo do sugerido"); modal de fechamento do atendimento ("Lucro real: R$ 84,07"); dashboard (lucro do mês + custo médio); e `analytics.worstServices()` (margem < 20%).

**`src/services/recurrence.ts` — retenção**: na conclusão calcula `avgFreqDays` (média das diferenças entre atendimentos — porta direta de `app.customers.tsx:730-741`), define `nextExpectedAt` (usa `firstMaintenanceIntervalDays` na primeira visita) e classifica a cliente em ativa / em risco / sumida. Alimenta o sino do `app-shell` com "N clientes atrasadas" + botão `wa.me` com template pronto.

**`src/services/agenda.ts` — horário**: `slots(dia)` gera horários de `startTime` a `endTime` em passos de `stepMin`, descontando almoço e ocupações; `endAt = startAt + durationMin + Σ addons + bufferMin`; `conflicts()` usa overlap `a.startAt < endAt && a.endAt > startAt` — mesma forma do `kitsRepo.availability()` (`index.ts:150-155`), mas em milissegundos. A verificação de disponibilidade por componente reutilizável é descartada (1 cadeira).

**Mudança importante de regra**: a baixa de estoque sai de `create()` e passa para **`appointmentsRepo.complete()`**, gravando `consumption[]` e `materialCostSnapshot`. Isso evita debitar material de no-show e corrige um comportamento frágil da origem (que recalcula pelo kit atual ao cancelar, e não pelo que foi de fato consumido).

## Rotas e menu

| Rota | Origem | Ação |
|---|---|---|
| `__root`, `login`, `signup`, `reset-password`, `app.tsx` | idem | copiar literal |
| `/app` (Hoje) | `app.index.tsx` | adaptar: agenda do dia, lucro do mês, custo médio, clientes para chamar |
| `/app/agenda` | `app.sales.tsx` | **reescrever** (timeline por horário) |
| `/app/clientes` | `app.customers.tsx` | adaptar + CRUD real + abas Anamnese / Fotos / Ficha por dedo |
| `/app/servicos` | `app.kits.tsx` | **reescrever** (ficha técnica + duração + custo ao vivo) |
| `/app/insumos` | `app.components.tsx` | **reescrever** (unidade, embalagem, rendimento, granulação, cor) |
| `/app/precificacao` | — | **nova** (simulador — também é peça de marketing) |
| `/app/financas` | `app.finance.tsx` | adaptar (taxa de maquininha, fiado, pró-labore) |
| `/app/relatorios` | `app.reports.tsx` | rename de colunas |
| `/app/equipamentos` | — | nova, CRUD simples de `Tool` |
| `/app/configuracoes` | `app.settings.tsx` | adaptar + blocos Motor de Preço e Agenda |
| `/app/onboarding` | `app.onboarding.tsx` | **reescrever** (técnicas + kit inicial de insumos + hora/margem) |

Menu mantém o botão **Atualizar** e o sino. Ordem mobile-first: Hoje · Agenda · Clientes · Serviços · Insumos · Precificação · Finanças · Relatórios · Equipamentos · Configurações.

## Estratégia de código

- **Copiar literal**: `components/ui/**` (46 componentes shadcn), `lib/*` (`brl`, `fmtDate`, `cls`, `downloadCsv`), `hooks/*`, `services/auth/*`, bootstrap do router (`main.tsx`, `router.tsx`, `server.ts`, `start.ts`), rotas de auth, `firestore.rules`, `storage.rules`, `firebase.json`, `wrangler.jsonc`, esqueleto de `functions/`.
- **Renomear/adaptar**: `db/firestore.ts` (só os nomes das coleções), `db/index.ts` (repos), `app.customers/index/finance/settings/reports`, `app-shell.tsx`, `assistant-orb.tsx`, `styles.css` (tokens rosa → paleta do nicho), `contract-modal.tsx` → `anamnese-pdf.tsx` (motor jsPDF ~70% reaproveitável).
- **Reescrever**: `app.agenda`, `app.servicos`, `app.insumos`, `app.onboarding`, `seed.ts`, `components/landing/**`.
- **Ordem que minimiza retrabalho**: types → firestore → repos → pricing/recurrence/agenda → seed → telas de cadastro → agenda → dashboard → landing.

## Faseamento

- **F0 — Base**: criar repo, fork, rename, tokens de cor, `types.ts`, `firestore.ts`, `index.ts`, `seed.ts` com insumos e serviços reais do nicho. Sem UI nova.
- **F1 — MVP utilizável pela primeira usuária** (depende de F0): `/app/insumos`, `/app/servicos` com ficha técnica, `pricing.ts` + painel de custo, `/app/clientes` com anamnese, `/app/agenda` (dia, conflito, sinal, concluir/faltou), dashboard enxuto, Configurações. **No fim desta fase ela já usa no atendimento real.**
- **F2 — Retenção**: `recurrence.ts`, sino de clientes atrasadas, ficha por dedo, fotos antes/depois no Storage, `/app/financas`, `/app/relatorios`.
- **F3 — Produto vendável**: landing nova, onboarding, `/app/precificacao` público, link Hotmart, PDF de anamnese, lembretes diários por Cloud Function.
- **F4 — Evoluções**: bot de WhatsApp (agendar/confirmar/horários livres), assistente IA, portfólio/Instagram, PIX automático.

## Riscos e decisões em aberto

1. **Sinal via PIX**: manual (chave copiada) no MVP, ou integração (Mercado Pago/Asaas)? Integração muda o modelo de negócio para mensalidade.
2. **Fotos no Storage são o novo vetor de custo recorrente** — a origem resolveu leitura de Firestore, mas portfólio fotográfico gera custo por GB. Precisa de compressão no upload e limite por conta.
3. **Anamnese com termo de consentimento tem implicação legal** (LGPD, dado de saúde) — o texto precisa de revisão humana antes de ir para produção.
4. **Estoque com decimais** (0,15 g/unha): exibir com 1 casa e traduzir para "rende ~N atendimentos", que é como a profissional pensa.
5. **`Tool` como coleção separada** de `Supply` — confirmar; custa uma coleção a mais, mas evita poluir o custo por atendimento.
6. **Mobile-first de verdade**: a origem é desktop-first. `agenda` e `insumos` precisam ser desenhadas a partir de 390px, não adaptadas depois.
7. **Migração de dados**: se ela já tiver planilha/caderno, um importador CSV pode ser necessário ainda na F1.

## Verificação

Ao final da F1, testar o fluxo completo no app rodando (`npm run dev`), em viewport de celular:
1. Cadastrar insumos reais com embalagem (gel construtor 24g por R$ 89, caixa de 240 tips, lixa 180) e conferir se o custo unitário derivado bate.
2. Criar o serviço "Alongamento em fibra" com ficha técnica e duração de 3h; conferir se o custo de material calculado cai na faixa de **R$ 15–30** da referência de mercado — se der muito diferente, a ficha ou as unidades estão erradas.
3. Cadastrar uma cliente com anamnese (marcar alergia) e verificar se o alerta aparece no atendimento.
4. Agendar dois atendimentos no mesmo horário e confirmar que o conflito é bloqueado; conferir que a duração empurra o fim corretamente com adicional.
5. Concluir um atendimento e verificar: estoque debitado conforme a ficha, `materialCostSnapshot` gravado, lucro real exibido descontando taxa de maquininha.
6. Marcar outro como "faltou" e confirmar que **não** houve baixa de estoque.
7. Conferir no Console do Firebase que o volume de leituras por sessão continua baixo (o gêmeo herda o modelo sem tempo real).

## Apêndice: dados brutos da pesquisa de mercado

Contexto adicional para quando for útil (seed de dados na F0, copy da landing na F3) — não é preciso reler tudo agora, é referência.

### Serviços, duração e preço (Brasil, 2025/2026)

| Técnica | Duração | Preço típico |
|---|---|---|
| Alongamento em fibra de vidro | 2h30–3h30 | R$ 100–180 |
| Molde F1 / adesivo | 2h30–3h | R$ 90–160 |
| Tips (ABS) / gel tip | 1h30–2h30 | R$ 90–170 |
| Acrigel / polygel | 2h30–3h | R$ 100–180 |
| Acrílico (monômero + pó) | 2h30–3h | R$ 90–160 |
| Banho de gel (sobre unha natural) | 1h–2h | — |
| Blindagem | ~1h | — |
| Esmaltação em gel | 1h–1h30 | R$ 70–120 |
| Manicure/pedicure tradicional | 40–90min | R$ 30–55 |
| Manutenção de alongamento | ~1h30 | 50–70% do valor da aplicação (R$ 60–120) |
| Remoção | 30–50min | R$ 30–60 |
| Nail art | — | a partir de R$ 5/unha; francesinha +R$ 5–15 |

### Insumos por categoria

**Consumíveis** (dão baixa por atendimento): desidratador (10ml), primer ácido/bonder (10ml), álcool isopropílico, acetona; gel base clear (10g), gel construtor (potes 14g/24g/30g), fibra de vidro (rolo em metros), tips (caixas de 240un), gel tips por formato, moldes F1, pó acrílico + monômero, top coat (10g); esmalte em gel por cor (frascos 5–15ml), foil, pedrarias, glitter, pó chrome; lixas por granulação (80–120 desbaste, 150–180 modelagem, 240+ acabamento), blocos polidores; luvas, máscara, palitos de laranjeira, algodão, foil de remoção.

**Duráveis** (ativo fixo, não entra no custo por atendimento): cabine LED/UV (36–120W), motor/lixadeira + brocas (diamantadas p/ gel/fibra/acrílico, tungstênio p/ unha natural), pincéis de alongamento, alicate de cutícula, empurrador, pinça, autoclave/estufa.

### Referência de custo por atendimento (alongamento)

Gel construtor R$ 3,60 · primer/desidratador R$ 0,58 · top coat R$ 1,50 · moldes/tips R$ 2,25 · lixas/buffers R$ 2,00 · descartáveis/higienização R$ 4,00 · cor/decoração R$ 2,00 = **R$ 15,93 total**. Fórmula de precificação difundida no nicho: `Preço = (material + custo da hora × tempo real + rateio de custo fixo) × margem (30–50%)`.

### Ciclo de manutenção

Fibra de vidro: 1ª manutenção em 15 dias, depois a cada 20. Gel/molde: 15–21 dias (ideal 3 semanas). Esmaltação em gel/blindagem: 15–21 dias. Banho de gel: 3–4 semanas.

### Concorrentes (Brasil)

| Produto | Preço | Público |
|---|---|---|
| Trinks | R$ 76/mês (1–2 prof.), R$ 110/mês (3–4) | Salão/estúdio |
| Avec | R$ 88,90/mês ("Começando", 1–2 prof.) | Salão |
| AppBarber/AppBeleza | ~R$ 89–164,50/mês | Barbearia/beleza, equipe |
| Belasis | não público | Salão/clínica |
| Simples Agenda | a partir de R$ 39,90/mês, 35 dias grátis | Manicure autônoma |
| Agendali | a partir de R$ 39,90/mês, 7 dias grátis | Manicure autônoma/pequeno espaço |
| TopAgenda | grátis + 14 dias trial | Nail designer |
| Prit | freemium | Manicure |
| Naild | sistema focado em manicure/nail designer | Sem custo de material por atendimento |

Nenhum dos apps de autônoma (Agendali, Booksy, Minha Agenda, Naild, TopAgenda, Prit) tem ficha técnica de insumo por serviço ou custo de material por atendimento — só existe na camada de salão (Programa Salão, Belasis, Frizzar, Nuvem Gestor, RTM Salão).

### Planilhas vendidas no Hotmart (prova de demanda)

Planilha Controle Financeiro Nail Designer (Lívia Xavier) — financeiro + estoque. Planilha de Precificação para Nails (Divina Unha SP) — 4,9★. eplanilhas.com.br: agenda + estoque + preço por R$ 149,90 (de R$ 299,80), pagamento único. Faixa típica de planilha no nicho: **R$ 17–150, pagamento único**.

### Comportamento e posicionamento

100% mobile-first (WhatsApp + Instagram no celular). Objeção principal é "é complicado demais", não resistência à tecnologia. Aversão a mensalidade é evidente (sucesso das planilhas de pagamento único). Nomes dominantes no mercado usam "Nail"/"Bella" + "Agenda/App" — o espaço de posicionamento em **lucro/custo** está livre; recomendação é evitar mais um nome com "Agenda".

### Ficha de anamnese

Prática já estabelecida no nicho (vendida em blocos de papel de 50/100 folhas). Conteúdo típico: dados pessoais, alergias (esmalte, acrilato, acetona, látex), condições (onicomicose, psoríase, diabetes, gestação, onicofagia), medicamentos, histórico de procedimentos, termo de consentimento assinado. Funciona como prontuário evolutivo (formato/tamanho de tip por dedo, trocas, descolamentos).

## Nota sobre esta sessão

Este plano foi escrito originalmente numa sessão do Claude Code que tinha acesso apenas aos repositórios `AlveDev/kit-genie` e `AlveDev/pinkloveultimov3` — não ao `AlveDev/designMika`, destino real deste projeto. Por isso o plano foi commitado aqui, no `kit-genie`, como ponto de partida documentado para uma sessão nova com acesso a ambos os repositórios. O checklist no início deste arquivo cobre o que essa sessão nova precisa verificar antes de agir.
