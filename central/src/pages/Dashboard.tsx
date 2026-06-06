import { Link } from "react-router-dom";
import { useAuth } from "../store/auth";

export function Dashboard() {
  const tenants = useAuth((s) => s.tenants);
  const currentTenantId = useAuth((s) => s.currentTenantId);
  const currentTenant = tenants.find((t) => t.id === currentTenantId) ?? null;

  if (!currentTenant) {
    return (
      <div className="rounded-[var(--radius-card)] border border-creme-edge bg-creme-soft p-8 text-center">
        <h2 className="font-display text-2xl text-cafe">
          Bem-vinda à Central da Lena.
        </h2>
        <p className="mt-2 text-cafe-soft">
          Você ainda não tem um negócio cadastrado. Vamos começar?
        </p>
        <Link
          to="/criar-tenant"
          className="mt-6 inline-block rounded-xl bg-terracota px-5 py-2.5 font-medium text-white hover:bg-terracota-dark"
        >
          Criar primeiro negócio
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl text-cafe">Visão geral</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: "Conversas hoje", value: "—" },
          { label: "Agendamentos", value: "—" },
          { label: "Tempo de resposta", value: "—" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-[var(--radius-card)] border border-creme-edge bg-creme-soft p-5"
          >
            <div className="text-xs uppercase tracking-wide text-cafe-muted">
              {kpi.label}
            </div>
            <div className="mt-1 font-display text-3xl text-cafe">
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[var(--radius-card)] border border-creme-edge bg-creme-soft p-6">
        <h2 className="font-display text-xl text-cafe">Próximos passos</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-cafe-soft">
          <li>Preencher o cérebro da Lena (horários, serviços, FAQ, tom).</li>
          <li>Conectar o número de WhatsApp via Cloud API.</li>
          <li>Conectar a agenda (Google Calendar).</li>
          <li>Convidar a equipe (operadores que atendem o handoff).</li>
        </ul>
      </div>
    </div>
  );
}
