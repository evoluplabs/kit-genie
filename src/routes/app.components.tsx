import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Plus, Minus, Search, X, Package, AlertTriangle,
  CheckCircle2, LayoutGrid, List, ArrowRight, Edit2,
  Repeat2, Flame, Tag, DollarSign, BarChart2, ChevronRight,
} from "lucide-react";
import { useDb } from "@/hooks/use-db";
import { componentsRepo, analytics, type Component, type Unit } from "@/services/db";
import { brl, cls } from "@/lib/format";
import { PageHeader } from "@/components/app/app-shell";
import { toast } from "sonner";

export const Route = createFileRoute("/app/components")({ component: ComponentsPage });

const UNIT_OPTIONS: Unit[] = ["un", "m", "kg", "rolo", "pct", "par"];

const VARIATION_OPTIONS = ["pequeno", "médio", "grande", "alta", "baixa"];

const COLOR_OPTIONS = [
  { value: "rosa",     hex: "#f9a8d4", label: "Rosa" },
  { value: "azul",     hex: "#93c5fd", label: "Azul" },
  { value: "vermelho", hex: "#fca5a5", label: "Vermelho" },
  { value: "amarelo",  hex: "#fde047", label: "Amarelo" },
  { value: "verde",    hex: "#86efac", label: "Verde" },
  { value: "roxo",     hex: "#c4b5fd", label: "Roxo" },
  { value: "laranja",  hex: "#fdba74", label: "Laranja" },
  { value: "preto",    hex: "#374151", label: "Preto" },
  { value: "branco",   hex: "#f3f4f6", label: "Branco" },
  { value: "dourado",  hex: "#fcd34d", label: "Dourado" },
  { value: "prata",    hex: "#d1d5db", label: "Prata" },
];

function colorHex(value: string): string {
  return COLOR_OPTIONS.find(c => c.value === value)?.hex ?? "#e5e7eb";
}

const CATEGORY_COLORS: Record<string, string> = {
  "Balão":      "bg-pink-50 text-pink-700 border-pink-100",
  "Painel":     "bg-violet-50 text-violet-700 border-violet-100",
  "Mesa":       "bg-blue-50 text-blue-700 border-blue-100",
  "Decor":      "bg-emerald-50 text-emerald-700 border-emerald-100",
  "Tecido":     "bg-amber-50 text-amber-700 border-amber-100",
  "Iluminação": "bg-yellow-50 text-yellow-700 border-yellow-100",
};
function categoryColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? "bg-surface text-muted-foreground border-border";
}

