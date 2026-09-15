import * as functions from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { parseIntent } from "./assistant-intent";
import { executeIntent } from "./assistant-executor";

if (!admin.apps.length) admin.initializeApp();

// Cota vitalícia gratuita pra quem ainda não assinou o Assistente IA (R$9,90/mês).
// Precisa bater com o valor inicial em src/services/db/firestore.ts (defaultSchema)
// e src/services/db/seed.ts (seedDb) no frontend.
const FREE_USES_LIMIT = 25;

// Teto de uso mensal só pra pegar bug/abuso em contas assinantes — não bloqueia uso
// normal (mesmo uso pesado fica bem abaixo disso, ver cálculo de custo já feito).
const FAIR_USE_MONTHLY_CAP = 1500;

export const assistant = functions.onRequest(
  {
    region: "us-central1",
    secrets: ["ANTHROPIC_API_KEY"],
    cors: true,
  },
  async (req, res) => {
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }
    if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

    // Verificar Firebase ID token
    const authHeader = req.headers.authorization ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) { res.status(401).json({ error: "Token ausente" }); return; }

    let userId: string;
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      userId = decoded.uid;
    } catch {
      res.status(401).json({ error: "Token inválido" });
      return;
    }

    const { text } = req.body as { text?: string };
    if (!text?.trim()) { res.status(400).json({ error: "Texto vazio" }); return; }

    let allowed: boolean;
    try {
      allowed = await checkAndConsumeQuota(userId);
    } catch (err) {
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
      const intent = await parseIntent(text.trim());
      const message = await executeIntent(userId, intent);
      res.json({ message, action: intent.action });
    } catch (err) {
      console.error("[assistant] erro:", err);
      res.status(500).json({ error: "Erro interno" });
    }
  }
);

/**
 * Trava de cobrança do Assistente IA — precisa rodar no servidor (nunca só no
 * frontend). Assinante: uso ilimitado, só registra contagem mensal pra detectar
 * bug/abuso. Não-assinante: consome a cota vitalícia única (nunca reseta).
 */
async function checkAndConsumeQuota(userId: string): Promise<boolean> {
  const db = admin.firestore();
  const settingsRef = db.collection("users").doc(userId).collection("meta").doc("settings");

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(settingsRef);
    const data = snap.data() ?? {};

    if (data.assistantSubscriptionActive === true) {
      const currentMonth = new Date().toISOString().slice(0, 7); // "2026-09"
      const sameMonth = data.assistantSubscriberUsageMonth === currentMonth;
      const usageCount = sameMonth ? ((data.assistantSubscriberUsageCount as number | undefined) ?? 0) : 0;

      if (usageCount + 1 > FAIR_USE_MONTHLY_CAP) {
        console.warn(`[assistant] usuária ${userId} passou do teto de uso justo mensal (${FAIR_USE_MONTHLY_CAP}) — investigar bug ou abuso.`);
      }

      tx.set(settingsRef, {
        assistantSubscriberUsageCount: usageCount + 1,
        assistantSubscriberUsageMonth: currentMonth,
      }, { merge: true });
      return true;
    }

    const remaining = (data.assistantFreeUsesRemaining as number | undefined) ?? FREE_USES_LIMIT;
    if (remaining <= 0) return false;

    tx.set(settingsRef, { assistantFreeUsesRemaining: remaining - 1 }, { merge: true });
    return true;
  });
}
