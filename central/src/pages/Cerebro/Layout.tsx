import { NavLink, Outlet } from "react-router-dom";

const tabs = [
  { to: "/cerebro", label: "Dados gerais", end: true },
  { to: "/cerebro/tom", label: "Tom e IA" },
  { to: "/cerebro/servicos", label: "Serviços" },
  { to: "/cerebro/faq", label: "FAQ" },
  { to: "/cerebro/limites", label: "Limites" },
];

export function CerebroLayout() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl text-cafe">Cérebro da Lena</h1>
        <p className="mt-1 text-cafe-soft">
          Tudo que a Lena sabe sobre o seu negócio. Quanto mais completo,
          melhor ela atende.
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
