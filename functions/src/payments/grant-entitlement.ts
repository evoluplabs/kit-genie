import * as admin from "firebase-admin";

if (!admin.apps.length) admin.initializeApp();

export type PaymentProduct = "base" | "assistant" | "whatsapp_premium";
export type PaymentStatus = "active" | "canceled" | "refunded";
export type PaymentProvider = "hotmart" | "mercadopago";

export interface PaymentEvent {
  userEmail: string;
  product: PaymentProduct;
  status: PaymentStatus;
  provider: PaymentProvider;
  externalId: string; // identificador único do evento no provedor — usado pra idempotência
}

const FIELD_BY_PRODUCT: Record<PaymentProduct, string | null> = {
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
export async function grantEntitlement(event: PaymentEvent): Promise<void> {
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
  } catch {
    console.error(`[grant-entitlement] usuária não encontrada pro e-mail ${event.userEmail} (produto ${event.product})`);
    // Registra mesmo sem achar a usuária, pra não reprocessar em loop se o webhook for
    // reenviado — mas fica nos logs pra investigação manual (ex.: e-mail divergente).
    await eventRef.set({ ...event, processedAt: Date.now(), error: "user_not_found" });
    return;
  }

  const active = event.status === "active";
  const field = FIELD_BY_PRODUCT[event.product];

  if (field) {
    const settingsRef = db.collection("users").doc(user.uid).collection("meta").doc("settings");
    await settingsRef.set({ [field]: active }, { merge: true });
  }

  await eventRef.set({ ...event, processedAt: Date.now(), userId: user.uid });
  console.log(`[grant-entitlement] ${event.product} -> ${event.status} pra ${user.uid} (via ${event.provider})`);
}
