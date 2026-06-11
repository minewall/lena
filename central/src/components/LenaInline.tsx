import type { ReactNode } from "react";
import { Link } from "react-router-dom";

/* Lena inline: a Lena fala em 1ª pessoa no topo da tela — um insight do
   contexto daquela página + 1 ação, dispensável. É o copiloto aparecendo
   onde o dono já está olhando, sem tirar ele do fluxo. */
const actionClass =
  "shrink-0 rounded-[9px] bg-terracota-soft px-3.5 py-1.5 text-[12.5px] font-semibold text-terracota-dark transition hover:bg-terracota hover:text-white";

export function LenaInline({
  children,
  action,
  onDismiss,
}: {
  /** A fala da Lena (1ª pessoa). Pode conter <b> para destaque. */
  children: ReactNode;
  /** Ação que navega (to) OU executa na própria tela (onClick). */
  action?: { label: string; to?: string; onClick?: () => void };
  onDismiss?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-creme-edge border-l-[3px] border-l-terracota bg-creme-soft px-4 py-3">
      <img
        src="/lena-avatar.png"
        alt="Lena"
        className="h-9 w-9 shrink-0 rounded-full object-cover"
      />
      <p className="min-w-0 flex-1 text-[13.5px] text-cafe-soft">{children}</p>
      {action?.to ? (
        <Link to={action.to} className={actionClass}>
          {action.label}
        </Link>
      ) : action?.onClick ? (
        <button type="button" onClick={action.onClick} className={actionClass}>
          {action.label}
        </button>
      ) : null}
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          title="Dispensar"
          className="shrink-0 text-cafe-muted transition hover:text-cafe"
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}
