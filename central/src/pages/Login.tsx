import { type FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../store/auth";

export function Login() {
  const status = useAuth((s) => s.status);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "signed-in") {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setSending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex h-full items-center justify-center bg-creme px-6">
      <div className="w-full max-w-md rounded-[var(--radius-card)] border border-creme-edge bg-creme-soft p-8 shadow-[0_18px_44px_-26px_rgba(36,27,21,0.30)]">
        <div className="font-display text-3xl text-cafe">
          Central da lena<span className="text-terracota">.</span>
        </div>
        <p className="mt-2 text-sm text-cafe-soft">
          Entre com o seu e-mail. A gente envia um link mágico — sem senha.
        </p>

        {sent ? (
          <div className="mt-6 rounded-xl bg-salvia-soft px-4 py-3 text-sm text-cafe">
            Pronto. Confira o seu e-mail <strong>{email}</strong> e clique no
            link para entrar.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-cafe-soft">e-mail</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@negocio.com.br"
                className="rounded-xl border border-creme-edge bg-white px-3 py-2 text-cafe outline-none focus:border-terracota"
              />
            </label>
            {error ? (
              <p className="text-sm text-terracota-dark">{error}</p>
            ) : null}
            <button
              type="submit"
              disabled={sending}
              className="rounded-xl bg-terracota px-4 py-2.5 font-medium text-white transition hover:bg-terracota-dark disabled:opacity-60"
            >
              {sending ? "enviando…" : "Enviar link mágico"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
