import type { ComponentType, ReactNode } from "react";
import { Link } from "react-router-dom";

/* Empty state padrão da Central: ícone num círculo creme, título, descrição
   e CTA opcional. Voz acolhedora — a tela vazia também é onboarding. */
const btnClass =
  "mt-1 rounded-[10px] bg-terracota px-4 py-2 text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(227,91,46,0.35)] transition hover:bg-terracota-dark";

export function EmptyState({
  icon: Icon,
  title,
  description,
  cta,
  action,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: ReactNode;
  /** CTA que navega (Link). */
  cta?: { label: string; to: string };
  /** CTA que executa (botão). */
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-creme-edge/70 text-cafe-muted">
        <Icon size={26} />
      </span>
      <div className="max-w-sm">
        <h3 className="font-display text-lg font-bold text-cafe">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-cafe-soft">{description}</p>
      </div>
      {cta ? (
        <Link to={cta.to} className={btnClass}>
          {cta.label}
        </Link>
      ) : action ? (
        <button type="button" onClick={action.onClick} className={btnClass}>
          {action.label}
        </button>
      ) : null}
    </div>
  );
}
