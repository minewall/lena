import { useEffect, useState, type ComponentType } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";
import {
  IconBrain,
  IconBuilding,
  IconCalendar,
  IconChart,
  IconChevrons,
  IconDashboard,
  IconLogout,
  IconMessage,
  IconPlus,
  IconSettings,
  IconTarget,
  IconUsers,
} from "./icons";

/** Rotas que ocupam a área inteira (sem container nem breadcrumb). */
const FULL_BLEED_PREFIXES = ["/conversas"];

/** Páginas de formulário leem melhor estreitas; o resto (operação) usa a tela. */
const FORM_PREFIXES = ["/cerebro", "/configuracoes", "/criar-tenant"];

interface NavChild {
  to: string;
  label: string;
  end?: boolean;
}

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  /** Sub-abas: o item vira acordeão (clique abre/fecha; navegação nas filhas). */
  children?: NavChild[];
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
      { to: "/relatorios", label: "Relatórios", icon: IconChart },
    ],
  },
  {
    label: "Lena",
    items: [
      {
        to: "/cerebro",
        label: "Cérebro",
        icon: IconBrain,
        adminOnly: true,
        children: [
          { to: "/cerebro", label: "Dados gerais", end: true },
          { to: "/cerebro/servicos", label: "Serviços" },
          { to: "/cerebro/tom", label: "Tom e IA" },
          { to: "/cerebro/faq", label: "FAQ" },
          { to: "/cerebro/limites", label: "Limites" },
        ],
      },
      {
        to: "/configuracoes",
        label: "Configurações",
        icon: IconSettings,
        adminOnly: true,
        children: [
          { to: "/configuracoes", label: "Geral", end: true },
          { to: "/configuracoes/whatsapp", label: "WhatsApp" },
          { to: "/configuracoes/equipe", label: "Equipe" },
        ],
      },
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
  const isForm = FORM_PREFIXES.some((p) => pathname.startsWith(p));
  const containerClass = fullBleed
    ? "h-full"
    : isForm
      ? "mx-auto w-full max-w-5xl px-8 py-7"
      : "mx-auto w-full max-w-[1480px] px-8 py-7";

  const currentTenant = tenants.find((t) => t.id === currentTenantId) ?? null;

  // Acordeão: itens com filhas abrem/fecham no clique; rota ativa abre sozinha.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  useEffect(() => {
    for (const g of NAV_GROUPS) {
      for (const item of g.items) {
        if (item.children && pathname.startsWith(item.to)) {
          setExpanded((prev) => (prev[item.to] ? prev : { ...prev, [item.to]: true }));
        }
      }
    }
  }, [pathname]);

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
          <img
            src="/lena-avatar.png"
            alt="Lena"
            className="h-8 w-8 rounded-full object-cover ring-2 ring-terracota/60"
          />
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

                if (!item.children) {
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
                }

                const isOpen = expanded[item.to] ?? false;
                const sectionActive = pathname.startsWith(item.to);
                return (
                  <div key={item.to} className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded((prev) => ({ ...prev, [item.to]: !isOpen }))
                      }
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] transition ${
                        sectionActive && !isOpen
                          ? "bg-white/10 font-semibold text-creme"
                          : "text-creme/70 hover:bg-white/5 hover:text-creme"
                      }`}
                    >
                      <Icon size={16} />
                      {item.label}
                      <span
                        className={`ml-auto text-[10px] text-creme/40 transition-transform ${
                          isOpen ? "rotate-90" : ""
                        }`}
                      >
                        ›
                      </span>
                    </button>
                    {isOpen ? (
                      <div className="ml-[17px] flex flex-col gap-0.5 border-l border-white/10 pl-3">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.to}
                            to={child.to}
                            end={child.end}
                            className={({ isActive }) =>
                              `rounded-md px-2 py-1.5 text-[12.5px] transition ${
                                isActive
                                  ? "bg-terracota font-semibold text-white"
                                  : "text-creme/60 hover:bg-white/5 hover:text-creme"
                              }`
                            }
                          >
                            {child.label}
                          </NavLink>
                        ))}
                      </div>
                    ) : null}
                  </div>
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
          <div className={containerClass}>
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
