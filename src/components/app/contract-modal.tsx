/**
 * ContractModal — Rodada 2
 * Modal de contrato pré-preenchido com dados da venda + empresa.
 * Gera PDF para assinatura via gov.br usando jsPDF (browser-only, sem backend).
 *
 * Uso:
 *   import { ContractModal } from "@/components/app/contract-modal";
 *   <ContractModal sale={sale} onClose={() => setContractSale(null)} />
 *
 * Dependência:
 *   npm install jspdf
 */

import * as React from "react";
import {
  X, Download, FileText, Building2, User, Calendar,
  Package, DollarSign, Phone, MapPin, Hash, Edit3,
  CheckCircle2, AlertCircle, RotateCcw,
} from "lucide-react";
import { profileRepo, kitsRepo, componentsRepo } from "@/services/db";
import type { Sale, KitTierName } from "@/services/db";
import { brl, fmtDateLong, cls } from "@/lib/format";

/* ─── Tipos locais ──────────────────────────────────────────── */
interface ContractData {
  // Empresa (decoradora)
  businessName: string;
  ownerName: string;
  cnpj: string;
  address: string;
  phone: string;
  email: string;
  // Cliente
  customerName: string;
  customerPhone: string;
  // Evento
  kitName: string;
  kitTier: string;
  eventDate: string;
  returnDate: string;
  eventAddress: string;
  // Financeiro
  totalPrice: number;
  paidAmount: number;
  remaining: number;
  paymentDueDate: string;
  // Extras
  extras: Array<{ name: string; qty: number; unitPrice: number; total: number }>;
  // Observações
  notes: string;
  // Cláusulas
  cancellationPolicy: string;
  damagePolicy: string;
}

const TIER_LABEL: Record<KitTierName, string> = {
  bronze: "🥉 Bronze",
  prata:  "🥈 Prata",
  ouro:   "🥇 Ouro",
};

