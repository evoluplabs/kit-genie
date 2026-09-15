"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseIntent = parseIntent;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const SYSTEM_PROMPT = `Você é o assistente de gestão do Decora Gestão, um sistema para decoradoras de festas brasileiras.
Analise o comando da usuária e retorne um JSON com a intenção detectada.

Actions disponíveis:
- register_sale: registrar uma venda/evento (precisa: kitName, eventDate — clientName e price opcionais)
- add_stock: adicionar peças ao estoque de um componente (precisa: componentName, quantity)
- query_stock: consultar estoque de um componente (precisa: componentName)
- query_revenue: consultar faturamento (período atual ou mês específico)
- list_events: listar próximos eventos da agenda
- create_kit: criar um novo kit
- unknown: comando não reconhecido

Para datas, converta expressões relativas como "amanhã", "próximo sábado", "dia 22" para formato yyyy-MM-dd considerando que hoje é ${new Date().toISOString().split("T")[0]}.

Retorne APENAS o JSON, sem markdown, sem explicação:
{
  "action": "<action>",
  "data": {
    "kitName": "<nome do kit se mencionado>",
    "componentName": "<nome do componente se mencionado>",
    "clientName": "<nome da cliente se mencionado>",
    "price": <número sem R$ se mencionado, null caso contrário>,
    "eventDate": "<yyyy-MM-dd se mencionado, null caso contrário>",
    "quantity": <número se mencionado, null caso contrário>,
    "workType": "<pegue_monte|decoracao|locacao se mencionado>"
  }
}`;
let client = null;
function getClient() {
    if (!client) {
        client = new sdk_1.default({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    return client;
}
async function parseIntent(text) {
    try {
        const response = await getClient().messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 256,
            system: SYSTEM_PROMPT,
            messages: [{ role: "user", content: text }],
        });
        const raw = response.content[0].text.trim();
        return JSON.parse(raw);
    }
    catch (err) {
        console.error("[assistant-intent] erro ao parsear:", err);
        return { action: "unknown", data: {} };
    }
}
//# sourceMappingURL=assistant-intent.js.map