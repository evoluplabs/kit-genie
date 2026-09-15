import * as functions from "firebase-functions/v2/https";
import * as crypto from "crypto";
import { PreApproval } from "mercadopago";
import { getMercadoPagoConfig } from "./mercadopago-client";
import { grantEntitlement } from "./grant-entitlement";

/**
 * Valida o header x-signature do MercadoPago: HMAC-SHA256 de um manifest
 * "id:{data.id};request-id:{x-request-id};ts:{ts};" usando o secret de
 * assinatura configurado no painel (Suas integrações > Webhooks).
 * PLACEHOLDER: confirmar esse formato contra o simulador de webhooks do
 * MercadoPago ao testar com credenciais reais — fail-closed enquanto isso
 * (sem MERCADOPAGO_WEBHOOK_SECRET configurada, a validação nunca passa).
 */
function isValidSignature(req: functions.Request, dataId: string | undefined): boolean {
  const xSignature = req.headers["x-signature"] as string | undefined;
  const xRequestId = req.headers["x-request-id"] as string | undefined;
  if (!xSignature || !xRequestId || !dataId) return false;

  const parts: Record<string, string> = {};
  for (const part of xSignature.split(",")) {
    const [key, value] = part.split("=");
    if (key && value) parts[key.trim()] = value.trim();
  }
  const { ts, v1 } = parts;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = crypto
    .createHmac("sha256", process.env.MERCADOPAGO_WEBHOOK_SECRET ?? "")
    .update(manifest)
    .digest("hex");

  return expected === v1;
}

export const mercadopagoWebhook = functions.onRequest(
  {
    region: "us-central1",
    secrets: ["MERCADOPAGO_ACCESS_TOKEN", "MERCADOPAGO_WEBHOOK_SECRET"],
  },
  async (req, res) => {
    if (req.method !== "POST") { res.status(405).send("Method not allowed"); return; }

    const type = req.body?.type as string | undefined;
    const dataId = req.body?.data?.id as string | undefined;

    if (!isValidSignature(req, dataId)) {
      console.warn("[mercadopagoWebhook] assinatura inválida ou ausente");
      res.status(401).send("Unauthorized");
      return;
    }

    if (type !== "subscription_preapproval" || !dataId) {
      // Outros tipos de evento (ex.: "payment", que não usamos nesta integração
      // — só assinaturas) apenas confirmam recebimento, sem processar.
      res.status(200).send("ok (evento ignorado)");
      return;
    }

    try {
      const preApproval = new PreApproval(getMercadoPagoConfig());
      const subscription = await preApproval.get({ id: dataId });

      const [, product] = (subscription.external_reference ?? "").split(":");
      if (product !== "assistant" && product !== "whatsapp_premium") {
        console.warn(`[mercadopagoWebhook] external_reference sem produto reconhecível: ${subscription.external_reference}`);
        res.status(200).send("ok (produto não reconhecido)");
        return;
      }
      if (!subscription.payer_email) {
        console.warn(`[mercadopagoWebhook] assinatura ${dataId} sem payer_email`);
        res.status(200).send("ok (sem e-mail)");
        return;
      }

      const status = subscription.status === "authorized" ? "active" : "canceled";

      await grantEntitlement({
        userEmail: subscription.payer_email,
        product,
        status,
        provider: "mercadopago",
        externalId: `mercadopago_${dataId}_${subscription.status}`,
      });

      res.status(200).send("ok");
    } catch (err) {
      console.error("[mercadopagoWebhook] erro ao processar evento:", err);
      res.status(500).send("Erro interno");
    }
  },
);
