// Repositórios — única porta de entrada para dados.
// Leitura: síncrona do cache em memória (atualizado no login e no refresh manual).
// Escrita: atualiza cache imediatamente + persiste no Firestore em background.

import type {
  Component, CostEntry, DbSchema, Kit, KitTierName, Profile, Sale, Settings,
} from "./types";
import {
  loadDb, notify, subscribe, refreshDb,
  fsSetComponent, fsDeleteComponent,
  fsSetKit, fsDeleteKit,
  fsSetSale, fsUpdateSaleStatus, fsDeleteSale,
  fsSetCost, fsDeleteCost,
  fsSetProfile, fsSetSettings,
} from "./firestore";

export { subscribe } from "./firestore";
export type * from "./types";

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

function read(): DbSchema { return loadDb(); }

function mutate(mut: (db: DbSchema) => void): DbSchema {
  const db = loadDb();
  mut(db);
  notify();
  return db;
}

// ---------- Profile ----------
export const profileRepo = {
  get(): Profile | null { return read().profile; },
  upsert(input: Omit<Profile, "id" | "createdAt"> & { id?: string }): Profile {
    const existing = read().profile;
    const profile: Profile = {
      id: existing?.id ?? input.id ?? uid(),
      createdAt: existing?.createdAt ?? Date.now(),
      ...input,
    };
    mutate((db) => { db.profile = profile; });
    fsSetProfile(profile).catch((e) => console.error("[db] profile sync", e));
    return profile;
  },
  clear(): void {
    mutate((db) => { db.profile = null; });
  },
};

// ---------- Settings ----------
export const settingsRepo = {
  get(): Settings { return read().settings; },
  update(patch: Partial<Settings>): Settings {
    let next!: Settings;
    mutate((db) => { db.settings = { ...db.settings, ...patch }; next = db.settings; });
    fsSetSettings(next).catch((e) => console.error("[db] settings sync", e));
    return next;
  },
};

// ---------- Components ----------
export const componentsRepo = {
  list(): Component[] { return read().components; },
  get(id: string): Component | undefined { return read().components.find(c => c.id === id); },
  create(input: Omit<Component, "id" | "createdAt" | "updatedAt">): Component {
    const c: Component = { ...input, id: uid(), createdAt: Date.now(), updatedAt: Date.now() };
    mutate((db) => { db.components.push(c); });
    fsSetComponent(c).catch((e) => console.error("[db] component create sync", e));
    return c;
  },
  update(id: string, patch: Partial<Component>): void {
    let updated!: Component;
    mutate((db) => {
      const i = db.components.findIndex(c => c.id === id);
      if (i >= 0) {
        db.components[i] = { ...db.components[i], ...patch, updatedAt: Date.now() };
        updated = db.components[i];
      }
    });
    if (updated) fsSetComponent(updated).catch((e) => console.error("[db] component update sync", e));
  },
  remove(id: string): void {
    mutate((db) => {
      db.components = db.components.filter(c => c.id !== id);
      db.kits.forEach(k => { k.items = (k.items ?? []).filter(it => it.componentId !== id); });
    });
    fsDeleteComponent(id).catch((e) => console.error("[db] component delete sync", e));
    read().kits
      .filter(k => (k.items ?? []).some(it => it.componentId !== id))
      .forEach(k => fsSetKit(k).catch((e) => console.error("[db] kit update after component delete", e)));
  },
  adjustStock(id: string, delta: number): void {
    let updated!: Component;
    mutate((db) => {
      const c = db.components.find(c => c.id === id);
      if (c) { c.stock = Math.max(0, c.stock + delta); c.updatedAt = Date.now(); updated = c; }
    });
    if (updated) fsSetComponent(updated).catch((e) => console.error("[db] stock sync", e));
  },
};

