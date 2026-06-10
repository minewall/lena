import { Outlet } from "react-router-dom";

/* Sub-abas vivem na sidebar (acordeão do item Cérebro) — aqui só o header. */
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
      <Outlet />
    </div>
  );
}
