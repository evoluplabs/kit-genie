import * as admin from "firebase-admin";
import type { AssistantIntent } from "./assistant-intent";

const db = () => admin.firestore();

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function fmtBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function findByName<T extends { name: string }>(items: T[], name: string): T | undefined {
  const lower = name.toLowerCase();
  return items.find(i => i.name.toLowerCase().includes(lower));
}

export async function executeIntent(userId: string, intent: AssistantIntent): Promise<string> {
  const { action, data } = intent;

  switch (action) {
    case "register_sale": {
      if (!data.kitName) return "Qual kit você quer registrar? Me diz o nome.";
      if (!data.eventDate) return `Qual a data do evento para o ${data.kitName}?`;

      // Busca o kit pelo nome
      const kitsSnap = await db().collection(`users/${userId}/kits`).get();
      const kit = kitsSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as { id: string; name: string; price?: number }))
        .find(k => k.name.toLowerCase().includes(data.kitName!.toLowerCase()));

      if (!kit) return `Não encontrei o kit "${data.kitName}". Verifique o nome ou cadastre-o primeiro no app.`;

      const price = data.price ?? kit.price ?? 0;
      const saleId = uid();
      const eventTs = new Date(data.eventDate + "T12:00:00").getTime();

      // Campos alinhados com o tipo Sale real (src/services/db/types.ts):
      // kitNameSnapshot (não kitName), customerName (não clientName), totalPrice (não price),
      // paidAmount obrigatório, source restrito a "manual"|"whatsapp"|"automacao",
      // createdAt como number (Date.now()), não FieldValue.serverTimestamp().
      await db().doc(`users/${userId}/sales/${saleId}`).set({
        id: saleId,
        kitId: kit.id,
        kitNameSnapshot: kit.name,
        customerName: data.clientName ?? "Cliente",
        totalPrice: price,
        paidAmount: 0,
        eventDate: eventTs,
        status: "agendado",
        source: "automacao",
        createdAt: Date.now(),
      });

      const resp = [`✅ Venda registrada!`,
        `📦 ${kit.name} · ${fmtDate(data.eventDate)} · ${data.clientName ?? "Cliente"}`,
        price > 0 ? `💰 ${fmtBRL(price)}` : "",
        `Status: agendado — acesse o app para confirmar.`,
      ].filter(Boolean).join("\n");

      return resp;
    }

    case "add_stock": {
      if (!data.componentName) return "Qual componente você quer adicionar ao estoque?";
      if (!data.quantity || data.quantity <= 0) return `Quantas unidades de "${data.componentName}" quer adicionar?`;

      const snap = await db().collection(`users/${userId}/components`).get();
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as { id: string; name: string; stock: number }));
      const comp = findByName(items, data.componentName);

      if (!comp) return `Não encontrei o componente "${data.componentName}". Cadastre-o primeiro no app.`;

      const newStock = (comp.stock ?? 0) + data.quantity;
      await db().doc(`users/${userId}/components/${comp.id}`).update({
        stock: newStock,
        updatedAt: Date.now(),
      });

      return `✅ Estoque atualizado!\n${comp.name}: ${comp.stock} → ${newStock} unidades`;
    }

    case "query_stock": {
      if (!data.componentName) return "Qual componente você quer consultar?";

      const snap = await db().collection(`users/${userId}/components`).get();
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as { id: string; name: string; stock: number; minStock: number }));
      const comp = findByName(items, data.componentName);

      if (!comp) return `Não encontrei o componente "${data.componentName}". Verifique o nome no app.`;

      const status = comp.stock <= comp.minStock ? "⚠️ Estoque baixo" : "✅ OK";
      return `${comp.name}\nEstoque: ${comp.stock} unidades\nMínimo: ${comp.minStock ?? 0} · ${status}`;
    }

    case "query_revenue": {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

      const snap = await db()
        .collection(`users/${userId}/sales`)
        .where("eventDate", ">=", startOfMonth)
        .get();

      const sales = snap.docs.map(d => d.data() as { totalPrice?: number; status?: string; customerName?: string });
      const active = sales.filter(s => s.status !== "cancelado");
      const total = active.reduce((acc, s) => acc + (s.totalPrice ?? 0), 0);
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

      if (snap.empty) return "Nenhum evento nos próximos dias. A agenda está livre! 🎉";

      const lines = snap.docs.map(d => {
        const s = d.data() as { kitNameSnapshot?: string; customerName?: string; eventDate?: number; status?: string };
        const date = s.eventDate ? fmtDate(new Date(s.eventDate).toISOString().split("T")[0]) : "?";
        return `• ${date} — ${s.kitNameSnapshot ?? "Kit"} · ${s.customerName ?? "Cliente"} (${s.status ?? "agendado"})`;
      });

      return `📅 Próximos eventos:\n${lines.join("\n")}`;
    }

    case "create_kit": {
      if (!data.kitName) return "Qual o nome do novo kit?";

      const kitId = uid();
      // Campos mínimos exigidos pelo tipo Kit real (theme, type, active, updatedAt).
      await db().doc(`users/${userId}/kits/${kitId}`).set({
        id: kitId,
        name: data.kitName,
        theme: data.kitName,
        type: "decoracao",
        items: [],
        price: 0,
        active: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
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