/* ─── Componente principal ──────────────────────────────────── */
export function ContractModal({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const profile    = profileRepo.get();
  const kit        = kitsRepo.get(sale.kitId);
  const components = componentsRepo.list();

  const fmtTs = (ts?: number) => ts ? fmtDateLong(ts) : "—";

  /* Estado editável do contrato */
  const [data, setData] = React.useState<ContractData>(() => ({
    // Empresa
    businessName:      profile?.businessName ?? "",
    ownerName:         profile?.ownerName ?? "",
    cnpj:              (profile as any)?.cnpj ?? "",
    address:           (profile as any)?.address ?? "",
    phone:             profile?.phone ?? "",
    email:             profile?.email ?? "",
    // Cliente
    customerName:      sale.customerName,
    customerPhone:     sale.customerPhone ?? "",
    // Evento
    kitName:           sale.kitNameSnapshot,
    kitTier:           sale.kitTier ? TIER_LABEL[sale.kitTier] : "Padrão",
    eventDate:         fmtTs(sale.eventDate),
    returnDate:        fmtTs(sale.returnDate),
    eventAddress:      "",
    // Financeiro
    totalPrice:        sale.totalPrice,
    paidAmount:        sale.paidAmount,
    remaining:         Math.max(0, sale.totalPrice - sale.paidAmount),
    paymentDueDate:    fmtTs(sale.eventDate), // padrão: dia do evento
    // Extras
    extras: (sale.extraItems ?? []).map(e => {
      const comp = components.find(c => c.id === e.componentId);
      return {
        name:      e.name ?? comp?.name ?? e.componentId,
        qty:       e.quantity,
        unitPrice: e.unitPrice,
        total:     e.quantity * e.unitPrice,
      };
    }),
    // Cláusulas
    notes: sale.notes ?? "",
    cancellationPolicy:
      "O cancelamento com até 7 dias de antecedência devolve 50% do sinal. " +
      "Cancelamentos com menos de 7 dias não geram reembolso do sinal.",
    damagePolicy:
      "Itens de locação danificados ou não devolvidos no prazo serão cobrados " +
      "pelo valor de reposição. O contratante é responsável pela guarda dos itens.",
  }));

  const [generating, setGenerating] = React.useState(false);
  const patch = (diff: Partial<ContractData>) => setData(d => ({ ...d, ...diff }));

  /* ─── Geração do PDF via jsPDF ────────────────────────────── */
  const generatePDF = async () => {
    setGenerating(true);
    try {
      // Importação dinâmica para não afetar o bundle inicial
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const W = 210; // largura A4
      const margin = 20;
      const contentW = W - margin * 2;
      let y = 20;

      const LINE_H   = 6;
      const SECTION_H = 10;

      /* helpers */
      const line = (x1: number, y1: number, x2: number, y2: number, color = "#e5e7eb") => {
        doc.setDrawColor(color);
        doc.line(x1, y1, x2, y2);
      };
      const text = (str: string, x: number, yy: number, opts?: { size?: number; bold?: boolean; color?: string; align?: "left"|"center"|"right" }) => {
        doc.setFontSize(opts?.size ?? 10);
        doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
        doc.setTextColor(opts?.color ?? "#111827");
        doc.text(str, x, yy, { align: opts?.align ?? "left" });
      };
      const section = (title: string) => {
        y += 4;
        doc.setFillColor("#fce7f3");
        doc.roundedRect(margin, y, contentW, SECTION_H, 2, 2, "F");
        text(title.toUpperCase(), margin + 4, y + 6.5, { size: 8, bold: true, color: "#9d174d" });
        y += SECTION_H + 3;
      };
      const row = (label: string, value: string) => {
        text(label, margin, y, { size: 8, bold: true, color: "#6b7280" });
        text(value || "—", margin + 48, y, { size: 9, color: "#111827" });
        y += LINE_H;
      };
      const checkPage = (needed = 20) => {
        if (y + needed > 275) { doc.addPage(); y = 20; }
      };

      /* ── Cabeçalho ── */
      doc.setFillColor("#fdf2f8");
      doc.rect(0, 0, W, 38, "F");

      text("CONTRATO DE PRESTAÇÃO DE SERVIÇOS", W / 2, 13, { size: 14, bold: true, color: "#9d174d", align: "center" });
      text("Decoração de Festas", W / 2, 20, { size: 9, color: "#be185d", align: "center" });

      const now = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
      text(`Emitido em ${now}`, W / 2, 27, { size: 8, color: "#6b7280", align: "center" });

      line(margin, 33, W - margin, 33, "#fbcfe8");

      const contractNum = `PL-${sale.id.slice(0,8).toUpperCase()}`;
      text(`Nº ${contractNum}`, W - margin, 27, { size: 8, color: "#9d174d", align: "right" });

      y = 44;

      /* ── Partes ── */
      section("1. PARTES");

      text("CONTRATADO (Prestador de Serviços)", margin, y, { size: 9, bold: true });
      y += LINE_H;
      row("Nome / Razão Social:", data.businessName);
      row("Responsável:",        data.ownerName);
      row("CNPJ / CPF:",         data.cnpj);
      row("Endereço:",           data.address);
      row("Telefone:",           data.phone);
      row("E-mail:",             data.email);

      y += 3;
      text("CONTRATANTE (Cliente)", margin, y, { size: 9, bold: true });
      y += LINE_H;
      row("Nome:",    data.customerName);
      row("Telefone:",data.customerPhone);

      /* ── Objeto ── */
      checkPage(40);
      section("2. OBJETO DO CONTRATO");

      row("Kit:",         data.kitName);
      row("Nível:",       data.kitTier);
      row("Data do evento:", data.eventDate);
      if (data.returnDate !== "—") row("Data de retorno:", data.returnDate);
      if (data.eventAddress) row("Local do evento:", data.eventAddress);

      /* Extras */
      if (data.extras.length > 0) {
        y += 3;
        text("Acessórios extras incluídos:", margin, y, { size: 8, bold: true, color: "#6b7280" });
        y += LINE_H;
        data.extras.forEach(e => {
          text(`• ${e.name}`, margin + 4, y, { size: 8 });
          text(`${e.qty}x  ${brl(e.unitPrice)}  =  ${brl(e.total)}`, margin + 80, y, { size: 8, color: "#6b7280" });
          y += LINE_H - 1;
        });
      }

      /* ── Valores ── */
      checkPage(45);
      section("3. VALORES E PAGAMENTO");

      row("Valor total do contrato:", brl(data.totalPrice));
      row("Sinal pago (agendamento):", brl(data.paidAmount));
      row("Saldo restante:",           brl(data.remaining));
      row("Vencimento do saldo:",      data.paymentDueDate);

      if (data.remaining > 0) {
        y += 2;
        doc.setFillColor("#fffbeb");
        doc.roundedRect(margin, y, contentW, 10, 2, 2, "F");
        text(
          `⚠  Pagamento do saldo de ${brl(data.remaining)} deverá ser realizado até ${data.paymentDueDate}.`,
          margin + 4, y + 6.5, { size: 8, color: "#92400e" }
        );
        y += 14;
      }

      /* ── Cláusulas ── */
      checkPage(50);
      section("4. CANCELAMENTO");
      const cancelLines = doc.splitTextToSize(data.cancellationPolicy, contentW - 4);
      doc.setFontSize(9); doc.setFont("helvetica","normal"); doc.setTextColor("#374151");
      doc.text(cancelLines, margin + 2, y);
      y += cancelLines.length * LINE_H + 2;

      checkPage(40);
      section("5. DANOS E DEVOLUÇÕES");
      const damageLines = doc.splitTextToSize(data.damagePolicy, contentW - 4);
      doc.setFontSize(9); doc.setFont("helvetica","normal"); doc.setTextColor("#374151");
      doc.text(damageLines, margin + 2, y);
      y += damageLines.length * LINE_H + 2;

      if (data.notes) {
        checkPage(30);
        section("6. OBSERVAÇÕES");
        const notesLines = doc.splitTextToSize(data.notes, contentW - 4);
        doc.setFontSize(9); doc.setFont("helvetica","normal"); doc.setTextColor("#374151");
        doc.text(notesLines, margin + 2, y);
        y += notesLines.length * LINE_H + 2;
      }

      /* ── Assinaturas ── */
      checkPage(55);
      y += 8;
      line(margin, y, W - margin, y, "#e5e7eb");
      y += 8;

      text("As partes declaram estar de acordo com todos os termos deste contrato.", W / 2, y, {
        size: 9, color: "#6b7280", align: "center",
      });
      y += 14;

      const sigW = (contentW - 10) / 2;
      // Assinatura contratado
      line(margin, y + 12, margin + sigW, y + 12, "#9ca3af");
      text(data.businessName || "Contratado", margin + sigW / 2, y + 18, { size: 8, color: "#374151", align: "center" });
      text("Prestador de Serviços", margin + sigW / 2, y + 23, { size: 7, color: "#9ca3af", align: "center" });

      // Assinatura contratante
      const sigX2 = margin + sigW + 10;
      line(sigX2, y + 12, sigX2 + sigW, y + 12, "#9ca3af");
      text(data.customerName || "Contratante", sigX2 + sigW / 2, y + 18, { size: 8, color: "#374151", align: "center" });
      text("Contratante", sigX2 + sigW / 2, y + 23, { size: 7, color: "#9ca3af", align: "center" });

      y += 30;
      text(`Documento gerado pelo Decora Gestão · ${now} · Ref: ${contractNum}`, W / 2, y, {
        size: 7, color: "#d1d5db", align: "center",
      });

      /* ── Download ── */
      const filename = `contrato-${sale.customerName.replace(/\s+/g,"-").toLowerCase()}-${contractNum}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error("[contrato] erro ao gerar PDF:", err);
      alert("Erro ao gerar o PDF. Verifique se o jsPDF está instalado:\nnpm install jspdf");
    } finally {
      setGenerating(false);
    }
  };

  /* ─── Render ─────────────────────────────────────────────── */
  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/50 z-50 grid place-items-center p-4 backdrop-blur-sm overflow-y-auto">
      <div
        onClick={e => e.stopPropagation()}
        className="bg-card rounded-3xl w-full max-w-2xl shadow-2xl my-8"
        style={{ maxHeight: "92vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-pink-50 flex items-center justify-center">
              <FileText className="size-5 text-pink-600" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">Contrato de serviço</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Revise os dados e baixe o PDF para assinatura
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface text-muted-foreground transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <div className="px-8 py-6 space-y-6">

          {/* Aviso de campos em branco */}
          {(!data.cnpj || !data.address) && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <AlertCircle className="size-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-xs text-amber-800">
                <strong>Perfil incompleto.</strong> Preencha CNPJ e endereço abaixo, ou atualize em{" "}
                <strong>Configurações → Meu negócio</strong> para não precisar preencher toda vez.
              </div>
            </div>
          )}

          {/* ── Seção: Empresa ── */}
          <Section icon={<Building2 className="size-4 text-pink-600" />} title="Dados da empresa (contratado)">
            <div className="grid grid-cols-2 gap-3">
              <EditField label="Nome do negócio" value={data.businessName} onChange={v => patch({ businessName: v })} />
              <EditField label="Responsável" value={data.ownerName} onChange={v => patch({ ownerName: v })} />
              <EditField label="CNPJ ou CPF" value={data.cnpj} onChange={v => patch({ cnpj: v })} placeholder="00.000.000/0001-00" />
              <EditField label="Telefone" value={data.phone} onChange={v => patch({ phone: v })} />
              <EditField label="Endereço" value={data.address} onChange={v => patch({ address: v })} className="col-span-2" />
              <EditField label="E-mail" value={data.email} onChange={v => patch({ email: v })} className="col-span-2" />
            </div>
          </Section>

          {/* ── Seção: Cliente ── */}
          <Section icon={<User className="size-4 text-violet-600" />} title="Dados do cliente (contratante)">
            <div className="grid grid-cols-2 gap-3">
              <EditField label="Nome completo" value={data.customerName} onChange={v => patch({ customerName: v })} />
              <EditField label="WhatsApp / Telefone" value={data.customerPhone} onChange={v => patch({ customerPhone: v })} />
            </div>
          </Section>

          {/* ── Seção: Evento ── */}
          <Section icon={<Calendar className="size-4 text-blue-600" />} title="Detalhes do evento">
            <div className="grid grid-cols-2 gap-3">
              <ReadField label="Kit contratado" value={`${data.kitName} — ${data.kitTier}`} />
              <ReadField label="Data do evento" value={data.eventDate} />
              {data.returnDate !== "—" && <ReadField label="Data de retorno" value={data.returnDate} icon={<RotateCcw className="size-3" />} />}
              <EditField label="Local do evento" value={data.eventAddress} onChange={v => patch({ eventAddress: v })} placeholder="Endereço onde acontecerá a festa" className="col-span-2" />
            </div>
          </Section>

          {/* ── Seção: Financeiro ── */}
          <Section icon={<DollarSign className="size-4 text-emerald-600" />} title="Valores e pagamento">
            <div className="grid grid-cols-3 gap-3">
              <ReadField label="Valor total" value={brl(data.totalPrice)} highlight />
              <ReadField label="Sinal pago" value={brl(data.paidAmount)} />
              <ReadField
                label="Saldo restante"
                value={brl(data.remaining)}
                highlight={data.remaining > 0}
                warn={data.remaining > 0}
              />
            </div>
            <EditField
              label="Vencimento do saldo restante"
              value={data.paymentDueDate}
              onChange={v => patch({ paymentDueDate: v })}
              placeholder="Ex: dia do evento ou data específica"
            />

            {/* Extras */}
            {data.extras.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Acessórios extras</p>
                <div className="space-y-1">
                  {data.extras.map((e, i) => (
                    <div key={i} className="flex items-center justify-between bg-surface border border-border rounded-xl px-3 py-2 text-xs">
                      <span className="font-medium">{e.name}</span>
                      <span className="text-muted-foreground">{e.qty}× {brl(e.unitPrice)} = <strong>{brl(e.total)}</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* ── Seção: Cláusulas ── */}
          <Section icon={<Edit3 className="size-4 text-gray-500" />} title="Cláusulas do contrato">
            <EditField
              label="Política de cancelamento"
              value={data.cancellationPolicy}
              onChange={v => patch({ cancellationPolicy: v })}
              multiline
            />
            <EditField
              label="Política de danos e devoluções"
              value={data.damagePolicy}
              onChange={v => patch({ damagePolicy: v })}
              multiline
            />
            <EditField
              label="Observações adicionais"
              value={data.notes}
              onChange={v => patch({ notes: v })}
              multiline
              placeholder="Informações extras que devem constar no contrato…"
            />
          </Section>

          {/* Preview resumido */}
          <div className="rounded-xl bg-pink-50 border border-pink-100 p-4 text-xs text-pink-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-pink-600" /> Resumo do contrato</p>
            <p>Prestador: <strong>{data.businessName}</strong> ({data.cnpj || "CNPJ não informado"})</p>
            <p>Cliente: <strong>{data.customerName}</strong></p>
            <p>Evento: <strong>{data.eventDate}</strong> — {data.kitName} {data.kitTier}</p>
            <p>Total: <strong>{brl(data.totalPrice)}</strong> · Sinal: {brl(data.paidAmount)} · Restante: {brl(data.remaining)}</p>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 pb-7 pt-4 border-t border-border">
          <p className="text-[11px] text-muted-foreground">
            O PDF gerado pode ser assinado digitalmente em{" "}
            <a href="https://assinador.iti.br" target="_blank" rel="noreferrer" className="text-primary underline">
              assinador.iti.br
            </a>
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-surface transition-colors">
              Fechar
            </button>
            <button
              onClick={generatePDF}
              disabled={generating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-60"
            >
              <Download className="size-4" />
              {generating ? "Gerando…" : "Baixar contrato PDF"}
            </button>
          </div>
        </div>

        <style>{`
          .inp-contract {
            width: 100%;
            padding: 0.5rem 0.75rem;
            border-radius: 0.625rem;
            border: 1px solid var(--border);
            background: var(--card);
            font-size: 0.875rem;
            transition: border-color 0.15s, box-shadow 0.15s;
          }
          .inp-contract:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 15%, transparent);
          }
        `}</style>
      </div>
    </div>
  );
}

/* ─── Sub-componentes ───────────────────────────────────────── */
function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-sm font-bold">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function EditField({
  label, value, onChange, placeholder, multiline, className,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean; className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="inp-contract resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="inp-contract"
        />
      )}
    </div>
  );
}

function ReadField({
  label, value, highlight, warn, icon,
}: {
  label: string; value: string; highlight?: boolean; warn?: boolean; icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">{label}</p>
      <div className={cls(
        "px-3 py-2 rounded-xl border text-sm font-semibold flex items-center gap-1.5",
        warn    ? "bg-amber-50 border-amber-200 text-amber-800"    :
        highlight ? "bg-primary/5 border-primary/20 text-primary"  :
        "bg-surface border-border text-foreground"
      )}>
        {icon && <span className="opacity-60">{icon}</span>}
        {value}
      </div>
    </div>
  );
}