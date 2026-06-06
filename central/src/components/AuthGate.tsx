import { type ReactNode, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../store/auth";

export function AuthGate({ children }: { children: ReactNode }) {
  const status = useAuth((s) => s.status);
  const init = useAuth((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  if (status === "loading") {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-cafe-soft animate-pulse-soft">carregando…</p>
      </div>
    );
  }

  if (status === "anon") {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
