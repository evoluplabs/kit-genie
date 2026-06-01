import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Plus, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight,
  List, Calendar as CalendarIcon, Search, TrendingUp, ShoppingBag,
  Clock, DollarSign, X, Phone, User, Package, Tag, FileText,
  RotateCcw, Layers, Sparkles, Minus, CreditCard, AlertTriangle, FilePlus2,
  Truck, Pencil, UserCircle, MapPin, Eye,
} from "lucide-react";
import { useDb } from "@/hooks/use-db";
import {
  salesRepo, kitsRepo, componentsRepo,
  type Sale, type SaleStatus, type KitTierName, type SaleExtraItem,
  type FreightOption, type FreightDirection,
} from "@/services/db";
import { brl, fmtDate, fmtDateInput, parseDateInput, cls } from "@/lib/format";
import { PageHeader } from "@/components/app/app-shell";
import { ContractModal } from "@/components/app/contract-modal";
import { toast } from "sonner";

export const Route = createFileRoute("/app/sales")({ component: SalesPage });

/* ── Tokens de status ─────────────────────────────────────── */
const STATUS_META: Record<SaleStatus, { label: string; pill: string; dot: string }> = {
  agendado:  { label: "Agendado",   pill: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",         dot: "bg-blue-400"   },
  confirmado:{ label: "Confirmado", pill: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500"},
  entregue:  { label: "Entregue",   pill: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",    dot: "bg-violet-500" },
  concluido: { label: "Concluído",  pill: "bg-gray-100 text-gray-600 ring-1 ring-gray-200",         dot: "bg-gray-400"   },
  cancelado: { label: "Cancelado",  pill: "bg-red-50 text-red-600 ring-1 ring-red-200",             dot: "bg-red-400"    },
};

const SOURCE_LABEL: Record<string, string> = {
  manual: "Manual", whatsapp: "WhatsApp", instagram: "Instagram", indicacao: "Indicação",
};

const TIER_META: Record<KitTierName, { label: string; emoji: string; color: string; bg: string; ring: string }> = {
  bronze: { label: "Bronze", emoji: "🥉", color: "text-amber-700",  bg: "bg-amber-50",  ring: "ring-amber-300" },
  prata:  { label: "Prata",  emoji: "🥈", color: "text-slate-600",  bg: "bg-slate-100", ring: "ring-slate-300" },
  ouro:   { label: "Ouro",   emoji: "🥇", color: "text-yellow-700", bg: "bg-yellow-50", ring: "ring-yellow-300"},
};

/* ══════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════ */

function SalesPage() {
  const sales = useDb(() => salesRepo.list());
  const [creating,     setCreating]     = React.useState(false);
  const [contractSale, setContractSale] = React.useState<Sale | null>(null);
  const [editingSale,  setEditingSale]  = React.useState<Sale | null>(null);
  const [viewingSale,  setViewingSale]  = React.useState<Sale | null>(null);
  const [view,         setView]         = React.useState<"tabela" | "calendario">("tabela");
  const [search,       setSearch]       = React.useState("");

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    return q
      ? sales.filter(s =>
          s.customerName.toLowerCase().includes(q) ||
          s.kitNameSnapshot?.toLowerCase().includes(q) ||
          s.customerPhone?.includes(q),
        )
      : sales;
  }, [sales, search]);

  /* KPIs */
  const active    = sales.filter(s => !["cancelado","concluido"].includes(s.status));
  const revenue   = sales.filter(s => s.status !== "cancelado").reduce((a, s) => a + s.totalPrice, 0);
  const pending   = sales.filter(s => s.status === "agendado").length;
  const remaining = sales
    .filter(s => !["cancelado","concluido"].includes(s.status))
    .reduce((a, s) => a + Math.max(0, s.totalPrice - s.paidAmount), 0);

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Locações & Agenda"
        subtitle="Estoque debitado automaticamente a cada locação"
        action={
          <div className="flex items-center gap-2">
            <ViewToggle view={view} setView={setView} />
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Plus className="size-4" /> Nova locação
            </button>
          </div>
        }
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard icon={<ShoppingBag className="size-4" />} label="Total de locações" value={String(sales.length)}  color="pink"    />
        <KpiCard icon={<TrendingUp  className="size-4" />} label="Em andamento"      value={String(active.length)} color="violet"  />
        <KpiCard icon={<Clock       className="size-4" />} label="Agendados"         value={String(pending)}        color="blue"    />
        <KpiCard icon={<DollarSign  className="size-4" />} label="Receita total"     value={brl(revenue)}           color="emerald" />
      </div>

      {/* Restante a receber */}
      {remaining > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <CreditCard className="size-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>{brl(remaining)}</strong> ainda a receber de locações ativas (saldo de sinais pendentes)
          </p>
        </div>
      )}

      {/* Busca */}
      {view === "tabela" && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por cliente, kit ou telefone…"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          )}
        </div>
      )}

      {view === "tabela"
        ? <SalesTable sales={filtered} onContract={setContractSale} onEdit={setEditingSale} onView={setViewingSale} />
        : <SalesCalendar sales={sales} />
      }

      {creating     && <SaleDialog onClose={() => setCreating(false)} />}
      {contractSale && <ContractModal sale={contractSale} onClose={() => setContractSale(null)} />}
      {editingSale  && <EditSaleDialog sale={editingSale} onClose={() => setEditingSale(null)} />}
      {viewingSale  && (
        <SaleDetailsModal
          sale={viewingSale}
          onClose={() => setViewingSale(null)}
          onEdit={() => { setEditingSale(viewingSale); setViewingSale(null); }}
          onContract={() => { setContractSale(viewingSale); setViewingSale(null); }}
        />
      )}
    </div>
  );
}

/* ── Toggle ───────────────────────────────────────────────── */
function ViewToggle({ view, setView }: { view: string; setView: (v: "tabela" | "calendario") => void }) {
  return (
    <div className="flex rounded-xl border border-border overflow-hidden bg-card">
      {(["tabela","calendario"] as const).map(v => (
        <button
          key={v}
          onClick={() => setView(v)}
          className={cls(
            "px-3 py-2 text-xs font-semibold flex items-center gap-1.5 transition-colors",
            view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface",
          )}
        >
          {v === "tabela" ? <List className="size-3.5" /> : <CalendarIcon className="size-3.5" />}
          {v === "tabela" ? "Tabela" : "Calendário"}
        </button>
      ))}
    </div>
  );
}

