import { Outlet } from "react-router-dom";

/* Sub-abas vivem na sidebar (acordeão do item Configurações) — aqui só o header. */
export function ConfiguracoesLayout() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl text-cafe">Configurações</h1>
        <p className="mt-1 text-cafe-soft">Integrações e dados do negócio.</p>
      </header>
      <Outlet />
    </div>
  );
}
