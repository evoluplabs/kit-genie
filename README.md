# Decora Gestão

> Sistema completo de gestão para decoradoras de festas — kits, estoque, vendas, finanças e automação WhatsApp.

---

## O que é

**Decora Gestão** é um SaaS voltado para o mercado de decoração de festas no Brasil (pegue-e-monte, montagem e locação). Ele substitui planilhas por um parceiro digital que:

- Gerencia kits com lista de materiais (BOM) e debita o estoque automaticamente a cada venda
- Exibe alertas de estoque baixo em tempo real
- Acompanha agenda de eventos, finanças e lucro líquido
- Gera relatórios exportáveis em CSV
- Responde orçamentos automaticamente via WhatsApp (plano premium)

**Modelo de negócio:** acesso vitalício por R$ 47 (vendido na Hotmart) + assinatura opcional R$ 9,90/mês para automação WhatsApp.

---

## Funcionalidades implementadas

| Módulo | Status |
|--------|--------|
| Landing page com pricing | Completo |
| Login / Cadastro / Recuperação de senha | Completo |
| Dashboard com KPIs em tempo real | Completo |
| Gerenciamento de kits e BOM | Completo |
| Controle de estoque de componentes | Completo |
| Vendas e agenda (tabela + calendário visual) | Completo |
| Débito automático de estoque na venda | Completo |
| Restauração de estoque ao cancelar/excluir | Completo |
| Verificação de disponibilidade por data (locação) | Completo |
| Finanças (criar, editar, excluir custos) | Completo |
| Relatórios e exportação CSV | Completo |
| Configurações de perfil e notificações | Completo |
| Firebase Auth (email/senha + reset) | Completo |
| Sync em tempo real com Firestore | Completo |
| Cloud Function — Resumo semanal por e-mail | Completo |
| Cloud Function — Alerta de estoque baixo | Completo |
| WhatsApp bot backend (webhook Z-API) | Completo |
| Botões de compra apontando para Hotmart | Completo |

---

## Stack tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19, TanStack Router, TanStack Query |
| Estilo | Tailwind CSS 4, Radix UI, shadcn/ui |
| Backend | Firebase Auth + Firestore (tempo real) |
| Cloud Functions | Firebase Functions v2 (Node 20) |
| Deploy Frontend | Cloudflare Workers (via Vite + TanStack Start) |
| Email | Nodemailer (SMTP configurável) |
| WhatsApp | Z-API (webhook HTTP) |
| Pagamentos | Hotmart (link externo) |

---

## Estrutura do projeto

```
kit-genie-main/
├── src/
│   ├── routes/          # Todas as telas (TanStack Router)
│   │   ├── index.tsx    # Landing page
│   │   ├── login.tsx    # Login
│   │   ├── reset-password.tsx
│   │   └── app.*.tsx    # Dashboard, Kits, Vendas, Finanças...
│   ├── services/
│   │   ├── auth/        # Firebase Auth context
│   │   └── db/          # Repositórios + sync Firestore
│   ├── components/
│   │   ├── landing/     # Seções da landing page
│   │   └── ui/          # Componentes shadcn/ui
│   └── lib/             # Utilitários (format, firebase, error)
└── functions/           # Firebase Cloud Functions
    └── src/
        ├── weekly-report.ts   # Email semanal (cron)
        ├── low-stock.ts       # Alerta de estoque (trigger)
        └── whatsapp/
            ├── webhook.ts     # Endpoint Z-API
            ├── bot.ts         # Lógica de conversa
            └── zapi.ts        # Cliente Z-API
```

---

## Como rodar localmente

### Pré-requisitos
- Node.js 20+
- Conta Firebase com projeto `decora-gestao`
- (Opcional) Conta Z-API para WhatsApp

### Passos

```bash
# 1. Instalar dependências
npm install

# 2. Criar arquivo de variáveis de ambiente
cp .env.example .env
# Preencha com os dados do Firebase e Hotmart

# 3. Rodar em desenvolvimento
npm run dev
```

### Variáveis de ambiente (`.env`)

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# URLs de checkout na Hotmart
VITE_HOTMART_URL_BASE=
VITE_HOTMART_URL_PREMIUM=
```

---

## Deploy

### Frontend (Cloudflare Workers)
```bash
npm run build
npx wrangler deploy
```

### Cloud Functions (Firebase)
```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

#### Variáveis de ambiente das Functions
Configure no Firebase Functions via CLI:
```bash
firebase functions:secrets:set SMTP_HOST
firebase functions:secrets:set SMTP_USER
firebase functions:secrets:set SMTP_PASS
```

---

## Próximos passos para colocar à venda

Veja o documento **[PROXIMOS_PASSOS.md](./PROXIMOS_PASSOS.md)** para o roteiro completo de ativação.

---

## Arquitetura de dados

Cada usuária tem um subconjunto isolado no Firestore:

```
users/{userId}/
├── meta/profile      → Perfil do negócio
├── meta/settings     → Preferências e notificações
├── components/       → Estoque de peças
├── kits/             → Kits com BOM
├── sales/            → Vendas e agenda
└── costs/            → Lançamentos financeiros
```

Regras de segurança garantem que cada usuária acessa apenas seus próprios dados.

---

## Segurança

- Autenticação via Firebase Auth (email/senha)
- Regras Firestore: isolamento total por `userId`
- Variáveis sensíveis nunca commitadas (`.env` no `.gitignore`)
- WhatsApp token armazenado no Firestore do usuário, nunca no cliente

---

*Decora Gestão — construído com amor para decoradoras brasileiras.*
