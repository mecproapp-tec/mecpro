import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

// Páginas públicas
import Login from "../pages/public/Login/Login"
import Register from "../pages/public/Register/Register"

// Páginas privadas
// Certifique-se de que esses arquivos existem nos caminhos indicados
import Dashboard from "../pages/private/Dashboard/Dashboard"
import Clients from "../pages/private/Clientes/Clientes"        // pasta "Clientes"
import Estimates from "../pages/private/Orcamentos/Orcamentos"  // pasta "Orcamentos"
import Invoices from "../pages/private/Faturas/Faturas"         // pasta "Faturas"
import Admin from "../pages/private/Admin/Admin"

// Layout e Guard
import AuthLayout from "../layouts/AuthLayout"                 // layout autenticado
import PrivateRoute from "../components/guards/PrivateRoute"   // guarda de rota

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rotas privadas (protegidas por PrivateRoute) */}
        <Route element={<PrivateRoute><AuthLayout /></PrivateRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/estimates" element={<Estimates />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/admin" element={<Admin />} />
        </Route>

        {/* Redirecionamento padrão */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}