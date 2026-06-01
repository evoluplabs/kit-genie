import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Plus, Trash2, AlertCircle, CheckCircle2, Search, X,
  Upload, ImageIcon, Package, Tag, DollarSign, FileText,
  LayoutGrid, List, Edit2, Camera, Layers, ChevronDown,
} from "lucide-react";
import { useDb } from "@/hooks/use-db";
import {
  kitsRepo, componentsRepo,
  type Kit, type KitItem, type KitTier, type KitTierName,
} from "@/services/db";
import { brl, cls } from "@/lib/format";
import { PageHeader } from "@/components/app/app-shell";
import { toast } from "sonner";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useAuth } from "@/services/auth/auth-context";

export const Route = createFileRoute("/app/kits")({ component: KitsPage });

/* ── Constantes ──────────────────────────────────────────────── */

const TYPE_LABEL: Record<Kit["type"], string> = {
  decoracao:   "Decoração montada",
  pegue_monte: "Pegue e monte",
  locacao:     "Festa na mesa",
};

const TYPE_COLOR: Record<Kit["type"], string> = {
  decoracao:   "bg-pink-50 text-pink-700 ring-1 ring-pink-200",
  pegue_monte: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  locacao:     "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
};

const TIER_META: Record<KitTierName, { label: string; emoji: string; color: string; bg: string; ring: string }> = {
  bronze: { label: "Bronze", emoji: "🥉", color: "text-amber-700",  bg: "bg-amber-50",   ring: "ring-amber-300" },
  prata:  { label: "Prata",  emoji: "🥈", color: "text-slate-600",  bg: "bg-slate-100",  ring: "ring-slate-300" },
  ouro:   { label: "Ouro",   emoji: "🥇", color: "text-yellow-700", bg: "bg-yellow-50",  ring: "ring-yellow-300" },
};

const TIER_NAMES: KitTierName[] = ["bronze", "prata", "ouro"];

const DEFAULT_TIERS: KitTier[] = [
  { name: "bronze", price: 0, items: [], description: "Itens essenciais" },
  { name: "prata",  price: 0, items: [], description: "Mais itens inclusos" },
  { name: "ouro",   price: 0, items: [], description: "Kit completo premium" },
];

/* ══════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════ */