/* ── KPI Card ─────────────────────────────────────────────── */
const KPI_COLOR: Record<string, string> = {
  pink:    "bg-pink-50 text-pink-700 border-pink-100",
  violet:  "bg-violet-50 text-violet-700 border-violet-100",
  blue:    "bg-blue-50 text-blue-700 border-blue-100",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className={cls("rounded-2xl border p-4 flex items-center gap-3", KPI_COLOR[color] ?? KPI_COLOR.pink)}>
      <div className="shrink-0 opacity-70">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest opacity-60 truncate">{label}</p>
        <p className="text-lg font-bold leading-tight truncate">{value}</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SALES TABLE
══════════════════════════════════════════════════════════════ */

function SalesTable({
  sales, onContract, onEdit, onView,
}: {
  sales: Sale[];
  onContract: (s: Sale) => void;
  onEdit: (s: Sale) => void;
  onView: (s: Sale) => void;
}) {
  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              <th className="px-5 py-3.5">Cliente</th>
              <th className="px-5 py-3.5">Kit</th>
              <th className="px-5 py-3.5">Evento / Retorno</th>
              <th className="px-5 py-3.5">Pagamento</th>
              <th className="px-5 py-3.5 text-right">Total</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sales.map(s => <SaleRow key={s.id} sale={s} onContract={onContract} onEdit={onEdit} onView={onView} />)}
            {sales.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-14 text-center text-muted-foreground text-sm">
                  <ShoppingBag className="size-8 mx-auto mb-2 opacity-20" />
                  Nenhuma locação encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Sale Row ─────────────────────────────────────────────── */
function SaleRow({
  sale: s, onContract, onEdit, onView,
}: {
  sale: Sale;
  onContract: (s: Sale) => void;
  onEdit: (s: Sale) => void;
  onView: (s: Sale) => void;
}) {
  const remaining = Math.max(0, s.totalPrice - s.paidAmount);
  const isSettled = remaining === 0;
  const hasExtras = (s.extraItems?.length ?? 0) > 0;
  const tierMeta  = s.kitTier ? TIER_META[s.kitTier] : null;

  return (
    <tr className="hover:bg-surface/60 transition-colors group">
      {/* Cliente */}
      <td className="px-5 py-3.5">
        <CustomerLink name={s.customerName} />
        {s.customerPhone && <p className="text-[11px] text-muted-foreground mt-0.5">{s.customerPhone}</p>}
      </td>

      {/* Kit + Tier + Extras + Endereço */}
      <td className="px-5 py-3.5">
        <p className="text-muted-foreground leading-tight">{s.kitNameSnapshot}</p>
        <div className="flex items-center gap-1 mt-1 flex-wrap">
          {tierMeta && (
            <span className={cls("text-[9px] font-bold px-1.5 py-0.5 rounded-full ring-1", tierMeta.bg, tierMeta.color, tierMeta.ring)}>
              {tierMeta.emoji} {tierMeta.label}
            </span>
          )}
          {hasExtras && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-pink-50 text-pink-700 ring-1 ring-pink-200 flex items-center gap-0.5">
              <Sparkles className="size-2.5" /> +extras
            </span>
          )}
          {s.freight?.enabled && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-700 ring-1 ring-orange-200 flex items-center gap-0.5">
              <Truck className="size-2.5" /> {s.freight.direction === "ida_volta" ? "ida+volta" : s.freight.direction}
            </span>
          )}
        </div>
        {s.freight?.enabled && s.freight?.address && (
          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
            <MapPin className="size-2.5 shrink-0 text-orange-400" />
            <span className="truncate max-w-[160px]">{s.freight.address}</span>
          </p>
        )}
      </td>

      {/* Datas */}
      <td className="px-5 py-3.5">
        <p className="text-muted-foreground text-xs tabular-nums">{fmtDate(s.eventDate)}</p>
        {s.returnDate && (
          <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
            <RotateCcw className="size-2.5 opacity-50" />
            {fmtDate(s.returnDate)}
          </p>
        )}
      </td>

      {/* Pagamento */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-1 text-[11px]">
          <span className="text-emerald-700 font-semibold tabular-nums">{brl(s.paidAmount)}</span>
          <span className="text-muted-foreground">sinal</span>
        </div>
        {isSettled ? (
          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
            <CheckCircle2 className="size-2.5" /> Quitado
          </span>
        ) : (
          <div className="flex items-center gap-1 text-[11px] mt-0.5">
            <span className="text-amber-600 font-semibold tabular-nums">{brl(remaining)}</span>
            <span className="text-muted-foreground">restante</span>
          </div>
        )}
      </td>

      {/* Total */}
      <td className="px-5 py-3.5 text-right">
        <p className="font-mono font-bold tabular-nums">{brl(s.totalPrice)}</p>
        {s.freight?.enabled && s.freight?.price > 0 && (
          <p className="text-[10px] text-orange-600 flex items-center justify-end gap-0.5 mt-0.5">
            <Truck className="size-2.5" />{brl(s.freight.price)} frete
          </p>
        )}
      </td>

      {/* Status */}
      <td className="px-5 py-3.5">
        <StatusSelect id={s.id} value={s.status} />
      </td>

      {/* Ações (hover) */}
      <td className="px-5 py-3.5 text-right">
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onView(s)}
            className="text-xs text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1"
            title="Ver detalhes"
          >
            <Eye className="size-3" /> Detalhes
          </button>
          <span className="text-border">·</span>
          <button
            onClick={() => onEdit(s)}
            className="text-xs text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1"
            title="Editar locação"
          >
            <Pencil className="size-3" /> Editar
          </button>
          <span className="text-border">·</span>
          <button
            onClick={() => onContract(s)}
            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
            title="Gerar contrato PDF"
          >
            <FilePlus2 className="size-3.5" /> Contrato
          </button>
          <span className="text-border">·</span>
          <button
            onClick={() => {
              if (confirm(`Excluir locação de ${s.customerName}?`)) {
                salesRepo.remove(s.id);
                toast.success("Locação excluída · estoque restaurado");
              }
            }}
            className="text-xs text-muted-foreground hover:text-destructive hover:underline"
          >
            Excluir
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ── Status Select ────────────────────────────────────────── */
function StatusSelect({ id, value }: { id: string; value: SaleStatus }) {
  const meta = STATUS_META[value];
  return (
    <select
      value={value}
      onChange={e => { salesRepo.updateStatus(id, e.target.value as SaleStatus); toast.success("Status atualizado"); }}
      className={cls(
        "text-[11px] font-semibold rounded-full px-2.5 py-1 border-0 cursor-pointer appearance-none pr-5 bg-no-repeat",
        "focus:outline-none focus:ring-2 focus:ring-primary/30",
        meta.pill,
      )}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23999'/%3E%3C/svg%3E")`,
        backgroundPosition: "right 6px center",
      }}
    >
      {(Object.keys(STATUS_META) as SaleStatus[]).map(k => (
        <option key={k} value={k}>{STATUS_META[k].label}</option>
      ))}
    </select>
  );
}

