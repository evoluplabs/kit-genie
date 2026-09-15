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
exports.handleMessage = handleMessage;
const admin = __importStar(require("firebase-admin"));
const zapi_1 = require("./zapi");
const db = admin.firestore();
// Sessões de conversa em memória (por phone + userId)
// Em produção considerar usar Firestore para persistência entre instâncias
const sessions = new Map();
function sessionKey(userId, phone) {
    return `${userId}:${phone}`;
}
// Mesmo algoritmo de geração de ID usado no app (src/services/db/index.ts),
// para que documentos criados pelo bot fiquem no mesmo formato dos criados pelo app.
function generateId() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
async function handleMessage(userId, config, fromPhone, text) {
    var _a;
    const key = sessionKey(userId, fromPhone);
    const normalized = text.trim().toLowerCase();
    // Resetar sessão com "menu", "oi", "olá", "início"
    if (["menu", "oi", "olá", "ola", "inicio", "início", "0"].includes(normalized)) {
        sessions.delete(key);
    }
    const session = (_a = sessions.get(key)) !== null && _a !== void 0 ? _a : { step: "menu" };
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
async function handleMenu(userId, config, phone, key, input) {
    if (input === "1" || input.includes("disponib") || input.includes("kit") || input.includes("orçamento") || input.includes("orcamento")) {
        // Busca kits ativos do usuário
        const kitsSnap = await db.collection(`users/${userId}/kits`).where("active", "==", true).get();
        const kits = kitsSnap.docs.map(d => (Object.assign({ id: d.id }, d.data())));
        if (kits.length === 0) {
            await (0, zapi_1.sendText)(config, phone, "Ainda não temos kits disponíveis. Retorne em breve!");
            return;
        }
        const lista = kits.map((k, i) => `${i + 1}. ${k.name} — R$ ${k.price.toFixed(2).replace(".", ",")}`).join("\n");
        await (0, zapi_1.sendText)(config, phone, `Nossos kits disponíveis:\n\n${lista}\n\nDigite o *número* do kit que deseja verificar disponibilidade:`);
        sessions.set(key, { step: "escolher_kit" });
    }
    else {
        // Menu principal
        await (0, zapi_1.sendText)(config, phone, `Olá! Bem-vinda ao atendimento automático 💕\n\nDigite o que deseja:\n\n*1* — Ver kits e verificar disponibilidade\n*0* — Voltar ao início`);
        sessions.set(key, { step: "menu" });
    }
}
async function handleEscolherKit(userId, config, phone, key, _session, input) {
    const kitsSnap = await db.collection(`users/${userId}/kits`).where("active", "==", true).get();
    const kits = kitsSnap.docs.map(d => (Object.assign({ id: d.id }, d.data())));
    const idx = parseInt(input.trim()) - 1;
    if (isNaN(idx) || idx < 0 || idx >= kits.length) {
        await (0, zapi_1.sendText)(config, phone, `Número inválido. Digite um número de 1 a ${kits.length}, ou *0* para voltar ao início.`);
        return;
    }
    const kit = kits[idx];
    sessions.set(key, { step: "escolher_data", kitId: kit.id, kitName: kit.name, kitPrice: kit.price });
    await (0, zapi_1.sendText)(config, phone, `Ótima escolha! *${kit.name}*\n\nPara qual data você precisa? Responda no formato *DD/MM/AAAA*:`);
}
async function handleEscolherData(userId, config, phone, key, session, input) {
    var _a;
    // Validar formato DD/MM/AAAA
    const match = input.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) {
        await (0, zapi_1.sendText)(config, phone, "Data inválida. Use o formato *DD/MM/AAAA*, por exemplo: 15/06/2025");
        return;
    }
    const [, dd, mm, yyyy] = match;
    const eventDate = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
    if (isNaN(eventDate.getTime())) {
        await (0, zapi_1.sendText)(config, phone, "Data inválida. Verifique o dia e mês informados.");
        return;
    }
    if (eventDate < new Date()) {
        await (0, zapi_1.sendText)(config, phone, "Esta data já passou. Informe uma data futura:");
        return;
    }
    // Verificar disponibilidade
    const available = await checkAvailability(userId, session.kitId, eventDate.getTime());
    const dateStr = `${dd}/${mm}/${yyyy}`;
    sessions.set(key, Object.assign(Object.assign({}, session), { step: "confirmar", date: dateStr }));
    if (available) {
        await (0, zapi_1.sendText)(config, phone, `✅ *Kit disponível!*\n\n📦 Kit: ${session.kitName}\n📅 Data: ${dateStr}\n💰 Valor: R$ ${(_a = session.kitPrice) === null || _a === void 0 ? void 0 : _a.toFixed(2).replace(".", ",")}\n\nDeseja confirmar a reserva? Responda *SIM* para reservar ou *NÃO* para cancelar.`);
    }
    else {
        await (0, zapi_1.sendText)(config, phone, `⚠️ Infelizmente o *${session.kitName}* não está disponível para ${dateStr}.\n\nDigite *0* para voltar ao menu e escolher outra data ou kit.`);
        sessions.delete(key);
    }
}
async function handleConfirmar(userId, config, phone, key, session, input, customerPhone) {
    var _a, _b;
    if (input === "sim" || input === "s" || input === "yes") {
        // Cria rascunho de venda no Firestore — id gerado explicitamente e gravado dentro do
        // próprio documento, no mesmo formato usado pelo app (fsSetSale/salesRepo).
        const [dd, mm, yyyy] = ((_a = session.date) !== null && _a !== void 0 ? _a : "").split("/");
        const eventDate = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd)).getTime();
        const saleId = generateId();
        await db.doc(`users/${userId}/sales/${saleId}`).set({
            id: saleId,
            customerName: `WhatsApp ${customerPhone}`,
            customerPhone,
            kitId: session.kitId,
            kitNameSnapshot: session.kitName,
            eventDate,
            totalPrice: (_b = session.kitPrice) !== null && _b !== void 0 ? _b : 0,
            paidAmount: 0,
            status: "agendado",
            source: "whatsapp",
            notes: "Reserva feita via bot WhatsApp",
            createdAt: Date.now(),
        });
        await (0, zapi_1.sendText)(config, phone, `🎉 *Reserva confirmada!*\n\n📦 ${session.kitName}\n📅 ${session.date}\n\nEntraremos em contato para confirmar os detalhes e forma de pagamento. Obrigada! 💕`);
        sessions.delete(key);
    }
    else if (input === "não" || input === "nao" || input === "n" || input === "no") {
        await (0, zapi_1.sendText)(config, phone, "Reserva cancelada. Digite *0* para voltar ao menu.");
        sessions.delete(key);
    }
    else {
        await (0, zapi_1.sendText)(config, phone, "Por favor, responda *SIM* para confirmar ou *NÃO* para cancelar.");
    }
}
async function checkAvailability(userId, kitId, eventDate) {
    var _a;
    // Busca o kit
    const kitSnap = await db.doc(`users/${userId}/kits/${kitId}`).get();
    if (!kitSnap.exists)
        return false;
    const kit = kitSnap.data();
    // Busca componentes
    const compSnap = await db.collection(`users/${userId}/components`).get();
    const components = new Map(compSnap.docs.map(d => [d.id, d.data()]));
    // Calcula comprometidos na data
    const dayStart = new Date(eventDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(eventDate);
    dayEnd.setHours(23, 59, 59, 999);
    const salesSnap = await db.collection(`users/${userId}/sales`)
        .where("eventDate", ">=", dayStart.getTime())
        .where("eventDate", "<=", dayEnd.getTime())
        .get();
    const committed = new Map();
    for (const saleDoc of salesSnap.docs) {
        const sale = saleDoc.data();
        if (sale.status === "cancelado")
            continue;
        const saleKitSnap = await db.doc(`users/${userId}/kits/${sale.kitId}`).get();
        if (!saleKitSnap.exists)
            continue;
        const saleKit = saleKitSnap.data();
        saleKit.items.forEach(it => {
            var _a;
            const c = components.get(it.componentId);
            if (c === null || c === void 0 ? void 0 : c.reusable)
                committed.set(it.componentId, ((_a = committed.get(it.componentId)) !== null && _a !== void 0 ? _a : 0) + it.quantity);
        });
    }
    // Verifica disponibilidade
    for (const it of kit.items) {
        const c = components.get(it.componentId);
        if (!c)
            return false;
        if (!c.reusable && c.stock < it.quantity)
            return false;
        if (c.reusable) {
            const used = (_a = committed.get(it.componentId)) !== null && _a !== void 0 ? _a : 0;
            if (c.stock < it.quantity + used)
                return false;
        }
    }
    return true;
}
//# sourceMappingURL=bot.js.map