import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthGate } from "./components/AuthGate";
import { Layout } from "./components/Layout";
import { AuthCallback } from "./pages/AuthCallback";
import { CerebroLayout } from "./pages/Cerebro/Layout";
import { CerebroDados } from "./pages/Cerebro/Dados";
import { CerebroFaq } from "./pages/Cerebro/Faq";
import { CerebroServicos } from "./pages/Cerebro/Servicos";
import { CerebroTom } from "./pages/Cerebro/Tom";
import { ConfiguracoesGeral } from "./pages/Configuracoes/Geral";
import { ConfiguracoesLayout } from "./pages/Configuracoes/Layout";
import { ConfiguracoesWhatsapp } from "./pages/Configuracoes/Whatsapp";
import { ConversasPage } from "./pages/Conversas";
import { CreateTenant } from "./pages/CreateTenant";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";

function Placeholder({ title }: { title: string }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-creme-edge bg-creme-soft p-8">
      <h1 className="font-display text-2xl text-cafe">{title}</h1>
      <p className="mt-2 text-cafe-soft">Em construção.</p>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        <Route
          element={
            <AuthGate>
              <Layout />
            </AuthGate>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="/criar-tenant" element={<CreateTenant />} />
          <Route path="/cerebro" element={<CerebroLayout />}>
            <Route index element={<CerebroDados />} />
            <Route path="tom" element={<CerebroTom />} />
            <Route path="servicos" element={<CerebroServicos />} />
            <Route path="faq" element={<CerebroFaq />} />
          </Route>
          <Route path="/conversas" element={<ConversasPage />} />
          <Route path="/agenda" element={<Placeholder title="Agenda" />} />
          <Route path="/configuracoes" element={<ConfiguracoesLayout />}>
            <Route index element={<ConfiguracoesGeral />} />
            <Route path="whatsapp" element={<ConfiguracoesWhatsapp />} />
          </Route>
        </Route>

        <Route path="*" element={<div className="p-8">não encontrado</div>} />
      </Routes>
    </BrowserRouter>
  );
}
