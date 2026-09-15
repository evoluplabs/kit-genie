// ============================================================
// Seed Firestore — popula users/{userId}/kits/ e components/
//
// Pré-requisito: Service Account do Firebase
//   Opção A (arquivo local):
//     1. Firebase Console → Configurações do projeto → Contas de serviço
//     2. Clique em "Gerar nova chave privada" → salve como serviceAccount.json
//        na raiz do projeto (já está no .gitignore)
//
//   Opção B (Codespace Secret):
//     Crie um secret chamado FIREBASE_SERVICE_ACCOUNT com o conteúdo JSON
//
// Como rodar:
//   npm run seed               (usa os IDs do catalog/config.order = "atelie")
//   npm run seed -- --slug=outro-slug
//   npm run seed -- --force    (sobrescreve kits existentes)
// ============================================================

import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// ── Carrega credencial ──────────────────────────────────────────────────────

function loadCredential(): ServiceAccount {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) as ServiceAccount;
  }
  const saPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ??
    resolve(root, "serviceAccount.json");
  if (!existsSync(saPath)) {
    console.error(`
❌  Service Account não encontrada.

   Opção A — arquivo local:
     1. Firebase Console → Configurações → Contas de Serviço
     2. Gerar nova chave privada → salve como:
        ${resolve(root, "serviceAccount.json")}

   Opção B — Codespace Secret:
     Nome: FIREBASE_SERVICE_ACCOUNT
     Valor: cole o conteúdo completo do JSON
`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(saPath, "utf-8")) as ServiceAccount;
}

initializeApp({ credential: cert(loadCredential()) });
const db = getFirestore();

// ── Dados ──────────────────────────────────────────────────────────────────

const now = Date.now();

const COMPONENTS = [
  { id: "c1",  name: "Painel Redondo Branco",      category: "Painel",    unit: "un",   stock: 4,  minStock: 2,  unitCost: 180, reusable: true,  createdAt: now, updatedAt: now },
  { id: "c2",  name: "Cilindro MDF Médio",          category: "Estrutura", unit: "un",   stock: 6,  minStock: 3,  unitCost: 90,  reusable: true,  createdAt: now, updatedAt: now },
  { id: "c3",  name: "Mesa Cavalete Branca",        category: "Móveis",    unit: "un",   stock: 4,  minStock: 2,  unitCost: 220, reusable: true,  createdAt: now, updatedAt: now },
  { id: "c4",  name: "Balão Látex Rosa Pastel G",   category: "Balão",     unit: "pct",  stock: 8,  minStock: 10, unitCost: 25,  reusable: false, createdAt: now, updatedAt: now },
  { id: "c5",  name: "Balão Chrome Dourado",        category: "Balão",     unit: "pct",  stock: 12, minStock: 6,  unitCost: 38,  reusable: false, createdAt: now, updatedAt: now },
  { id: "c6",  name: "Fita de Cetim Gold (rolo)",   category: "Decor",     unit: "rolo", stock: 2,  minStock: 4,  unitCost: 14,  reusable: false, createdAt: now, updatedAt: now },
  { id: "c7",  name: "Boleira Cerâmica Rosa M",     category: "Decor",     unit: "un",   stock: 3,  minStock: 2,  unitCost: 75,  reusable: true,  createdAt: now, updatedAt: now },
  { id: "c8",  name: "Tapete Vinílico Preto",       category: "Estrutura", unit: "un",   stock: 2,  minStock: 1,  unitCost: 160, reusable: true,  createdAt: now, updatedAt: now },
  { id: "c9",  name: "Topo de Bolo Personalizado",  category: "Decor",     unit: "un",   stock: 15, minStock: 5,  unitCost: 18,  reusable: false, createdAt: now, updatedAt: now },
  { id: "c10", name: "Toalha Veludo Rosa",          category: "Tecido",    unit: "un",   stock: 3,  minStock: 2,  unitCost: 95,  reusable: true,  createdAt: now, updatedAt: now },
  { id: "c11", name: "Painel Minnie Vermelho",      category: "Painel",    unit: "un",   stock: 3,  minStock: 1,  unitCost: 200, reusable: true,  createdAt: now, updatedAt: now },
  { id: "c12", name: "Balão Látex Vermelho/Branco", category: "Balão",     unit: "pct",  stock: 10, minStock: 5,  unitCost: 22,  reusable: false, createdAt: now, updatedAt: now },
  { id: "c13", name: "Painel Princesa Rosa",        category: "Painel",    unit: "un",   stock: 3,  minStock: 1,  unitCost: 200, reusable: true,  createdAt: now, updatedAt: now },
  { id: "c14", name: "Coroa Decorativa Dourada",    category: "Decor",     unit: "un",   stock: 5,  minStock: 2,  unitCost: 45,  reusable: true,  createdAt: now, updatedAt: now },
  { id: "c15", name: "Painel Batman Azul/Cinza",    category: "Painel",    unit: "un",   stock: 2,  minStock: 1,  unitCost: 190, reusable: true,  createdAt: now, updatedAt: now },
];

