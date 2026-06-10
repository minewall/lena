import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AdminRoute } from "./components/AdminRoute";
import { AuthGate } from "./components/AuthGate";
import { Layout } from "./components/Layout";
import { AuthCallback } from "./pages/AuthCallback";
import { CerebroLayout } from "./pages/Cerebro/Layout";
import { CerebroDados } from "./pages/Cerebro/Dados";
import { CerebroFaq } from "./pages/Cerebro/Faq";
import { CerebroLimites } from "./pages/Cerebro/Limites";
import { CerebroServicos } from "./pages/Cerebro/Servicos";
import { CerebroTom } from "./pages/Cerebro/Tom";
import { ConfiguracoesEquipe } from "./pages/Configuracoes/Equipe";
import { ConfiguracoesGeral } from "./pages/Configuracoes/Geral";
import { ConfiguracoesLayout } from "./pages/Configuracoes/Layout";
import { ConfiguracoesWhatsapp } from "./pages/Configuracoes/Whatsapp";
import { ConversasPage } from "./pages/Conversas";
import { Agenda } from "./pages/Agenda";
import { CreateTenant } from "./pages/CreateTenant";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { Prospeccao } from "./pages/Prospeccao";
import { ClientesPage } from "./pages/Clientes";
import { ClientePerfil } from "./pages/Clientes/Perfil";

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
          <Route
            path="/cerebro"
            element={
              <AdminRoute>
                <CerebroLayout />
              </AdminRoute>
            }
          >
            <Route index element={<CerebroDados />} />
            <Route path="tom" element={<CerebroTom />} />
            <Route path="servicos" element={<CerebroServicos />} />
            <Route path="faq" element={<CerebroFaq />} />
            <Route path="limites" element={<CerebroLimites />} />
          </Route>
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/clientes/:id" element={<ClientePerfil />} />
          <Route path="/conversas" element={<ConversasPage />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/prospeccao" element={<Prospeccao />} />
          <Route
            path="/configuracoes"
            element={
              <AdminRoute>
                <ConfiguracoesLayout />
              </AdminRoute>
            }
          >
            <Route index element={<ConfiguracoesGeral />} />
            <Route path="whatsapp" element={<ConfiguracoesWhatsapp />} />
            <Route path="equipe" element={<ConfiguracoesEquipe />} />
          </Route>
        </Route>

        <Route path="*" element={<div className="p-8">não encontrado</div>} />
      </Routes>
    </BrowserRouter>
  );
}
