import { NavLink } from "react-router-dom";

/* Sub-navegação lateral para páginas de configuração (padrão validado no
   Haile): grupos com label uppercase, itens com título + descrição.
   Páginas de operação usam sub-abas horizontais, não isto. */

export interface SubNavItem {
  to: string;
  label: string;
  desc: string;
  end?: boolean;
}

export interface SubNavGroup {
  label: string;
  items: SubNavItem[];
}

export function SubNav({ groups }: { groups: SubNavGroup[] }) {
  return (
    <nav className="flex flex-col gap-1 rounded-2xl border border-creme-edge bg-creme-soft p-3">
      {groups.map((group) => (
        <div key={group.label} className="flex flex-col gap-0.5">
          <div className="px-3 pb-1 pt-3 text-[9.5px] font-bold uppercase tracking-[0.12em] text-cafe-muted first:pt-1">
            {group.label}
          </div>
          {group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `group flex items-center gap-2 rounded-xl px-3 py-2 transition ${
                  isActive ? "bg-terracota-soft" : "hover:bg-creme-edge/50"
                }`
              }
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-semibold text-cafe">
                  {item.label}
                </span>
                <span className="block truncate text-[11.5px] text-cafe-muted">
                  {item.desc}
                </span>
              </span>
              <span className="text-cafe-muted transition group-hover:translate-x-0.5">
                ›
              </span>
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}