/* ══════════════════════════════════════════════════════════════
   SALE DETAILS MODAL
══════════════════════════════════════════════════════════════ */

function SaleDetailsModal({
  sale: s, onClose, onEdit, onContract,
}: {
  sale: Sale;
  onClose: () => void;
  onEdit: () => void;
  onContract: () => void;
}) {
  const remaining = Math.max(0, s.totalPrice - s.paidAmount);
  const isSettled = remaining === 0;
  const tierMeta  = s.kitTier ? TIER_META[s.kitTier] : null;

  React.useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/50 z-50 grid place-items-center p-4 backdrop-blur-sm">
      <div
        onClick={e => e.stopPropagation()}
        className="bg-card rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-border">
          <div>
            <h2 className="font-display text-xl font-bold">Detalhes da locação</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{s.customerName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface text-muted-foreground transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <div className="px-8 py-6 space-y-4">

          {/* Status + origem */}
          <div className="flex items-center justify-between">
            <span className={cls("text-xs font-bold px-3 py-1.5 rounded-full ring-1", STATUS_META[s.status].pill)}>
              <span className={cls("inline-block size-1.5 rounded-full mr-1.5 align-middle", STATUS_META[s.status].dot)} />
              {STATUS_META[s.status].label}
            </span>
            {s.source && (
              <span className="text-[11px] text-muted-foreground">
                via {SOURCE_LABEL[s.source] ?? s.source}
              </span>
            )}
          </div>

          {/* Cliente */}
          <DetailSection icon={<User className="size-4" />} title="Cliente">
            <p className="font-semibold">{s.customerName}</p>
            {s.customerPhone && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <Phone className="size-3 opacity-60" /> {s.customerPhone}
              </p>
            )}
          </DetailSection>

          {/* Kit */}
          <DetailSection icon={<Package className="size-4" />} title="Kit">
            <p className="font-semibold">{s.kitNameSnapshot}</p>
            {tierMeta && (
              <span className={cls("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 mt-1", tierMeta.bg, tierMeta.color, tierMeta.ring)}>
                {tierMeta.emoji} {tierMeta.label}
              </span>
            )}
          </DetailSection>

          {/* Extras */}
          {s.extraItems && s.extraItems.length > 0 && (
            <DetailSection icon={<Sparkles className="size-4 text-pink-500" />} title="Acessórios extras">
              <div className="space-y-1">
                {s.extraItems.map(e => (
                  <div key={e.componentId} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{e.name} × {e.quantity}</span>
                    <span className="font-mono tabular-nums text-pink-600">{brl(e.unitPrice * e.quantity)}</span>
                  </div>
                ))}
              </div>
            </DetailSection>
          )}

          {/* Datas */}
          <DetailSection icon={<CalendarIcon className="size-4" />} title="Datas">
            <div className="flex items-center gap-6 text-sm">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Evento</p>
                <p className="font-semibold tabular-nums">{fmtDate(s.eventDate)}</p>
              </div>
              {s.returnDate && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Retorno</p>
                  <p className="font-semibold tabular-nums">{fmtDate(s.returnDate)}</p>
                </div>
              )}
            </div>
          </DetailSection>

          {/* Frete + Endereço */}
          {s.freight?.enabled && (
            <DetailSection icon={<Truck className="size-4 text-orange-500" />} title="Frete">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 ring-1 ring-orange-200">
                  {s.freight.direction === "ida_volta" ? "Ida + volta" : s.freight.direction === "ida" ? "Só ida" : "Só volta"}
                </span>
                {s.freight.price > 0 && (
                  <span className="text-sm font-semibold tabular-nums text-orange-700">{brl(s.freight.price)}</span>
                )}
              </div>
              {s.freight.address && (
                <p className="text-sm text-muted-foreground flex items-start gap-1.5 mt-2">
                  <MapPin className="size-3.5 shrink-0 mt-0.5 text-orange-400" />
                  <span>{s.freight.address}</span>
                </p>
              )}
            </DetailSection>
          )}

          {/* Pagamento */}
          <DetailSection icon={<DollarSign className="size-4 text-emerald-500" />} title="Pagamento">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total da locação</span>
                <strong className="font-mono tabular-nums">{brl(s.totalPrice)}</strong>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sinal pago</span>
                <span className="font-mono tabular-nums text-emerald-700">{brl(s.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-sm pt-1 border-t border-border">
                {isSettled ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="size-3.5" /> Quitado
                  </span>
                ) : (
                  <>
                    <span className="text-muted-foreground">Restante a receber</span>
                    <span className="font-mono tabular-nums text-amber-600 font-semibold">{brl(remaining)}</span>
                  </>
                )}
              </div>
            </div>
          </DetailSection>

          {/* Observações */}
          {s.notes && (
            <DetailSection icon={<FileText className="size-4" />} title="Observações">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{s.notes}</p>
            </DetailSection>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 pb-7 pt-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-surface transition-colors"
          >
            Fechar
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onContract}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border border-border hover:bg-surface transition-colors"
            >
              <FilePlus2 className="size-3.5" /> Contrato
            </button>
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Pencil className="size-3.5" /> Editar locação
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Detail Section helper ────────────────────────────────── */
function DetailSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border p-4 space-y-2">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        <span className="opacity-60">{icon}</span>
        {title}
      </p>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CALENDAR
══════════════════════════════════════════════════════════════ */

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAYS   = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

function SalesCalendar({ sales }: { sales: Sale[] }) {
  const today = new Date();
  const [year,        setYear]        = React.useState(today.getFullYear());
  const [month,       setMonth]       = React.useState(today.getMonth());
  const [selectedDay, setSelectedDay] = React.useState<number | null>(null);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); setSelectedDay(null); };
  const nextMonth = () => { if (month === 11) { setMonth(0);  setYear(y => y + 1); } else setMonth(m => m + 1); setSelectedDay(null); };

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const salesByDay = React.useMemo(() => {
    const map = new Map<number, Sale[]>();
    sales.forEach(s => {
      const d = new Date(s.eventDate);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        map.set(day, [...(map.get(day) ?? []), s]);
      }
    });
    return map;
  }, [sales, year, month]);

  const selectedSales = selectedDay ? (salesByDay.get(selectedDay) ?? []) : [];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-5">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-surface transition-colors"><ChevronLeft className="size-4" /></button>
          <h3 className="font-bold text-base">{MONTHS[month]} {year}</h3>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-surface transition-colors"><ChevronRight className="size-4" /></button>
        </div>
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(d => <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }, (_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day       = i + 1;
            const daySales  = salesByDay.get(day) ?? [];
            const isToday    = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
            const isSelected = selectedDay === day;
            const hasEvents  = daySales.length > 0;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={cls(
                  "rounded-xl p-1.5 text-center min-h-[52px] flex flex-col items-center transition-all",
                  isSelected  ? "bg-primary text-primary-foreground shadow-md"
                  : isToday   ? "ring-2 ring-primary/50 hover:bg-surface"
                  : hasEvents ? "hover:bg-surface"
                  : "hover:bg-surface/70",
                )}
              >
                <span className={cls("text-xs font-semibold mb-1", isToday && !isSelected ? "text-primary" : "")}>{day}</span>
                <div className="flex flex-wrap gap-0.5 justify-center">
                  {daySales.slice(0, 3).map(s => (
                    <span key={s.id} className={cls("size-1.5 rounded-full", isSelected ? "bg-white/70" : STATUS_META[s.status].dot)} />
                  ))}
                  {daySales.length > 3 && (
                    <span className={cls("text-[8px] font-bold leading-none", isSelected ? "text-white/80" : "text-muted-foreground")}>+{daySales.length - 3}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-3">
          {(Object.keys(STATUS_META) as SaleStatus[]).map(s => (
            <div key={s} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={cls("size-2 rounded-full", STATUS_META[s].dot)} />
              {STATUS_META[s].label}
            </div>
          ))}
        </div>
      </div>
      {selectedDay && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
            <CalendarIcon className="size-4 text-muted-foreground" />
            {selectedDay}/{String(month + 1).padStart(2, "0")}/{year}
            {selectedSales.length === 0 && <span className="text-muted-foreground font-normal text-xs">— nenhum evento</span>}
          </h4>
          <div className="space-y-2">
            {selectedSales.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border">
                <div className="min-w-0 mr-4">
                  <p className="font-semibold text-sm truncate">{s.customerName}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.kitNameSnapshot} · {brl(s.totalPrice)}</p>
                </div>
                <StatusSelect id={s.id} value={s.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SALE DIALOG
══════════════════════════════════════════════════════════════ */

function SaleDialog({ onClose }: { onClose: () => void }) {
  const kits       = useDb(() => kitsRepo.list().filter(k => k.active));
  const components = useDb(() => componentsRepo.list());
  const allSales   = useDb(() => salesRepo.list());

  const [kitSearch, setKitSearch] = React.useState("");

  /* Clientes anteriores para autocomplete */
  const prevClients = React.useMemo(() => {
    const seen = new Map<string, { name: string; phone: string }>();
    allSales.forEach(s => {
      const key = s.customerName.toLowerCase().trim();
      if (!seen.has(key)) seen.set(key, { name: s.customerName, phone: s.customerPhone ?? "" });
    });
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allSales]);

  /* Kits filtrados pela busca */
  const filteredKits = React.useMemo(() => {
    const q = kitSearch.toLowerCase().trim();
    return q ? kits.filter(k => k.name.toLowerCase().includes(q)) : kits;
  }, [kits, kitSearch]);

  const [form, setForm] = React.useState({
    customerName:     "",
    customerPhone:    "",
    kitId:            kits[0]?.id ?? "",
    kitTier:          undefined as KitTierName | undefined,
    eventDate:        fmtDateInput(Date.now() + 7 * 86400000),
    returnDate:       fmtDateInput(Date.now() + 8 * 86400000),
    paidAmount:       0,
    status:           "agendado" as SaleStatus,
    source:           "manual",
    notes:            "",
    freightEnabled:   false,
    freightDirection: "ida" as FreightDirection,
    freightPrice:     0,
    freightAddress:   "",
  });

  const [extraItems, setExtraItems] = React.useState<SaleExtraItem[]>([]);
  const [extrasOpen, setExtrasOpen] = React.useState(false);

  const patch = (diff: Partial<typeof form>) => setForm(f => ({ ...f, ...diff }));

  /* Auto-preenche telefone ao selecionar cliente existente */
  const handleCustomerNameChange = (name: string) => {
    const found = prevClients.find(c => c.name.toLowerCase() === name.toLowerCase());
    patch({ customerName: name, ...(found?.phone ? { customerPhone: found.phone } : {}) });
  };

  /* Kit e tier selecionados */
  const selectedKit   = kits.find(k => k.id === form.kitId);
  const hasTiers      = (selectedKit?.tiers?.length ?? 0) > 0;
  const effectiveTier = hasTiers ? (form.kitTier ?? "bronze") : undefined;

  /* Preço base */
  const kitBasePrice = React.useMemo(() => {
    if (!selectedKit) return 0;
    if (hasTiers && effectiveTier) {
      return selectedKit.tiers?.find(t => t.name === effectiveTier)?.price ?? selectedKit.price;
    }
    return selectedKit.price;
  }, [selectedKit, hasTiers, effectiveTier]);

  /* Total com extras + frete */
  const extrasTotal  = extraItems.reduce((sum, e) => sum + e.unitPrice * e.quantity, 0);
  const freightTotal = form.freightEnabled ? form.freightPrice : 0;
  const totalPrice   = kitBasePrice + extrasTotal + freightTotal;
  const remaining    = totalPrice - form.paidAmount;

  /* Disponibilidade */
  const eventDateTs  = form.eventDate ? parseDateInput(form.eventDate) : undefined;
  const availability = form.kitId
    ? kitsRepo.availability(form.kitId, eventDateTs, effectiveTier)
    : { available: true, missing: [] };

  /* Componentes disponíveis para extras */
  const kitBomIds = React.useMemo(() => {
    if (!selectedKit) return new Set<string>();
    const bomItems = effectiveTier
      ? (selectedKit.tiers?.find(t => t.name === effectiveTier)?.items ?? selectedKit.items ?? [])
      : (selectedKit.items ?? []);
    return new Set(bomItems.map(it => it.componentId));
  }, [selectedKit, effectiveTier]);

  const availableExtras = components.filter(c => !kitBomIds.has(c.id));

  /* Extras helpers */
  const addExtra = (componentId: string) => {
    const c = components.find(x => x.id === componentId);
    if (!c || extraItems.find(e => e.componentId === componentId)) return;
    setExtraItems(prev => [...prev, { componentId: c.id, name: c.name, quantity: 1, unitPrice: c.unitCost }]);
  };
  const updateExtraQty   = (cid: string, qty: number)   => setExtraItems(prev => prev.map(e => e.componentId === cid ? { ...e, quantity: Math.max(1, qty) } : e));
  const updateExtraPrice = (cid: string, price: number) => setExtraItems(prev => prev.map(e => e.componentId === cid ? { ...e, unitPrice: Math.max(0, price) } : e));
  const removeExtra      = (cid: string)                => setExtraItems(prev => prev.filter(e => e.componentId !== cid));

  React.useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  /* Reset tier ao trocar kit */
  React.useEffect(() => {
    patch({ kitTier: undefined });
    setExtraItems([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.kitId]);

  /* Save */
  const save = () => {
    if (!form.customerName || !form.kitId) { toast.error("Preencha cliente e kit"); return; }
    if (hasTiers && !form.kitTier) { toast.error("Selecione o tier do kit (Bronze, Prata ou Ouro)"); return; }
    salesRepo.create({
      customerName:  form.customerName,
      customerPhone: form.customerPhone,
      kitId:         form.kitId,
      kitTier:       form.kitTier,
      extraItems:    extraItems.length ? extraItems : undefined,
      eventDate:     parseDateInput(form.eventDate),
      returnDate:    form.returnDate ? parseDateInput(form.returnDate) : undefined,
      totalPrice,
      paidAmount:    form.paidAmount,
      status:        form.status as SaleStatus,
      source:        form.source as any,
      notes:         form.notes,
      freight: form.freightEnabled ? {
        enabled:   true,
        direction: form.freightDirection,
        price:     form.freightPrice,
        address:   form.freightAddress || undefined,
      } : undefined,
    });
    toast.success("Locação registrada · estoque atualizado");
    onClose();
  };

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/50 z-50 grid place-items-center p-4 backdrop-blur-sm">
      <div
        onClick={e => e.stopPropagation()}
        className="bg-card rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-border">
          <div>
            <h2 className="font-display text-xl font-bold">Nova locação</h2>
            <p className="text-xs text-muted-foreground mt-0.5">O estoque será debitado automaticamente</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface text-muted-foreground transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <div className="px-8 py-6 space-y-4">

          {/* Cliente com autocomplete */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cliente" icon={<User className="size-3.5" />}>
              <input
                value={form.customerName}
                onChange={e => handleCustomerNameChange(e.target.value)}
                className="inp"
                placeholder="Nome completo"
                list="prev-clients-list"
                autoComplete="off"
              />
              {prevClients.length > 0 && (
                <datalist id="prev-clients-list">
                  {prevClients.map(c => <option key={c.name} value={c.name} />)}
                </datalist>
              )}
            </Field>
            <Field label="WhatsApp" icon={<Phone className="size-3.5" />}>
              <input
                value={form.customerPhone}
                onChange={e => patch({ customerPhone: e.target.value })}
                className="inp"
                placeholder="(11) 99999-9999"
              />
            </Field>
          </div>

          {/* Kit com busca */}
          <Field label="Kit" icon={<Package className="size-3.5" />}>
            <div className="space-y-1.5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <input
                  value={kitSearch}
                  onChange={e => setKitSearch(e.target.value)}
                  className="inp pl-8"
                  placeholder="Buscar kit…"
                />
                {kitSearch && (
                  <button
                    type="button"
                    onClick={() => setKitSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              <select value={form.kitId} onChange={e => patch({ kitId: e.target.value })} className="inp">
                {filteredKits.length === 0 && (
                  <option value="" disabled>Nenhum kit encontrado</option>
                )}
                {filteredKits.map(k => (
                  <option key={k.id} value={k.id}>
                    {k.name}{k.tiers?.length ? " (🥉🥈🥇)" : ` — ${brl(k.price)}`}
                  </option>
                ))}
              </select>
            </div>
          </Field>

          {/* Tier */}
          {hasTiers && selectedKit?.tiers && (
            <Field label="Tier do kit" icon={<Layers className="size-3.5" />}>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {selectedKit.tiers.map(tier => {
                  const m = TIER_META[tier.name];
                  const isSelected = form.kitTier === tier.name;
                  return (
                    <button
                      key={tier.name}
                      type="button"
                      onClick={() => patch({ kitTier: tier.name })}
                      className={cls(
                        "flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all text-center",
                        isSelected
                          ? cls("shadow-sm", m.bg, "border-current", m.color)
                          : "border-border hover:border-primary/30 hover:bg-surface/60",
                      )}
                    >
                      <span className="text-lg leading-none">{m.emoji}</span>
                      <span className={cls("text-[11px] font-bold", isSelected ? m.color : "text-foreground")}>{m.label}</span>
                      <span className={cls("text-xs font-semibold tabular-nums", isSelected ? m.color : "text-muted-foreground")}>
                        {brl(tier.price)}
                      </span>
                      {tier.description && (
                        <span className="text-[9px] text-muted-foreground leading-tight px-1">{tier.description}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </Field>
          )}

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Data do evento" icon={<CalendarIcon className="size-3.5" />}>
              <input type="date" value={form.eventDate} onChange={e => patch({ eventDate: e.target.value })} className="inp" />
            </Field>
            <Field label="Data de retorno" icon={<RotateCcw className="size-3.5" />}>
              <input type="date" value={form.returnDate} min={form.eventDate} onChange={e => patch({ returnDate: e.target.value })} className="inp" />
            </Field>
          </div>

          {form.eventDate && form.returnDate && form.returnDate > form.eventDate && (
            <p className="text-[11px] text-muted-foreground -mt-2 flex items-center gap-1">
              <RotateCcw className="size-3 opacity-50" />
              Combinado para devolver em{" "}
              {(() => {
                const diff = Math.round((parseDateInput(form.returnDate) - parseDateInput(form.eventDate)) / 86400000);
                return `${diff} dia${diff !== 1 ? "s" : ""} após o evento`;
              })()}
            </p>
          )}

          {/* Disponibilidade */}
          {form.kitId && (!hasTiers || form.kitTier) && (
            <div className={cls(
              "rounded-xl p-3 text-sm flex gap-2 items-start",
              availability.available ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200" : "bg-red-50 text-red-700 ring-1 ring-red-200",
            )}>
              {availability.available
                ? <CheckCircle2 className="size-4 mt-0.5 shrink-0" />
                : <AlertCircle  className="size-4 mt-0.5 shrink-0" />
              }
              <div>
                {availability.available
                  ? <span><strong>Disponível!</strong> Todos os componentes em estoque para esta data.</span>
                  : <div>
                      <strong>Atenção:</strong> faltam componentes
                      <ul className="text-xs mt-1 space-y-0.5">
                        {availability.missing.map(m => (
                          <li key={m.componentId}>• {m.name} (precisa {m.need}, tem {m.have})</li>
                        ))}
                      </ul>
                    </div>
                }
              </div>
            </div>
          )}

          {/* Extras */}
          {form.kitId && (
            <div className="rounded-2xl border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setExtrasOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface/60 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-pink-500" />
                  <div>
                    <p className="text-sm font-semibold">
                      Acessórios extras
                      {extraItems.length > 0 && (
                        <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-pink-50 text-pink-700 ring-1 ring-pink-200">
                          {extraItems.length} adicionado{extraItems.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {extraItems.length > 0 ? `+ ${brl(extrasTotal)} no total` : "Itens solicitados além do kit"}
                    </p>
                  </div>
                </div>
                <span className={cls("text-muted-foreground transition-transform duration-200", extrasOpen ? "rotate-180" : "")}>
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1l5 6 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </span>
              </button>

              {extrasOpen && (
                <div className="border-t border-border bg-surface/30 px-4 py-4 space-y-3">
                  {extraItems.length > 0 && (
                    <div className="space-y-2">
                      {extraItems.map(extra => {
                        const c = components.find(x => x.id === extra.componentId);
                        return (
                          <div key={extra.componentId} className="flex items-center gap-2 bg-card border border-border rounded-xl p-2.5">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate">{extra.name}</p>
                              <p className="text-[10px] text-muted-foreground">estoque: {c?.stock ?? 0} {c?.unit ?? "un"}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => updateExtraQty(extra.componentId, extra.quantity - 1)} className="size-6 rounded-lg border border-border hover:bg-surface flex items-center justify-center text-muted-foreground transition-colors text-xs">−</button>
                              <span className="w-6 text-center text-xs font-semibold tabular-nums">{extra.quantity}</span>
                              <button onClick={() => updateExtraQty(extra.componentId, extra.quantity + 1)} className="size-6 rounded-lg border border-border hover:bg-surface flex items-center justify-center text-muted-foreground transition-colors text-xs">+</button>
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <span className="text-[10px] text-muted-foreground">R$</span>
                              <input
                                type="number" min={0} step={0.5}
                                value={extra.unitPrice}
                                onChange={e => updateExtraPrice(extra.componentId, Number(e.target.value))}
                                className="w-14 text-xs text-center py-1 px-1 border border-border rounded-lg bg-card"
                              />
                            </div>
                            <button onClick={() => removeExtra(extra.componentId)} className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0">
                              <X className="size-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Componentes disponíveis como upgrade</p>
                    {availableExtras.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-3">Todos os componentes já estão no kit.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
                        {availableExtras.map(c => {
                          const alreadyAdded = extraItems.some(e => e.componentId === c.id);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => addExtra(c.id)}
                              disabled={alreadyAdded || c.stock === 0}
                              className={cls(
                                "text-left p-2.5 rounded-xl border transition-all",
                                alreadyAdded
                                  ? "border-pink-200 bg-pink-50 opacity-60 cursor-default"
                                  : c.stock === 0
                                  ? "border-border bg-surface opacity-40 cursor-not-allowed"
                                  : "border-border hover:border-primary/40 hover:bg-surface/60 hover:shadow-sm",
                              )}
                            >
                              <p className="text-[11px] font-semibold truncate leading-tight">{c.name}</p>
                              <p className="text-[9px] text-muted-foreground mt-0.5">
                                {alreadyAdded ? "✓ Adicionado" : c.stock === 0 ? "Sem estoque" : `${c.stock} ${c.unit} · ${brl(c.unitCost)}`}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Frete */}
          <div className="rounded-2xl border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => patch({ freightEnabled: !form.freightEnabled })}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface/60 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Truck className="size-4 text-orange-500" />
                <div>
                  <p className="text-sm font-semibold">
                    Frete{form.freightEnabled && form.freightPrice > 0 && (
                      <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-700 ring-1 ring-orange-200">
                        {brl(form.freightPrice)}
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {form.freightEnabled ? "Frete incluído nesta locação" : "Clique para incluir frete"}
                  </p>
                </div>
              </div>
              <div className={cls(
                "relative w-9 h-5 rounded-full transition-colors shrink-0",
                form.freightEnabled ? "bg-orange-400" : "bg-border",
              )}>
                <div className={cls("absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform", form.freightEnabled ? "translate-x-4" : "translate-x-0.5")} />
              </div>
            </button>
            {form.freightEnabled && (
              <div className="border-t border-border bg-surface/30 px-4 py-4 space-y-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Tipo de frete</p>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { v: "ida",       label: "Só ida",      emoji: "🚚", desc: "Você leva" },
                      { v: "volta",     label: "Só volta",    emoji: "🔄", desc: "Alguém traz" },
                      { v: "ida_volta", label: "Ida + volta", emoji: "↔️", desc: "Vai e volta" },
                    ] as const).map(opt => (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => patch({ freightDirection: opt.v })}
                        className={cls(
                          "flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-all text-center",
                          form.freightDirection === opt.v
                            ? "border-orange-400 bg-orange-50"
                            : "border-border hover:border-orange-200",
                        )}
                      >
                        <span className="text-base leading-none">{opt.emoji}</span>
                        <span className="text-[10px] font-bold">{opt.label}</span>
                        <span className="text-[9px] text-muted-foreground">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Valor do frete (R$)" icon={<DollarSign className="size-3.5" />}>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">R$</span>
                      <input
                        type="number" min={0} step={1}
                        value={form.freightPrice}
                        onChange={e => patch({ freightPrice: Number(e.target.value) })}
                        className="inp pl-9"
                        placeholder="0,00"
                      />
                    </div>
                  </Field>
                  <Field label="Endereço de entrega" icon={<MapPin className="size-3.5" />}>
                    <input
                      value={form.freightAddress}
                      onChange={e => patch({ freightAddress: e.target.value })}
                      className="inp"
                      placeholder="Rua, número, bairro"
                    />
                  </Field>
                </div>
              </div>
            )}
          </div>

          {/* Pagamento */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sinal pago (R$)" icon={<DollarSign className="size-3.5" />}>
              <input
                type="number" min={0}
                value={form.paidAmount}
                onChange={e => patch({ paidAmount: Number(e.target.value) })}
                className="inp"
                placeholder="0,00"
              />
            </Field>
            <Field label="Origem" icon={<Tag className="size-3.5" />}>
              <select value={form.source} onChange={e => patch({ source: e.target.value })} className="inp">
                {Object.entries(SOURCE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
          </div>

          {/* Resumo financeiro */}
          <div className="rounded-xl bg-primary/5 ring-1 ring-primary/20 p-3 text-sm space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Kit {effectiveTier ? `(${TIER_META[effectiveTier].emoji} ${TIER_META[effectiveTier].label})` : ""}
              </span>
              <strong className="font-mono tabular-nums">{brl(kitBasePrice)}</strong>
            </div>
            {extrasTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Extras ({extraItems.length} item{extraItems.length !== 1 ? "s" : ""})</span>
                <span className="font-mono tabular-nums text-pink-600">+ {brl(extrasTotal)}</span>
              </div>
            )}
            {form.freightEnabled && form.freightPrice > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1"><Truck className="size-3 opacity-60" /> Frete ({form.freightDirection === "ida_volta" ? "ida+volta" : form.freightDirection})</span>
                <span className="font-mono tabular-nums text-orange-600">+ {brl(form.freightPrice)}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-primary/10">
              <span className="font-semibold">Total</span>
              <strong className="font-mono tabular-nums">{brl(totalPrice)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sinal pago</span>
              <span className="font-mono tabular-nums text-emerald-700">{brl(form.paidAmount)}</span>
            </div>
            {remaining > 0 ? (
              <div className="flex justify-between pt-1 border-t border-primary/10">
                <span className="text-muted-foreground">Restante a receber</span>
                <span className="font-mono tabular-nums text-amber-600 font-semibold">{brl(remaining)}</span>
              </div>
            ) : form.paidAmount > 0 ? (
              <div className="flex justify-between pt-1 border-t border-primary/10">
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="size-3.5" /> Valor quitado
                </span>
                <span className="font-mono tabular-nums text-emerald-700">{brl(totalPrice)}</span>
              </div>
            ) : null}
          </div>

          {/* Observações */}
          <Field label="Observações" icon={<FileText className="size-3.5" />}>
            <textarea
              value={form.notes}
              onChange={e => patch({ notes: e.target.value })}
              className="inp resize-none"
              rows={2}
              placeholder="Informações adicionais sobre o evento ou o cliente…"
            />
          </Field>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-8 pb-7 pt-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-surface transition-colors">
            Cancelar
          </button>
          <button
            onClick={save}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
          >
            Registrar locação
          </button>
        </div>

        <style>{`
          .inp { width:100%; padding:0.5rem 0.75rem; border-radius:0.625rem; border:1px solid var(--border); background:var(--card); font-size:0.875rem; transition:border-color 0.15s,box-shadow 0.15s; }
          .inp:focus { outline:none; border-color:var(--primary); box-shadow:0 0 0 3px color-mix(in srgb,var(--primary) 15%,transparent); }
        `}</style>
      </div>
    </div>
  );
}

/* ── Field helper ─────────────────────────────────────────── */
function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
        {icon && <span className="opacity-60">{icon}</span>}
        {label}
      </label>
      {children}
    </div>
  );
}

/* ── CustomerLink ─────────────────────────────────────────── */
function CustomerLink({ name }: { name: string }) {
  const nav = useNavigate();
  return (
    <button
      onClick={() => nav({ to: "/app/customers", search: { q: name } as any })}
      className="font-semibold leading-tight hover:text-primary hover:underline transition-colors text-left flex items-center gap-1 group"
      title="Ver perfil do cliente"
    >
      {name}
      <UserCircle className="size-3 opacity-0 group-hover:opacity-40 transition-opacity shrink-0" />
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════
   EDIT SALE DIALOG
══════════════════════════════════════════════════════════════ */

function EditSaleDialog({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const [form, setForm] = React.useState({
    customerName:     sale.customerName,
    customerPhone:    sale.customerPhone ?? "",
    eventDate:        fmtDateInput(sale.eventDate),
    returnDate:       sale.returnDate ? fmtDateInput(sale.returnDate) : "",
    paidAmount:       sale.paidAmount,
    status:           sale.status as SaleStatus,
    notes:            sale.notes ?? "",
    source:           sale.source,
    freightEnabled:   sale.freight?.enabled ?? false,
    freightDirection: (sale.freight?.direction ?? "ida") as FreightDirection,
    freightPrice:     sale.freight?.price ?? 0,
    freightAddress:   sale.freight?.address ?? "",
  });

  const patch = (diff: Partial<typeof form>) => setForm(f => ({ ...f, ...diff }));

  const freightTotal       = form.freightEnabled ? form.freightPrice : 0;
  const baseWithoutFreight = sale.totalPrice - (sale.freight?.price ?? 0);
  const newTotal           = baseWithoutFreight + freightTotal;

  const save = () => {
    if (!form.customerName.trim()) { toast.error("Nome do cliente é obrigatório"); return; }
    salesRepo.update(sale.id, {
      customerName:  form.customerName,
      customerPhone: form.customerPhone || undefined,
      eventDate:     parseDateInput(form.eventDate),
      returnDate:    form.returnDate ? parseDateInput(form.returnDate) : undefined,
      paidAmount:    form.paidAmount,
      status:        form.status,
      notes:         form.notes || undefined,
      source:        form.source as any,
      totalPrice:    newTotal,
      freight: form.freightEnabled ? {
        enabled:   true,
        direction: form.freightDirection,
        price:     form.freightPrice,
        address:   form.freightAddress || undefined,
      } : undefined,
    });
    toast.success("Locação atualizada!");
    onClose();
  };

  React.useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/50 z-50 grid place-items-center p-4 backdrop-blur-sm">
      <div
        onClick={e => e.stopPropagation()}
        className="bg-card rounded-3xl w-full max-w-lg shadow-2xl"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-border">
          <div>
            <h2 className="font-display text-xl font-bold">Editar locação</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {sale.kitNameSnapshot} · {sale.kitTier ? `${TIER_META[sale.kitTier].emoji} ${TIER_META[sale.kitTier].label}` : ""}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface text-muted-foreground transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <div className="px-8 py-6 space-y-4">

          {/* Cliente */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cliente" icon={<User className="size-3.5" />}>
              <input value={form.customerName} onChange={e => patch({ customerName: e.target.value })} className="inp" />
            </Field>
            <Field label="WhatsApp" icon={<Phone className="size-3.5" />}>
              <input value={form.customerPhone} onChange={e => patch({ customerPhone: e.target.value })} className="inp" placeholder="(11) 99999-9999" />
            </Field>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Data do evento" icon={<CalendarIcon className="size-3.5" />}>
              <input type="date" value={form.eventDate} onChange={e => patch({ eventDate: e.target.value })} className="inp" />
            </Field>
            <Field label="Data de retorno" icon={<RotateCcw className="size-3.5" />}>
              <input type="date" value={form.returnDate} min={form.eventDate} onChange={e => patch({ returnDate: e.target.value })} className="inp" />
            </Field>
          </div>

          {/* Frete */}
          <div className="rounded-2xl border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => patch({ freightEnabled: !form.freightEnabled })}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface/60 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Truck className="size-4 text-orange-500" />
                <div>
                  <p className="text-sm font-semibold">
                    Frete{form.freightEnabled && form.freightPrice > 0 && (
                      <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-700 ring-1 ring-orange-200">
                        {brl(form.freightPrice)}
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{form.freightEnabled ? "Frete incluído" : "Sem frete"}</p>
                </div>
              </div>
              <div className={cls("relative w-9 h-5 rounded-full transition-colors shrink-0", form.freightEnabled ? "bg-orange-400" : "bg-border")}>
                <div className={cls("absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform", form.freightEnabled ? "translate-x-4" : "translate-x-0.5")} />
              </div>
            </button>
            {form.freightEnabled && (
              <div className="border-t border-border bg-surface/30 px-4 py-4 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { v: "ida",       label: "Só ida",      emoji: "🚚" },
                    { v: "volta",     label: "Só volta",    emoji: "🔄" },
                    { v: "ida_volta", label: "Ida + volta", emoji: "↔️" },
                  ] as const).map(opt => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => patch({ freightDirection: opt.v })}
                      className={cls(
                        "flex flex-col items-center gap-1 py-2 rounded-xl border-2 transition-all text-center",
                        form.freightDirection === opt.v ? "border-orange-400 bg-orange-50" : "border-border hover:border-orange-200",
                      )}
                    >
                      <span className="text-sm">{opt.emoji}</span>
                      <span className="text-[10px] font-bold">{opt.label}</span>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Valor do frete (R$)">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">R$</span>
                      <input type="number" min={0} value={form.freightPrice} onChange={e => patch({ freightPrice: Number(e.target.value) })} className="inp pl-9" />
                    </div>
                  </Field>
                  <Field label="Endereço" icon={<MapPin className="size-3.5" />}>
                    <input value={form.freightAddress} onChange={e => patch({ freightAddress: e.target.value })} className="inp" placeholder="Rua, número..." />
                  </Field>
                </div>
              </div>
            )}
          </div>

          {/* Pagamento + status */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sinal pago (R$)" icon={<DollarSign className="size-3.5" />}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">R$</span>
                <input type="number" min={0} value={form.paidAmount} onChange={e => patch({ paidAmount: Number(e.target.value) })} className="inp pl-9" />
              </div>
            </Field>
            <Field label="Status" icon={<Tag className="size-3.5" />}>
              <select value={form.status} onChange={e => patch({ status: e.target.value as SaleStatus })} className="inp">
                {(Object.keys(STATUS_META) as SaleStatus[]).map(k => (
                  <option key={k} value={k}>{STATUS_META[k].label}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Resumo */}
          <div className="rounded-xl bg-primary/5 ring-1 ring-primary/20 p-3 text-sm space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Kit + extras (fixo)</span>
              <span className="font-mono">{brl(baseWithoutFreight)}</span>
            </div>
            {form.freightEnabled && form.freightPrice > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1"><Truck className="size-3 opacity-60" /> Frete</span>
                <span className="font-mono text-orange-600">+ {brl(form.freightPrice)}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-primary/10 text-sm">
              <span className="font-semibold">Novo total</span>
              <strong className="font-mono">{brl(newTotal)}</strong>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Sinal pago</span>
              <span className="font-mono text-emerald-700">{brl(form.paidAmount)}</span>
            </div>
            {newTotal - form.paidAmount > 0 && (
              <div className="flex justify-between text-xs pt-1 border-t border-primary/10">
                <span className="text-muted-foreground">Restante</span>
                <span className="font-mono text-amber-600 font-semibold">{brl(newTotal - form.paidAmount)}</span>
              </div>
            )}
          </div>

          {/* Observações */}
          <Field label="Observações" icon={<FileText className="size-3.5" />}>
            <textarea value={form.notes} onChange={e => patch({ notes: e.target.value })} className="inp resize-none" rows={2} placeholder="Informações adicionais…" />
          </Field>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-8 pb-7 pt-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-surface transition-colors">
            Cancelar
          </button>
          <button onClick={save} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm">
            Salvar alterações
          </button>
        </div>

        <style>{`
          .inp { width:100%; padding:0.5rem 0.75rem; border-radius:0.625rem; border:1px solid var(--border); background:var(--card); font-size:0.875rem; transition:border-color 0.15s,box-shadow 0.15s; }
          .inp:focus { outline:none; border-color:var(--primary); box-shadow:0 0 0 3px color-mix(in srgb,var(--primary) 15%,transparent); }
        `}</style>
      </div>
    </div>
  );
}
