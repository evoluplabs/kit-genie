// Entidades de domínio — mantidas independentes de qualquer backend.
// Para migrar para Firebase: traduza esses tipos em coleções Firestore.

export type ID = string;

export type Unit = "un" | "m" | "kg" | "rolo" | "pct" | "par";

export interface Component {
  id: ID;
  name: string;
  category: string;          // ex: "Balão", "Painel", "Mesa", "Decor"
  unit: Unit;
  stock: number;             // quantidade atual em estoque
  minStock: number;          // alerta de estoque baixo
  unitCost: number;          // custo médio por unidade
  reusable: boolean;         // material reutilizável (locação) vs consumível
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface KitItem {
  componentId: ID;
  quantity: number;          // qtd usada do componente no kit
}

/* ── Tiers de kit (Bronze / Prata / Ouro) ───────────────────────────────── */

export type KitTierName = "bronze" | "prata" | "ouro";

export interface KitTier {
  name: KitTierName;
  price: number;
  items: KitItem[];          // BOM específico do tier
  description?: string;      // ex: "Itens básicos", "Mais balões e painel", "Kit completo premium"
}

export interface Kit {
  id: ID;
  name: string;              // ex: "Kit Mickey Premium"
  theme: string;             // ex: "Mickey", "Batman", "Personalizado"
  type: "decoracao" | "pegue_monte" | "locacao";
  description?: string;
  price: number;             // preço base (= tier bronze quando tiers habilitados)
  items: KitItem[];          // BOM base (= tier bronze quando tiers habilitados)
  tiers?: KitTier[];         // quando presente, kit tem variações Bronze/Prata/Ouro
  imageColor?: string;       // cor decorativa do card (hex)
  imageUrl?: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

/* ── Frete opcional por venda ───────────────────────────────── */
export type FreightDirection = "ida" | "volta" | "ida_volta";

export interface FreightOption {
  enabled: boolean;
  direction: FreightDirection;
  price: number;              // valor cobrado pelo frete
  address?: string;           // endereço de entrega/coleta
}

export type SaleStatus = "agendado" | "confirmado" | "entregue" | "concluido" | "cancelado";

/* ── Acessório extra adicionado a uma venda específica ──────────────────── */

export interface SaleExtraItem {
  componentId: ID;
  name: string;              // snapshot do nome do componente
  quantity: number;
  unitPrice: number;         // valor cobrado por unidade nessa venda
}

export interface Sale {
  id: ID;
  customerName: string;
  customerPhone?: string;
  kitId: ID;
  kitNameSnapshot: string;   // snapshot p/ histórico mesmo se o kit mudar
  kitTier?: KitTierName;     // tier selecionado (bronze/prata/ouro), quando aplicável
  extraItems?: SaleExtraItem[]; // acessórios extras solicitados além do kit
  eventDate: number;         // data do evento
  returnDate?: number;       // data combinada de devolução
  freight?: FreightOption;   // frete opcional por venda
  totalPrice: number;        // total cobrado (inclui extras)
  paidAmount: number;        // valor do sinal pago no agendamento
  status: SaleStatus;
  notes?: string;
  source: "manual" | "whatsapp" | "automacao";
  createdAt: number;
}

export type CostKind = "pessoal" | "profissional";
export type CostFrequency = "unico" | "mensal" | "anual";

export interface CostEntry {
  id: ID;
  description: string;
  kind: CostKind;
  category: string;          // ex: "Aluguel", "Marketing", "Mercado"
  amount: number;
  frequency: CostFrequency;
  date: number;
  createdAt: number;
}

export interface Profile {
  id: ID;
  businessName: string;
  ownerName: string;
  phone?: string;
  email?: string;
  cnpj?: string;             // CNPJ ou CPF para constar no contrato
  address?: string;          // endereço para constar no contrato
  themes: string[];          // temas com os quais a decoradora trabalha
  workTypes: Array<"decoracao" | "pegue_monte" | "locacao">;
  onboardingCompleted: boolean;
  createdAt: number;
}

export interface Settings {
  notifyLowStock: boolean;
  notifyWeeklyReport: boolean;
  weeklyReportEmail?: string;
  currency: "BRL";
  lowStockMultiplier: number; // alerta quando stock <= minStock * multiplier
  goalAmount?: number;        // meta de faturamento mensal (valor fixo)
  goalGrowthPct?: number;     // meta de crescimento % sobre mês anterior
}

export interface DbSchema {
  profile: Profile | null;
  settings: Settings;
  components: Component[];
  kits: Kit[];
  sales: Sale[];
  costs: CostEntry[];
}