// ---------- Kits ----------
export const kitsRepo = {
  list(): Kit[] { return read().kits; },
  get(id: string): Kit | undefined { return read().kits.find(k => k.id === id); },
  create(input: Omit<Kit, "id" | "createdAt" | "updatedAt">): Kit {
    const k: Kit = { ...input, id: uid(), createdAt: Date.now(), updatedAt: Date.now() };
    mutate((db) => { db.kits.push(k); });
    fsSetKit(k).catch((e) => console.error("[db] kit create sync", e));
    return k;
  },
  update(id: string, patch: Partial<Kit>): void {
    let updated!: Kit;
    mutate((db) => {
      const i = db.kits.findIndex(k => k.id === id);
      if (i >= 0) {
        db.kits[i] = { ...db.kits[i], ...patch, updatedAt: Date.now() };
        updated = db.kits[i];
      }
    });
    if (updated) fsSetKit(updated).catch((e) => console.error("[db] kit update sync", e));
  },
  remove(id: string): void {
    mutate((db) => { db.kits = db.kits.filter(k => k.id !== id); });
    fsDeleteKit(id).catch((e) => console.error("[db] kit delete sync", e));
  },

  availability(
    id: string,
    eventDate?: number,
    tierName?: KitTierName,
  ): {
    available: boolean;
    missing: Array<{ componentId: string; name: string; need: number; have: number }>;
  } {
    const db = read();
    const kit = db.kits.find(k => k.id === id);
    if (!kit) return { available: false, missing: [] };

    const tierItems = tierName
      ? (kit.tiers?.find(t => t.name === tierName)?.items ?? kit.items ?? [])
      : (kit.items ?? []);

    const missing: Array<{ componentId: string; name: string; need: number; have: number }> = [];

    const committedOnDate = new Map<string, number>();
    if (eventDate) {
      const dayStart = startOfDay(eventDate);
      const dayEnd = dayStart + 86400000;
      db.sales
        .filter(s => {
          if (s.status === "cancelado") return false;
          const saleStart = startOfDay(s.eventDate);
          const saleEnd   = startOfDay(s.returnDate ?? s.eventDate) + 86400000;
          return dayStart < saleEnd && dayEnd > saleStart;
        })
        .forEach(s => {
          const saleKit = db.kits.find(k => k.id === s.kitId);
          if (saleKit) {
            const saleTierItems = s.kitTier
              ? (saleKit.tiers?.find(t => t.name === s.kitTier)?.items ?? saleKit.items ?? [])
              : (saleKit.items ?? []);
            saleTierItems.forEach(it => {
              const comp = db.components.find(c => c.id === it.componentId);
              if (comp?.reusable) {
                committedOnDate.set(it.componentId, (committedOnDate.get(it.componentId) ?? 0) + it.quantity);
              }
            });
          }
        });
    }

    for (const it of tierItems) {
      const c = db.components.find(x => x.id === it.componentId);
      if (!c) {
        missing.push({ componentId: it.componentId, name: "Componente removido", need: it.quantity, have: 0 });
        continue;
      }
      if (!c.reusable) {
        if (c.stock < it.quantity) {
          missing.push({ componentId: c.id, name: c.name, need: it.quantity, have: c.stock });
        }
      } else if (eventDate) {
        const committed = committedOnDate.get(c.id) ?? 0;
        if (c.stock < it.quantity + committed) {
          missing.push({ componentId: c.id, name: c.name, need: it.quantity + committed, have: c.stock });
        }
      }
    }
    return { available: missing.length === 0, missing };
  },
};

