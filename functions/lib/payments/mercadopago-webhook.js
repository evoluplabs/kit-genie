"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.mercadopagoWebhook = void 0;
const functions = __importStar(require("firebase-functions/v2/https"));
const crypto = __importStar(require("crypto"));
const mercadopago_1 = require("mercadopago");
const mercadopago_client_1 = require("./mercadopago-client");
const grant_entitlement_1 = require("./grant-entitlement");
/**
 * Valida o header x-signature do MercadoPago: HMAC-SHA256 de um manifest
 * "id:{data.id};request-id:{x-request-id};ts:{ts};" usando o secret de
 * assinatura configurado no painel (Suas integrações > Webhooks).
 * PLACEHOLDER: confirmar esse formato contra o simulador de webhooks do
 * MercadoPago ao testar com credenciais reais — fail-closed enquanto isso
 * (sem MERCADOPAGO_WEBHOOK_SECRET configurada, a validação nunca passa).
 */
function isValidSignature(req, dataId) {
    var _a;
    const xSignature = req.headers["x-signature"];
    const xRequestId = req.headers["x-request-id"];
    if (!xSignature || !xRequestId || !dataId)
        return false;
    const parts = {};
    for (const part of xSignature.split(",")) {
        const [key, value] = part.split("=");
        if (key && value)
            parts[key.trim()] = value.trim();
    }
    const { ts, v1 } = parts;
    if (!ts || !v1)
        return false;
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const expected = crypto
        .createHmac("sha256", (_a = process.env.MERCADOPAGO_WEBHOOK_SECRET) !== null && _a !== void 0 ? _a : "")
        .update(manifest)
        .digest("hex");
    return expected === v1;
}
exports.mercadopagoWebhook = functions.onRequest({
    region: "us-central1",
    secrets: ["MERCADOPAGO_ACCESS_TOKEN", "MERCADOPAGO_WEBHOOK_SECRET"],
}, async (req, res) => {
    var _a, _b, _c, _d;
    if (req.method !== "POST") {
        res.status(405).send("Method not allowed");
        return;
    }
    const type = (_a = req.body) === null || _a === void 0 ? void 0 : _a.type;
    const dataId = (_c = (_b = req.body) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.id;
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
        const preApproval = new mercadopago_1.PreApproval((0, mercadopago_client_1.getMercadoPagoConfig)());
        const subscription = await preApproval.get({ id: dataId });
        const [, product] = ((_d = subscription.external_reference) !== null && _d !== void 0 ? _d : "").split(":");
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
        await (0, grant_entitlement_1.grantEntitlement)({
            userEmail: subscription.payer_email,
            product,
            status,
            provider: "mercadopago",
            externalId: `mercadopago_${dataId}_${subscription.status}`,
        });
        res.status(200).send("ok");
    }
    catch (err) {
        console.error("[mercadopagoWebhook] erro ao processar evento:", err);
        res.status(500).send("Erro interno");
    }
});
//# sourceMappingURL=mercadopago-webhook.js.map