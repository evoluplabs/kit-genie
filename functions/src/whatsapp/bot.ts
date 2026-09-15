import * as admin from "firebase-admin";
import { sendText } from "./zapi";
import type { ZApiConfig } from "./zapi";

const db = admin.firestore();

// Sessões de conversa em memória (por phone + userId)
// Em produção considerar usar Firestore para persistência entre instâncias
const sessions = new Map<string, BotSession>();

interface BotSession {
  step: "menu" | "escolher_kit" | "escolher_data" | "confirmar";
  kitId?: string;
  kitName?: string;
  kitPrice?: number;
  date?: string;
}

function sessionKey(userId: string, phone: string) {
  return `${userId}:${phone}`;
}

// Mesmo algoritmo de geração de ID usado no app (src/services/db/index.ts),
// para que documentos criados pelo bot fiquem no mesmo formato dos criados pelo app.
function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export async function handleMessage(
  userId: string,
  config: ZApiConfig,
  fromPhone: string,
  text: string
): Promise<void> {
  const key = sessionKey(userId, fromPhone);
  const normalized = text.trim().toLowerCase();

  // Resetar sessão com "menu", "oi", "olá", "início"
  if (["menu", "oi", "olá", "ola", "inicio", "início", "0"].includes(normalized)) {
    sessions.delete(key);
  }

  const session = sessions.get(key) ?? { step: "menu" as const };

  switch (session.step) {
    case "menu":
      await handleMenu(userId, config, fromPhone, key, normalized);
      break;
    case "escolher_kit":
      await handleEscolherKit(userId, config, fromPhone, key, session, text);
      break;
    case "escolher_data":
      await handleEscolherData(userId, config, fromPhone, key, session, text);
      break;
    case "confirmar":
      await handleConfirmar(userId, config, fromPhone, key, session, normalized, fromPhone);
      break;
  }
}

async function handleMenu(
  userId: string,
  config: ZApiConfig,
  phone: string,
  key: string,
  input: string
): Promise<void> {
  if (input === "1" || input.includes("disponib") || input.includes("kit") || input.includes("orçamento") || input.includes("orcamento")) {
    // Busca kits ativos do usuário
    const kitsSnap = await db.collection(`users/${userId}/kits`).where("active", "==", true).get();
    const kits = kitsSnap.docs.map(d => ({ id: d.id, ...(d.data() as { name: string; price: number }) }));

    if (kits.length === 0) {
      await sendText(config, phone, "Ainda não temos kits disponíveis. Retorne em breve!");
      return;
    }

    const lista = kits.map((k, i) => `${i + 1}. ${k.name} — R$ ${k.price.toFixed(2).replace(".", ",")}`).join("\n");
    await sendText(config, phone, `Nossos kits disponíveis:\n\n${lista}\n\nDigite o *número* do kit que deseja verificar disponibilidade:`);
    sessions.set(key, { step: "escolher_kit" });

  } else {
    // Menu principal
    await sendText(config, phone,
      `Olá! Bem-vinda ao atendimento automático 💕\n\nDigite o que deseja:\n\n*1* — Ver kits e verificar disponibilidade\n*0* — Voltar ao início`
    );
    sessions.set(key, { step: "menu" });
  }
}

async function handleEscolherKit(
  userId: string,
  config: ZApiConfig,
  phone: string,
  key: string,
  _session: BotSession,
  input: string
): Promise<void> {
  const kitsSnap = await db.collection(`users/${userId}/kits`).where("active", "==", true).get();
  const kits = kitsSnap.docs.map(d => ({ id: d.id, ...(d.data() as { name: string; price: number }) }));

  const idx = parseInt(input.trim()) - 1;
  if (isNaN(idx) || idx < 0 || idx >= kits.length) {
    await sendText(config, phone, `Número inválido. Digite um número de 1 a ${kits.length}, ou *0* para voltar ao início.`);
    return;
  }

  const kit = kits[idx];
  sessions.set(key, { step: "escolher_data", kitId: kit.id, kitName: kit.name, kitPrice: kit.price });
  await sendText(config, phone, `Ótima escolha! *${kit.name}*\n\nPara qual data você precisa? Responda no formato *DD/MM/AAAA*:`);
}

