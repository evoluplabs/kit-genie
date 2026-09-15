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
exports.hotmartWebhook = void 0;
const functions = __importStar(require("firebase-functions/v2/https"));
const grant_entitlement_1 = require("./grant-entitlement");
const ACTIVE_EVENTS = new Set(["PURCHASE_APPROVED", "PURCHASE_COMPLETE", "SUBSCRIPTION_REACTIVATED"]);
const CANCELED_EVENTS = new Set([
    "PURCHASE_CANCELED", "PURCHASE_CHARGEBACK", "SUBSCRIPTION_CANCELLATION", "PURCHASE_EXPIRED",
]);
// Mapeia o ID do produto na Hotmart (painel > Produtos) pro produto interno.
// PLACEHOLDER: preencher os 3 secrets abaixo com os IDs reais depois de criar/confirmar
// os produtos na Hotmart — sem isso, resolveProduct nunca casa e nada é liberado.
function resolveProduct(productId) {
    if (productId && productId === process.env.HOTMART_PRODUCT_ID_BASE)
        return "base";
    if (productId && productId === process.env.HOTMART_PRODUCT_ID_ASSISTANT)
        return "assistant";
    if (productId && productId === process.env.HOTMART_PRODUCT_ID_WHATSAPP)
        return "whatsapp_premium";
    return null;
}
exports.hotmartWebhook = functions.onRequest({
    region: "us-central1",
    secrets: [
        "HOTMART_WEBHOOK_TOKEN",
        "HOTMART_PRODUCT_ID_BASE",
        "HOTMART_PRODUCT_ID_ASSISTANT",
        "HOTMART_PRODUCT_ID_WHATSAPP",
    ],
}, async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
    if (req.method !== "POST") {
        res.status(405).send("Method not allowed");
        return;
    }
    // PLACEHOLDER: confirmar no painel da Hotmart onde o token de segurança chega de fato
    // (header X-HOTMART-HOTTOK na integração v2, ou campo "hottok" no corpo em versões antigas).
    const receivedToken = (_a = req.headers["x-hotmart-hottok"]) !== null && _a !== void 0 ? _a : (_b = req.body) === null || _b === void 0 ? void 0 : _b.hottok;
    if (!receivedToken || receivedToken !== process.env.HOTMART_WEBHOOK_TOKEN) {
        console.warn("[hotmartWebhook] token inválido ou ausente");
        res.status(401).send("Unauthorized");
        return;
    }
    const event = (_c = req.body) === null || _c === void 0 ? void 0 : _c.event;
    const email = (_f = (_e = (_d = req.body) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.buyer) === null || _f === void 0 ? void 0 : _f.email;
    const productId = String((_k = (_j = (_h = (_g = req.body) === null || _g === void 0 ? void 0 : _g.data) === null || _h === void 0 ? void 0 : _h.product) === null || _j === void 0 ? void 0 : _j.id) !== null && _k !== void 0 ? _k : "");
    const externalId = String((_w = (_u = (_p = (_o = (_m = (_l = req.body) === null || _l === void 0 ? void 0 : _l.data) === null || _m === void 0 ? void 0 : _m.purchase) === null || _o === void 0 ? void 0 : _o.transaction) !== null && _p !== void 0 ? _p : (_t = (_s = (_r = (_q = req.body) === null || _q === void 0 ? void 0 : _q.data) === null || _r === void 0 ? void 0 : _r.subscription) === null || _s === void 0 ? void 0 : _s.subscriber) === null || _t === void 0 ? void 0 : _t.code) !== null && _u !== void 0 ? _u : (_v = req.body) === null || _v === void 0 ? void 0 : _v.id) !== null && _w !== void 0 ? _w : "");
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
    let status = null;
    if (ACTIVE_EVENTS.has(event))
        status = "active";
    else if (event === "PURCHASE_REFUNDED")
        status = "refunded";
    else if (CANCELED_EVENTS.has(event))
        status = "canceled";
    if (!status) {
        // Evento que não altera entitlement (ex.: PURCHASE_BILLET_PRINTED) — só confirma recebimento.
        res.status(200).send("ok (evento ignorado)");
        return;
    }
    try {
        await (0, grant_entitlement_1.grantEntitlement)({
            userEmail: email,
            product,
            status,
            provider: "hotmart",
            externalId: `hotmart_${externalId}`,
        });
        res.status(200).send("ok");
    }
    catch (err) {
        console.error("[hotmartWebhook] erro ao processar evento:", err);
        res.status(500).send("Erro interno");
    }
});
//# sourceMappingURL=hotmart-webhook.js.map