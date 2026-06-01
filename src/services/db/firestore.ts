// Camada de sincronização com Firestore.
// Mantém cache em memória para que os repos continuem síncronos.
// Escrita vai para Firestore em background; onSnapshot atualiza o cache.

import {
  collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc,
  getDocs, getDoc, writeBatch, type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Component, Kit, Sale, CostEntry, Profile, Settings, DbSchema } from "./types";

// ── Cache em memória ─────────────────────────────────────────────────────────

let cache: DbSchema = defaultSchema();
let currentUserId: string | null = null;
let unsubscribers: Unsubscribe[] = [];

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribe(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function notify(): void {
  listeners.forEach((l) => l());
}

export function loadDb(): DbSchema {
  return cache;
}

// ── Inicialização por usuário ────────────────────────────────────────────────

export async function initUserDb(userId: string): Promise<void> {
  if (currentUserId === userId) return;

  // Encerra listeners do usuário anterior
  unsubscribers.forEach((u) => u());
  unsubscribers = [];
  currentUserId = userId;
  cache = defaultSchema();

  // Carrega todos os dados uma vez para evitar flash de tela vazia
  await loadAllOnce(userId);

  // Listeners em tempo real — mantêm o cache atualizado
  unsubscribers.push(
    onSnapshot(collection(db, "users", userId, "components"), (snap) => {
      cache.components = snap.docs.map((d) => d.data() as Component);
      notify();
    }),
    onSnapshot(collection(db, "users", userId, "kits"), (snap) => {
      cache.kits = snap.docs.map((d) => d.data() as Kit);
      notify();
    }),
    onSnapshot(collection(db, "users", userId, "sales"), (snap) => {
      cache.sales = snap.docs.map((d) => d.data() as Sale);
      notify();
    }),
    onSnapshot(collection(db, "users", userId, "costs"), (snap) => {
      cache.costs = snap.docs.map((d) => d.data() as CostEntry);
      notify();
    }),
    onSnapshot(doc(db, "users", userId, "meta", "profile"), (snap) => {
      cache.profile = snap.exists() ? (snap.data() as Profile) : null;
      notify();
    }),
    onSnapshot(doc(db, "users", userId, "meta", "settings"), (snap) => {
      if (snap.exists()) cache.settings = snap.data() as Settings;
      notify();
    }),
  );
}

export function teardownUserDb(): void {
  unsubscribers.forEach((u) => u());
  unsubscribers = [];
  currentUserId = null;
  cache = defaultSchema();
  notify();
}

async function loadAllOnce(userId: string): Promise<void> {
  const [comps, kits, sales, costs, profileSnap, settingsSnap] = await Promise.all([
    getDocs(collection(db, "users", userId, "components")),
    getDocs(collection(db, "users", userId, "kits")),
    getDocs(collection(db, "users", userId, "sales")),
    getDocs(collection(db, "users", userId, "costs")),
    getDoc(doc(db, "users", userId, "meta", "profile")),
    getDoc(doc(db, "users", userId, "meta", "settings")),
  ]);
  cache.components = comps.docs.map((d) => d.data() as Component);
  cache.kits = kits.docs.map((d) => d.data() as Kit);
  cache.sales = sales.docs.map((d) => d.data() as Sale);
  cache.costs = costs.docs.map((d) => d.data() as CostEntry);
  if (profileSnap.exists()) cache.profile = profileSnap.data() as Profile;
  if (settingsSnap.exists()) cache.settings = settingsSnap.data() as Settings;
  notify();
}

// ── Operações de escrita Firestore ───────────────────────────────────────────

function userPath(): string {
  if (!currentUserId) throw new Error("[db] usuário não autenticado");
  return currentUserId;
}

export async function fsSetComponent(c: Component): Promise<void> {
  await setDoc(doc(db, "users", userPath(), "components", c.id), c);
}

export async function fsDeleteComponent(id: string): Promise<void> {
  await deleteDoc(doc(db, "users", userPath(), "components", id));
}

export async function fsSetKit(k: Kit): Promise<void> {
  await setDoc(doc(db, "users", userPath(), "kits", k.id), k);
}

export async function fsDeleteKit(id: string): Promise<void> {
  await deleteDoc(doc(db, "users", userPath(), "kits", id));
}

export async function fsSetSale(s: Sale): Promise<void> {
  await setDoc(doc(db, "users", userPath(), "sales", s.id), s);
}

export async function fsUpdateSaleStatus(id: string, status: Sale["status"]): Promise<void> {
  await updateDoc(doc(db, "users", userPath(), "sales", id), { status });
}

export async function fsDeleteSale(id: string): Promise<void> {
  await deleteDoc(doc(db, "users", userPath(), "sales", id));
}

export async function fsSetCost(c: CostEntry): Promise<void> {
  await setDoc(doc(db, "users", userPath(), "costs", c.id), c);
}

export async function fsDeleteCost(id: string): Promise<void> {
  await deleteDoc(doc(db, "users", userPath(), "costs", id));
}

export async function fsSetProfile(p: Profile): Promise<void> {
  await setDoc(doc(db, "users", userPath(), "meta", "profile"), p);
}

export async function fsSetSettings(s: Settings): Promise<void> {
  await setDoc(doc(db, "users", userPath(), "meta", "settings"), s);
}

// Seed inicial: popula Firestore com dados de exemplo (chamado no onboarding se DB vazio)
export async function fsSeedUser(data: DbSchema): Promise<void> {
  const uid = userPath();
  const batch = writeBatch(db);

  data.components.forEach((c) => batch.set(doc(db, "users", uid, "components", c.id), c));
  data.kits.forEach((k) => batch.set(doc(db, "users", uid, "kits", k.id), k));
  data.sales.forEach((s) => batch.set(doc(db, "users", uid, "sales", s.id), s));
  data.costs.forEach((co) => batch.set(doc(db, "users", uid, "costs", co.id), co));
  if (data.profile) batch.set(doc(db, "users", uid, "meta", "profile"), data.profile);
  batch.set(doc(db, "users", uid, "meta", "settings"), data.settings);

  await batch.commit();
}

// ── Schema padrão para usuário novo ─────────────────────────────────────────

function defaultSchema(): DbSchema {
  return {
    profile: null,
    settings: {
      notifyLowStock: true,
      notifyWeeklyReport: true,
      currency: "BRL",
      lowStockMultiplier: 1,
    },
    components: [],
    kits: [],
    sales: [],
    costs: [],
  };
}
