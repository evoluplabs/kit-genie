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
exports.assistant = void 0;
const functions = __importStar(require("firebase-functions/v2/https"));
const admin = __importStar(require("firebase-admin"));
const assistant_intent_1 = require("./assistant-intent");
const assistant_executor_1 = require("./assistant-executor");
if (!admin.apps.length)
    admin.initializeApp();
// Cota vitalícia gratuita pra quem ainda não assinou o Assistente IA (R$9,90/mês).
// Precisa bater com o valor inicial em src/services/db/firestore.ts (defaultSchema)
// e src/services/db/seed.ts (seedDb) no frontend.
const FREE_USES_LIMIT = 25;
// Teto de uso mensal só pra pegar bug/abuso em contas assinantes — não bloqueia uso
// normal (mesmo uso pesado fica bem abaixo disso, ver cálculo de custo já feito).
const FAIR_USE_MONTHLY_CAP = 1500;
exports.assistant = functions.onRequest({
    region: "us-central1",
    secrets: ["ANTHROPIC_API_KEY"],
    cors: true,
}, async (req, res) => {
    var _a;
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }
    // Verificar Firebase ID token
    const authHeader = (_a = req.headers.authorization) !== null && _a !== void 0 ? _a : "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
        res.status(401).json({ error: "Token ausente" });
        return;
    }
    let userId;
    try {
        const decoded = await admin.auth().verifyIdToken(token);
        userId = decoded.uid;
    }
    catch (_b) {
        res.status(401).json({ error: "Token inválido" });
        return;
    }
    const { text } = req.body;
    if (!(text === null || text === void 0 ? void 0 : text.trim())) {
        res.status(400).json({ error: "Texto vazio" });
        return;
    }
    let allowed;
    try {
        allowed = await checkAndConsumeQuota(userId);
    }
    catch (err) {
        console.error("[assistant] erro ao checar cota:", err);
        res.status(500).json({ error: "Erro interno" });
        return;
    }
    if (!allowed) {
        res.status(402).json({
            error: "quota_exceeded",
            message: "Você já usou suas interações gratuitas do Assistente IA. Assine por R$9,90/mês em Configurações para continuar usando.",
        });
        return;
    }
    try {
        const intent = await (0, assistant_intent_1.parseIntent)(text.trim());
        const message = await (0, assistant_executor_1.executeIntent)(userId, intent);
        res.json({ message, action: intent.action });
    }
    catch (err) {
        console.error("[assistant] erro:", err);
        res.status(500).json({ error: "Erro interno" });
    }
});
/**
 * Trava de cobrança do Assistente IA — precisa rodar no servidor (nunca só no
 * frontend). Assinante: uso ilimitado, só registra contagem mensal pra detectar
 * bug/abuso. Não-assinante: consome a cota vitalícia única (nunca reseta).
 */
async function checkAndConsumeQuota(userId) {
    const db = admin.firestore();
    const settingsRef = db.collection("users").doc(userId).collection("meta").doc("settings");
    return db.runTransaction(async (tx) => {
        var _a, _b, _c;
        const snap = await tx.get(settingsRef);
        const data = (_a = snap.data()) !== null && _a !== void 0 ? _a : {};
        if (data.assistantSubscriptionActive === true) {
            const currentMonth = new Date().toISOString().slice(0, 7); // "2026-09"
            const sameMonth = data.assistantSubscriberUsageMonth === currentMonth;
            const usageCount = sameMonth ? ((_b = data.assistantSubscriberUsageCount) !== null && _b !== void 0 ? _b : 0) : 0;
            if (usageCount + 1 > FAIR_USE_MONTHLY_CAP) {
                console.warn(`[assistant] usuária ${userId} passou do teto de uso justo mensal (${FAIR_USE_MONTHLY_CAP}) — investigar bug ou abuso.`);
            }
            tx.set(settingsRef, {
                assistantSubscriberUsageCount: usageCount + 1,
                assistantSubscriberUsageMonth: currentMonth,
            }, { merge: true });
            return true;
        }
        const remaining = (_c = data.assistantFreeUsesRemaining) !== null && _c !== void 0 ? _c : FREE_USES_LIMIT;
        if (remaining <= 0)
            return false;
        tx.set(settingsRef, { assistantFreeUsesRemaining: remaining - 1 }, { merge: true });
        return true;
    });
}
//# sourceMappingURL=assistant.js.map