function ComponentsPage() {
  const items = useDb(() => componentsRepo.list());
  const [editing,   setEditing]   = React.useState<Component | null>(null);
  const [creating,  setCreating]  = React.useState(false);
  const [search,    setSearch]    = React.useState("");
  const [layout,    setLayout]    = React.useState<"tabela" | "cards">("tabela");
  const [catFilter, setCatFilter] = React.useState<string>("todos");

  const categories = React.useMemo(() =>
    [...new Set(items.map(i => i.category).filter(Boolean))].sort(), [items]);

  const filtered = React.useMemo(() => {
    let list = items;
    if (catFilter !== "todos") list = list.filter(i => i.category === catFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
    }
    return list;
  }, [items, search, catFilter]);

  const lowStock  = items.filter(i => i.stock <= i.minStock);
  const totalCost = items.reduce((a, i) => a + i.stock * i.unitCost, 0);

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Acervo"
        subtitle="Peças e materiais do seu estoque — usadas pelos kits automaticamente"
        action={
          <button onClick={() => setCreating(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm">
            <Plus className="size-4" /> Nova peça
          </button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard icon={<Package className="size-4" />}       label="Total de peças"   value={String(items.length)}      color="pink" />
        <KpiCard icon={<AlertTriangle className="size-4" />} label="Estoque baixo"    value={String(lowStock.length)}   color={lowStock.length > 0 ? "red" : "emerald"} />
        <KpiCard icon={<BarChart2 className="size-4" />}     label="Categorias"       value={String(categories.length)} color="violet" />
        <KpiCard icon={<DollarSign className="size-4" />}    label="Valor em estoque" value={brl(totalCost)}            color="blue" />
      </div>

      {/* Alerta */}
      {lowStock.length > 0 && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
          <AlertTriangle className="size-4 text-red-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-red-800 mb-1">{lowStock.length} {lowStock.length === 1 ? "peça" : "peças"} com estoque baixo</p>
            <p className="text-xs text-red-700 truncate">{lowStock.map(i => i.name).join(", ")}</p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou categoria…"
            className="w-full pl-9 pr-9 py-2.5 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30" />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="size-4" /></button>}
        </div>
        {categories.length > 0 && (
          <div className="flex gap-1 bg-card border border-border rounded-xl p-1 overflow-x-auto shrink-0">
            <button onClick={() => setCatFilter("todos")} className={cls("px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors", catFilter === "todos" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface")}>Todos</button>
            {categories.map(cat => (
              <button key={cat} onClick={() => setCatFilter(cat)} className={cls("px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors", catFilter === cat ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface")}>{cat}</button>
            ))}
          </div>
        )}
        <div className="flex rounded-xl border border-border overflow-hidden bg-card shrink-0">
          <button onClick={() => setLayout("tabela")} className={cls("p-2.5 transition-colors", layout === "tabela" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface")}><List className="size-4" /></button>
          <button onClick={() => setLayout("cards")}  className={cls("p-2.5 transition-colors", layout === "cards"  ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface")}><LayoutGrid className="size-4" /></button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">Mostrando <strong>{filtered.length}</strong> de <strong>{items.length}</strong> peças</p>

      {filtered.length === 0 ? (
        <EmptyComponents hasItems={items.length > 0} onNew={() => setCreating(true)} />
      ) : layout === "tabela" ? (
        <ComponentTable components={filtered} onEdit={setEditing} />
      ) : (
        <ComponentCards components={filtered} onEdit={setEditing} />
      )}

      {(creating || editing) && <CompDialog comp={editing} onClose={() => { setCreating(false); setEditing(null); }} />}
    </div>
  );
}

/* ─── KPI card ──────────────────────────────────────────── */
const KPI_COLORS: Record<string, string> = {
  pink: "bg-pink-50 text-pink-700 border-pink-100", violet: "bg-violet-50 text-violet-700 border-violet-100",
  blue: "bg-blue-50 text-blue-700 border-blue-100", emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
  red:  "bg-red-50 text-red-600 border-red-100",
};
function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className={cls("rounded-2xl border p-4 flex items-center gap-3", KPI_COLORS[color] ?? KPI_COLORS.pink)}>
      <span className="opacity-60 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 truncate">{label}</p>
        <p className="text-lg font-bold leading-tight">{value}</p>
      </div>
    </div>
  );
}

/* ─── Tabela ──────────────────────────────────────────────── */
function ComponentTable({ components, onEdit }: { components: Component[]; onEdit: (c: Component) => void }) {
  const nav = useNavigate();
  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              <th className="px-5 py-3.5">Peça</th>
              <th className="px-5 py-3.5">Categoria</th>
              <th className="px-5 py-3.5">Cor / Variação</th>
              <th className="px-5 py-3.5 text-right">Estoque</th>
              <th className="px-5 py-3.5 text-right">Mínimo</th>
              <th className="px-5 py-3.5 text-right">Custo un.</th>
              <th className="px-5 py-3.5 text-right">Valor total</th>
              <th className="px-5 py-3.5">Kits</th>
              <th className="px-5 py-3.5 text-right">Ajustar</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {components.map(c => {
              const usage = analytics.componentUsage(c.id);
              const low = c.stock <= c.minStock;
              const critical = c.stock === 0;
              return (
                <tr key={c.id} className="hover:bg-surface/60 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className={cls("size-2 rounded-full shrink-0", critical ? "bg-red-500" : low ? "bg-amber-400" : "bg-emerald-400")} />
                      <div>
                        <p className="font-semibold leading-tight">{c.name}</p>
                        <span className={cls("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded mt-0.5 inline-flex items-center gap-0.5",
                          c.reusable ? "bg-blue-50 text-blue-600" : "bg-amber-100 text-amber-700")}>
                          {c.reusable ? <><Repeat2 className="size-2" /> Reutilizável</> : <><Flame className="size-2" /> Consumível</>}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={cls("text-[10px] font-bold px-2 py-1 rounded-full border", categoryColor(c.category))}>{c.category}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {c.color && (
                        <span className="size-4 rounded-full border border-border shadow-sm shrink-0" style={{ background: colorHex(c.color) }} title={c.color} />
                      )}
                      {c.color && <span className="text-xs text-muted-foreground capitalize">{c.color}</span>}
                      {c.variation && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface border border-border text-muted-foreground capitalize">{c.variation}</span>
                      )}
                      {!c.color && !c.variation && <span className="text-xs text-muted-foreground">—</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={cls("font-mono font-bold tabular-nums", critical ? "text-red-600" : low ? "text-amber-600" : "")}>{c.stock}</span>
                    <span className="text-muted-foreground ml-1 text-xs">{c.unit}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-muted-foreground text-xs">{c.minStock} {c.unit}</td>
                  <td className="px-5 py-3.5 text-right font-mono text-xs">{brl(c.unitCost)}</td>
                  <td className="px-5 py-3.5 text-right font-mono text-xs text-muted-foreground">{brl(c.stock * c.unitCost)}</td>
                  <td className="px-5 py-3.5">
                    {usage.kits.length > 0 ? (
                      <button onClick={() => nav({ to: "/app/kits" })} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                        {usage.kits.length} kit{usage.kits.length !== 1 ? "s" : ""} <ChevronRight className="size-3" />
                      </button>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { componentsRepo.adjustStock(c.id, -1); toast.success(`-1 ${c.unit}`); }} className="size-7 rounded-lg border border-border hover:bg-surface flex items-center justify-center text-muted-foreground transition-colors"><Minus className="size-3" /></button>
                      <button onClick={() => { componentsRepo.adjustStock(c.id,  1); toast.success(`+1 ${c.unit}`); }} className="size-7 rounded-lg border border-border hover:bg-surface flex items-center justify-center text-muted-foreground transition-colors"><Plus  className="size-3" /></button>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => onEdit(c)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary p-1"><Edit2 className="size-3.5" /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Cards ────────────────────────────────────────────────── */
function ComponentCards({ components, onEdit }: { components: Component[]; onEdit: (c: Component) => void }) {
  const nav = useNavigate();
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {components.map(c => {
        const usage = analytics.componentUsage(c.id);
        const low = c.stock <= c.minStock;
        const critical = c.stock === 0;
        return (
          <div key={c.id} className={cls("rounded-2xl border bg-card p-4 flex flex-col gap-3 hover:shadow-md transition-all group",
            critical ? "border-red-200 bg-red-50/20" : low ? "border-amber-200 bg-amber-50/20" : "border-border")}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm leading-tight truncate">{c.name}</p>
                <span className={cls("text-[10px] font-bold px-1.5 py-0.5 rounded-full border mt-1 inline-block", categoryColor(c.category))}>{c.category}</span>
                {(c.color || c.variation) && (
                  <div className="flex items-center gap-1.5 mt-1">
                    {c.color && <span className="size-3.5 rounded-full border border-white/30 shadow-sm" style={{ background: colorHex(c.color) }} title={c.color} />}
                    {c.color && <span className="text-[10px] text-muted-foreground capitalize">{c.color}</span>}
                    {c.variation && <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-surface border border-border text-muted-foreground capitalize">{c.variation}</span>}
                  </div>
                )}
              </div>
              <button onClick={() => onEdit(c)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-primary shrink-0"><Edit2 className="size-3.5" /></button>
            </div>
            <div className={cls("rounded-xl p-3 text-center", critical ? "bg-red-100" : low ? "bg-amber-100" : "bg-surface")}>
              <p className={cls("text-2xl font-bold font-mono tabular-nums", critical ? "text-red-600" : low ? "text-amber-600" : "")}>
                {c.stock}<span className="text-sm font-normal text-muted-foreground ml-1">{c.unit}</span>
              </p>
              {(low || critical) && <p className={cls("text-[10px] font-bold mt-0.5", critical ? "text-red-600" : "text-amber-600")}>{critical ? "⚠ Sem estoque!" : `⚠ Mín: ${c.minStock} ${c.unit}`}</p>}
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Custo unit.</span><span className="font-mono font-semibold">{brl(c.unitCost)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Valor estoque</span><span className="font-mono font-semibold">{brl(c.stock * c.unitCost)}</span></div>
              <div className="flex justify-between text-xs items-center">
                <span className="text-muted-foreground">Tipo</span>
                <span className={cls("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded flex items-center gap-0.5", c.reusable ? "bg-blue-50 text-blue-600" : "bg-amber-100 text-amber-700")}>
                  {c.reusable ? <><Repeat2 className="size-2.5" /> Reutilizável</> : <><Flame className="size-2.5" /> Consumível</>}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center gap-1">
                <button onClick={() => { componentsRepo.adjustStock(c.id, -1); toast.success(`-1 ${c.unit}`); }} className="size-7 rounded-lg border border-border hover:bg-surface flex items-center justify-center text-muted-foreground transition-colors"><Minus className="size-3" /></button>
                <button onClick={() => { componentsRepo.adjustStock(c.id,  1); toast.success(`+1 ${c.unit}`); }} className="size-7 rounded-lg border border-border hover:bg-surface flex items-center justify-center text-muted-foreground transition-colors"><Plus  className="size-3" /></button>
              </div>
              {usage.kits.length > 0 && (
                <button onClick={() => nav({ to: "/app/kits" })} className="text-[10px] text-primary font-semibold hover:underline flex items-center gap-0.5">
                  {usage.kits.length} kit{usage.kits.length !== 1 ? "s" : ""} <ChevronRight className="size-3" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Empty ─────────────────────────────────────────────────── */
function EmptyComponents({ hasItems, onNew }: { hasItems: boolean; onNew: () => void }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border flex flex-col items-center py-16 text-center px-6">
      <Package className="size-10 opacity-20 mb-3" />
      <p className="font-semibold mb-1">{hasItems ? "Nenhuma peça encontrada" : "Nenhuma peça cadastrada"}</p>
      <p className="text-sm text-muted-foreground mb-5">{hasItems ? "Tente outro filtro ou busca." : "Cadastre as peças e materiais que compõem seus kits."}</p>
      {!hasItems && <button onClick={onNew} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"><Plus className="size-4" /> Cadastrar primeira peça</button>}
    </div>
  );
}

/* ─── Dialog ────────────────────────────────────────────────── */
function CompDialog({ comp, onClose }: { comp: Component | null; onClose: () => void }) {
  const nav = useNavigate();
  const [form, setForm] = React.useState({
    name: comp?.name ?? "", category: comp?.category ?? "",
    unit: (comp?.unit ?? "un") as Unit, stock: comp?.stock ?? 0,
    minStock: comp?.minStock ?? 1, unitCost: comp?.unitCost ?? 0,
    reusable: comp?.reusable ?? false, notes: comp?.notes ?? "",
    color: comp?.color ?? "", variation: comp?.variation ?? "",
  });
  const usage = comp ? analytics.componentUsage(comp.id) : { kits: [] };

  React.useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const save = () => {
    if (!form.name.trim()) { toast.error("Nome obrigatório"); return; }
    const payload = { ...form, color: form.color || undefined, variation: form.variation || undefined };
    if (comp) { componentsRepo.update(comp.id, payload); toast.success("Peça atualizada!"); }
    else { componentsRepo.create(payload); toast.success("Peça criada!"); }
    onClose();
  };
  const del = () => {
    if (comp && confirm(`Excluir "${comp.name}"? Ela será removida de todos os kits.`)) {
      componentsRepo.remove(comp.id); toast.success("Peça excluída"); onClose();
    }
  };

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/50 z-50 grid place-items-center p-4 backdrop-blur-sm">
      <div onClick={e => e.stopPropagation()} className="bg-card rounded-3xl w-full max-w-lg shadow-2xl" style={{ maxHeight: "90vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-border">
          <div>
            <h2 className="font-display text-xl font-bold">{comp ? "Editar peça" : "Nova peça"}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{comp ? `Usada em ${usage.kits.length} kit${usage.kits.length !== 1 ? "s" : ""}` : "Preencha os dados da peça ou material"}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface text-muted-foreground transition-colors"><X className="size-4" /></button>
        </div>

        <div className="px-8 py-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nome" className="col-span-2">
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="inp" placeholder="Ex: Balão metalizado rosa" autoFocus />
            </Field>
            <Field label="Categoria">
              <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="inp" placeholder="Ex: Balão" list="cat-list" />
              <datalist id="cat-list">{["Balão","Painel","Mesa","Decor","Tecido","Iluminação","Acessório"].map(c => <option key={c} value={c} />)}</datalist>
            </Field>
            <Field label="Unidade">
              <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value as Unit })} className="inp">
                {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </Field>
          </div>

          {/* Cor */}
          <Field label="Cor (opcional)">
            <div className="flex flex-wrap gap-1.5 items-center mt-1">
              <button
                onClick={() => setForm({ ...form, color: "" })}
                className={cls("px-2.5 py-1 text-xs font-semibold rounded-full border transition-all", !form.color ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40 text-muted-foreground")}
              >
                Nenhuma
              </button>
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setForm({ ...form, color: c.value })}
                  title={c.label}
                  className={cls("size-6 rounded-full transition-all hover:scale-110", form.color === c.value ? "ring-2 ring-offset-2 ring-primary scale-110" : "ring-1 ring-black/10")}
                  style={{ background: c.hex }}
                />
              ))}
            </div>
            {form.color && (
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Cor: <strong className="capitalize">{COLOR_OPTIONS.find(c => c.value === form.color)?.label ?? form.color}</strong>
                {" — aparece nos detalhes da peça"}
              </p>
            )}
          </Field>

          {/* Variação */}
          <Field label="Variação (opcional)" hint="Tamanho ou intensidade da peça">
            <div className="flex flex-wrap gap-1.5 mt-1">
              <button
                onClick={() => setForm({ ...form, variation: "" })}
                className={cls("px-3 py-1.5 text-xs font-semibold rounded-full border transition-all", !form.variation ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40 text-muted-foreground")}
              >
                Nenhuma
              </button>
              {VARIATION_OPTIONS.map(v => (
                <button
                  key={v}
                  onClick={() => setForm({ ...form, variation: v })}
                  className={cls("px-3 py-1.5 text-xs font-semibold rounded-full border transition-all capitalize", form.variation === v ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40 text-muted-foreground")}
                >
                  {v}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Estoque atual" hint="Quantas unidades você tem agora">
              <input type="number" min={0} value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} className="inp" />
            </Field>
            <Field label="Estoque mínimo" hint="Abaixo disso o sistema alerta">
              <input type="number" min={0} value={form.minStock} onChange={e => setForm({ ...form, minStock: Number(e.target.value) })} className="inp" />
            </Field>
          </div>
          <Field label="Custo por unidade (R$)" hint="Usado para calcular margem dos kits">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">R$</span>
              <input type="number" min={0} step={0.01} value={form.unitCost} onChange={e => setForm({ ...form, unitCost: Number(e.target.value) })} className="inp pl-9" />
            </div>
          </Field>
          {form.stock * form.unitCost > 0 && (
            <div className="rounded-xl bg-surface border border-border p-3 flex justify-between text-sm">
              <span className="text-muted-foreground">Valor total em estoque</span>
              <strong className="font-mono">{brl(form.stock * form.unitCost)}</strong>
            </div>
          )}
          <div className="rounded-xl border border-border overflow-hidden">
            <label className="flex items-start gap-4 px-4 py-4 cursor-pointer hover:bg-surface transition-colors">
              <div className={cls("relative w-9 h-5 rounded-full transition-colors mt-0.5 shrink-0", form.reusable ? "bg-blue-500" : "bg-border")}
                onClick={() => setForm({ ...form, reusable: !form.reusable })}>
                <div className={cls("absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform", form.reusable ? "translate-x-4" : "translate-x-0.5")} />
              </div>
              <div>
                <p className="font-semibold text-sm">{form.reusable ? "Reutilizável (locação)" : "Consumível"}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {form.reusable
                    ? "A peça volta para o estoque após o evento. Ideal para cenários, mesas e estruturas."
                    : "A peça é consumida na festa e não volta. Ideal para balões, enfeites e descartáveis."}
                </p>
              </div>
            </label>
          </div>
          {comp && usage.kits.length > 0 && (
            <div className="rounded-xl bg-surface border border-border p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Usada nos kits</p>
              <div className="space-y-1.5">
                {usage.kits.map(k => (
                  <button key={k.id} onClick={() => { onClose(); nav({ to: "/app/kits" }); }}
                    className="w-full flex items-center justify-between text-sm hover:text-primary transition-colors group">
                    <span className="font-medium">{k.name}</span>
                    <ArrowRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}
          <Field label="Observações (opcional)">
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="inp resize-none" placeholder="Fornecedor, observações de uso…" />
          </Field>
        </div>

        <div className="flex items-center justify-between px-8 pb-7 pt-4 border-t border-border">
          {comp ? (
            <button onClick={del} className="text-sm text-destructive font-semibold hover:bg-destructive/10 px-3 py-2 rounded-xl transition-colors">Excluir</button>
          ) : <span />}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-surface transition-colors">Cancelar</button>
            <button onClick={save} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm">{comp ? "Salvar alterações" : "Criar peça"}</button>
          </div>
        </div>
        <style>{".inp{width:100%;padding:0.5rem 0.75rem;border-radius:0.625rem;border:1px solid var(--border);background:var(--card);font-size:0.875rem;transition:border-color 0.15s,box-shadow 0.15s}.inp:focus{outline:none;border-color:var(--primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--primary) 15%,transparent)}"}</style>
      </div>
    </div>
  );
}

function Field({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{hint}</p>}
    </div>
  );
}