// ---------- Sales ----------
export const salesRepo = {
  list(): Sale[] { return read().sales.slice().sort((a, b) => b.eventDate - a.eventDate); },
  get(id: string): Sale | undefined { return read().sales.find(s => s.id === id); },

  update(id: string, patch: Partial<Omit<Sale, "id" | "createdAt" | "kitId" | "kitNameSnapshot">>): void {
    let updated!: Sale;
    mutate((db) => {
      const i = db.sales.findIndex(s => s.id === id);
      if (i >= 0) {
        db.sales[i] = { ...db.sales[i], ...patch };
        updated = db.sales[i];
      }
    });
    if (updated) fsSetSale(updated).catch((e) => console.error("[db] sale update sync", e));
  },

  create(input: Omit<Sale, "id" | "createdAt" | "kitNameSnapshot"> & { kitNameSnapshot?: string }): Sale {
    const db = read();
    const kit = db.kits.find(k => k.id === input.kitId);
    if (!kit) throw new Error("Kit não encontrado");

    const effectiveItems = input.kitTier
      ? (kit.tiers?.find(t => t.name === input.kitTier)?.items ?? kit.items ?? [])
      : (kit.items ?? []);

    const sale: Sale = {
      ...input,
      id: uid(),
      kitNameSnapshot: input.kitNameSnapshot ?? kit.name,
      createdAt: Date.now(),
    };

    const updatedComponents: Component[] = [];
    mutate((db) => {
      db.sales.push(sale);

      for (const it of effectiveItems) {
        const c = db.components.find(x => x.id === it.componentId);
        if (c && !c.reusable) {
          c.stock = Math.max(0, c.stock - it.quantity);
          c.updatedAt = Date.now();
          updatedComponents.push(c);
        }
      }

      if (input.extraItems?.length) {
        for (const extra of input.extraItems) {
          const c = db.components.find(x => x.id === extra.componentId);
          if (c && !c.reusable) {
            c.stock = Math.max(0, c.stock - extra.quantity);
            c.updatedAt = Date.now();
            if (!updatedComponents.find(x => x.id === c.id)) updatedComponents.push(c);
          }
        }
      }
    });

    fsSetSale(sale).catch((e) => console.error("[db] sale create sync", e));
    updatedComponents.forEach(c => fsSetComponent(c).catch((e) => console.error("[db] stock debit sync", e)));
    return sale;
  },

  updateStatus(id: string, status: Sale["status"]): void {
    const sale = read().sales.find(s => s.id === id);
    if (!sale) return;
    const prevStatus = sale.status;
    const updatedComponents: Component[] = [];

    mutate((db) => {
      const s = db.sales.find(s => s.id === id);
      if (!s) return;
      s.status = status;

      const kit = db.kits.find(k => k.id === s.kitId);
      if (!kit) return;

      const effectiveItems = s.kitTier
        ? (kit.tiers?.find(t => t.name === s.kitTier)?.items ?? kit.items ?? [])
        : (kit.items ?? []);

      const restoreStock = (componentId: string, qty: number) => {
        const c = db.components.find(x => x.id === componentId);
        if (c && !c.reusable) {
          c.stock += qty;
          c.updatedAt = Date.now();
          if (!updatedComponents.find(x => x.id === c.id)) updatedComponents.push({ ...c });
        }
      };
      const debitStock = (componentId: string, qty: number) => {
        const c = db.components.find(x => x.id === componentId);
        if (c && !c.reusable) {
          c.stock = Math.max(0, c.stock - qty);
          c.updatedAt = Date.now();
          if (!updatedComponents.find(x => x.id === c.id)) updatedComponents.push({ ...c });
        }
      };

      if (status === "cancelado" && prevStatus !== "cancelado") {
        for (const it of effectiveItems) restoreStock(it.componentId, it.quantity);
        for (const extra of s.extraItems ?? []) restoreStock(extra.componentId, extra.quantity);
      } else if (prevStatus === "cancelado" && status !== "cancelado") {
        for (const it of effectiveItems) debitStock(it.componentId, it.quantity);
        for (const extra of s.extraItems ?? []) debitStock(extra.componentId, extra.quantity);
      }
    });

    fsUpdateSaleStatus(id, status).catch((e) => console.error("[db] sale status sync", e));
    updatedComponents.forEach(c => fsSetComponent(c).catch((e) => console.error("[db] stock sync on status change", e)));
  },

  remove(id: string): void {
    const sale = read().sales.find(s => s.id === id);
    const updatedComponents: Component[] = [];

    mutate((db) => {
      db.sales = db.sales.filter(s => s.id !== id);
      if (sale && sale.status !== "cancelado") {
        const kit = db.kits.find(k => k.id === sale.kitId);
        if (kit) {
          const effectiveItems = sale.kitTier
            ? (kit.tiers?.find(t => t.name === sale.kitTier)?.items ?? kit.items ?? [])
            : (kit.items ?? []);

          for (const it of effectiveItems) {
            const c = db.components.find(x => x.id === it.componentId);
            if (c && !c.reusable) {
              c.stock += it.quantity;
              c.updatedAt = Date.now();
              updatedComponents.push(c);
            }
          }
          for (const extra of sale.extraItems ?? []) {
            const c = db.components.find(x => x.id === extra.componentId);
            if (c && !c.reusable) {
              c.stock += extra.quantity;
              c.updatedAt = Date.now();
              if (!updatedComponents.find(x => x.id === c.id)) updatedComponents.push(c);
            }
          }
        }
      }
    });

    fsDeleteSale(id).catch((e) => console.error("[db] sale delete sync", e));
    updatedComponents.forEach(c => fsSetComponent(c).catch((e) => console.error("[db] stock restore on delete sync", e)));
  },
};

