import * as React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard, Package, Boxes, ShoppingBag, Wallet,
  FileBarChart, Settings as SettingsIcon, Menu, X, LogOut,
  Users, Bell, CalendarClock, RotateCcw, AlertTriangle, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { cls, fmtDate } from "@/lib/format";
import { useAuth } from "@/services/auth/auth-context";
import { useDb } from "@/hooks/use-db";
import { salesRepo, settingsRepo, dbRefresh, type Sale } from "@/services/db";
import { AssistantOrb } from "@/components/app/assistant-orb";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const NAV: NavItem[] = [
  { to: "/app",            label: "Dashboard",          icon: LayoutDashboard, exact: true },
  { to: "/app/kits",       label: "Kits & BOM",          icon: Boxes },
  { to: "/app/components", label: "Acervo",              icon: Package },
  { to: "/app/sales",      label: "Locações & Agenda",   icon: ShoppingBag },
  { to: "/app/finance",    label: "Finanças",            icon: Wallet },
  { to: "/app/reports",    label: "Relatórios",          icon: FileBarChart },
  { to: "/app/settings",   label: "Configurações",       icon: SettingsIcon },
  { to: "/app/customers",  label: "Clientes",            icon: Users },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open,       setOpen]       = React.useState(false);
  const [notifOpen,  setNotifOpen]  = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const loc = useLocation();
  const { user, signOut } = useAuth();

  React.useEffect(() => { setOpen(false); }, [loc.pathname]);

  // Não há mais sincronização em tempo real (custo de leitura no Firestore) — os dados são
  // buscados no login e sob demanda, por este botão, sempre visível em qualquer tela.
  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await dbRefresh();
      toast.success("Dados atualizados");
    } catch (e) {
      console.error("[app-shell] refresh", e);
      toast.error("Não foi possível atualizar agora. Tente de novo.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  const settings = useDb(() => settingsRepo.get());

  /* ── Lembretes: eventos em 48h + retornos vencidos/próximos ── */
  const allSales = useDb(() => salesRepo.list());

  type Reminder = { type: "evento" | "retorno"; sale: Sale; diff: number; overdue: boolean };
  const reminders = React.useMemo((): Reminder[] => {
    const now    = Date.now();
    const twoDay = 2 * 86_400_000;
    const items: Reminder[] = [];
    allSales
      .filter(s => !["cancelado", "concluido"].includes(s.status))
      .forEach(s => {
        const toEvent = s.eventDate - now;
        if (toEvent >= 0 && toEvent <= twoDay) {
          items.push({ type: "evento", sale: s, diff: toEvent, overdue: false });
        }
        if (s.returnDate) {
          const toReturn = s.returnDate - now;
          if (toReturn <= twoDay) {
            items.push({ type: "retorno", sale: s, diff: toReturn, overdue: toReturn < 0 });
          }
        }
      });
    return items.sort((a, b) => a.diff - b.diff);
  }, [allSales]);

  const urgentCount = reminders.filter(r => r.overdue || r.diff < 86_400_000).length;

  return (
    <div className="min-h-screen bg-surface flex">
      {/* mobile topbar */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-card border-b border-border flex items-center justify-between px-4">
        <Link to="/app" className="flex items-center gap-2">
          <div className="size-8 bg-primary rounded-lg grid place-items-center text-primary-foreground font-display font-bold">P</div>
          <span className="font-bold text-primary-dark">PinkLove</span>
        </Link>
        <div className="flex items-center gap-2">
          <RefreshButton loading={refreshing} onClick={handleRefresh} />
          <NotifButton count={reminders.length} urgent={urgentCount > 0} onClick={() => setNotifOpen(v => !v)} />
          <button onClick={() => setOpen(v => !v)} className="size-9 grid place-items-center rounded-lg hover:bg-secondary">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </header>

      <aside className={cls(
        "fixed lg:sticky top-0 z-30 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="hidden lg:flex h-20 items-center justify-between px-6 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="size-10 bg-primary rounded-xl grid place-items-center text-primary-foreground font-display font-bold text-lg shadow-soft">P</div>
            <span className="font-bold text-primary-dark text-lg">PinkLove</span>
          </Link>
          <div className="flex items-center gap-1">
            <RefreshButton loading={refreshing} onClick={handleRefresh} />
            <NotifButton count={reminders.length} urgent={urgentCount > 0} onClick={() => setNotifOpen(v => !v)} />
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto pt-20 lg:pt-5">
          {NAV.map(item => {
            const active = item.exact ? loc.pathname === item.to : loc.pathname.startsWith(item.to);
            const Icon   = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cls(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-9 rounded-full bg-primary-soft grid place-items-center font-bold text-primary text-sm">
              {(user?.name ?? "?")[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{user?.name ?? "Visitante"}</div>
              <div className="text-[10px] text-muted-foreground truncate">{user?.email ?? "modo demo"}</div>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary py-2 rounded-lg hover:bg-secondary"
          >
            <LogOut className="size-3.5" /> Sair
          </button>
        </div>
      </aside>

      {open      && <div onClick={() => setOpen(false)}      className="fixed inset-0 bg-black/40 z-20 lg:hidden" />}
      {notifOpen && <div onClick={() => setNotifOpen(false)} className="fixed inset-0 z-40" />}

      {/* Painel de lembretes */}
      {notifOpen && (
        <div className="fixed top-16 lg:top-4 right-4 z-50 w-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="font-semibold text-sm flex items-center gap-2">
              <Bell className="size-4 text-primary" /> Lembretes
            </p>
            <button onClick={() => setNotifOpen(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-surface">
              <X className="size-3.5" />
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {reminders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">🎉 Nenhum evento nas próximas 48h.</p>
            ) : (
              <div className="divide-y divide-border">
                {reminders.map((r, i) => (
                  <div
                    key={i}
                    className={cls(
                      "flex items-start gap-3 px-4 py-3 text-sm",
                      r.overdue ? "bg-red-50" : r.diff < 86_400_000 ? "bg-amber-50" : "",
                    )}
                  >
                    <div className="mt-0.5 shrink-0">
                      {r.type === "evento"
                        ? <CalendarClock className={cls("size-4", r.diff < 86_400_000 ? "text-amber-500" : "text-blue-500")} />
                        : <RotateCcw    className={cls("size-4", r.overdue ? "text-red-500" : "text-orange-400")} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{r.sale.customerName}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{r.sale.kitNameSnapshot}</p>
                      <p className={cls(
                        "text-[11px] font-semibold mt-0.5",
                        r.overdue ? "text-red-600" : r.diff < 86_400_000 ? "text-amber-600" : "text-blue-600",
                      )}>
                        {r.type === "evento" ? "📅 Evento" : r.overdue ? "⚠️ Retorno vencido" : "🔄 Retorno"}
                        {" · "}{fmtDate(r.type === "evento" ? r.sale.eventDate : r.sale.returnDate!)}
                      </p>
                    </div>
                    {r.overdue && <AlertTriangle className="size-3.5 text-red-500 shrink-0 mt-1" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 pt-14 lg:pt-0">
        {children}
      </main>

      {settings.assistantEnabled && <AssistantOrb />}
    </div>
  );
}

function RefreshButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="relative size-9 grid place-items-center rounded-xl hover:bg-secondary transition-colors disabled:opacity-50"
      title="Atualizar dados"
      aria-label="Atualizar dados"
    >
      <RefreshCw className={cls("size-4 text-muted-foreground", loading && "animate-spin")} />
    </button>
  );
}

function NotifButton({ count, urgent, onClick }: { count: number; urgent: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cls(
        "relative size-9 grid place-items-center rounded-xl transition-colors",
        urgent ? "hover:bg-amber-100" : "hover:bg-secondary",
      )}
      title="Lembretes"
    >
      <Bell className={cls("size-4", urgent ? "text-amber-500" : "text-muted-foreground")} />
      {count > 0 && (
        <span className={cls(
          "absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full text-[9px] font-bold text-white grid place-items-center px-0.5",
          urgent ? "bg-red-500" : "bg-primary",
        )}>
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
      <div>
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">{title}</h1>
        {subtitle && <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex gap-2">{action}</div>}
    </div>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cls("bg-card border border-border rounded-2xl p-6", className)}>{children}</div>;
}
