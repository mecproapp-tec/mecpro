// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/public/Login/Login";
import Register from "./pages/public/Register/Register";
import Home from "./pages/private/Home/Home";
import Clientes from "./pages/private/Clientes/Clientes";
import NovoCliente from "./pages/private/Clientes/NovoCliente";
import DetalhesCliente from "./pages/private/Clientes/DetalhesCliente";
import Orcamentos from "./pages/private/Orcamentos/Orcamentos";
import NovoOrcamento from "./pages/private/Orcamentos/NovoOrcamento";
import { DetalhesOrcamento } from "./pages/private/Orcamentos/DetalhesOrcamento";
import Faturas from "./pages/private/Faturas/Faturas";
import NovaFatura from "./pages/private/Faturas/NovaFatura";
import { DetalhesFatura } from "./pages/private/Faturas/DetalhesFatura";
import Agendamento from "./pages/private/Agenda/Agendamento";
import VerAgendamento from "./pages/private/Agenda/VerAgendamento";
import EditarAgendamento from "./pages/private/Agenda/EditarAgendamento";
import Notificacoes from "./pages/private/Notificacoes/Notificacoes";
import OficinaConfig from "./pages/private/Configuracoes/Oficina";
import PrivateRoute from "./routes/PrivateRoute";
import FAQ from "./pages/private/FAQ/FAQ";
import Configuracoes from "./pages/private/Configuracoes/Configuracoes";
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rotas privadas */}
        <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/notificacoes" element={<PrivateRoute><Notificacoes /></PrivateRoute>} />

        {/* Clientes */}
        <Route path="/clientes" element={<PrivateRoute><Clientes /></PrivateRoute>} />
        <Route path="/clientes/novo" element={<PrivateRoute><NovoCliente /></PrivateRoute>} />
        <Route path="/clientes/editar/:id" element={<PrivateRoute><NovoCliente /></PrivateRoute>} />
        <Route path="/clientes/ver/:id" element={<PrivateRoute><DetalhesCliente /></PrivateRoute>} />

        {/* Agenda */}
        <Route path="/agendamento/novo/:clienteId" element={<PrivateRoute><Agendamento /></PrivateRoute>} />
        <Route path="/agendamento/ver/:id" element={<PrivateRoute><VerAgendamento /></PrivateRoute>} />
        <Route path="/agendamento/editar/:id" element={<PrivateRoute><EditarAgendamento /></PrivateRoute>} />

        {/* Orçamentos */}
        <Route path="/orcamentos" element={<PrivateRoute><Orcamentos /></PrivateRoute>} />
        <Route path="/orcamentos/novo" element={<PrivateRoute><NovoOrcamento /></PrivateRoute>} />
        <Route path="/orcamentos/editar/:id" element={<PrivateRoute><NovoOrcamento /></PrivateRoute>} />
        <Route path="/orcamentos/detalhes/:id" element={<PrivateRoute><DetalhesOrcamento /></PrivateRoute>} />

        {/* Faturas */}
        <Route path="/faturas" element={<PrivateRoute><Faturas /></PrivateRoute>} />
        <Route path="/faturas/nova" element={<PrivateRoute><NovaFatura /></PrivateRoute>} />
        <Route path="/faturas/editar/:id" element={<PrivateRoute><NovaFatura /></PrivateRoute>} />
        <Route path="/faturas/detalhes/:id" element={<PrivateRoute><DetalhesFatura /></PrivateRoute>} />

        {/* FAQ e Configurações */}
        <Route path="/faq" element={<PrivateRoute><FAQ /></PrivateRoute>} />
        <Route path="/configuracoes" element={<PrivateRoute><Configuracoes /></PrivateRoute>} />
        <Route path="/oficina/config" element={<PrivateRoute><OficinaConfig /></PrivateRoute>} />

        {/* Rota curinga */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </ErrorBoundary>
  );
}