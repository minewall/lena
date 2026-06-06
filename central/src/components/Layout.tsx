import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";

const navItems = [
  { to: "/", label: "Visão geral" },
  { to: "/cerebro", label: "Cérebro da Lena" },
  { to: "/conversas", label: "Conversas" },
  { to: "/agenda", label: "Agenda" },
  { to: "/configuracoes", label: "Configurações" },
];

export function Layout() {
  const tenants = useAuth((s) => s.tenants);
  const currentTenantId = useAuth((s) => s.currentTenantId);
  const setCurrentTenant = useAuth((s) => s.setCurrentTenant);
  const signOut = useAuth((s) => s.signOut);
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();

  const currentTenant = tenants.find((t) => t.id === currentTenantId) ?? null;

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
          {navItems.map((item) => (
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
        <div className="mx-auto max-w-5xl px-8 py-8">
          {currentTenant ? (
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
