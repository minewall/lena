import type { ComponentType } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";
import {
  IconBrain,
  IconBuilding,
  IconCalendar,
  IconChevrons,
  IconDashboard,
  IconLogout,
  IconMessage,
  IconPlus,
  IconSettings,
  IconTarget,
  IconUsers,
  LenaSelo,
} from "./icons";

/** Rotas que ocupam a área inteira (sem container nem breadcrumb). */
const FULL_BLEED_PREFIXES = ["/conversas"];

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  adminOnly?: boolean;
  platformOnly?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
  platformOnly?: boolean;
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Operação",
    items: [
      { to: "/", label: "Hoje", icon: IconDashboard },
      { to: "/conversas", label: "Conversas", icon: IconMessage },
      { to: "/agenda", label: "Agenda", icon: IconCalendar },
      { to: "/clientes", label: "Clientes", icon: IconUsers },
    ],
  },
  {
    label: "Lena",
    items: [
      { to: "/cerebro", label: "Cérebro", icon: IconBrain, adminOnly: true },
      { to: "/configuracoes", label: "Configurações", icon: IconSettings, adminOnly: true },
    ],
  },
  {
    label: "Averse",
    platformOnly: true,
    items: [
      { to: "/prospeccao", label: "Prospecção", icon: IconTarget, platformOnly: true },
      { to: "/averse/tenants", label: "Clientes Averse", icon: IconBuilding, platformOnly: true },
    ],
  },
];

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  operador: "Operador",
};

export function Layout() {
  const tenants = useAuth((s) => s.tenants);
  const currentTenantId = useAuth((s) => s.currentTenantId);
  const setCurrentTenant = useAuth((s) => s.setCurrentTenant);
  const signOut = useAuth((s) => s.signOut);
  const user = useAuth((s) => s.user);
  const isAdmin = useAuth((s) => s.isAdmin());
  const currentRole = useAuth((s) => s.currentRole());
  const isPlatformAdmin = useAuth((s) => s.isPlatformAdmin);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const fullBleed = FULL_BLEED_PREFIXES.some((p) => pathname.startsWith(p));

  const currentTenant = tenants.find((t) => t.id === currentTenantId) ?? null;

  const visibleGroups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter(
      (item) =>
        (!item.adminOnly || isAdmin) && (!item.platformOnly || isPlatformAdmin),
    ),
  })).filter((g) => g.items.length > 0 && (!g.platformOnly || isPlatformAdmin));

  const roleLabel = isPlatformAdmin
    ? "Averse"
    : currentRole
      ? ROLE_LABEL[currentRole]
      : null;

  const userName = user?.email?.split("@")[0] ?? "";
  const userInitial = (userName[0] ?? "?").toUpperCase();
  const tenantInitials = (currentTenant?.name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="grid h-full grid-cols-[248px_1fr] bg-creme">
      {/* ── Sidebar café ─────────────────────────────────────────────── */}
      <aside className="flex flex-col gap-4 bg-cafe px-3.5 py-5 text-creme">
        <Link to="/" className="flex items-center gap-2.5 px-2">
          <LenaSelo size={28} />
          <span className="font-display text-[21px] font-bold tracking-tight">
            lena<span className="text-terracota">.</span>
          </span>
        </Link>

        {tenants.length > 0 ? (
          <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2">
            <span className="grid h-[26px] w-[26px] flex-shrink-0 place-items-center rounded-lg bg-terracota text-[11px] font-bold text-white">
              {tenantInitials}
            </span>
            <span className="min-w-0 flex-1">
              <select
                value={currentTenantId ?? ""}
                onChange={(e) => setCurrentTenant(e.target.value)}
                className="w-full cursor-pointer appearance-none truncate border-none bg-transparent text-[13px] font-semibold text-creme outline-none"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id} className="text-cafe">
                    {t.name}
                  </option>
                ))}
              </select>
              {currentTenant?.segment ? (
                <span className="block text-[10.5px] leading-tight text-creme/50">
                  {currentTenant.segment}
                </span>
              ) : null}
            </span>
            <IconChevrons size={14} className="flex-shrink-0 opacity-45" />
          </label>
        ) : (
          <Link
            to="/criar-tenant"
            className="rounded-xl bg-terracota px-3 py-2 text-center text-sm font-medium text-white hover:bg-terracota-dark"
          >
            Criar primeiro negócio
          </Link>
        )}

        <nav className="flex flex-col gap-0.5">
          {visibleGroups.map((group) => (
            <div key={group.label} className="flex flex-col gap-0.5">
              <div className="px-2.5 pb-1 pt-3.5 text-[9.5px] font-bold uppercase tracking-[0.12em] text-creme/35">
                {group.label}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] transition ${
                        isActive
                          ? "bg-terracota font-semibold text-white shadow-[0_6px_18px_-8px_rgba(227,91,46,0.7)]"
                          : "text-creme/70 hover:bg-white/5 hover:text-creme"
                      }`
                    }
                  >
                    <Icon size={16} />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-2.5 border-t border-white/10 px-1.5 pt-3">
          <span className="grid h-[30px] w-[30px] flex-shrink-0 place-items-center rounded-full bg-salvia text-[12px] font-bold text-white">
            {userInitial}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12.5px] font-semibold text-creme">{userName}</span>
            {roleLabel ? (
              <span className="block text-[10.5px] text-creme/45">{roleLabel}</span>
            ) : null}
          </span>
          <button
            type="button"
            title="Sair"
            onClick={async () => {
              await signOut();
              navigate("/login", { replace: true });
            }}
            className="rounded-lg p-1.5 text-creme/45 transition hover:bg-white/5 hover:text-creme"
          >
            <IconLogout size={15} />
          </button>
        </div>
      </aside>

      {/* ── Conteúdo ─────────────────────────────────────────────────── */}
      <main className="grid grid-rows-[auto_1fr] overflow-hidden">
        <div className="flex items-center gap-3 border-b border-creme-edge bg-creme-soft px-7 py-3">
          <span className="text-[13px] text-cafe-muted">
            {currentTenant ? (
              <>
                {currentTenant.segment} · <b className="font-semibold text-cafe">{currentTenant.name}</b>
              </>
            ) : null}
          </span>
          <Link
            to="/agenda"
            className="ml-auto flex items-center gap-1.5 rounded-[10px] bg-terracota px-4 py-2 text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(227,91,46,0.35)] transition hover:bg-terracota-dark"
          >
            <IconPlus size={14} />
            Agendar
          </Link>
        </div>

        <div className="overflow-auto">
          <div className={fullBleed ? "h-full" : "mx-auto max-w-5xl px-8 py-7"}>
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
