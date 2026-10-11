# Roteiro e guia de cortes — vídeo de apresentação

Vídeo completo: **1:41**, vertical 1080×1920, só legendas curtas (sem voz, sem música). Sem marca, preço ou contato no final.
Cada seção também sai como clipe solto em `saida/secoes/`. Todas as telas são do app real rodando com **dados fictícios**.

| # | Seção | Tempo no vídeo | Duração |
|---|---|---|---|
| 1 | Gancho | 0:00 – 0:08 | 8,3 s |
| 2 | Painel do dia | 0:08 – 0:24 | 15,6 s |
| 3 | Kits e lista de materiais | 0:24 – 0:37 | 13,5 s |
| 4 | Venda que baixa o estoque | 0:37 – 1:01 | 23,7 s |
| 5 | Agenda | 1:01 – 1:10 | 8,8 s |
| 6 | Finanças e relatórios | 1:10 – 1:23 | 13,3 s |
| 7 | Clientes e WhatsApp | 1:23 – 1:36 | 12,5 s |
| 8 | Fechamento | 1:36 – 1:41 | 5,2 s |

**Como a edição funciona:** a tela do app fica livre a maior parte do tempo. As legendas são pequenas, claras, de uma linha, e somem sozinhas em ~1,5 s (ficam na tela cerca de 30–45% de cada seção; só o gancho tem mais). O destaque é um anel rosa fino (nada escurece). A "câmera" se aproxima do que importa e volta, números sobem, etiquetas verdes "pulam" ao lado dos elementos (ex.: margem 72%, 8 → 6), cada seção abre com um título de capítulo e as trocas são varridas rosas.

## Seção por seção

### 1 · Gancho
- **Na tela:** planilha cheia de erro (duas festas no mesmo dia, "#REF!", recados de "quem pagou o sinal??") e, em seguida, o painel do app.
- **Legendas:** "Já alugou o mesmo painel pra duas festas?" → "Na planilha, a conta nunca fecha." → "Agora imagine tudo num só lugar."
- **Narração (se quiser gravar):** "Você já alugou o mesmo painel pra duas festas? Na planilha, a conta nunca fecha. Agora imagine tudo num só lugar: estoque, agenda e lucro, no celular."
- **Não entrega nada do produto** além do visual do painel. Serve como abertura de qualquer corte.

### 2 · Painel do dia
- **Na tela:** faturamento do mês subindo, lucro estimado, meta do mês (76%), alerta de estoque baixo.
- **Narração:** "Abriu o app, já vê como está o mês: faturamento, lucro e a meta. E o que está acabando no estoque, ele avisa antes. Tudo isso nasce das suas vendas."
- **Gancho para a próxima:** "Tudo isso nasce das suas vendas."

### 3 · Kits e lista de materiais
- **Na tela:** cartões de kits, abertura de um kit, lista de materiais com quantidade e custo, **custo e margem calculados na hora**, níveis bronze/prata/ouro.
- **Narração:** "Cada kit tem a sua lista de materiais, com quantidade e custo. O sistema calcula o custo e a margem na hora. E o mesmo kit pode ter bronze, prata e ouro, cada um com seu preço."
- **Gancho:** "E cada peça já tem estoque próprio."

### 4 · Venda que baixa o estoque (a mais forte)
- **Na tela:** nova locação → cliente → kit e nível → **aviso de conflito de data** ("kit já agendado nesse período") → outra data com "Disponível!" → registrar → **estoque baixa sozinho** (balões de 8 para 6 pacotes).
- **Narração:** "Fechou a venda? Registra em segundos. Se o mesmo kit já estiver marcado naquela data, o sistema avisa. Escolheu outra data, está disponível. Salvou? O estoque já baixou sozinho."
- **Atenção:** é a seção que mais responde à dor do gancho, e também a que mais mostra como o sistema funciona na prática. Se quiser um teaser mais curto, corte o final (a parte do Acervo) e termine no "Salvou? O estoque baixa sozinho".

### 5 · Agenda
- **Na tela:** calendário do mês com pontos nos dias de festa; toque num dia mostra cliente, kit e valor.
- **Narração:** "Sua agenda de festas, mês a mês. Toca no dia e vê cliente, kit e valor. Nada de esquecer uma entrega."

### 6 · Finanças e relatórios
- **Na tela:** custos do negócio e pessoais separados, lucro do negócio, relatórios exportáveis (vendas, estoque, financeiro e kits).
- **Narração:** "Custos do negócio e pessoais separados. Lucro: receita menos custos. E tudo exportável para o contador."

### 7 · Clientes e WhatsApp
- **Na tela:** clientes VIP e fidelidade; **conversa de exemplo** do robô de WhatsApp (marcada como "EXEMPLO DE CONVERSA · PLANO PREMIUM").
- **Narração:** "Quem compra mais fica no radar. E o WhatsApp responde por você: você só confirma o pix."
- **Cuidado:** a conversa é ilustrativa (o app tem o robô, mas o envio real não roda neste vídeo). Se perguntarem, diga que é um exemplo do fluxo.

### 8 · Fechamento
- **Na tela:** "Kits. Estoque. Agenda. Lucro." + "Tudo isso no seu celular. Quer ver funcionando?"
- Sem marca, preço ou contato. Para pôr um texto no rodapé: edite `video/config.json` (campo `rodape`) e peça para regravar a seção 8.

## Cortes sugeridos para Reels (cada um deixa o resto como curiosidade)

| Corte | Seções | Duração | Para quê | O que NÃO revela |
|---|---|---|---|---|
| **A · Dor + painel** | 1 + 2 | 23,9 s | Atrair quem vive de planilha | Como se registra venda, kits, finanças |
| **B · O aviso de conflito** | 1 + 4 | 32 s | O mais forte: mostra o problema e a solução | Painel, kits, finanças, clientes |
| **C · Só o estoque** | 4 sozinha | 23,7 s | Reel direto, sem gancho de planilha | Todo o resto |
| **D · Versão de 1 minuto** | 1 + 2 + 4 + 5 + 8 | 61,6 s | Para WhatsApp rápido | Kits/margem, finanças, clientes, WhatsApp |
| **E · Só números** | 6 sozinha | 13,3 s | Atrair dono(a) que quer lucro | Operação do dia a dia |

Para juntar: no CapCut/InShot, arraste os clipes de `saida/secoes/` na ordem desejada.
Sugestão de ordem para "desejo": **mostrar a dor e o resultado; guardar o "como configurar" (seção 3) e o WhatsApp (seção 7) para a conversa individual**.

## Dicas de publicação
- **O gancho abre com legenda grande logo no primeiro segundo**, então não precisa de capa especial; se quiser, use um quadro da seção 1.
- **Som:** o arquivo vai com faixa de áudio silenciosa. No Instagram, adicione música em alta pelo próprio aplicativo; no WhatsApp, a maioria assiste no mudo e as legendas já resolvem.
- **Reels:** a legenda de cada cena fica acima da faixa que o Instagram cobre (parte de baixo). O título de capítulo (canto superior esquerdo) fica logo abaixo da faixa que o Instagram cobre.
- **Duração:** o completo (1:41) cabe no Reels (até 3 min), mas costuma segurar mais gente em 30–60 s; use os cortes A, B ou D.
