// Entidades de domínio — mantidas independentes de qualquer backend.

export type ID = string;

export type Unit = "un" | "m" | "kg" | "rolo" | "pct" | "par";

export interface Component {
  id: ID;
  name: string;
  category: string;
  unit: Unit;
  stock: number;
  minStock: number;
  unitCost: number;
  reusable: boolean;
  color?: string;
  variation?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface KitItem {
  componentId: ID;
  quantity: number;
}

export type KitTierName = "bronze" | "prata" | "ouro";

export interface KitTier {
  name: KitTierName;
  price: number;
  items: KitItem[];
  description?: string;
}

export interface Kit {
  id: ID;
  name: string;
  theme: string;
  type: "decoracao" | "pegue_monte" | "locacao";
  description?: string;
  price: number;
  items: KitItem[];
  tiers?: KitTier[];
  imageColor?: string;
  imageUrl?: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export type FreightDirection = "ida" | "volta" | "ida_volta";

export interface FreightOption {
  enabled: boolean;
  direction: FreightDirection;
  price: number;
  address?: string;
}

export type SaleStatus = "agendado" | "confirmado" | "entregue" | "concluido" | "cancelado";

export interface SaleExtraItem {
  componentId: ID;
  name: string;
  quantity: number;
  unitPrice: number;
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
  eventPhoto?: string;         // foto registrada após o evento
  source: "manual" | "whatsapp" | "automacao";
  createdAt: number;
}

export type CostKind = "pessoal" | "profissional";
export type CostFrequency = "unico" | "mensal" | "anual";

export interface CostEntry {
  id: ID;
  description: string;
  kind: CostKind;
  category: string;
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
