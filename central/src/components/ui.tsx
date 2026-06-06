import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const baseInput =
  "rounded-xl border border-creme-edge bg-white px-3 py-2 text-cafe outline-none focus:border-terracota disabled:opacity-60";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-cafe-soft">{label}</span>
      {children}
      {hint ? <span className="text-xs text-cafe-muted">{hint}</span> : null}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${baseInput} ${props.className ?? ""}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={3}
      {...props}
      className={`${baseInput} ${props.className ?? ""}`}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${baseInput} ${props.className ?? ""}`} />;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
};

export function Button({
  variant = "primary",
  className = "",
  ...rest
}: ButtonProps) {
  const styles = {
    primary:
      "rounded-xl bg-terracota px-4 py-2 font-medium text-white transition hover:bg-terracota-dark disabled:opacity-60",
    ghost:
      "rounded-xl border border-creme-edge bg-white px-4 py-2 font-medium text-cafe transition hover:bg-creme-soft disabled:opacity-60",
    danger:
      "rounded-xl px-3 py-2 text-sm font-medium text-terracota-dark hover:underline disabled:opacity-60",
  }[variant];
  return <button type="button" {...rest} className={`${styles} ${className}`} />;
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[var(--radius-card)] border border-creme-edge bg-creme-soft p-5 ${className}`}
    >
      {children}
    </div>
  );
}

export function StatusPill({
  kind,
  children,
}: {
  kind: "saved" | "saving" | "error";
  children: ReactNode;
}) {
  const styles = {
    saved: "bg-salvia-soft text-cafe",
    saving: "bg-creme-edge text-cafe-soft animate-pulse-soft",
    error: "bg-terracota-soft text-terracota-dark",
  }[kind];
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs ${styles}`}>
      {children}
    </span>
  );
}
