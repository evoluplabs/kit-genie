import * as functions from "firebase-functions/v2/https";
import { grantEntitlement, type PaymentProduct } from "./grant-entitlement";

const ACTIVE_EVENTS = new Set(["PURCHASE_APPROVED", "PURCHASE_COMPLETE", "SUBSCRIPTION_REACTIVATED"]);
const CANCELED_EVENTS = new Set([
  "PURCHASE_CANCELED", "PURCHASE_CHARGEBACK", "SUBSCRIPTION_CANCELLATION", "PURCHASE_EXPIRED",
]);

// Mapeia o ID do produto na Hotmart (painel > Produtos) pro produto interno.
// PLACEHOLDER: preencher os 3 secrets abaixo com os IDs reais depois de criar/confirmar
// os produtos na Hotmart — sem isso, resolveProduct nunca casa e nada é liberado.
function resolveProduct(productId: string): PaymentProduct | null {
  if (productId && productId === process.env.HOTMART_PRODUCT_ID_BASE) return "base";
  if (productId && productId === process.env.HOTMART_PRODUCT_ID_ASSISTANT) return "assistant";
  if (productId && productId === process.env.HOTMART_PRODUCT_ID_WHATSAPP) return "whatsapp_premium";
  return null;
}

export const hotmartWebhook = functions.onRequest(
  {
    region: "us-central1",
    secrets: [
      "HOTMART_WEBHOOK_TOKEN",
      "HOTMART_PRODUCT_ID_BASE",
      "HOTMART_PRODUCT_ID_ASSISTANT",
      "HOTMART_PRODUCT_ID_WHATSAPP",
    ],
  },
  async (req, res) => {
    if (req.method !== "POST") { res.status(405).send("Method not allowed"); return; }

    // PLACEHOLDER: confirmar no painel da Hotmart onde o token de segurança chega de fato
    // (header X-HOTMART-HOTTOK na integração v2, ou campo "hottok" no corpo em versões antigas).
    const receivedToken = (req.headers["x-hotmart-hottok"] as string | undefined) ?? req.body?.hottok;
    if (!receivedToken || receivedToken !== process.env.HOTMART_WEBHOOK_TOKEN) {
      console.warn("[hotmartWebhook] token inválido ou ausente");
      res.status(401).send("Unauthorized");
      return;
    }

    const event = req.body?.event as string | undefined;
    const email = req.body?.data?.buyer?.email as string | undefined;
    const productId = String(req.body?.data?.product?.id ?? "");
    const externalId = String(
      req.body?.data?.purchase?.transaction ?? req.body?.data?.subscription?.subscriber?.code ?? req.body?.id ?? "",
    );

    if (!event || !email || !externalId) {
      console.warn("[hotmartWebhook] payload incompleto", { event, hasEmail: !!email, externalId });
      res.status(400).send("Payload incompleto");
      return;
    }

    const product = resolveProduct(productId);
    if (!product) {
      // ID de produto ainda não mapeado nos secrets — não é erro, só não fazemos nada.
      console.warn(`[hotmartWebhook] produto ${productId} não mapeado, ignorando evento ${event}`);
      res.status(200).send("ok (produto não mapeado)");
      return;
    }

    let status: "active" | "canceled" | "refunded" | null = null;
    if (ACTIVE_EVENTS.has(event)) status = "active";
    else if (event === "PURCHASE_REFUNDED") status = "refunded";
    else if (CANCELED_EVENTS.has(event)) status = "canceled";

    if (!status) {
      // Evento que não altera entitlement (ex.: PURCHASE_BILLET_PRINTED) — só confirma recebimento.
      res.status(200).send("ok (evento ignorado)");
      return;
    }

    try {
      await grantEntitlement({
        userEmail: email,
        product,
        status,
        provider: "hotmart",
        externalId: `hotmart_${externalId}`,
      });
      res.status(200).send("ok");
    } catch (err) {
      console.error("[hotmartWebhook] erro ao processar evento:", err);
      res.status(500).send("Erro interno");
    }
  },
);