async function handleEscolherData(
  userId: string,
  config: ZApiConfig,
  phone: string,
  key: string,
  session: BotSession,
  input: string
): Promise<void> {
  // Validar formato DD/MM/AAAA
  const match = input.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    await sendText(config, phone, "Data inválida. Use o formato *DD/MM/AAAA*, por exemplo: 15/06/2025");
    return;
  }

  const [, dd, mm, yyyy] = match;
  const eventDate = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
  if (isNaN(eventDate.getTime())) {
    await sendText(config, phone, "Data inválida. Verifique o dia e mês informados.");
    return;
  }

  if (eventDate < new Date()) {
    await sendText(config, phone, "Esta data já passou. Informe uma data futura:");
    return;
  }

  // Verificar disponibilidade
  const available = await checkAvailability(userId, session.kitId!, eventDate.getTime());

  const dateStr = `${dd}/${mm}/${yyyy}`;
  sessions.set(key, { ...session, step: "confirmar", date: dateStr });

  if (available) {
    await sendText(config, phone,
      `✅ *Kit disponível!*\n\n📦 Kit: ${session.kitName}\n📅 Data: ${dateStr}\n💰 Valor: R$ ${session.kitPrice?.toFixed(2).replace(".", ",")}\n\nDeseja confirmar a reserva? Responda *SIM* para reservar ou *NÃO* para cancelar.`
    );
  } else {
    await sendText(config, phone,
      `⚠️ Infelizmente o *${session.kitName}* não está disponível para ${dateStr}.\n\nDigite *0* para voltar ao menu e escolher outra data ou kit.`
    );
    sessions.delete(key);
  }
}

async function handleConfirmar(
  userId: string,
  config: ZApiConfig,
  phone: string,
  key: string,
  session: BotSession,
  input: string,
  customerPhone: string
): Promise<void> {
  if (input === "sim" || input === "s" || input === "yes") {
    // Cria rascunho de venda no Firestore — id gerado explicitamente e gravado dentro do
    // próprio documento, no mesmo formato usado pelo app (fsSetSale/salesRepo).
    const [dd, mm, yyyy] = (session.date ?? "").split("/");
    const eventDate = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd)).getTime();
    const saleId = generateId();

    await db.doc(`users/${userId}/sales/${saleId}`).set({
      id: saleId,
      customerName: `WhatsApp ${customerPhone}`,
      customerPhone,
      kitId: session.kitId,
      kitNameSnapshot: session.kitName,
      eventDate,
      totalPrice: session.kitPrice ?? 0,
      paidAmount: 0,
      status: "agendado",
      source: "whatsapp",
      notes: "Reserva feita via bot WhatsApp",
      createdAt: Date.now(),
    });

    await sendText(config, phone,
      `🎉 *Reserva confirmada!*\n\n📦 ${session.kitName}\n📅 ${session.date}\n\nEntraremos em contato para confirmar os detalhes e forma de pagamento. Obrigada! 💕`
    );
    sessions.delete(key);

  } else if (input === "não" || input === "nao" || input === "n" || input === "no") {
    await sendText(config, phone, "Reserva cancelada. Digite *0* para voltar ao menu.");
    sessions.delete(key);
  } else {
    await sendText(config, phone, "Por favor, responda *SIM* para confirmar ou *NÃO* para cancelar.");
  }
}

async function checkAvailability(userId: string, kitId: string, eventDate: number): Promise<boolean> {
  // Busca o kit
  const kitSnap = await db.doc(`users/${userId}/kits/${kitId}`).get();
  if (!kitSnap.exists) return false;
  const kit = kitSnap.data() as { items: Array<{ componentId: string; quantity: number }> };

  // Busca componentes
  const compSnap = await db.collection(`users/${userId}/components`).get();
  const components = new Map(compSnap.docs.map(d => [d.id, d.data() as { stock: number; reusable: boolean; minStock: number }]));

  // Calcula comprometidos na data
  const dayStart = new Date(eventDate); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(eventDate); dayEnd.setHours(23, 59, 59, 999);

  const salesSnap = await db.collection(`users/${userId}/sales`)
    .where("eventDate", ">=", dayStart.getTime())
    .where("eventDate", "<=", dayEnd.getTime())
    .get();

  const committed = new Map<string, number>();
  for (const saleDoc of salesSnap.docs) {
    const sale = saleDoc.data() as { kitId: string; status: string };
    if (sale.status === "cancelado") continue;
    const saleKitSnap = await db.doc(`users/${userId}/kits/${sale.kitId}`).get();
    if (!saleKitSnap.exists) continue;
    const saleKit = saleKitSnap.data() as { items: Array<{ componentId: string; quantity: number }> };
    saleKit.items.forEach(it => {
      const c = components.get(it.componentId);
      if (c?.reusable) committed.set(it.componentId, (committed.get(it.componentId) ?? 0) + it.quantity);
    });
  }

  // Verifica disponibilidade
  for (const it of kit.items) {
    const c = components.get(it.componentId);
    if (!c) return false;
    if (!c.reusable && c.stock < it.quantity) return false;
    if (c.reusable) {
      const used = committed.get(it.componentId) ?? 0;
      if (c.stock < it.quantity + used) return false;
    }
  }
  return true;
}
