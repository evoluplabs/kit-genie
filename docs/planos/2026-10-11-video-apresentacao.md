# Vídeo de apresentação do Decora Gestão (WhatsApp + Reels)

## Objetivo e prova de sucesso
Um vídeo vertical de ~1:45 que apresenta o sistema (funções, uso do dia a dia, detalhes) para donas de negócio de decoração de festas, sem tom de propaganda, dividido em seções que também funcionam como clipes soltos.
**Dá certo se:** o dono abre `video/saida/` e acha (1) o vídeo completo, (2) a versão leve para WhatsApp (≤ 16 MB), (3) um clipe por seção, (4) `roteiro.md` dizendo o que cada clipe mostra e o que esconde. Prova técnica na T7.

## Decisões do dono (11/10/2026)
- Fechamento **sem marca e sem preço** (versão neutra: o sistema será revendido e a compradora põe o nome dela).
- **Só legendas**, sem voz e sem música.
- Gravar a partir da branch mais recente `claude/optimistic-cannon-NFh28` (já traz o nome genérico "Decora Gestão").

## Fica de fora (e por quê)
| Item | Motivo / alternativa |
|---|---|
| Assistente de IA respondendo | Exige chave paga da Anthropic (gasto de API só com ordem dele) e não vou inventar resposta falsa. Alternativa: mostrar só o botão, ou ele autoriza um teste real. |
| Preço, checkout (Hotmart/MercadoPago), tela de planos em Configurações | Decisão "sem preço". Evito gravar essas telas. |
| Versão horizontal 16:9 | Não pedida; faço depois se ele quiser (WhatsApp Web/YouTube). |
| Voz e música | Decisão dele. `roteiro.md` traz o texto de narração caso grave depois. |
| Capa (thumbnail) dos Reels | Não pedida; extraio um quadro em 1 minuto se ele quiser. |
| Conversa real do robô de WhatsApp | O envio real (Z-API) não roda aqui. Uso a conversa de exemplo da landing, marcada na tela como "exemplo". |
| Deploy, PR, merge, dado de cliente real | Só com ordem dele. Dados do vídeo são fictícios. |

## Mapa de arquivos (na branch `ccr-dff16a67-2wnso2`; o produto não é alterado)
- `video/package.json` — Playwright para gravar. `video/.gitignore` — ignora `saida/bruto/` e `node_modules/`.
- `video/standin/auth-context.tsx` e `video/standin/firestore.ts` — substituem login e banco **só na cópia usada para gravar** (usuária fixa, dados em memória).
- `video/standin/demo-data.ts` — dados fictícios com datas relativas a "hoje".
- `video/cenas.mjs` — as 8 seções: passos, legenda de cada passo, duração.
- `video/overlay.mjs` — camada visual injetada na página: legenda, anel de toque, destaque/zoom, contador, barra de progresso.
- `video/gravar.mjs` — grava cada seção em `saida/bruto/NN-nome.webm`.
- `video/montar.sh` — ffmpeg: MP4 por seção, completo, versão WhatsApp.
- `video/roteiro.md`, `video/README.md` (como regerar), `video/saida/*.mp4` (entrega).
- Fora do repositório: cópia da branch nova em worktree no scratchpad (somente leitura para o produto).

## Tarefas
**T1. App rodando para gravar.** Cópia da branch nova + copiar os 2 arquivos de `standin/` por cima + `npm ci` + `npm run dev`. *Prova:* screenshot 390×693 de `/app` mostra o painel com números, sem tela de login. *Risco:* o servidor de desenvolvimento pode exigir plugin da Cloudflare; se falhar, uso `vite build` + preview. Sem custo.

**T2. Dados de exemplo.** `demo-data.ts`: ~10 componentes (2 com estoque baixo), 4 kits (decoração, pegue-e-monte, locação), 12 vendas (passadas e dos próximos 20 dias, uma com conflito de data), custos do mês, clientes fictícios. *Prova:* painel mostra faturamento > 0, alerta de estoque baixo e eventos próximos. Sem dado real.

**T3. Roteiro e legendas.** `cenas.mjs` + `roteiro.md`. Seções: 1 Gancho (≤10s) · 2 Painel do dia · 3 Kits e lista de materiais · 4 Venda que baixa o estoque e avisa conflito de data · 5 Agenda · 6 Finanças e relatórios · 7 Clientes e WhatsApp (exemplo) · 8 Fechamento neutro (≤7s). Cada seção abre com uma frase-gancho e fecha deixando uma pergunta. *Prova:* soma das durações entre 95s e 115s; nenhuma seção < 7s ou > 22s (script confere).

**T4. Qualidade da gravação.** Testar 5s com `recordVideo` e com captura via CDP em escala 2,77× (390×693 → 1080×1920) e ficar com a mais nítida. *Prova:* quadro do texto pequeno legível a 1080 de largura.

**T5. Retenção e gravação.** `overlay.mjs` + `gravar.mjs`: legenda grande nos primeiros 0,5s de cada seção, troca de plano/zoom a cada ≤ 4s, anel de toque, números que sobem, barra de progresso com o nome da seção, antes/depois (planilha × painel) no gancho, legendas fora das faixas do Reels (topo 220px e base 340px livres), último quadro igual ao primeiro. *Prova:* 8 arquivos `.webm` gerados.

**T6. Montagem.** `montar.sh`: H.264 + yuv420p + 30fps + faststart + trilha AAC silenciosa; completo 1080×1920; WhatsApp 720×1280 com teto de 12 MB; um MP4 por seção.

**T7. Verificação (antes de dizer "pronto").** `ffprobe` em todos: resolução, codec, duração, tamanho. Folha de contato de 1 quadro por segundo (uma imagem pequena) para conferir legendas cortadas e telas vazias. Relato do que não deu para conferir (som, ritmo percebido).

**T8. Entrega.** Commit na `ccr-dff16a67-2wnso2` e push; MP4 enviados na conversa. Sem PR.

## Regras que valem aqui
Regras globais do dono: português simples; nada de deploy/PR/merge/gasto sem ordem; segredo nunca no repositório (nenhuma chave Firebase é usada); contexto barato (imagens pequenas, só quando o texto não basta); fechamento diz o que foi feito, o que não foi verificado e o que depende dele.
