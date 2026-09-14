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
exports.executeIntent = executeIntent;
const admin = __importStar(require("firebase-admin"));
const db = () => admin.firestore();
function fmtDate(iso) {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
}
function fmtBRL(v) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function uid() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
function findByName(items, name) {
    const lower = name.toLowerCase();
    return items.find(i => i.name.toLowerCase().includes(lower));
}
async function executeIntent(userId, intent) {
    var _a, _b, _c, _d, _e, _f, _g;
    const { action, data } = intent;
    switch (action) {
        case "register_sale": {
            if (!data.kitName)
                return "Qual kit você quer registrar? Me diz o nome.";
            if (!data.eventDate)
                return `Qual a data do evento para o ${data.kitName}?`;
            // Busca o kit pelo nome
            const kitsSnap = await db().collection(`users/${userId}/kits`).get();
            const kit = kitsSnap.docs
                .map(d => (Object.assign({ id: d.id }, d.data())))
                .find(k => k.name.toLowerCase().includes(data.kitName.toLowerCase()));
            if (!kit)
                return `Não encontrei o kit "${data.kitName}". Verifique o nome ou cadastre-o primeiro no app.`;
            const price = (_b = (_a = data.price) !== null && _a !== void 0 ? _a : kit.price) !== null && _b !== void 0 ? _b : 0;
            const saleId = uid();
            const eventTs = new Date(data.eventDate + "T12:00:00").getTime();
            await db().doc(`users/${userId}/sales/${saleId}`).set({
                id: saleId,
                kitId: kit.id,
                kitName: kit.name,
                clientName: (_c = data.clientName) !== null && _c !== void 0 ? _c : "Cliente",
                price,
                eventDate: eventTs,
                status: "agendado",
                workType: (_d = data.workType) !== null && _d !== void 0 ? _d : "decoracao",
                source: "assistant",
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            const resp = [`✅ Venda registrada!`,
                `📦 ${kit.name} · ${fmtDate(data.eventDate)} · ${(_e = data.clientName) !== null && _e !== void 0 ? _e : "Cliente"}`,
                price > 0 ? `💰 ${fmtBRL(price)}` : "",
                `Status: agendado — acesse o app para confirmar.`,].filter(Boolean).join("\n");
            return resp;
        }
        case "add_stock": {
            if (!data.componentName)
                return "Qual componente você quer adicionar ao estoque?";
            if (!data.quantity || data.quantity <= 0)
                return `Quantas unidades de "${data.componentName}" quer adicionar?`;
            const snap = await db().collection(`users/${userId}/components`).get();
            const items = snap.docs.map(d => (Object.assign({ id: d.id }, d.data())));
            const comp = findByName(items, data.componentName);
            if (!comp)
                return `Não encontrei o componente "${data.componentName}". Cadastre-o primeiro no app.`;
            const newStock = ((_f = comp.stock) !== null && _f !== void 0 ? _f : 0) + data.quantity;
            await db().doc(`users/${userId}/components/${comp.id}`).update({
                stock: newStock,
                updatedAt: Date.now(),
            });
            return `✅ Estoque atualizado!\n${comp.name}: ${comp.stock} → ${newStock} unidades`;
        }
        case "query_stock": {
            if (!data.componentName)
                return "Qual componente você quer consultar?";
            const snap = await db().collection(`users/${userId}/components`).get();
            const items = snap.docs.map(d => (Object.assign({ id: d.id }, d.data())));
            const comp = findByName(items, data.componentName);
            if (!comp)
                return `Não encontrei o componente "${data.componentName}". Verifique o nome no app.`;
            const status = comp.stock <= comp.minStock ? "⚠️ Estoque baixo" : "✅ OK";
            return `${comp.name}\nEstoque: ${comp.stock} unidades\nMínimo: ${(_g = comp.minStock) !== null && _g !== void 0 ? _g : 0} · ${status}`;
        }
        case "query_revenue": {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
            const snap = await db()
                .collection(`users/${userId}/sales`)
                .where("eventDate", ">=", startOfMonth)
                .get();
            const sales = snap.docs.map(d => d.data());
            const active = sales.filter(s => s.status !== "cancelado");
            const total = active.reduce((acc, s) => { var _a; return acc + ((_a = s.price) !== null && _a !== void 0 ? _a : 0); }, 0);
            const month = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
            return [
                `📊 Faturamento — ${month}`,
                `${active.length} evento${active.length !== 1 ? "s" : ""}`,
                `Total: ${fmtBRL(total)}`,
            ].join("\n");
        }
        case "list_events": {
            const now = Date.now();
            const snap = await db()
                .collection(`users/${userId}/sales`)
                .where("eventDate", ">=", now)
                .orderBy("eventDate")
                .limit(5)
                .get();
            if (snap.empty)
                return "Nenhum evento nos próximos dias. A agenda está livre! 🎉";
            const lines = snap.docs.map(d => {
                var _a, _b, _c;
                const s = d.data();
                const date = s.eventDate ? fmtDate(new Date(s.eventDate).toISOString().split("T")[0]) : "?";
                return `• ${date} — ${(_a = s.kitName) !== null && _a !== void 0 ? _a : "Kit"} · ${(_b = s.clientName) !== null && _b !== void 0 ? _b : "Cliente"} (${(_c = s.status) !== null && _c !== void 0 ? _c : "agendado"})`;
            });
            return `📅 Próximos eventos:\n${lines.join("\n")}`;
        }
        case "create_kit": {
            if (!data.kitName)
                return "Qual o nome do novo kit?";
            const kitId = uid();
            await db().doc(`users/${userId}/kits/${kitId}`).set({
                id: kitId,
                name: data.kitName,
                items: [],
                price: 0,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return `✅ Kit "${data.kitName}" criado!\nAcesse o app em Kits para adicionar os componentes.`;
        }
        case "unknown":
        default:
            return [
                "Não entendi o comando. Tente algo como:",
                "• Vendi o Kit Mickey pro dia 22, cliente Joana, 850 reais",
                "• Comprei 30 balões rosa",
                "• Quanto tenho de balão azul?",
                "• Faturamento desse mês",
                "• Próximos eventos",
            ].join("\n");
    }
}
//# sourceMappingURL=assistant-executor.js.map