import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, ExternalLink, Globe } from "lucide-react";
import { toast } from "sonner";
import { useDb } from "@/hooks/use-db";
import { catalogRepo, kitsRepo } from "@/services/db";
import type { CatalogConfig } from "@/services/db/types";
import { Card, PageHeader } from "@/components/app/app-shell";

export const Route = createFileRoute("/app/catalog")({ component: CatalogPage });

const DEFAULT: CatalogConfig = {
  slug: "",
  businessName: "",
  tagline: "",
  logo: "",
  coverPhoto: "",
  primaryColor: "#e879a0",
  backgroundColor: "#fdfaf9",
  showPrices: true,
  showAvailability: true,
  freight: { enabled: false, ida: 0, volta: 0, idaVolta: 0, radiusKm: 0 },
  social: { whatsapp: "", instagram: "", tiktok: "", email: "" },
  hiddenKitIds: [],
  order: [],
};

function CatalogPage() {
  const current   = useDb(() => catalogRepo.get());
  const allKits   = useDb(() => kitsRepo.list());
  const [cfg, setCfg]       = React.useState<CatalogConfig>(current ?? DEFAULT);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (current) setCfg(current);
  }, [current]);

  const set   = (p: Partial<CatalogConfig>) => setCfg(c => ({ ...c, ...p }));
  const setFr = (p: Partial<CatalogConfig["freight"]>) =>
    setCfg(c => ({ ...c, freight: { ...c.freight, ...p } }));
  const setSo = (p: Partial<CatalogConfig["social"]>) =>
    setCfg(c => ({ ...c, social: { ...c.social, ...p } }));

  const save = async () => {
    if (!cfg.slug.trim()) { toast.error("Defina o slug antes de salvar."); return; }
    setSaving(true);
    try {
      catalogRepo.save(cfg);
      toast.success("Catálogo atualizado!", {
        description: "As mudanças já aparecem no link público.",
      });
    } finally {
      setSaving(false);
    }
  };

  const catalogUrl = cfg.slug ? `https://${cfg.slug}.decoragestao.app` : null;

  // Ordenação e visibilidade de kits
  const activeKits   = allKits.filter(k => k.active);
  const orderedKits  = [
    ...cfg.order.map(id => activeKits.find(k => k.id === id)).filter(Boolean),
    ...activeKits.filter(k => !cfg.order.includes(k.id)),
  ] as typeof activeKits;

  const toggleHide = (id: string) =>
    set({
      hiddenKitIds: cfg.hiddenKitIds.includes(id)
        ? cfg.hiddenKitIds.filter(x => x !== id)
        : [...cfg.hiddenKitIds, id],
    });

  const moveKit = (id: string, dir: -1 | 1) => {
    const ids = orderedKits.map(k => k.id);
    const i = ids.indexOf(id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    set({ order: ids });
  };

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Catálogo White-Label"
        subtitle="Configure como o seu catálogo público aparece para os clientes"
        action={
          catalogUrl ? (
            <a href={catalogUrl} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
              <Globe className="size-4" /> Ver catálogo <ExternalLink className="size-3" />
            </a>
          ) : undefined
        }
      />

      {/* Link público */}
      <Card>
        <h3 className="font-bold mb-5">🔗 Link do catálogo</h3>
        <F label="Slug (subdomínio)">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">https://</span>
            <input
              value={cfg.slug}
              onChange={e => set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
              className="inp flex-1"
              placeholder="seunegocio"
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">.decoragestao.app</span>
          </div>
          {catalogUrl && (
            <a href={catalogUrl} target="_blank" rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
              <ExternalLink className="size-3" /> {catalogUrl}
            </a>
          )}
        </F>
      </Card>

      {/* Identidade */}
      <Card>
        <h3 className="font-bold mb-5">🏪 Identidade</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <F label="Nome do negócio">
            <input value={cfg.businessName} onChange={e => set({ businessName: e.target.value })} className="inp" />
          </F>
          <F label="Slogan">
            <input value={cfg.tagline} onChange={e => set({ tagline: e.target.value })} className="inp" placeholder="Festas inesquecíveis, do seu jeito" />
          </F>
          <F label="URL da logo">
            <input value={cfg.logo ?? ""} onChange={e => set({ logo: e.target.value })} className="inp" placeholder="https://..." />
          </F>
          <F label="URL da foto de capa">
            <input value={cfg.coverPhoto ?? ""} onChange={e => set({ coverPhoto: e.target.value })} className="inp" placeholder="https://..." />
          </F>
        </div>
      </Card>

      {/* Visual */}
      <Card>
        <h3 className="font-bold mb-5">🎨 Visual</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <F label="Cor primária">
            <div className="flex gap-3 items-center">
              <input type="color" value={cfg.primaryColor}
                onChange={e => set({ primaryColor: e.target.value })}
                className="h-10 w-12 rounded-lg border border-border cursor-pointer p-0.5 bg-card" />
              <input value={cfg.primaryColor} onChange={e => set({ primaryColor: e.target.value })} className="inp flex-1" placeholder="#e879a0" />
            </div>
          </F>
          <F label="Cor de fundo">
            <div className="flex gap-3 items-center">
              <input type="color" value={cfg.backgroundColor}
                onChange={e => set({ backgroundColor: e.target.value })}
                className="h-10 w-12 rounded-lg border border-border cursor-pointer p-0.5 bg-card" />
              <input value={cfg.backgroundColor} onChange={e => set({ backgroundColor: e.target.value })} className="inp flex-1" placeholder="#fdfaf9" />
            </div>
          </F>
        </div>
      </Card>

      {/* Contato */}
      <Card>
        <h3 className="font-bold mb-5">📱 Contato público</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <F label="WhatsApp (com DDI, sem espaços)">
            <input value={cfg.social.whatsapp} onChange={e => setSo({ whatsapp: e.target.value })} className="inp" placeholder="5511999998888" />
          </F>
          <F label="Instagram">
            <input value={cfg.social.instagram ?? ""} onChange={e => setSo({ instagram: e.target.value })} className="inp" placeholder="@seuinstagram" />
          </F>
          <F label="TikTok">
            <input value={cfg.social.tiktok ?? ""} onChange={e => setSo({ tiktok: e.target.value })} className="inp" placeholder="@seutiktok" />
          </F>
          <F label="E-mail">
            <input type="email" value={cfg.social.email ?? ""} onChange={e => setSo({ email: e.target.value })} className="inp" placeholder="contato@..." />
          </F>
        </div>
      </Card>

      {/* Frete */}
      <Card>
        <h3 className="font-bold mb-5">🚚 Frete</h3>
        <Toggle
          label="Oferecer frete / montagem com entrega"
          desc="Exibe opções de montagem no local ou entrega com valores no catálogo"
          checked={cfg.freight.enabled}
          onChange={v => setFr({ enabled: v })}
        />
        {cfg.freight.enabled && (
          <div className="mt-4 grid sm:grid-cols-2 gap-4">
            <F label="Somente ida (R$)">
              <input type="number" min={0} value={cfg.freight.ida}
                onChange={e => setFr({ ida: Number(e.target.value) })} className="inp" />
            </F>
            <F label="Somente volta (R$)">
              <input type="number" min={0} value={cfg.freight.volta}
                onChange={e => setFr({ volta: Number(e.target.value) })} className="inp" />
            </F>
            <F label="Ida + volta (R$)">
              <input type="number" min={0} value={cfg.freight.idaVolta}
                onChange={e => setFr({ idaVolta: Number(e.target.value) })} className="inp" />
            </F>
            <F label="Raio de atendimento (km)">
              <input type="number" min={0} value={cfg.freight.radiusKm}
                onChange={e => setFr({ radiusKm: Number(e.target.value) })} className="inp" />
            </F>
          </div>
        )}
      </Card>

      {/* Exibição e ordem dos kits */}
      <Card>
        <h3 className="font-bold mb-5">⚙️ Exibição</h3>
        <div className="space-y-3 mb-6">
          <Toggle
            label="Mostrar preços no catálogo"
            desc="Quando desativado, os preços ficam ocultos para o cliente"
            checked={cfg.showPrices}
            onChange={v => set({ showPrices: v })}
          />
          <Toggle
            label="Mostrar disponibilidade em tempo real"
            desc="O cliente pode verificar se a data do evento está disponível"
            checked={cfg.showAvailability}
            onChange={v => set({ showAvailability: v })}
          />
        </div>

        {activeKits.length > 0 && (
          <>
            <h4 className="text-sm font-semibold mb-1">Visibilidade e ordem dos kits</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Desmarque para ocultar do catálogo público. Use as setas para reordenar.
            </p>
            <div className="space-y-2">
              {orderedKits.map((k, i) => {
                const hidden = cfg.hiddenKitIds.includes(k.id);
                return (
                  <div key={k.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-opacity ${
                      hidden ? "opacity-40 border-border" : "border-border bg-card"
                    }`}>
                    <input type="checkbox" checked={!hidden} onChange={() => toggleHide(k.id)}
                      className="size-4 accent-[var(--primary)] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{k.name}</div>
                      <div className="text-xs text-muted-foreground">{k.theme}</div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => moveKit(k.id, -1)} disabled={i === 0}
                        className="size-7 rounded-lg border border-border grid place-items-center hover:bg-secondary disabled:opacity-30"
                        aria-label="Subir">
                        <ChevronUp className="size-3.5" />
                      </button>
                      <button onClick={() => moveKit(k.id, 1)} disabled={i === orderedKits.length - 1}
                        className="size-7 rounded-lg border border-border grid place-items-center hover:bg-secondary disabled:opacity-30"
                        aria-label="Descer">
                        <ChevronDown className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      <div className="flex justify-end pt-2 pb-10">
        <button onClick={save} disabled={saving}
          className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 disabled:opacity-50 transition">
          {saving ? "Salvando..." : "Salvar catálogo"}
        </button>
      </div>

      <style>{`.inp{width:100%;padding:0.5rem 0.75rem;border-radius:0.625rem;border:1px solid var(--border);background:var(--card);font-size:0.875rem}`}</style>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">{label}</span>
      {children}
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }: {
  label: string; desc: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        className="mt-1 size-4 accent-[var(--primary)]" />
      <div>
        <div className="font-semibold text-sm">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </label>
  );
}
