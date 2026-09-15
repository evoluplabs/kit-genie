# Próximos Passos — Decora Gestão pronto para venda

Este documento é um roteiro prático de tudo que precisa ser feito para lançar o produto e começar a vender.

---

## ETAPA 1 — Infraestrutura Firebase (obrigatório antes de tudo)

### 1.1 Habilitar Firebase Authentication
No [Console Firebase](https://console.firebase.google.com/project/pink-love-gestao):
1. Vá em **Authentication → Sign-in method**
2. Habilite **Email/senha**
3. (Opcional) Habilite **Google** para login social

### 1.2 Verificar regras do Firestore
As regras de segurança já estão no arquivo `firestore.rules`. Faça o deploy:
```bash
firebase deploy --only firestore:rules
```

### 1.3 Deploy das Cloud Functions
```bash
cd functions
npm install && npm run build
cd ..
firebase deploy --only functions
```

**Configure as variáveis SMTP** para o envio de e-mail semanal:
```bash
firebase functions:secrets:set SMTP_HOST   # ex: smtp.gmail.com
firebase functions:secrets:set SMTP_USER   # seu e-mail
firebase functions:secrets:set SMTP_PASS   # senha de app (não a senha normal do Gmail)
```
> Para Gmail: ative "Senhas de app" nas configurações de segurança da conta Google.

---

## ETAPA 2 — Deploy do frontend (Cloudflare Workers)

```bash
# No diretório kit-genie-main
npm run build
npx wrangler deploy
```

Após o deploy, você terá uma URL tipo `https://tanstack-start-app.<seu-subdominio>.workers.dev`.

Para usar domínio próprio (ex: `app.decoragestao.com.br`):
1. No painel Cloudflare → Workers → seu worker → **Custom Domains**
2. Adicione o domínio desejado

---

## ETAPA 3 — Criar os produtos na Hotmart

1. Acesse [hotmart.com](https://hotmart.com) e crie sua conta de produtor
2. Crie dois produtos:
   - **Plano Base**: R$ 47 (acesso vitalício)
   - **Automação WhatsApp**: R$ 9,90/mês (assinatura recorrente)
3. Copie as URLs de checkout (formato `https://pay.hotmart.com/XXXXXX`)
4. Adicione as URLs no arquivo `.env` do projeto:
   ```
   VITE_HOTMART_URL_BASE=https://pay.hotmart.com/SEU_PRODUTO_BASE
   VITE_HOTMART_URL_PREMIUM=https://pay.hotmart.com/SEU_PRODUTO_PREMIUM
   ```
5. Faça o rebuild e redeploy do frontend

### Acesso pós-compra
Após a compra na Hotmart, o cliente precisa acessar o sistema. Fluxo recomendado:
- Configure um e-mail de entrega na Hotmart com o link `https://seuapp.com` e instruções para criar conta pelo onboarding
- Ou configure o **webhook da Hotmart** para criar a conta automaticamente (etapa avançada — não implementada ainda)

---

## ETAPA 4 — Configurar domínio personalizado

Compre um domínio (ex: `decoragestao.com.br`) e:
1. Adicione como Custom Domain no Cloudflare Workers
2. Atualize as configurações de **Authorized Domains** no Firebase Authentication para incluir o novo domínio

---

## ETAPA 5 — Teste end-to-end antes do lançamento

### Checklist de teste:
- [ ] Criar conta nova pelo onboarding
- [ ] Fazer login com a conta criada
- [ ] Recuperar senha (receber e-mail)
- [ ] Criar um componente com estoque
- [ ] Criar um kit usando esse componente
- [ ] Registrar uma venda → verificar se estoque reduziu
- [ ] Cancelar a venda → verificar se estoque voltou
- [ ] Lançar um custo → editar → excluir
- [ ] Verificar o calendário de vendas
- [ ] Exportar relatório CSV
- [ ] Testar visualização em celular (responsividade)
- [ ] Verificar se o botão "Comprar na Hotmart" abre a página certa

---

## ETAPA 6 — WhatsApp Bot (plano premium)

O backend já está pronto. Para ativar por cliente:

1. O cliente cria uma conta no [Z-API](https://z-api.io) (plano gratuito disponível)
2. O cliente cria uma **instância** e escaneia o QR Code para conectar o WhatsApp
3. Nas configurações da instância Z-API, o cliente configura o webhook:
   ```
   https://us-central1-pink-love-gestao.cloudfunctions.net/whatsappWebhook
   ```
4. O cliente insere o **Instance ID** e o **Token** nas Configurações do app (seção WhatsApp Premium)
5. O bot começa a responder automaticamente

---

## ETAPA 7 — Marketing e lançamento

### Material de venda sugerido
- [ ] Gravar um vídeo demonstrando o sistema (5-7 minutos)
- [ ] Criar um grupo/comunidade no WhatsApp ou Telegram para as clientes
- [ ] Publicar na bio do Instagram com o link Hotmart
- [ ] Criar um carrossel mostrando o antes (planilha) vs depois (sistema)

### Canais recomendados
- Instagram (nichos de decoração de festa)
- Grupos do Facebook (decoradoras de festas)
- TikTok (demonstração rápida)
- Hotmart Club (comunidade de compradores)

---

## ETAPA 8 — Melhorias futuras (pós-lançamento)

Estas funcionalidades podem ser adicionadas nas próximas versões para justificar futuras cobranças:

| Funcionalidade | Valor percebido |
|---------------|-----------------|
| App mobile (PWA instalável) | Alto |
| Webhook Hotmart → cria conta automaticamente | Alto |
| Login social (Google) | Médio |
| PDF de orçamento para cliente | Alto |
| Múltiplos usuários por conta (equipe) | Médio |
| Histórico de movimentação de estoque | Médio |
| Integração com Google Calendar | Médio |
| Dashboard de análise preditiva | Alto |

---

## Resumo de prioridades

| Prioridade | O que fazer |
|-----------|-------------|
| 🔴 Hoje | Habilitar Auth no Firebase, deploy Functions, deploy frontend |
| 🟡 Esta semana | Criar produtos na Hotmart, configurar domínio, teste completo |
| 🟢 Antes do lançamento | Gravar vídeo, preparar material de marketing |
| 🔵 Pós-lançamento | WhatsApp bot para clientes premium, melhorias de UX |