// IDs DEVEM casar com o campo `order` em users/{uid}/catalog/config
const KITS = [
  {
    id: "kit-princesas",
    name: "Kit Princesas",
    theme: "Princesa",
    type: "decoracao",
    description: "Decoração completa com tema Princesa, painel rosa e coroas douradas.",
    price: 890,
    items: [
      { componentId: "c13", quantity: 1 },
      { componentId: "c14", quantity: 2 },
      { componentId: "c4",  quantity: 2 },
      { componentId: "c9",  quantity: 1 },
    ],
    tiers: [
      { name: "bronze", price: 890,  description: "Painel + topo de bolo",         items: [{ componentId: "c13", quantity: 1 }, { componentId: "c9", quantity: 1 }] },
      { name: "prata",  price: 1290, description: "Bronze + coroas + balões rosa",  items: [{ componentId: "c13", quantity: 1 }, { componentId: "c14", quantity: 2 }, { componentId: "c4", quantity: 2 }, { componentId: "c9", quantity: 1 }] },
      { name: "ouro",   price: 1890, description: "Prata + toalha + coroas extras", items: [{ componentId: "c13", quantity: 1 }, { componentId: "c14", quantity: 3 }, { componentId: "c4", quantity: 3 }, { componentId: "c10", quantity: 1 }, { componentId: "c9", quantity: 1 }] },
    ],
    imageColor: "#fce7f3",
    active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "kit-mickey",
    name: "Kit Mickey",
    theme: "Mickey",
    type: "decoracao",
    description: "Decoração completa montada no local com tema Mickey Mouse.",
    price: 850,
    items: [
      { componentId: "c1", quantity: 1 },
      { componentId: "c2", quantity: 3 },
      { componentId: "c5", quantity: 2 },
      { componentId: "c8", quantity: 1 },
    ],
    tiers: [
      { name: "bronze", price: 850,  description: "Painel + cilindros + balões",          items: [{ componentId: "c1", quantity: 1 }, { componentId: "c2", quantity: 2 }, { componentId: "c5", quantity: 1 }] },
      { name: "prata",  price: 1250, description: "Bronze + mesa + tapete",               items: [{ componentId: "c1", quantity: 1 }, { componentId: "c2", quantity: 3 }, { componentId: "c3", quantity: 1 }, { componentId: "c5", quantity: 2 }, { componentId: "c8", quantity: 1 }] },
      { name: "ouro",   price: 1850, description: "Prata + topo de bolo + toalha rosa",   items: [{ componentId: "c1", quantity: 1 }, { componentId: "c2", quantity: 3 }, { componentId: "c3", quantity: 1 }, { componentId: "c5", quantity: 2 }, { componentId: "c8", quantity: 1 }, { componentId: "c9", quantity: 1 }, { componentId: "c10", quantity: 1 }] },
    ],
    imageColor: "#dbeafe",
    active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "kit-minnie",
    name: "Kit Minnie",
    theme: "Minnie",
    type: "decoracao",
    description: "Decoração montada no local com tema Minnie Mouse, tons vermelho e branco.",
    price: 870,
    items: [
      { componentId: "c11", quantity: 1 },
      { componentId: "c12", quantity: 2 },
      { componentId: "c3",  quantity: 1 },
      { componentId: "c9",  quantity: 1 },
    ],
    tiers: [
      { name: "bronze", price: 870,  description: "Painel + balões + topo",           items: [{ componentId: "c11", quantity: 1 }, { componentId: "c12", quantity: 1 }, { componentId: "c9", quantity: 1 }] },
      { name: "prata",  price: 1290, description: "Bronze + mesa + mais balões",      items: [{ componentId: "c11", quantity: 1 }, { componentId: "c12", quantity: 2 }, { componentId: "c3", quantity: 1 }, { componentId: "c9", quantity: 1 }] },
      { name: "ouro",   price: 1890, description: "Prata + cilindros + toalha rosa",  items: [{ componentId: "c11", quantity: 1 }, { componentId: "c12", quantity: 3 }, { componentId: "c2", quantity: 2 }, { componentId: "c3", quantity: 1 }, { componentId: "c10", quantity: 1 }, { componentId: "c9", quantity: 1 }] },
    ],
    imageColor: "#fee2e2",
    active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "kit-batman",
    name: "Kit Batman",
    theme: "Batman",
    type: "pegue_monte",
    description: "Kit montado para o cliente retirar e montar em casa.",
    price: 320,
    items: [
      { componentId: "c15", quantity: 1 },
      { componentId: "c5",  quantity: 1 },
      { componentId: "c9",  quantity: 1 },
    ],
    tiers: [
      { name: "bronze", price: 320, description: "Painel + balões dourados + topo",  items: [{ componentId: "c15", quantity: 1 }, { componentId: "c5", quantity: 1 }, { componentId: "c9", quantity: 1 }] },
      { name: "prata",  price: 520, description: "Bronze + cilindros MDF",           items: [{ componentId: "c15", quantity: 1 }, { componentId: "c2", quantity: 2 }, { componentId: "c5", quantity: 1 }, { componentId: "c9", quantity: 1 }] },
      { name: "ouro",   price: 790, description: "Prata + mesa + tapete",            items: [{ componentId: "c15", quantity: 1 }, { componentId: "c2", quantity: 2 }, { componentId: "c3", quantity: 1 }, { componentId: "c5", quantity: 2 }, { componentId: "c8", quantity: 1 }, { componentId: "c9", quantity: 1 }] },
    ],
    imageColor: "#e0e7ff",
    active: true,
    createdAt: now,
    updatedAt: now,
  },
];

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const slug = args.find((a) => a.startsWith("--slug="))?.split("=")[1] ?? "atelie";

  console.log(`\n🌱  Seed Firestore — slug: "${slug}"\n`);

  // 1. Resolver userId a partir do slug
  const slugSnap = await db.doc(`slugs/${slug}`).get();
  if (!slugSnap.exists) {
    console.error(`❌  Documento slugs/${slug} não encontrado no Firestore.`);
    console.error(`    Configure o catálogo no kit-genie primeiro:`);
    console.error(`    Configurações → Catálogo → definir o subdomínio como "${slug}".`);
    process.exit(1);
  }
  const userId = (slugSnap.data() as { userId: string }).userId;
  console.log(`✅  userId: ${userId}`);

  // 2. Verificar se kits já existem
  const kitsSnap = await db.collection(`users/${userId}/kits`).get();
  if (!kitsSnap.empty && !force) {
    console.log(`\n⚠️   A coleção users/${userId}/kits/ já tem ${kitsSnap.size} documento(s).`);
    console.log(`    Use --force para sobrescrever.\n`);
    process.exit(0);
  }

  // 3. Verificar se components já existem (só cria se vazio)
  const compsSnap = await db.collection(`users/${userId}/components`).get();
  const seedComponents = compsSnap.empty || force;

  // 4. Escrever em batch (max 500 por batch — estamos bem abaixo)
  const batch = db.batch();

  if (seedComponents) {
    for (const c of COMPONENTS) {
      batch.set(db.doc(`users/${userId}/components/${c.id}`), c);
    }
    console.log(`📦  Agendando ${COMPONENTS.length} componentes...`);
  } else {
    console.log(`ℹ️   Componentes já existem — pulando (use --force para sobrescrever).`);
  }

  for (const k of KITS) {
    batch.set(db.doc(`users/${userId}/kits/${k.id}`), k);
  }
  console.log(`🎁  Agendando ${KITS.length} kits: ${KITS.map((k) => k.id).join(", ")}`);

  await batch.commit();
  console.log(`\n✅  Batch gravado com sucesso!`);

  // 5. Garantir que catalog/config.order contém todos os IDs
  const configRef = db.doc(`users/${userId}/catalog/config`);
  const configSnap = await configRef.get();
  if (configSnap.exists) {
    const currentOrder: string[] = (configSnap.data()?.order as string[]) ?? [];
    const missing = KITS.map((k) => k.id).filter((id) => !currentOrder.includes(id));
    if (missing.length > 0) {
      await configRef.update({ order: [...currentOrder, ...missing] });
      console.log(`✅  catalog/config.order atualizado com: ${missing.join(", ")}`);
    } else {
      console.log(`✅  catalog/config.order já contém todos os IDs.`);
    }
  } else {
    console.log(`ℹ️   catalog/config não existe — crie o catálogo no kit-genie para configurar o tema.`);
  }

  console.log(`\n🎉  Seed concluído! Abra o kit-genie para ver os kits.\n`);
  process.exit(0);
}

main().catch((err: Error) => {
  console.error("\n❌  Erro:", err.message);
  process.exit(1);
});
