import * as React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard, Package, Boxes, ShoppingBag, Wallet,
  FileBarChart, Settings as SettingsIcon, Menu, X, LogOut,
  Users,
} from "lucide-react";
import { cls } from "@/lib/format";
import { useAuth } from "@/services/auth/auth-context";

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
  const [open, setOpen] = React.useState(false);
  const loc = useLocation();
  const { user, signOut } = useAuth();

  React.useEffect(() => { setOpen(false); }, [loc.pathname]);

  return (
    <div className="min-h-screen bg-surface flex">
      {/* mobile topbar */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-card border-b border-border flex items-center justify-between px-4">
        <Link to="/app" className="flex items-center gap-2">
          <div className="size-8 bg-primary rounded-lg grid place-items-center text-primary-foreground font-display font-bold">P</div>
          <span className="font-bold text-primary-dark">PinkLove</span>
        </Link>
        <button onClick={() => setOpen(v => !v)} className="size-9 grid place-items-center rounded-lg hover:bg-secondary">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </header>

      <aside className={cls(
        "fixed lg:sticky top-0 z-30 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="hidden lg:flex h-20 items-center px-6 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="size-10 bg-primary rounded-xl grid place-items-center text-primary-foreground font-display font-bold text-lg shadow-soft">P</div>
            <span className="font-bold text-primary-dark text-lg">PinkLove</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto pt-20 lg:pt-5">
          {NAV.map(item => {
            const active = item.exact ? loc.pathname === item.to : loc.pathname.startsWith(item.to);
            const Icon = item.icon;
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

      {open && <div onClick={() => setOpen(false)} className="fixed inset-0 bg-black/40 z-20 lg:hidden" />}

      <main className="flex-1 min-w-0 pt-14 lg:pt-0">
        {children}
      </main>
    </div>
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
