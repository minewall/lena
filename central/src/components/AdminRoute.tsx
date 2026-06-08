import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../store/auth";
import { Card } from "./ui";

/**
 * Protege rotas que só admin do tenant (ou platform admin) pode acessar.
 * Defesa em profundidade: o menu já esconde esses itens para operador,
 * mas se alguém digitar a URL direto, cai aqui. O backend (RLS) é a
 * barreira real; isto é só UX.
 */
export function AdminRoute({ children }: { children: ReactNode }) {
  const isAdmin = useAuth((s) => s.isAdmin());
  const status = useAuth((s) => s.status);
  const hasTenant = useAuth((s) => s.currentTenantId !== null);

  // ainda carregando sessão/tenants: não decide nada
  if (status === "loading") return null;

  // sem tenant: deixa a home decidir (mostra criar-tenant)
  if (!hasTenant) return <Navigate to="/" replace />;

  if (!isAdmin) {
    return (
      <Card className="text-cafe-soft">
        <h2 className="font-display text-lg text-cafe">Acesso restrito</h2>
        <p className="mt-2 text-sm">
          Esta área é só para administradores do negócio. Se você precisa
          editar isto, peça para um administrador te dar acesso.
        </p>
      </Card>
    );
  }

  return <>{children}</>;
}
