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
exports.grantEntitlement = grantEntitlement;
const admin = __importStar(require("firebase-admin"));
if (!admin.apps.length)
    admin.initializeApp();
const FIELD_BY_PRODUCT = {
    assistant: "assistantSubscriptionActive",
    whatsapp_premium: "whatsappPremiumActive",
    base: null, // plano base não tem trava de acesso no app hoje — só registramos o evento
};
/**
 * Ponto único de escrita no Firestore para qualquer confirmação de pagamento,
 * independente do provedor (Hotmart, MercadoPago, futuros). Cada webhook normaliza
 * seu payload pra este formato e chama esta função — evita duplicar em cada
 * integração a lógica de "o que isso significa pro Firestore".
 */
async function grantEntitlement(event) {
    const db = admin.firestore();
    // Idempotência: provedores reenviam o mesmo evento em caso de retry/timeout.
    const eventRef = db.collection("payment_events").doc(event.externalId);
    const eventSnap = await eventRef.get();
    if (eventSnap.exists) {
        console.log(`[grant-entitlement] evento ${event.externalId} já processado, ignorando`);
        return;
    }
    let user;
    try {
        user = await admin.auth().getUserByEmail(event.userEmail);
    }
    catch (_a) {
        console.error(`[grant-entitlement] usuária não encontrada pro e-mail ${event.userEmail} (produto ${event.product})`);
        // Registra mesmo sem achar a usuária, pra não reprocessar em loop se o webhook for
        // reenviado — mas fica nos logs pra investigação manual (ex.: e-mail divergente).
        await eventRef.set(Object.assign(Object.assign({}, event), { processedAt: Date.now(), error: "user_not_found" }));
        return;
    }
    const active = event.status === "active";
    const field = FIELD_BY_PRODUCT[event.product];
    if (field) {
        const settingsRef = db.collection("users").doc(user.uid).collection("meta").doc("settings");
        await settingsRef.set({ [field]: active }, { merge: true });
    }
    await eventRef.set(Object.assign(Object.assign({}, event), { processedAt: Date.now(), userId: user.uid }));
    console.log(`[grant-entitlement] ${event.product} -> ${event.status} pra ${user.uid} (via ${event.provider})`);
}
//# sourceMappingURL=grant-entitlement.js.map