function KitsPage() {
  const kits       = useDb(() => kitsRepo.list());
  const components = useDb(() => componentsRepo.list());
  const [editing,  setEditing]  = React.useState<Kit | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [search,   setSearch]   = React.useState("");
  const [layout,   setLayout]   = React.useState<"grid" | "list">("grid");
  const [filter,   setFilter]   = React.useState<Kit["type"] | "todos">("todos");

  const filtered = React.useMemo(() => {
    let list = kits;
    if (filter !== "todos") list = list.filter(k => k.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(k =>
        k.name.toLowerCase().includes(q) ||
        k.theme.toLowerCase().includes(q) ||
        k.description?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [kits, filter, search]);

  const handleClose = () => {
    setCreating(false);
    setEditing(null);
    // Reseta filtro para garantir que o kit recém-criado/editado seja visível
    setFilter("todos");
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Kits & BOM"
        subtitle="Seus kits com lista de materiais — estoque debitado automaticamente"
        action={
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="size-4" /> Novo kit
          </button>
        }
      />

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, tema ou descrição…"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="flex gap-1 bg-card border border-border rounded-xl p-1">
          {(["todos", "pegue_monte", "locacao"] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={cls(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap",
                filter === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface",
              )}
            >
              {t === "todos" ? "Todos" : TYPE_LABEL[t]}
            </button>
          ))}
        </div>
        <div className="flex rounded-xl border border-border overflow-hidden bg-card">
          <button onClick={() => setLayout("grid")} className={cls("p-2.5 transition-colors", layout === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface")}>
            <LayoutGrid className="size-4" />
          </button>
          <button onClick={() => setLayout("list")} className={cls("p-2.5 transition-colors", layout === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface")}>
            <List className="size-4" />
          </button>
        </div>
      </div>

      {kits.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Mostrando <strong>{filtered.length}</strong> de <strong>{kits.length}</strong> kits
        </p>
      )}

      {filtered.length === 0 ? (
        <EmptyKits hasKits={kits.length > 0} onNew={() => setCreating(true)} />
      ) : layout === "grid" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(k => <KitCard key={k.id} kit={k} onClick={() => setEditing(k)} />)}
        </div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden bg-card">
          {filtered.map((k, i) => <KitRow key={k.id} kit={k} onClick={() => setEditing(k)} last={i === filtered.length - 1} />)}
        </div>
      )}

      {(creating || editing) && (
        <KitDialog
          kit={editing}
          components={components}
          onClose={handleClose}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   KIT CARD (grid)
══════════════════════════════════════════════════════════════ */

function KitCard({ kit: k, onClick }: { kit: Kit; onClick: () => void }) {
  const av = kitsRepo.availability(k.id);
  const hasTiers = (k.tiers?.length ?? 0) > 0;

  return (
    <button
      onClick={onClick}
      className="group text-left bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-md transition-all"
    >
      <div className="relative h-44 overflow-hidden">
        {k.imageUrl ? (
          <img src={k.imageUrl} alt={k.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: k.imageColor ?? "var(--primary-soft)" }}>
            <Package className="size-10 opacity-20" />
          </div>
        )}
        <span className={cls("absolute top-3 left-3 text-[10px] font-bold uppercase px-2 py-1 rounded-full backdrop-blur-sm", TYPE_COLOR[k.type])}>
          {TYPE_LABEL[k.type]}
        </span>
        {hasTiers && (
          <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded-full bg-black/40 text-white backdrop-blur-sm flex items-center gap-1">
            <Layers className="size-2.5" /> Tiers
          </span>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="bg-white rounded-full p-2 shadow-lg"><Edit2 className="size-4 text-gray-700" /></div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-base leading-tight mb-1">{k.name}</h3>
        {k.theme && <p className="text-xs text-muted-foreground mb-2">{k.theme}</p>}
        {k.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{k.description}</p>}
        {hasTiers && (
          <div className="flex gap-1 mb-3">
            {TIER_NAMES.map(t => {
              const m = TIER_META[t];
              return (
                <span key={t} className={cls("text-[9px] font-bold px-1.5 py-0.5 rounded-full ring-1", m.bg, m.color, m.ring)}>
                  {m.emoji} {m.label}
                </span>
              );
            })}
          </div>
        )}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xl font-bold text-primary">
              {hasTiers ? <><span className="text-xs font-normal text-muted-foreground">a partir de </span>{brl(k.tiers?.[0]?.price ?? 0)}</> : brl(k.price)}
            </p>
            <p className="text-[10px] text-muted-foreground">{(k.items?.length ?? 0)} componente{(k.items?.length ?? 0) !== 1 ? "s" : ""}</p>
          </div>
          {av.available ? (
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
              <CheckCircle2 className="size-3" /> Disponível
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
              <AlertCircle className="size-3" /> Faltam peças
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════
   KIT ROW (lista)
══════════════════════════════════════════════════════════════ */

function KitRow({ kit: k, onClick, last }: { kit: Kit; onClick: () => void; last: boolean }) {
  const av = kitsRepo.availability(k.id);
  const hasTiers = (k.tiers?.length ?? 0) > 0;
  return (
    <button
      onClick={onClick}
      className={cls("w-full flex items-center gap-4 px-5 py-4 hover:bg-surface/60 transition-colors text-left group", !last && "border-b border-border")}
    >
      <div className="size-14 rounded-xl overflow-hidden shrink-0 border border-border">
        {k.imageUrl
          ? <img src={k.imageUrl} alt={k.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center" style={{ background: k.imageColor ?? "var(--primary-soft)" }}><Package className="size-5 opacity-30" /></div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-semibold text-sm truncate">{k.name}</h3>
          <span className={cls("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0", TYPE_COLOR[k.type])}>{TYPE_LABEL[k.type]}</span>
          {hasTiers && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200 flex items-center gap-0.5 shrink-0">
              <Layers className="size-2.5" /> Tiers
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{k.theme}{k.description ? ` · ${k.description}` : ""}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-bold text-base">
          {hasTiers ? `${brl(k.tiers?.[0]?.price ?? 0)} ~ ${brl(k.tiers?.[2]?.price ?? k.tiers?.[k.tiers.length - 1]?.price ?? 0)}` : brl(k.price)}
        </p>
        <p className="text-[10px] text-muted-foreground">{(k.items?.length ?? 0)} comp.</p>
      </div>
      <div className="shrink-0">
        {av.available ? <CheckCircle2 className="size-4 text-emerald-500" /> : <AlertCircle className="size-4 text-red-500" />}
      </div>
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════
   EMPTY STATE
══════════════════════════════════════════════════════════════ */

function EmptyKits({ hasKits, onNew }: { hasKits: boolean; onNew: () => void }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center py-16 text-center px-6">
      <Package className="size-10 text-muted-foreground/30 mb-3" />
      <h3 className="font-semibold mb-1">{hasKits ? "Nenhum kit encontrado" : "Nenhum kit cadastrado ainda"}</h3>
      <p className="text-sm text-muted-foreground mb-5">
        {hasKits ? "Tente outro filtro ou termo de busca." : "Crie seu primeiro kit e o sistema vai controlar o estoque automaticamente."}
      </p>
      {!hasKits && (
        <button onClick={onNew} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus className="size-4" /> Criar primeiro kit
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   KIT DIALOG
══════════════════════════════════════════════════════════════ */

function KitDialog({
  kit, components, onClose,
}: {
  kit: Kit | null;
  components: ReturnType<typeof componentsRepo.list>;
  onClose: () => void;
}) {
  const { user } = useAuth();

  const [name,        setName]        = React.useState(kit?.name ?? "");
  const [theme,       setTheme]       = React.useState(kit?.theme ?? "");
  const [type,        setType]        = React.useState<Kit["type"]>(kit?.type ?? "pegue_monte");
  const [description, setDescription] = React.useState(kit?.description ?? "");
  const [price,       setPrice]       = React.useState(kit?.price ?? 0);
  const [items,       setItems]       = React.useState<KitItem[]>(kit?.items ?? []);
  const [imageUrl,    setImageUrl]    = React.useState<string | undefined>(kit?.imageUrl);
  const [imageColor,  setImageColor]  = React.useState(kit?.imageColor ?? "#FDA4AF");
  const [uploading,   setUploading]   = React.useState(false);
  const [saving,      setSaving]      = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const [tiersEnabled,  setTiersEnabled]  = React.useState(!!(kit?.tiers?.length));
  const [tiers,         setTiers]         = React.useState<KitTier[]>(
    kit?.tiers?.length ? kit.tiers : DEFAULT_TIERS.map(t => ({ ...t, items: t.name === "bronze" ? (kit?.items ?? []) : [], price: t.name === "bronze" ? (kit?.price ?? 0) : 0 })),
  );
  const [activeTier, setActiveTier] = React.useState<KitTierName>("bronze");

  const tierItems = React.useMemo(
    () => tiers.find(t => t.name === activeTier)?.items ?? [],
    [tiers, activeTier],
  );
  const setTierItems = (fn: (prev: KitItem[]) => KitItem[]) => {
    setTiers(prev => prev.map(t => t.name === activeTier ? { ...t, items: fn(t.items) } : t));
  };
  const setTierPrice = (tierName: KitTierName, val: number) => {
    setTiers(prev => prev.map(t => t.name === tierName ? { ...t, price: val } : t));
  };
  const setTierDescription = (tierName: KitTierName, val: string) => {
    setTiers(prev => prev.map(t => t.name === tierName ? { ...t, description: val } : t));
  };

  const addItem = (cid: string, forItems: KitItem[], setFn: (fn: (p: KitItem[]) => KitItem[]) => void) => {
    if (forItems.find(i => i.componentId === cid)) return;
    setFn(prev => [...prev, { componentId: cid, quantity: 1 }]);
  };
  const updateQty = (cid: string, qty: number, setFn: (fn: (p: KitItem[]) => KitItem[]) => void) =>
    setFn(prev => prev.map(i => i.componentId === cid ? { ...i, quantity: Math.max(1, qty) } : i));
  const removeItem = (cid: string, setFn: (fn: (p: KitItem[]) => KitItem[]) => void) =>
    setFn(prev => prev.filter(i => i.componentId !== cid));

  const bomCost = (bomItems: KitItem[]) =>
    bomItems.reduce((acc, it) => {
      const c = components.find(x => x.id === it.componentId);
      return acc + (c?.unitCost ?? 0) * it.quantity;
    }, 0);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast.error("Selecione uma imagem (JPG, PNG, WebP)"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("A imagem deve ter no máximo 5MB"); return; }
    setUploading(true);
    try {
      const storage = getStorage();
      const kitId = kit?.id ?? `new-${Date.now()}`;
      const ext = file.name.split(".").pop() ?? "jpg";
      const storageRef = ref(storage, `kits/${user.id}/${kitId}.${ext}`);
      if (imageUrl) {
        try { await deleteObject(ref(storage, imageUrl)); } catch (_) { /* ok */ }
      }
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setImageUrl(url);
      toast.success("Foto enviada!");
    } catch (err: any) {
      console.error(err);
      if (err?.code === "storage/unauthorized") {
        toast.error("Sem permissão para enviar foto. Verifique as regras do Firebase Storage.");
      } else {
        toast.error("Erro ao enviar a foto. Tente novamente.");
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    if (!name.trim()) { toast.error("Dê um nome ao kit"); return; }
    setSaving(true);
    try {
      let payload: Omit<Kit, "id" | "createdAt" | "updatedAt">;
      if (tiersEnabled) {
        const bronzeTier = tiers.find(t => t.name === "bronze") ?? { name: "bronze", price: 0, items: [], description: "" };
        payload = {
          name: name.trim(), theme, type, description,
          price: bronzeTier.price,
          items: bronzeTier.items,
          tiers,
          active: true, imageColor, imageUrl,
        };
      } else {
        payload = {
          name: name.trim(), theme, type, description,
          price, items, tiers: undefined,
          active: true, imageColor, imageUrl,
        };
      }
      if (kit) {
        kitsRepo.update(kit.id, payload);
        toast.success("Kit atualizado!");
      } else {
        kitsRepo.create(payload);
        toast.success("Kit criado!");
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar kit. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const del = () => {
    if (kit && confirm(`Excluir o kit "${kit.name}"? Esta ação não pode ser desfeita.`)) {
      kitsRepo.remove(kit.id);
      toast.success("Kit excluído");
      onClose();
    }
  };

  const PALETTE = ["#FDA4AF","#C4B5FD","#93C5FD","#6EE7B7","#FCD34D","#F9A8D4","#A5F3FC","#FCA5A5"];

  const BomSection = ({
    bomItems, setFn, currentCost, currentPrice,
  }: {
    bomItems: KitItem[];
    setFn: (fn: (p: KitItem[]) => KitItem[]) => void;
    currentCost: number;
    currentPrice: number;
  }) => (
    <div>
      <div className="flex items-center justify-between mb-3">
        <FieldLabel label="Materiais do kit (BOM)" />
        {currentCost > 0 && (
          <span className="text-xs text-muted-foreground">
            Custo: <strong className="text-foreground">{brl(currentCost)}</strong>
            {currentPrice > 0 && (
              <span className="text-emerald-600 ml-1">
                · margem {Math.round(((currentPrice - currentCost) / currentPrice) * 100)}%
              </span>
            )}
          </span>
        )}
      </div>
      {bomItems.length > 0 && (
        <div className="space-y-2 mb-3">
          {bomItems.map(it => {
            const c = components.find(x => x.id === it.componentId);
            if (!c) return null;
            const cost = c.unitCost * it.quantity;
            const stockOk = c.stock >= it.quantity;
            return (
              <div key={it.componentId} className="flex items-center gap-3 bg-surface border border-border rounded-xl p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {brl(cost)} · estoque:{" "}
                    <span className={stockOk ? "text-emerald-600" : "text-red-600"}>{c.stock} {c.unit}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => updateQty(it.componentId, it.quantity - 1, setFn)} className="size-7 rounded-lg border border-border hover:bg-surface flex items-center justify-center text-muted-foreground transition-colors">−</button>
                  <input
                    type="number" min={1} value={it.quantity}
                    onChange={e => updateQty(it.componentId, Number(e.target.value), setFn)}
                    className="w-12 text-center py-1 px-1 text-sm border border-border rounded-lg bg-card"
                  />
                  <button onClick={() => updateQty(it.componentId, it.quantity + 1, setFn)} className="size-7 rounded-lg border border-border hover:bg-surface flex items-center justify-center text-muted-foreground transition-colors">+</button>
                </div>
                <span className="text-xs text-muted-foreground w-8 text-center shrink-0">{c.unit}</span>
                <button onClick={() => removeItem(it.componentId, setFn)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                  <Trash2 className="size-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
      <select
        onChange={e => { if (e.target.value) { addItem(e.target.value, bomItems, setFn); e.target.value = ""; } }}
        className="inp text-muted-foreground"
        defaultValue=""
      >
        <option value="" disabled>+ Adicionar material…</option>
        {components
          .filter(c => !bomItems.find(i => i.componentId === c.id))
          .map(c => (
            <option key={c.id} value={c.id}>{c.name} — {c.stock} {c.unit} em estoque · {brl(c.unitCost)}/{c.unit}</option>
          ))}
      </select>
      {bomItems.length === 0 && (
        <p className="text-xs text-muted-foreground mt-2 text-center py-4 border border-dashed border-border rounded-xl">
          Nenhum material adicionado. O sistema não vai debitar estoque.
        </p>
      )}
    </div>
  );

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/50 z-50 grid place-items-center p-4 backdrop-blur-sm overflow-y-auto">
      <div
        onClick={e => e.stopPropagation()}
        className="bg-card rounded-3xl w-full max-w-2xl shadow-2xl my-8"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-border">
          <div>
            <h2 className="font-display text-xl font-bold">{kit ? "Editar kit" : "Novo kit"}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Preencha os dados e adicione os materiais do kit</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface text-muted-foreground transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <div className="px-8 py-6 space-y-6">

          {/* Upload de foto */}
          <div>
            <FieldLabel icon={<Camera className="size-3.5" />} label="Foto do kit" />
            <div className="flex gap-4 items-start">
              <div className="relative shrink-0">
                <div
                  className="size-28 rounded-2xl overflow-hidden border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors group"
                  style={{ background: imageUrl ? "transparent" : imageColor }}
                  onClick={() => fileRef.current?.click()}
                >
                  {imageUrl ? (
                    <>
                      <img src={imageUrl} alt="Kit" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-2xl">
                        <Camera className="size-6 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-white/70">
                      {uploading
                        ? <div className="size-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                        : <ImageIcon className="size-6" />
                      }
                      <span className="text-[10px] font-semibold">{uploading ? "Enviando…" : "Clique"}</span>
                    </div>
                  )}
                </div>
                {imageUrl && (
                  <button onClick={() => setImageUrl(undefined)} className="absolute -top-2 -right-2 size-5 bg-destructive text-white rounded-full flex items-center justify-center hover:bg-destructive/80 transition-colors shadow-md">
                    <X className="size-3" />
                  </button>
                )}
              </div>

              <div className="flex-1 space-y-3">
                <div>
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 text-sm font-semibold text-primary hover:bg-primary/5 px-3 py-2 rounded-xl border border-primary/30 transition-colors disabled:opacity-50"
                  >
                    <Upload className="size-3.5" />
                    {uploading ? "Enviando…" : imageUrl ? "Trocar foto" : "Enviar foto"}
                  </button>
                  <p className="text-[11px] text-muted-foreground mt-1.5">JPG, PNG ou WebP · máx. 5MB</p>
                </div>
                {!imageUrl && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Cor do card (sem foto)</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {PALETTE.map(c => (
                        <button
                          key={c}
                          onClick={() => setImageColor(c)}
                          className={cls("size-6 rounded-full border-2 transition-all hover:scale-110", imageColor === c ? "border-foreground scale-110" : "border-transparent")}
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>

          {/* Info básica */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FieldLabel icon={<Package className="size-3.5" />} label="Nome do kit" />
              <input value={name} onChange={e => setName(e.target.value)} className="inp" placeholder="Ex: Kit Jardim Encantado" autoFocus />
            </div>
            <div>
              <FieldLabel icon={<Tag className="size-3.5" />} label="Tema" />
              <input value={theme} onChange={e => setTheme(e.target.value)} className="inp" placeholder="Ex: Jardim, Unicorn, Safari" />
            </div>
            <div>
              <FieldLabel label="Tipo de serviço" />
              <select value={type} onChange={e => setType(e.target.value as Kit["type"])} className="inp">
                <option value="pegue_monte">Pegue e monte</option>
                <option value="locacao">Festa na mesa</option>
              </select>
            </div>
          </div>

          <div>
            <FieldLabel icon={<FileText className="size-3.5" />} label="Descrição (opcional)" />
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="inp resize-none" placeholder="Descreva o que está incluído no kit…" />
          </div>

          {/* ══ TOGGLE TIERS ══════════════════════════════════════ */}
          <div className="rounded-2xl border border-border bg-surface/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Layers className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold">Tiers Bronze / Prata / Ouro</p>
                  <p className="text-[11px] text-muted-foreground">Variações do kit com preços e materiais diferentes</p>
                </div>
              </div>
              <button
                onClick={() => setTiersEnabled(v => !v)}
                className={cls("relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none", tiersEnabled ? "bg-primary" : "bg-border")}
                role="switch" aria-checked={tiersEnabled}
              >
                <span className={cls("absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200", tiersEnabled ? "translate-x-5" : "translate-x-0")} />
              </button>
            </div>

            {tiersEnabled && (
              <div className="mt-4 space-y-4">
                <div className="flex gap-1 bg-card border border-border rounded-xl p-1">
                  {TIER_NAMES.map(t => {
                    const m = TIER_META[t];
                    const tierData = tiers.find(x => x.name === t) ?? { name: t, price: 0, items: [], description: "" };
                    return (
                      <button
                        key={t}
                        onClick={() => setActiveTier(t)}
                        className={cls("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors",
                          activeTier === t ? cls("shadow-sm ring-1", m.bg, m.color, m.ring) : "text-muted-foreground hover:bg-surface")}
                      >
                        <span>{m.emoji}</span>
                        <span>{m.label}</span>
                        {tierData.price > 0 && <span className="hidden sm:inline opacity-60 text-[10px]">{brl(tierData.price)}</span>}
                      </button>
                    );
                  })}
                </div>
                {TIER_NAMES.map(tierName => {
                  const tierData = tiers.find(t => t.name === tierName) ?? { name: tierName, price: 0, items: [], description: "" };
                  const meta = TIER_META[tierName];
                  const cost = bomCost(tierData.items);
                  if (tierName !== activeTier) return null;
                  return (
                    <div key={tierName} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <FieldLabel label={`Descrição ${meta.label}`} />
                          <input value={tierData.description ?? ""} onChange={e => setTierDescription(tierName, e.target.value)} className="inp"
                            placeholder={`Ex: ${tierName === "bronze" ? "Itens essenciais" : tierName === "prata" ? "Mais balões e painel" : "Kit completo premium"}`} />
                        </div>
                        <div>
                          <FieldLabel icon={<DollarSign className="size-3.5" />} label={`Preço ${meta.emoji} ${meta.label}`} />
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">R$</span>
                            <input type="number" min={0} step={10} value={tierData.price}
                              onChange={e => setTierPrice(tierName, Number(e.target.value))} className="inp pl-9" />
                          </div>
                        </div>
                      </div>
                      <BomSection bomItems={tierData.items} setFn={setTierItems} currentCost={cost} currentPrice={tierData.price} />
                    </div>
                  );
                })}
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  {TIER_NAMES.map(t => {
                    const m = TIER_META[t];
                    const tierData = tiers.find(x => x.name === t) ?? { name: t, price: 0, items: [], description: "" };
                    return (
                      <div key={t} className={cls("flex-1 text-center py-2 rounded-xl", m.bg)}>
                        <p className={cls("text-[10px] font-bold", m.color)}>{m.emoji} {m.label}</p>
                        <p className={cls("text-sm font-bold tabular-nums", m.color)}>{brl(tierData.price)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!tiersEnabled && (
              <div className="mt-4 space-y-4">
                <div>
                  <FieldLabel icon={<DollarSign className="size-3.5" />} label="Preço de venda (R$)" />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">R$</span>
                    <input type="number" min={0} step={10} value={price} onChange={e => setPrice(Number(e.target.value))} className="inp pl-9" />
                  </div>
                </div>
                <BomSection bomItems={items} setFn={fn => setItems(fn)} currentCost={bomCost(items)} currentPrice={price} />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-8 pb-7 pt-4 border-t border-border">
          {kit ? (
            <button onClick={del} className="flex items-center gap-1.5 text-sm text-destructive font-semibold hover:bg-destructive/10 px-3 py-2 rounded-xl transition-colors">
              <Trash2 className="size-3.5" /> Excluir kit
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-surface transition-colors">Cancelar</button>
            <button onClick={save} disabled={saving} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50">
              {saving ? "Salvando…" : kit ? "Salvar alterações" : "Criar kit"}
            </button>
          </div>
        </div>

        <style>{".inp{width:100%;padding:0.5rem 0.75rem;border-radius:0.625rem;border:1px solid var(--border);background:var(--card);font-size:0.875rem;transition:border-color 0.15s,box-shadow 0.15s}.inp:focus{outline:none;border-color:var(--primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--primary) 15%,transparent)}"}</style>
      </div>
    </div>
  );
}

function FieldLabel({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
      {icon && <span className="opacity-60">{icon}</span>}
      {label}
    </label>
  );
}
