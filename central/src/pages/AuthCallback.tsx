import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

/**
 * Recebe o redirect do magic link. O Supabase SDK detecta a sessão na URL
 * (detectSessionInUrl: true). Depois mandamos o usuário para a home.
 */
export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      navigate(data.session ? "/" : "/login", { replace: true });
    })();
  }, [navigate]);

  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-cafe-soft animate-pulse-soft">entrando…</p>
    </div>
  );
}
