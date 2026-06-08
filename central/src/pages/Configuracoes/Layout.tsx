import { NavLink, Outlet } from "react-router-dom";

const tabs = [
  { to: "/configuracoes", label: "Geral", end: true },
  { to: "/configuracoes/whatsapp", label: "WhatsApp" },
  { to: "/configuracoes/equipe", label: "Equipe" },
];

export function ConfiguracoesLayout() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl text-cafe">Configurações</h1>
        <p className="mt-1 text-cafe-soft">
          Integrações e dados do negócio.
        </p>
      </header>

      <nav className="flex gap-1 border-b border-creme-edge">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `border-b-2 px-4 py-2 text-sm transition ${
                isActive
                  ? "border-terracota text-cafe"
                  : "border-transparent text-cafe-soft hover:text-cafe"
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
