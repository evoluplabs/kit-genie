// Entidades de domínio — mantidas independentes de qualquer backend.

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
  color?: string;            // cor nomeada: "rosa", "azul", "vermelho", etc.
  variation?: string;        // "pequeno" | "médio" | "grande" | "alta" | "baixa"
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
  description?: string;
}

export interface Kit {
  id: ID;
  name: string;              // ex: "Kit Mickey Premium"
  theme: string;             // ex: "Mickey", "Batman", "Personalizado"
  type: "decoracao" | "pegue_monte" | "locacao";
  description?: string;
  price: number;             // preço base
  items: KitItem[];          // BOM base
  tiers?: KitTier[];         // variações Bronze/Prata/Ouro
  imageColor?: string;
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
  price: number;
  address?: string;          // endereço de entrega/coleta
}

export type SaleStatus = "agendado" | "confirmado" | "entregue" | "concluido" | "cancelado";

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
  kitNameSnapshot: string;
  kitTier?: KitTierName;
  extraItems?: SaleExtraItem[];
  eventDate: number;
  returnDate?: number;
  freight?: FreightOption;
  totalPrice: number;
  paidAmount: number;
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
  cnpj?: string;
  address?: string;
  themes: string[];
  workTypes: Array<"decoracao" | "pegue_monte" | "locacao">;
  onboardingCompleted: boolean;
  createdAt: number;
}

export interface Settings {
  notifyLowStock: boolean;
  notifyWeeklyReport: boolean;
  weeklyReportEmail?: string;
  currency: "BRL";
  lowStockMultiplier: number;
  goalAmount?: number;
  goalGrowthPct?: number;
}

export interface DbSchema {
  profile: Profile | null;
  settings: Settings;
  components: Component[];
  kits: Kit[];
  sales: Sale[];
  costs: CostEntry[];
}
