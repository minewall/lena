import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";

/** Rotas que ocupam a área inteira (sem container nem breadcrumb). */
const FULL_BLEED_PREFIXES = ["/conversas"];

const navItems: {
  to: string;
  label: string;
  adminOnly?: boolean;
  platformOnly?: boolean;
}[] = [
  { to: "/", label: "Visão geral" },
  { to: "/clientes", label: "Clientes" },
  { to: "/conversas", label: "Conversas" },
  { to: "/agenda", label: "Agenda" },
  { to: "/cerebro", label: "Cérebro da Lena", adminOnly: true },
  { to: "/prospeccao", label: "Prospecção", platformOnly: true },
  { to: "/averse/tenants", label: "Tenants", platformOnly: true },
  { to: "/configuracoes", label: "Configurações", adminOnly: true },
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
  const visibleNav = navItems.filter(
    (item) =>
      (!item.adminOnly || isAdmin) &&
      (!item.platformOnly || isPlatformAdmin),
  );

  const roleLabel = isPlatformAdmin
    ? "Averse"
    : currentRole
      ? ROLE_LABEL[currentRole]
      : null;

  return (
    <div className="grid h-full grid-cols-[260px_1fr] bg-creme">
      <aside className="flex flex-col gap-6 border-r border-creme-edge bg-creme-soft px-5 py-6">
        <Link to="/" className="font-display text-2xl text-cafe">
          lena<span className="text-terracota">.</span>
        </Link>

        {tenants.length > 0 ? (
          <select
            value={currentTenantId ?? ""}
            onChange={(e) => setCurrentTenant(e.target.value)}
            className="rounded-xl border border-creme-edge bg-white px-3 py-2 text-sm text-cafe"
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        ) : (
          <Link
            to="/criar-tenant"
            className="rounded-xl bg-terracota px-3 py-2 text-center text-sm font-medium text-white hover:bg-terracota-dark"
          >
            Criar primeiro negócio
          </Link>
        )}

        <nav className="flex flex-col gap-1 text-sm">
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 transition ${
                  isActive
                    ? "bg-terracota-soft text-cafe"
                    : "text-cafe-soft hover:bg-creme-edge"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-2 text-xs text-cafe-muted">
          <span className="truncate">{user?.email}</span>
          {roleLabel ? (
            <span className="w-fit rounded-full bg-creme-edge px-2 py-0.5 text-[11px] text-cafe-soft">
              {roleLabel}
            </span>
          ) : null}
          <button
            type="button"
            onClick={async () => {
              await signOut();
              navigate("/login", { replace: true });
            }}
            className="text-left underline hover:text-cafe"
          >
            sair
          </button>
        </div>
      </aside>

      <main className="overflow-auto">
        <div className={fullBleed ? "h-full" : "mx-auto max-w-5xl px-8 py-8"}>
          {currentTenant && !fullBleed ? (
            <div className="mb-6 text-sm text-cafe-muted">
              {currentTenant.segment} ·{" "}
              <span className="text-cafe">{currentTenant.name}</span>
            </div>
          ) : null}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
