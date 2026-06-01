import type { DbSchema } from "./types";

const now = () => Date.now();
const day = 24 * 60 * 60 * 1000;

export function seedDb(): DbSchema {
  const t = now();

  const components = [
    { id: "c1", name: "Painel Redondo Branco", category: "Painel", unit: "un" as const, stock: 4, minStock: 2, unitCost: 180, reusable: true, createdAt: t, updatedAt: t },
    { id: "c2", name: "Cilindro MDF Médio", category: "Estrutura", unit: "un" as const, stock: 6, minStock: 3, unitCost: 90, reusable: true, createdAt: t, updatedAt: t },
    { id: "c3", name: "Mesa Cavalete Branca", category: "Móveis", unit: "un" as const, stock: 4, minStock: 2, unitCost: 220, reusable: true, createdAt: t, updatedAt: t },
    { id: "c4", name: "Balão Látex Rosa Pastel G", category: "Balão", unit: "pct" as const, stock: 8, minStock: 10, unitCost: 25, reusable: false, createdAt: t, updatedAt: t },
    { id: "c5", name: "Balão Chrome Dourado", category: "Balão", unit: "pct" as const, stock: 12, minStock: 6, unitCost: 38, reusable: false, createdAt: t, updatedAt: t },
    { id: "c6", name: "Fita de Cetim Gold (rolo)", category: "Decor", unit: "rolo" as const, stock: 2, minStock: 4, unitCost: 14, reusable: false, createdAt: t, updatedAt: t },
    { id: "c7", name: "Boleira Cerâmica Rosa M", category: "Decor", unit: "un" as const, stock: 3, minStock: 2, unitCost: 75, reusable: true, createdAt: t, updatedAt: t },
    { id: "c8", name: "Tapete Vinílico Preto", category: "Estrutura", unit: "un" as const, stock: 2, minStock: 1, unitCost: 160, reusable: true, createdAt: t, updatedAt: t },
    { id: "c9", name: "Topo de Bolo Personalizado", category: "Decor", unit: "un" as const, stock: 15, minStock: 5, unitCost: 18, reusable: false, createdAt: t, updatedAt: t },
    { id: "c10", name: "Toalha Veludo Rosa", category: "Tecido", unit: "un" as const, stock: 3, minStock: 2, unitCost: 95, reusable: true, createdAt: t, updatedAt: t },
  ];

  const kits = [
    {
      id: "k1", name: "Kit Mickey Premium", theme: "Mickey", type: "decoracao" as const,
      description: "Decoração completa montada no local, tema Mickey.", price: 850,
      items: [
        { componentId: "c1", quantity: 1 },
        { componentId: "c2", quantity: 3 },
        { componentId: "c3", quantity: 1 },
        { componentId: "c5", quantity: 2 },
        { componentId: "c8", quantity: 1 },
      ],
      imageColor: "#fce7f3", active: true, createdAt: t, updatedAt: t,
    },
    {
      id: "k2", name: "Kit Pegue e Monte Batman", theme: "Batman", type: "pegue_monte" as const,
      description: "Kit montado para o cliente retirar e montar em casa.", price: 320,
      items: [
        { componentId: "c2", quantity: 2 },
        { componentId: "c5", quantity: 1 },
        { componentId: "c9", quantity: 1 },
      ],
      imageColor: "#e0e7ff", active: true, createdAt: t, updatedAt: t,
    },
    {
      id: "k3", name: "Kit Jardim Encantado", theme: "Jardim", type: "decoracao" as const,
      description: "Decoração delicada com tons pastéis e flores.", price: 980,
      items: [
        { componentId: "c1", quantity: 1 },
        { componentId: "c3", quantity: 1 },
        { componentId: "c4", quantity: 2 },
        { componentId: "c7", quantity: 2 },
        { componentId: "c10", quantity: 1 },
      ],
      imageColor: "#dcfce7", active: true, createdAt: t, updatedAt: t,
    },
    {
      id: "k4", name: "Locação Painel + Cilindros", theme: "Personalizado", type: "locacao" as const,
      description: "Locação pura de estrutura por 24h.", price: 280,
      items: [
        { componentId: "c1", quantity: 1 },
        { componentId: "c2", quantity: 3 },
      ],
      imageColor: "#fef3c7", active: true, createdAt: t, updatedAt: t,
    },
  ];

  const sales = [
    { id: "s1", customerName: "Mariana Silva", customerPhone: "(11) 98888-1111", kitId: "k3", kitNameSnapshot: "Kit Jardim Encantado", eventDate: t + 2 * day, totalPrice: 980, paidAmount: 490, status: "confirmado" as const, source: "whatsapp" as const, createdAt: t - 3 * day },
    { id: "s2", customerName: "Pedro Souza", customerPhone: "(11) 97777-2222", kitId: "k2", kitNameSnapshot: "Kit Pegue e Monte Batman", eventDate: t + 4 * day, totalPrice: 320, paidAmount: 320, status: "confirmado" as const, source: "manual" as const, createdAt: t - 5 * day },
    { id: "s3", customerName: "Camila Rocha", customerPhone: "(11) 96666-3333", kitId: "k1", kitNameSnapshot: "Kit Mickey Premium", eventDate: t - 6 * day, totalPrice: 850, paidAmount: 850, status: "concluido" as const, source: "manual" as const, createdAt: t - 12 * day },
    { id: "s4", customerName: "Aline Mendes", customerPhone: "(11) 95555-4444", kitId: "k4", kitNameSnapshot: "Locação Painel + Cilindros", eventDate: t - 2 * day, totalPrice: 280, paidAmount: 280, status: "concluido" as const, source: "automacao" as const, createdAt: t - 8 * day },
    { id: "s5", customerName: "Júlia Pires", customerPhone: "(11) 94444-5555", kitId: "k1", kitNameSnapshot: "Kit Mickey Premium", eventDate: t - 15 * day, totalPrice: 850, paidAmount: 850, status: "concluido" as const, source: "whatsapp" as const, createdAt: t - 20 * day },
  ];

  const costs = [
    { id: "co1", description: "Aluguel do galpão", kind: "profissional" as const, category: "Espaço", amount: 1800, frequency: "mensal" as const, date: t - 5 * day, createdAt: t - 5 * day },
    { id: "co2", description: "Compra balões fornecedor", kind: "profissional" as const, category: "Estoque", amount: 420, frequency: "unico" as const, date: t - 7 * day, createdAt: t - 7 * day },
    { id: "co3", description: "Mercado", kind: "pessoal" as const, category: "Casa", amount: 950, frequency: "mensal" as const, date: t - 4 * day, createdAt: t - 4 * day },
    { id: "co4", description: "Anúncios Instagram", kind: "profissional" as const, category: "Marketing", amount: 250, frequency: "mensal" as const, date: t - 2 * day, createdAt: t - 2 * day },
  ];

  return {
    profile: null,
    settings: {
      notifyLowStock: true,
      notifyWeeklyReport: true,
      currency: "BRL",
      lowStockMultiplier: 1,
    },
    components,
    kits,
    sales,
    costs,
  };
}
