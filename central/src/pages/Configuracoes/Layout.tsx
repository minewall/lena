import { Outlet } from "react-router-dom";
import { SubNav, type SubNavGroup } from "../../components/SubNav";

const groups: SubNavGroup[] = [
  {
    label: "Negócio",
    items: [
      { to: "/configuracoes", label: "Geral", desc: "Dados, fuso e billing", end: true },
    ],
  },
  {
    label: "Integrações",
    items: [
      { to: "/configuracoes/whatsapp", label: "WhatsApp", desc: "Número, Cloud API e saúde" },
    ],
  },
  {
    label: "Time",
    items: [
      { to: "/configuracoes/equipe", label: "Equipe", desc: "Membros, papéis e convites" },
    ],
  },
];

export function ConfiguracoesLayout() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl text-cafe">Configurações</h1>
        <p className="mt-1 text-cafe-soft">Integrações e dados do negócio.</p>
      </header>

      <div className="grid grid-cols-[250px_1fr] items-start gap-6">
        <SubNav groups={groups} />
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
