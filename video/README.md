# Vídeo de apresentação — como foi feito e como refazer

O vídeo é gerado por código: um navegador grava o app **real** rodando com **dados fictícios** e o ffmpeg monta os arquivos.
Nada aqui altera o produto nem usa chave, conta ou dado de cliente.

## O que tem aqui
| Arquivo | Para quê |
|---|---|
| `roteiro.md` | Roteiro, narração opcional e sugestões de cortes |
| `cenas.mjs` | As 8 seções (gestos e legendas) — edite aqui para mudar o texto |
| `cartoes.mjs` | Telas sem app: planilha bagunçada, conversa de exemplo, fechamento |
| `overlay.mjs` | Legenda, dedo, destaque, contador, barra de progresso |
| `config.json` | Texto do cartão final (sem marca e sem preço) |
| `gravar.mjs` / `montar.sh` | Grava as seções / gera os MP4 finais |
| `standin/` | Troca o login e o banco do Firebase por dados de exemplo, **só para gravar** |
| `saida/` | Entrega: `completo-1080x1920.mp4`, `whatsapp-720x1280.mp4`, `secoes/NN-*.mp4` |

## Refazer
1. Pegue o app na branch `claude/optimistic-cannon-NFh28` (a que tem o nome "Decora Gestão").
2. Copie `standin/auth-context.tsx` para `src/services/auth/`, e `standin/firestore.ts` + `standin/demo-data.ts` para `src/services/db/`.
3. Crie `.env.local` com valores falsos nas 6 variáveis `VITE_FIREBASE_*` (qualquer texto; o app só exige que existam).
4. `npm ci && npm run dev -- --host 127.0.0.1 --port 5173`
5. Aqui em `video/`: `npm install`, depois `node gravar.mjs` (ou `node gravar.mjs 04` para uma seção) e `bash montar.sh`.

Variáveis úteis: `APP_URL` (endereço do app) e `CHROME_PATH` (Chromium/Chrome).
Se o app mudar de tela ou de texto, ajuste os seletores em `cenas.mjs` e regrave a seção afetada.

## Observações sobre o app (achadas durante a gravação)
- Em **Finanças**, o cartão "Lucro líquido" diz "Receita menos todos os custos", mas o cálculo subtrai só os custos **profissionais** (os pessoais ficam de fora). A legenda do vídeo diz apenas "receita menos custos".
- No celular, nomes longos na lista de materiais do kit aparecem cortados ("Pain…", "Balã…").
