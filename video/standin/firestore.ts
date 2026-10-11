// SUBSTITUTO SÓ PARA GRAVAR O VÍDEO — não faz parte do produto.
// Copiado por cima de src/services/db/firestore.ts na cópia usada para gravar.
// Mantém os mesmos nomes exportados; os dados vêm de demo-data.ts e as "gravações"
// ficam só na memória (a tela continua funcionando porque os repos alteram o cache).
import type { Component, Kit, Sale, CostEntry, Profile, Settings, DbSchema } from "./types";
import { demoData } from "./demo-data";

let cache: DbSchema = demoData();
const listeners = new Set<() => void>();

export function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}
export function notify(): void {
  listeners.forEach((l) => l());
}
export function loadDb(): DbSchema {
  return cache;
}
export async function initUserDb(_userId: string): Promise<void> {
  cache = demoData();
  notify();
}
export function teardownUserDb(): void {}
export async function refreshDb(): Promise<void> {}

export async function fsSetComponent(_c: Component): Promise<void> {}
export async function fsDeleteComponent(_id: string): Promise<void> {}
export async function fsSetKit(_k: Kit): Promise<void> {}
export async function fsDeleteKit(_id: string): Promise<void> {}
export async function fsSetSale(_s: Sale): Promise<void> {}
export async function fsUpdateSaleStatus(_id: string, _status: Sale["status"]): Promise<void> {}
export async function fsDeleteSale(_id: string): Promise<void> {}
export async function fsSetCost(_c: CostEntry): Promise<void> {}
export async function fsDeleteCost(_id: string): Promise<void> {}
export async function fsSetProfile(_p: Profile): Promise<void> {}
export async function fsSetSettings(_s: Settings): Promise<void> {}
export async function fsSeedUser(_data: DbSchema): Promise<void> {}
