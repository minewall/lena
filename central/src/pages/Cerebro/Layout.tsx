import { Outlet } from "react-router-dom";
import { SubNav, type SubNavGroup } from "../../components/SubNav";

const groups: SubNavGroup[] = [
  {
    label: "Negócio",
    items: [
      { to: "/cerebro", label: "Dados gerais", desc: "Nome, horários, endereço", end: true },
      { to: "/cerebro/servicos", label: "Serviços", desc: "O que a Lena oferece e agenda" },
    ],
  },
  {
    label: "Atendimento",
    items: [
      { to: "/cerebro/tom", label: "Tom e IA", desc: "Personalidade e modelo" },
      { to: "/cerebro/faq", label: "FAQ", desc: "Perguntas e respostas prontas" },
      { to: "/cerebro/limites", label: "Limites", desc: "Restrições e quando escalar" },
    ],
  },
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

      <div className="grid grid-cols-[250px_1fr] items-start gap-6">
        <SubNav groups={groups} />
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
