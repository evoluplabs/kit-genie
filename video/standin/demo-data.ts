// DADOS FICTÍCIOS PARA GRAVAR O VÍDEO — nenhum cliente, telefone ou valor é real.
// Copiado para src/services/db/demo-data.ts na cópia usada para gravar.
// Todas as datas são relativas a "hoje", então a agenda sempre parece em uso.
import type { Component, Kit, Sale, CostEntry, DbSchema, SaleStatus } from "./types";

const DAY = 86_400_000;
const midnight = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
})();
/** Dia `d` do mês atual (nunca depois de hoje) — para custos que precisam cair no mês corrente. */
const monthDay = (d: number) => {
  const m = new Date(midnight);
  const today = m.getDate();
  return midnight - (today - Math.min(d, today)) * DAY + 9 * 3_600_000;
};
/** n dias a partir de hoje, às 14h (n negativo = passado). */
const at = (n: number, hour = 14) => midnight + n * DAY + hour * 3_600_000;

const comp = (
  id: string, name: string, category: string, unit: Component["unit"],
  stock: number, minStock: number, unitCost: number, reusable: boolean,
): Component => ({ id, name, category, unit, stock, minStock, unitCost, reusable, createdAt: at(-120), updatedAt: at(-2) });

export function demoData(): DbSchema {
  const components: Component[] = [
    comp("c1", "Painel Redondo Branco", "Painel", "un", 4, 2, 180, true),
    comp("c2", "Cilindro MDF Médio", "Estrutura", "un", 6, 3, 90, true),
    comp("c3", "Mesa Cavalete Branca", "Móveis", "un", 4, 2, 220, true),
    comp("c4", "Balão Látex Rosa Pastel G", "Balão", "pct", 8, 10, 25, false),
    comp("c5", "Balão Chrome Dourado", "Balão", "pct", 12, 6, 38, false),
    comp("c6", "Fita de Cetim Gold (rolo)", "Decor", "rolo", 2, 4, 14, false),
    comp("c7", "Boleira Cerâmica Rosa M", "Decor", "un", 3, 2, 75, true),
    comp("c8", "Tapete Vinílico Preto", "Estrutura", "un", 2, 1, 160, true),
    comp("c9", "Topo de Bolo Personalizado", "Decor", "un", 15, 5, 18, false),
    comp("c10", "Toalha Veludo Rosa", "Tecido", "un", 3, 2, 95, true),
    comp("c11", "Arco Orgânico de Balões (kit)", "Balão", "un", 6, 3, 60, false),
    comp("c12", "Vaso Cerâmica Branco G", "Decor", "un", 5, 2, 55, true),
  ];

  const kits: Kit[] = [
    {
      id: "k1", name: "Kit Mickey Premium", theme: "Mickey", type: "decoracao", price: 1290,
      description: "Painel redondo, cilindros, mesa de bolo e arco de balões.",
      items: [
        { componentId: "c1", quantity: 1 }, { componentId: "c2", quantity: 3 }, { componentId: "c3", quantity: 1 },
        { componentId: "c4", quantity: 2 }, { componentId: "c5", quantity: 1 }, { componentId: "c9", quantity: 1 },
        { componentId: "c11", quantity: 1 },
      ],
      tiers: [
        { name: "bronze", price: 790, items: [{ componentId: "c1", quantity: 1 }, { componentId: "c4", quantity: 1 }, { componentId: "c9", quantity: 1 }] },
        { name: "prata", price: 1290, items: [{ componentId: "c1", quantity: 1 }, { componentId: "c2", quantity: 3 }, { componentId: "c4", quantity: 2 }, { componentId: "c9", quantity: 1 }] },
        { name: "ouro", price: 1890, items: [{ componentId: "c1", quantity: 1 }, { componentId: "c2", quantity: 3 }, { componentId: "c3", quantity: 1 }, { componentId: "c4", quantity: 2 }, { componentId: "c5", quantity: 1 }, { componentId: "c11", quantity: 1 }] },
      ],
      imageColor: "#ef4444", active: true, createdAt: at(-110), updatedAt: at(-10),
    },
    {
      id: "k2", name: "Kit Pegue e Monte Batman", theme: "Batman", type: "pegue_monte", price: 480,
      description: "Tudo embalado para a cliente montar em casa.",
      items: [
        { componentId: "c4", quantity: 2 }, { componentId: "c5", quantity: 1 },
        { componentId: "c6", quantity: 1 }, { componentId: "c9", quantity: 1 },
      ],
      imageColor: "#1e293b", active: true, createdAt: at(-100), updatedAt: at(-12),
    },
    {
      id: "k3", name: "Kit Jardim Encantado", theme: "Jardim", type: "decoracao", price: 1150,
      description: "Cenário com flores, vasos e mesa posta.",
      items: [
        { componentId: "c3", quantity: 1 }, { componentId: "c10", quantity: 1 }, { componentId: "c12", quantity: 3 },
        { componentId: "c7", quantity: 1 }, { componentId: "c4", quantity: 2 }, { componentId: "c6", quantity: 2 },
      ],
      imageColor: "#22c55e", active: true, createdAt: at(-90), updatedAt: at(-8),
    },
    {
      id: "k4", name: "Locação Painel + Cilindros", theme: "Personalizado", type: "locacao", price: 650,
      description: "Locação por dia; volta ao estoque após o evento.",
      items: [{ componentId: "c1", quantity: 2 }, { componentId: "c2", quantity: 4 }, { componentId: "c8", quantity: 1 }],
      imageColor: "#8b5cf6", active: true, createdAt: at(-80), updatedAt: at(-5),
    },
    {
      id: "k5", name: "Kit Unicórnio Pastel", theme: "Unicórnio", type: "decoracao", price: 980,
      description: "Tons pastel, arco de balões e mesa do bolo.",
      items: [
        { componentId: "c1", quantity: 1 }, { componentId: "c4", quantity: 3 }, { componentId: "c10", quantity: 1 },
        { componentId: "c7", quantity: 1 }, { componentId: "c11", quantity: 1 },
      ],
      imageColor: "#ec4899", active: true, createdAt: at(-70), updatedAt: at(-6),
    },
  ];

  const kitName = (id: string) => kits.find((k) => k.id === id)!.name;
  let n = 0;
  const sale = (
    customerName: string, kitId: string, day: number, total: number, paid: number,
    status: SaleStatus, source: Sale["source"] = "manual", extra: Partial<Sale> = {},
  ): Sale => ({
    id: `s${++n}`, customerName, customerPhone: `(11) 90000-${String(1000 + n)}`,
    kitId, kitNameSnapshot: kitName(kitId), eventDate: at(day), totalPrice: total, paidAmount: paid,
    status, source, createdAt: at(day - 14), ...extra,
  });

  const sales: Sale[] = [
    // meses anteriores (alimentam os gráficos e a base de clientes)
    sale("Camila Rocha", "k1", -95, 1290, 1290, "concluido"),
    sale("Fernanda Lima", "k3", -88, 1150, 1150, "concluido"),
    sale("Fernanda Lima", "k2", -70, 480, 480, "concluido"),
    sale("Camila Rocha", "k2", -62, 480, 480, "concluido", "whatsapp"),
    sale("Fernanda Lima", "k4", -55, 650, 650, "concluido"),
    sale("Camila Rocha", "k5", -44, 980, 980, "concluido"),
    sale("Fernanda Lima", "k5", -36, 980, 980, "concluido"),
    sale("Juliana Prado", "k2", -80, 480, 480, "concluido", "whatsapp"),
    sale("Patrícia Souza", "k4", -74, 650, 650, "concluido"),
    sale("Renata Alves", "k5", -66, 980, 980, "concluido"),
    sale("Aline Martins", "k1", -58, 1290, 1290, "concluido"),
    sale("Bianca Torres", "k3", -49, 1150, 1150, "concluido"),
    sale("Carla Mendes", "k2", -41, 480, 480, "concluido", "whatsapp"),
    sale("Daniela Freitas", "k5", -33, 980, 980, "concluido"),
    sale("Camila Rocha", "k4", -27, 650, 650, "concluido"),
    // mês atual
    sale("Eduarda Nunes", "k1", -19, 1290, 1290, "concluido"),
    sale("Fernanda Lima", "k5", -14, 980, 980, "concluido"),
    sale("Gabriela Dias", "k2", -9, 480, 480, "concluido", "whatsapp"),
    sale("Helena Costa", "k3", -4, 1150, 1150, "entregue"),
    // próximos dias (agenda)
    sale("Isabela Ramos", "k1", 1, 1290, 645, "confirmado"),
    sale("Juliana Prado", "k4", 3, 650, 325, "confirmado", "manual", { returnDate: at(4) }),
    sale("Larissa Gomes", "k5", 3, 980, 490, "confirmado"),
    sale("Mônica Reis", "k2", 6, 480, 240, "agendado", "whatsapp"),
    sale("Natália Ferraz", "k3", 9, 1150, 575, "confirmado"),
    sale("Camila Rocha", "k1", 12, 1290, 645, "agendado"),
    sale("Olívia Barros", "k4", 15, 650, 0, "agendado", "manual", { returnDate: at(16) }),
    sale("Patrícia Souza", "k5", 19, 980, 490, "agendado"),
  ];

  const cost = (
    description: string, kind: CostEntry["kind"], category: string, amount: number,
    frequency: CostEntry["frequency"], day: number,
  ): CostEntry => ({ id: `co${++n}`, description, kind, category, amount, frequency, date: monthDay(day), createdAt: monthDay(day) });

  const costs: CostEntry[] = [
    cost("Aluguel do ateliê", "profissional", "Aluguel", 1200, "mensal", 2),
    cost("Internet e telefone", "profissional", "Contas", 140, "mensal", 3),
    cost("Combustível das entregas", "profissional", "Transporte", 380, "mensal", 5),
    cost("Compra de balões e fitas", "profissional", "Materiais", 650, "unico", 4),
    cost("Embalagens dos kits", "profissional", "Materiais", 180, "unico", 6),
    cost("Anúncios", "profissional", "Marketing", 250, "mensal", 2),
    cost("Mercado", "pessoal", "Casa", 900, "mensal", 3),
    cost("Plano de saúde", "pessoal", "Saúde", 420, "mensal", 5),
  ];

  return {
    profile: {
      id: "demo", businessName: "Ateliê Exemplo", ownerName: "Mariana", phone: "(11) 90000-0000",
      email: "mariana@exemplo.com", themes: ["Mickey", "Batman", "Jardim", "Unicórnio"],
      workTypes: ["decoracao", "pegue_monte", "locacao"], onboardingCompleted: true, createdAt: at(-120),
    },
    settings: {
      notifyLowStock: true, notifyWeeklyReport: true, currency: "BRL", lowStockMultiplier: 1,
      goalAmount: 12000, assistantEnabled: false, assistantFreeUsesRemaining: 25, assistantSubscriptionActive: false,
    },
    components, kits, sales, costs,
  };
}
