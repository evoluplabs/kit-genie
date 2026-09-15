// Status do MVP — mantido manualmente. Atualize aqui conforme credenciais reais
// forem configuradas (não é uma checagem automática/ao vivo do backend: os
// secrets ficam só nas Cloud Functions, o frontend não tem como lê-los).
export type FeatureStatus = "ready" | "pending_credentials" | "planned";

export interface FeatureStatusItem {
  label: string;
  status: FeatureStatus;
  note: string;
}

export const MVP_STATUS: FeatureStatusItem[] = [
  {
    label: "Sistema principal (kits, estoque, vendas, financeiro)",
    status: "ready",
    note: "Funcionando, sem dependências externas pendentes.",
  },
  {
    label: "Autenticação e banco de dados (Firebase)",
    status: "ready",
    note: "Configurado e em uso.",
  },
  {
    label: "Assistente de IA (voz/texto)",
    status: "pending_credentials",
    note: "Cota grátis + paywall prontos — falta configurar a chave da Anthropic (ANTHROPIC_API_KEY) no Firebase.",
  },
  {
    label: "Cobrança recorrente via Hotmart",
    status: "pending_credentials",
    note: "Webhook pronto — falta configurar o token de segurança e os IDs dos produtos no painel da Hotmart.",
  },
  {
    label: "Checkout nativo MercadoPago",
    status: "pending_credentials",
    note: "Assinatura recorrente pronta — falta configurar as credenciais da conta MercadoPago.",
  },
  {
    label: "Bot de atendimento no WhatsApp (Z-API)",
    status: "ready",
    note: "Funcional hoje — cada cliente conecta a própria conta Z-API.",
  },
  {
    label: "Migração do WhatsApp para API oficial da Meta",
    status: "planned",
    note: "Ainda não iniciado — depende de registrar a empresa como Tech Provider na Meta antes de codar.",
  },
];