// ---------- Costs ----------
export const costsRepo = {
  list(): CostEntry[] { return read().costs.slice().sort((a, b) => b.date - a.date); },
  create(input: Omit<CostEntry, "id" | "createdAt">): CostEntry {
    const c: CostEntry = { ...input, id: uid(), createdAt: Date.now() };
    mutate((db) => { db.costs.push(c); });
    fsSetCost(c).catch((e) => console.error("[db] cost create sync", e));
    return c;
  },
  update(id: string, patch: Partial<Omit<CostEntry, "id" | "createdAt">>): void {
    let updated!: CostEntry;
    mutate((db) => {
      const i = db.costs.findIndex(c => c.id === id);
      if (i >= 0) {
        db.costs[i] = { ...db.costs[i], ...patch };
        updated = db.costs[i];
      }
    });
    if (updated) fsSetCost(updated).catch((e) => console.error("[db] cost update sync", e));
  },
  remove(id: string): void {
    mutate((db) => { db.costs = db.costs.filter(c => c.id !== id); });
    fsDeleteCost(id).catch((e) => console.error("[db] cost delete sync", e));
  },
};

// ---------- Aggregations / Inteligência ----------
export const analytics = {
  monthRevenue(): number {
    const start = startOfMonth();
    return salesRepo.list()
      .filter(s => s.eventDate >= start && s.status !== "cancelado")
      .reduce((acc, s) => acc + s.totalPrice, 0);
  },
  prevMonthRevenue(): number {
    const start = startOfMonth(-1);
    const end = startOfMonth();
    return salesRepo.list()
      .filter(s => s.eventDate >= start && s.eventDate < end && s.status !== "cancelado")
      .reduce((acc, s) => acc + s.totalPrice, 0);
  },
  monthSalesCount(): number {
    const start = startOfMonth();
    return salesRepo.list().filter(s => s.eventDate >= start && s.status !== "cancelado").length;
  },
  monthCosts(): number {
    const start = startOfMonth();
    return costsRepo.list()
      .filter(c => c.date >= start && c.kind === "profissional")
      .reduce((acc, c) => acc + c.amount, 0);
  },
  monthPersonalCosts(): number {
    const start = startOfMonth();
    return costsRepo.list()
      .filter(c => c.date >= start && c.kind === "pessoal")
      .reduce((acc, c) => acc + c.amount, 0);
  },
  monthProfit(): number {
    return analytics.monthRevenue() - analytics.monthCosts();
  },
  lowStock(): Component[] {
    const m = settingsRepo.get().lowStockMultiplier;
    return componentsRepo.list().filter(c => c.stock <= c.minStock * m);
  },
  topKits(limit = 5): Array<{ kit: Kit | undefined; count: number; revenue: number }> {
    const map = new Map<string, { count: number; revenue: number }>();
    for (const s of salesRepo.list()) {
      if (s.status === "cancelado") continue;
      const cur = map.get(s.kitId) ?? { count: 0, revenue: 0 };
      cur.count += 1;
      cur.revenue += s.totalPrice;
      map.set(s.kitId, cur);
    }
    return Array.from(map.entries())
      .map(([kitId, v]) => ({ kit: kitsRepo.get(kitId), ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  },
  upcomingEvents(limit = 5): Sale[] {
    const now = Date.now();
    return salesRepo.list()
      .filter(s => s.eventDate >= now && s.status !== "cancelado")
      .sort((a, b) => a.eventDate - b.eventDate)
      .slice(0, limit);
  },
  pendingReturns(days = 7): Sale[] {
    const now = Date.now();
    const limit = now + days * 86400000;
    return salesRepo.list()
      .filter(s =>
        s.returnDate &&
        s.returnDate >= now &&
        s.returnDate <= limit &&
        s.status === "entregue",
      )
      .sort((a, b) => (a.returnDate ?? 0) - (b.returnDate ?? 0));
  },
  overdueReturns(): Sale[] {
    const now = Date.now();
    return salesRepo.list()
      .filter(s =>
        s.returnDate &&
        s.returnDate < now &&
        !["concluido", "cancelado"].includes(s.status),
      )
      .sort((a, b) => (a.returnDate ?? 0) - (b.returnDate ?? 0));
  },
  componentUsage(componentId: string): { kits: Kit[] } {
    return { kits: kitsRepo.list().filter(k => (k.items ?? []).some(it => it.componentId === componentId)) };
  },
};

function startOfMonth(offset = 0): number {
  const d = new Date();
  d.setMonth(d.getMonth() + offset, 1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export const dbSubscribe = subscribe;
export const dbRefresh = refreshDb;
export const dbReset = () => read();
