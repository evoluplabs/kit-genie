import * as functions from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { PreApproval } from "mercadopago";
import { getMercadoPagoConfig } from "./mercadopago-client";

if (!admin.apps.length) admin.initializeApp();

// R$9,90/mês — mesmo valor pros 2 produtos recorrentes hoje (Assistente IA e
// WhatsApp Premium). O plano base (vitalício) continua vendido pela Hotmart.
const SUBSCRIPTION_PRICE = 9.9;

type RecurringProduct = "assistant" | "whatsapp_premium";

const PRODUCT_REASON: Record<RecurringProduct, string> = {
  assistant: "Decora Gestão — Assistente IA",
  whatsapp_premium: "Decora Gestão — WhatsApp Premium",
};

function isRecurringProduct(v: unknown): v is RecurringProduct {
  return v === "assistant" || v === "whatsapp_premium";
}

/**
 * Cria uma assinatura recorrente (PreApproval) no MercadoPago, cobrando no
 * cartão já tokenizado no frontend (Card Payment Brick). Autenticado — só a
 * própria usuária pode assinar em nome dela mesma (e-mail vem do token
 * verificado, nunca do body da requisição).
 */
export const createMercadoPagoSubscription = functions.onRequest(
  {
    region: "us-central1",
    secrets: ["MERCADOPAGO_ACCESS_TOKEN"],
    cors: true,
  },
  async (req, res) => {
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }
    if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

    const authHeader = req.headers.authorization ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) { res.status(401).json({ error: "Token ausente" }); return; }

    let userId: string;
    let userEmail: string;
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      userId = decoded.uid;
      const userRecord = await admin.auth().getUser(userId);
      if (!userRecord.email) throw new Error("sem e-mail");
      userEmail = userRecord.email;
    } catch {
      res.status(401).json({ error: "Token inválido" });
      return;
    }

    const { product, cardTokenId } = req.body as { product?: string; cardTokenId?: string };
    if (!isRecurringProduct(product)) {
      res.status(400).json({ error: "Produto inválido" });
      return;
    }
    if (!cardTokenId) {
      res.status(400).json({ error: "Token do cartão ausente" });
      return;
    }

    try {
      const preApproval = new PreApproval(getMercadoPagoConfig());
      const subscription = await preApproval.create({
        body: {
          reason: PRODUCT_REASON[product],
          external_reference: `${userId}:${product}`,
          payer_email: userEmail,
          card_token_id: cardTokenId,
          back_url: "https://decora-gestao.web.app/app/settings",
          auto_recurring: {
            frequency: 1,
            frequency_type: "months",
            transaction_amount: SUBSCRIPTION_PRICE,
            currency_id: "BRL",
          },
        },
      });

      res.json({ id: subscription.id, status: subscription.status });
    } catch (err) {
      console.error("[createMercadoPagoSubscription] erro:", err);
      res.status(500).json({ error: "Erro ao criar assinatura" });
    }
  },
);
